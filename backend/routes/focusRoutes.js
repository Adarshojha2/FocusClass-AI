const express = require("express");
const {
  saveFocus,
  getFocus,
} = require("../controllers/focusController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, saveFocus);
router.get("/", authMiddleware, getFocus);

module.exports = router;