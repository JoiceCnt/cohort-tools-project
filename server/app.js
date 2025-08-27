require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const { isValidObjectId } = mongoose;

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

/** ROTAS BÁSICAS / DOCS **/
app.get("/", (_req, res) => res.json({ status: "ok", docs: "/docs" }));

app.get("/docs", (_req, res) => {
  res.sendFile(path.join(__dirname, "views", "docs.html"));
});

/** COHORT ROUTES **/

// CREATE
app.post("/api/cohorts", async (req, res, next) => {
  try {
    const body = req.body; // {cohortSlug, cohortName, program, format, inProgress?}
    const created = await Cohort.create(body);
    res.status(201).json(created);
  } catch (err) {
    // E11000 = unique (cohortSlug already exists )
    if (err?.code === 11000)
      return res.status(409).json({ error: "Cohort already exists" });
    if (err?.name === "ValidationError")
      return res.status(400).json({ error: err.message });
    next(err);
  }
});

// READ ALL
app.get("/api/cohorts", async (_req, res, next) => {
  try {
    const list = await Cohort.find().lean();
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// READ ONE
app.get("/api/cohorts/:cohortId", async (req, res, next) => {
  try {
    const { cohortId } = req.params;
    if (!isValidObjectId(cohortId))
      return res.status(400).json({ error: "Invalid id" });
    const doc = await Cohort.findById(cohortId).lean();
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// UPDATE
app.put("/api/cohorts/:cohortId", async (req, res, next) => {
  try {
    const { cohortId } = req.params;
    if (!isValidObjectId(cohortId))
      return res.status(400).json({ error: "Invalid id" });
    const updated = await Cohort.findByIdAndUpdate(cohortId, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    if (err?.code === 11000)
      return res.status(409).json({ error: "Cohort slug already exists" });
    if (err?.name === "ValidationError")
      return res.status(400).json({ error: err.message });
    next(err);
  }
});

// DELETE
app.delete("/api/cohorts/:cohortId", async (req, res, next) => {
  try {
    const { cohortId } = req.params;
    if (!isValidObjectId(cohortId))
      return res.status(400).json({ error: "Invalid id" });
    const deleted = await Cohort.findByIdAndDelete(cohortId);
    if (!deleted) return res.status(404).json({ error: "Not found" });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/** STUDENT ROUTES **/

// CREATE
app.post("/api/students", async (req, res, next) => {
  try {
    const body = req.body; // {firstName,lastName,email,phone?,cohort?}
    // validate id of cohort in case it comes
    if (body.cohort && !isValidObjectId(body.cohort)) {
      return res.status(400).json({ error: "Invalid cohort id" });
    }
    const created = await Student.create(body);

    const populated = await Student.findById(created._id)
      .populate("cohort", "cohortName cohortSlug program format")
      .lean();
    res.status(201).json(populated);
  } catch (err) {
    if (err?.code === 11000)
      return res.status(409).json({ error: "Email already exists" });
    if (err?.name === "ValidationError")
      return res.status(400).json({ error: err.message });
    next(err);
  }
});

// READ ALL (with populate)
app.get("/api/students", async (_req, res, next) => {
  try {
    const list = await Student.find()
      .populate("cohort", "cohortName cohortSlug program format")
      .lean();
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// READ by cohort (with populate)
app.get("/api/students/cohort/:cohortId", async (req, res, next) => {
  try {
    const { cohortId } = req.params;
    if (!isValidObjectId(cohortId))
      return res.status(400).json({ error: "Invalid id" });
    const list = await Student.find({ cohort: cohortId })
      .populate("cohort", "cohortName cohortSlug program format")
      .lean();
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// READ ONE (with populate)
app.get("/api/students/:studentId", async (req, res, next) => {
  try {
    const { studentId } = req.params;
    if (!isValidObjectId(studentId))
      return res.status(400).json({ error: "Invalid id" });
    const doc = await Student.findById(studentId)
      .populate("cohort", "cohortName cohortSlug program format")
      .lean();
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// UPDATE (return populate)
app.put("/api/students/:studentId", async (req, res, next) => {
  try {
    const { studentId } = req.params;
    if (!isValidObjectId(studentId))
      return res.status(400).json({ error: "Invalid id" });

    if (req.body.cohort && !isValidObjectId(req.body.cohort)) {
      return res.status(400).json({ error: "Invalid cohort id" });
    }

    await Student.findByIdAndUpdate(studentId, req.body, {
      new: false,
      runValidators: true,
    });
    const updated = await Student.findById(studentId)
      .populate("cohort", "cohortName cohortSlug program format")
      .lean();

    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    if (err?.code === 11000)
      return res.status(409).json({ error: "Email already exists" });
    if (err?.name === "ValidationError")
      return res.status(400).json({ error: err.message });
    next(err);
  }
});

// DELETE
app.delete("/api/students/:studentId", async (req, res, next) => {
  try {
    const { studentId } = req.params;
    if (!isValidObjectId(studentId))
      return res.status(400).json({ error: "Invalid id" });
    const deleted = await Student.findByIdAndDelete(studentId);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/** HANDLERS DE ERRO E 404 (deixe no fim) **/
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

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
