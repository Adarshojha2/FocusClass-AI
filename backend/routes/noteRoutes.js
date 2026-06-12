const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  createNote,
  getNotes,
  explainNote,
} = require("../controllers/noteController");

router.post("/", authMiddleware, createNote);
router.get("/", authMiddleware, getNotes);
router.post("/:noteId/explain", authMiddleware, explainNote);

module.exports = router;