const mongoose = require("mongoose");

const topicHighlightSchema = new mongoose.Schema(
  {
    classSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassSession",
      required: true,
    },

    topic: {
      type: String,
      required: true,
    },

    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.8,
    },

    timestamp: {
      type: Number,
      required: true,
    },

    audioClip: String,

    studentNotes: [
      {
        user: mongoose.Schema.Types.ObjectId,
        note: String,
      },
    ],

    importance: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "High",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TopicHighlight", topicHighlightSchema);
