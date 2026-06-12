const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  recordImportantTopic,
  getTopicsFromClass,
  addStudentNote,
} = require("../controllers/topicController");

const router = express.Router();

// AI records important topic (teacher/system)
router.post("/record", authMiddleware, recordImportantTopic);

// Get important topics from a class
router.get("/class/:classSessionId", getTopicsFromClass);

// Student adds note to a topic
router.post("/:topicId/note", authMiddleware, addStudentNote);

module.exports = router;
