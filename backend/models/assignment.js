const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  submissionText: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
  grade: { type: String, default: "Not Graded" },
  feedback: { type: String, default: "" }
});

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  dueDate: { type: Date, required: true },
  subject: { type: String, required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  submissions: [submissionSchema]
}, { timestamps: true });

module.exports = mongoose.model("Assignment", assignmentSchema);
