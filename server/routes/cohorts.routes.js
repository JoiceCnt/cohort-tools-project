const router = require("express").Router();
const mongoose = require("mongoose");
const ctrl = require("../controllers/cohorts.controller");

router.get("/", ctrl.index);
router.get("/:cohortId", validate("cohortId"), ctrl.show);
router.post("/", ctrl.create);
router.put("/:cohortId", validate("cohortId"), ctrl.update);
router.delete("/:cohortId", validate("cohortId"), ctrl.destroy);

function validate(param) {
  return (req, res, next) =>
    mongoose.isValidObjectId(req.params[param])
      ? next()
      : res.status(400).json({ error: "Invalid id" });
}

module.exports = router;
