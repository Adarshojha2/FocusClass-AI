const mongoose = require("mongoose");

const classSessionSchema = new mongoose.Schema(
  {
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    subject: {
      type: String,
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: String,

    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },

    joinDeadline: {
      type: Date,
      required: true,
    },

    sessionEndTime: {
      type: Date,
      required: true,
    },

    endTime: Date,

    status: {
      type: String,
      enum: ["Active", "Ended", "Scheduled"],
      default: "Active",
    },

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    recordingUrl: String,

    transcript: String,

    importantTopics: [
      {
        topic: String,
        timestamp: Number,
        mentionedBy: String,
      },
    ],
    sessionPassword: String,
    classType: {
      type: String,
      enum: ["online", "in-person"],
      default: "online",
    },
    importantNote: {
      type: String,
      default: "",
    },
    noteReactions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ClassSession", classSessionSchema);
