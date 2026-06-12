const Attendance = require("../models/attendance");

exports.markAttendance = async (req, res) => {
  try {
    const { subject } = req.body;

    if (!subject) {
      return res.status(400).json({
        message: "Subject is required",
      });
    }

    const attendance = await Attendance.create({
      user: req.user,
      subject,
    });

    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getAttendance = async (req, res) => {
  try {
    const attendance = await Attendance.find({
      user: req.user,
    });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};