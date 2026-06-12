const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { sendMessage, getMyMessages } = require("../controllers/messageController");

router.post("/send", authMiddleware, sendMessage);
router.get("/my-messages", authMiddleware, getMyMessages);

module.exports = router;
