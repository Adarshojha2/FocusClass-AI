const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const {
  logBlockedApp,
  unblockApp,
  getBlockedApps,
} = require("../controllers/appBlockingController");

const router = express.Router();

// Log a blocked app
router.post("/log", authMiddleware, logBlockedApp);

// Get blocked apps for user
router.get("/", authMiddleware, getBlockedApps);

// Unblock an app
router.put("/:blockingId/unblock", authMiddleware, unblockApp);

module.exports = router;
