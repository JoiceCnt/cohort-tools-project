const mongoose = require("mongoose");

exports.asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

exports.validateObjectIdParam = (param) => (req, res, next) => {
  const id = req.params[param];
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  next();
};
