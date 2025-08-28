// server/app.js
require("dotenv").config();

const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const { isValidObjectId } = mongoose;

// Auth deps
const bcrypt = require("bcryptjs");
const jwtSign = require("jsonwebtoken");
const { expressjwt: jwt } = require("express-jwt");

// Models existentes
const Cohort = require("./models/Cohort.model");
const Student = require("./models/Student.model");

// ---- User Model (inline para simplificar o Day 5) ----
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true }, // armazenamos o HASH aqui
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);
const User = mongoose.models.User || mongoose.model("User", userSchema);

// ---- App / Middlewares ----
const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors({ origin: "http://localhost:5173" })); // ajuste se necessário
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

// Health & Docs
app.get("/", (_req, res) => res.json({ status: "ok", docs: "/docs" }));
app.get("/docs", (_req, res) =>
  res.sendFile(path.join(__dirname, "views", "docs.html"))
);

// ---- JWT middleware (protege rotas) ----
const requireAuth = jwt({
  secret: process.env.JWT_SECRET,
  algorithms: ["HS256"],
});

// =====================
// =    AUTH ROUTES    =
// =====================

// POST /auth/signup  -> cria usuário (hash de senha)
app.post("/auth/signup", async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ error: "email, password and name are required" });
    }
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ error: "Email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: passwordHash, name });

    res.status(201).json({ _id: user._id, email: user.email, name: user.name });
  } catch (err) {
    if (err?.name === "ValidationError")
      return res.status(400).json({ error: err.message });
    if (err?.code === 11000)
      return res.status(409).json({ error: "Email already exists" });
    next(err);
  }
});

// POST /auth/login  -> verifica credenciais e devolve JWT
app.post("/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "email and password are required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwtSign.sign(
      { sub: user._id.toString(), email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { _id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    next(err);
  }
});

// GET /auth/verify  -> valida JWT (protegida)
app.get("/auth/verify", requireAuth, (req, res) => {
  // express-jwt coloca o payload decodificado em req.auth
  res.json({ ok: true, payload: req.auth });
});

// =====================
// =   USER (secure)   =
// =====================

// GET /api/users/:id -> protegido por JWT
app.get("/api/users/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id))
      return res.status(400).json({ error: "Invalid id" });

    const user = await User.findById(id).select("-password").lean();
    if (!user) return res.status(404).json({ error: "Not found" });
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// ==================================
// =      COHORT ROUTES (CRUD)      =
// ==================================

// CREATE
app.post("/api/cohorts", async (req, res, next) => {
  try {
    const created = await Cohort.create(req.body);
    res.status(201).json(created);
  } catch (err) {
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

// ===================================
// =     STUDENT ROUTES (CRUD)       =
// ===================================

// CREATE
app.post("/api/students", async (req, res, next) => {
  try {
    const body = req.body; // {firstName,lastName,email,phone?,cohort?}
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

// READ ALL (populate)
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

// READ by cohort (populate)
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

// READ ONE (populate)
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

// UPDATE (return populated)
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

// ========================
// =  ERROR MIDDLEWARES   =
// ========================
app.use((err, _req, res, _next) => {
  // express-jwt errors
  if (err?.name === "UnauthorizedError") {
    return res.status(401).json({ error: "Invalid or missing token" });
  }
  // mongoose/common
  if (err?.name === "ValidationError")
    return res.status(400).json({ error: err.message });
  if (err?.name === "CastError")
    return res.status(400).json({ error: "Invalid id" });
  if (err?.code === 11000)
    return res.status(409).json({ error: "Duplicate key" });

  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

// ---- Mongo connection + start ----
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
