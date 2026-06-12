const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    title: String,

    transcript: String,

    summary: String,

    importantTopics: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  "Note",
  noteSchema
);