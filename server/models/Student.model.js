const { Schema, model } = require("mongoose");

const studentSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String },
    cohort: { type: Schema.Types.ObjectId, ref: "Cohort" }, // se existir no JSON
  },
  { timestamps: true }
);

module.exports = model("Student", studentSchema);
