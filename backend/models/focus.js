const mongoose = require("mongoose");

const focusSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    focusScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },

    distractions: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Focus", focusSchema);