const mongoose = require("mongoose");

const appBlockingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    classSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassSession",
    },

    appName: {
      type: String,
      required: true,
    },

    blockedAt: {
      type: Date,
      default: Date.now,
    },

    unblockedAt: Date,

    reason: {
      type: String,
      enum: ["Distraction", "Study Focus", "User Request"],
      default: "Distraction",
    },

    durationSeconds: Number,
  },
  { timestamps: true }
);

module.exports = mongoose.model("AppBlocking", appBlockingSchema);
