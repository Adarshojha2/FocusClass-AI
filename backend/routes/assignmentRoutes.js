const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createAssignment,
  getAssignments,
  submitAssignment,
  gradeSubmission,
} = require("../controllers/assignmentController");

router.post("/create", authMiddleware, createAssignment);
router.get("/list", authMiddleware, getAssignments);
router.post("/submit", authMiddleware, submitAssignment);
router.post("/grade", authMiddleware, gradeSubmission);

module.exports = router;
