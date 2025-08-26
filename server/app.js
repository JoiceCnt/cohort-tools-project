const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");
const cors = require("cors"); //reasearsh team day 1

const PORT = 5005;

// STATIC DATA
// Devs Team - Import the provided files with JSON data of students and cohorts here:
// ...
const cohorts = require("./cohorts.json");
const students = require("./students.json");

// INITIALIZE EXPRESS APP - https://expressjs.com/en/4x/api.html#express
const app = express();

// MIDDLEWARE
// Research Team - Set up CORS middleware here:
// ...
app.use(cors({ origin: "http://localhost:5173" }));

app.use(express.json());
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ROUTES - https://expressjs.com/en/starter/basic-routing.html
// Devs Team - Start working on the routes here:
// ...
app.get("/api/cohorts", (req, res) => res.json(cohorts));
app.get("/api/students", (req, res) => res.json(students));

app.get("/docs", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "docs.html"));
});

// not found
app.use((req, res) => res.status(404).json({ error: "Not found" }));
// START SERVER
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
