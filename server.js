const express = require("express");

const knex = require("knex");
const MongoClient = require("mongodb").MongoClient;

// Connect to the mySql DB
const sql_database = knex({
  client: "mysql",
  connection: {
    host: "127.0.0.1",
    user: "root",
    password: "sys123",
    database: "alna_course_hub",
  },
});

// Connect to mongo db, test connection
MongoClient.connect("mongodb://localhost:27017/course_hub", function (err, db) {
  db.collection("chatArchive", function (err, collection) {
    collection.find().toArray(function (err, items) {
      if (err) throw err;
      console.log(items);
    });
  });
});

const app = express();

const temp_db = {
  users: [
    {
      user_id: "1",
      user_name: "Bob",
      is_teacher: "N",
    },
    {
      user_id: "2",
      user_name: "Alice",
      is_teacher: "N",
    },
  ],
  course_lobbies: [
    {
      course_id: "1",
      course_name: "Linux",
    },
    {
      course_id: "2",
      course_name: "C#",
    },
  ],
};

// Test RDBMS queries
sql_database
  .select("*")
  .from("student")
  .then((data) => {
    console.log(data);
  });

app.use(express.json());
//app.use(express.static(__dirname + "/public")); // ### Comment out for the demo

// *** REQUESTS ***
app.get("/", (req, res) => {
  sql_database
    .select("*")
    .from("student")
    .then((user) => {
      res.json(user);
    })
    .catch((error) => res.status(400).json("Unable to show all users"));
});

app.post("/createUser", (req, res) => {
  const { user_name, is_teacher } = req.body;

  sql_database("student")
    .insert({
      user_name: user_name,
      is_teacher: is_teacher,
    })
    .then((user) => {
      res.json("Created new user: " + user[0]);
    })
    .catch((error) => res.status(400).json("Unable to create user"));
});

app.put("/setTeacher/:id", (req, res) => {
  const { id } = req.params;

  sql_database("student")
    .where("user_id", "=", id)
    .update({
      is_teacher: "T",
    })
    .then((user) => {
      res.json("User became teacher");
    })
    .catch((error) => res.status(400).json("User not updated"));
});

app.get("/seeAllCourses", (req, res) => {
  sql_database
    .select("*")
    .from("course_lobby")
    .then((user) => {
      res.json(user);
    })
    .catch((error) => res.status(400).json("Unable to show all courses"));
});

app.post("/createLobby", (req, res) => {
  const { course_name } = req.body;

  sql_database("course_lobby")
    .insert({
      course_name: course_name,
    })
    .then((course) => {
      res.json("Created new course: " + course[0]);
    })
    .catch((error) => res.status(400).json("Unable to create user"));
});

app.post("/joinCourse/:user_id/:course_id", (req, res) => {
  const { user_id, course_id } = req.params;

  sql_database("attendance")
    .insert({
      att_user: user_id,
      att_course: course_id,
    })
    .then((attendance) => {
      res.json("User attends the course: " + attendance[0]);
    })
    .catch((error) =>
      res.status(400).json("Unable join user to a course" + error)
    );
});

app.get("/seeAllChat/:course_id", (req, res) => {
  const { course_id } = req.params;

  sql_database
    .select("*")
    .from("chat_log")
    .where("chat_course", "=", course_id)
    .then((chat) => {
      res.json(chat);
    })
    .catch((error) =>
      res.status(400).json("Unable to show chat for lobby" + error)
    );
});

app.post("/createChatLog", (req, res) => {
  const { chat_text, chat_user, chat_course } = req.body;

  sql_database("chat_log")
    .insert({
      chat_date: new Date(),
      chat_text: chat_text,
      chat_user: chat_user,
      chat_course: chat_course,
    })
    .then((chat) => {
      res.json("Created new course: " + chat[0]);
    })
    .catch((error) =>
      res.status(400).json("Unable to create new chat" + error)
    );
});

app.post("/uploadFile", (req, res) => {
  const { file_name, file_content, faud_user, faud_course } = req.body;

  sql_database("course_file")
    .insert({
      file_name: file_name,
      file_content: file_content,
    })
    .then((file) => {
      sql_database("file_audit")
        .insert({
          faud_date: new Date(),
          faud_user: faud_user,
          faud_course: faud_course,
          faud_file: file[0],
        })
        .then((file) => {
          res.json("Created new file: " + file[0]);
        })
        .catch((error) => res.status(400).json("Unable to audit new file"));
      res.json("Created new file: " + file[0]);
    })
    .catch((error) => res.status(400).json("Unable to create file"));
});

app.get("/downloadFile/:fileId", (req, res) => {
  const { fileId } = req.params;

  sql_database
    .select("*")
    .from("course_file")
    .where("file_id", "=", fileId)
    .then((file) => {
      res.json(file);
    })
    .catch((error) => res.status(400).json("Unable to download file" + error));
});

//The listener
app.listen(3000, () => {
  console.log("Alna course hub is online and using port 3000");
});

/*
 /              {GET}   => shows the course lobbys
 /createUser    {POST}  => creates new student/lecturer
 /createLobby   {POST}  => creates new lobby
 /joinCourse    {POST}  => assigns user to a course
 /createChatLog {POST}  => creates new chat for a lobby, by a user
 /viewChatBoard {GET}   => view chat
 /uploadFile    {POST}  => creates new file for a lobby, by a user
 /downloadFile  {GET}   => get file
*/
