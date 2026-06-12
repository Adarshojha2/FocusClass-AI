const express = require("express");
const multer = require("multer");
const authMiddleware = require("../middleware/authMiddleware");
const {
  createClass,
  joinClass,
  markAbsent,
  getActiveClasses,
  getClassById,
  endClass,
  getStudentClasses,
  detectPresence,
  pingPresence,
  postImportantNote,
  reactToNote
} = require("../controllers/classController");

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// Teacher creates a class
router.post("/create", authMiddleware, createClass);

// Student joins a class
router.post("/join", authMiddleware, upload.single("photo"), joinClass);

// Student absence or exit during a live session
router.post("/absent", authMiddleware, markAbsent);

// Student webcam periodic presence check
router.post("/detect-presence", authMiddleware, upload.single("photo"), detectPresence);

// Student active presence heartbeat ping
router.post("/ping-presence", authMiddleware, pingPresence);

// Teacher posts important note for classroom class
router.post("/post-note", authMiddleware, postImportantNote);

// Student reacts to classroom important note
router.post("/react-note", authMiddleware, reactToNote);

// Get all active classes
router.get("/active", getActiveClasses);

// Get specific class details
router.get("/:classId", getClassById);

// Get classes student is part of
router.get("/student/classes", authMiddleware, getStudentClasses);

// Teacher ends class
router.put("/:classId/end", authMiddleware, endClass);

module.exports = router;
