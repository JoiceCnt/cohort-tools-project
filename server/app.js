require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");

// Models
const Cohort = require("./models/Cohort.model");
const Student = require("./models/Student.model");

const app = express();
const PORT = process.env.PORT || 5005;

// Middlewares
app.use(cors({ origin: "http://localhost:5173" }));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.get("/", (_req, res) => res.json({ status: "ok", docs: "/docs" }));

app.get("/docs", (_req, res) => {
  res.sendFile(path.join(__dirname, "views", "docs.html"));
});

//  API: Cohorts
app.get("/api/cohorts", async (_req, res, next) => {
  try {
    const list = await Cohort.find().lean();
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// GET /api/cohorts/:id
const { isValidObjectId } = mongoose;

app.get("/api/cohorts/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id))
      return res.status(400).json({ error: "Invalid id" });

    const doc = await Cohort.findById(id).lean();
    if (!doc) return res.status(404).json({ error: "Not found" });

    res.json(doc);
  } catch (err) {
    next(err);
  }
});

//API: Students
app.get("/api/students", async (_req, res, next) => {
  try {
    const list = await Student.find()
      .populate("cohort", "cohortName cohortSlug program format") // remova se não tiver ref
      .lean();
    res.json(list);
  } catch (err) {
    next(err);
  }
});

app.get("/api/students/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id))
      return res.status(400).json({ error: "Invalid id" });

    const doc = await Student.findById(id)
      .populate("cohort", "cohortName cohortSlug program format")
      .lean();
    if (!doc) return res.status(404).json({ error: "Not found" });

    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

// 404
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// mongo conection + start
if (!process.env.MONGODB_URI) {
  console.error("❌ Missing MONGODB_URI in .env");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected ✅");
    app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error ❌", err.message);
    process.exit(1);
  });
