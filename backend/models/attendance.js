const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    subject: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      default: "Present",
      enum: ["Present", "Absent", "Late"],
    },

    classSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassSession",
    },

    photoMatch: {
      type: Boolean,
      default: false,
    },

    photoName: String,
    joinTime: {
      type: Date,
      default: Date.now,
    },
    activeSeconds: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);