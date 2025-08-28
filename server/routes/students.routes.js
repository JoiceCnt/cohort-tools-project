const router = require("express").Router();
const mongoose = require("mongoose");
const ctrl = require("../controllers/students.controller");

router.get("/", ctrl.index);
router.get("/cohort/:cohortId", validate("cohortId"), ctrl.listByCohort);
router.get("/:studentId", validate("studentId"), ctrl.show);
router.post("/", ctrl.create);
router.put("/:studentId", validate("studentId"), ctrl.update);
router.delete("/:studentId", validate("studentId"), ctrl.destroy);

function validate(param) {
  return (req, res, next) =>
    mongoose.isValidObjectId(req.params[param])
      ? next()
      : res.status(400).json({ error: "Invalid id" });
}

module.exports = router;
