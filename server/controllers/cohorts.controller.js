const Cohort = require("../models/Cohort.model");

exports.index = async (_req, res, next) => {
  try {
    res.json(await Cohort.find().lean());
  } catch (e) {
    next(e);
  }
};

exports.show = async (req, res, next) => {
  try {
    const doc = await Cohort.findById(req.params.cohortId).lean();
    if (!doc) return res.status(404).json({ error: "Not found" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
};

exports.create = async (req, res, next) => {
  try {
    const created = await Cohort.create(req.body);
    res.status(201).location(`/api/cohorts/${created._id}`).json(created);
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const updated = await Cohort.findByIdAndUpdate(
      req.params.cohortId,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (e) {
    next(e);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    const deleted = await Cohort.findByIdAndDelete(req.params.cohortId);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.status(204).send();
  } catch (e) {
    next(e);
  }
};
