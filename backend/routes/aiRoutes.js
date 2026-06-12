const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { askProblem } = require("../controllers/aiController");

router.post("/ask-problem", authMiddleware, askProblem);

module.exports = router;
