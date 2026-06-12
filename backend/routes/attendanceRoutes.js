const express = require("express");
const {
  markAttendance,
  getAttendance,
} = require("../controllers/attendanceController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, markAttendance);
router.get("/", authMiddleware, getAttendance);

module.exports = router;