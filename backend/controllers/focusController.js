const Focus = require("../models/focus");

exports.saveFocus = async (req, res) => {
  try {
    const { focusScore, distractions } = req.body;

    if (focusScore === undefined) {
      return res.status(400).json({
        message: "focusScore is required",
      });
    }

    const focus = await Focus.create({
      user: req.user,
      focusScore,
      distractions,
    });

    res.status(201).json(focus);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getFocus = async (req, res) => {
  try {
    const focus = await Focus.find({
      user: req.user,
    });

    res.json(focus);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};