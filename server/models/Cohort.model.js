const { Schema, model } = require("mongoose");

const cohortSchema = new Schema(
  {
    cohortSlug: { type: String, required: true, unique: true },
    cohortName: { type: String, required: true },
    program: {
      type: String,
      enum: ["Web Dev", "UX/UI", "Data Analytics", "Cybersecurity"],
      required: true,
    },
    format: { type: String, enum: ["Full Time", "Part Time"], required: true },
    inProgress: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = model("Cohort", cohortSchema);
