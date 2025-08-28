const Student = require("../models/Student.model");
const populateSel = "cohortName cohortSlug program format";

exports.index = async (_req, res, next) => {
  try {
    const rows = await Student.find().populate("cohort", populateSel).lean();
    res.json(rows);
  } catch (e) {
    next(e);
  }
};

exports.listByCohort = async (req, res, next) => {
  try {
    const rows = await Student.find({ cohort: req.params.cohortId })
      .populate("cohort", populateSel)
      .lean();
    res.json(rows);
  } catch (e) {
    next(e);
  }
};

exports.show = async (req, res, next) => {
  try {
    const doc = await Student.findById(req.params.studentId)
      .populate("cohort", populateSel)
      .lean();
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    const created = await Student.create(req.body);
    const populated = await Student.findById(created._id)
      .populate("cohort", populateSel)
      .lean();
    res.status(201).location(`/api/students/${created._id}`).json(populated);
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    await Student.findByIdAndUpdate(req.params.studentId, req.body, {
      runValidators: true,
    });
    const updated = await Student.findById(req.params.studentId)
      .populate("cohort", populateSel)
      .lean();
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (e) {
    next(e);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    const deleted = await Student.findByIdAndDelete(req.params.studentId);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};
