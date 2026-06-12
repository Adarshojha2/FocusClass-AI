const express = require("express");
const multer = require("multer");
const authMiddleware = require("../middleware/authMiddleware");

const {
  registerUser,
  loginUser,
  verifyOtp,
  getCurrentUser,
  updateUser,
  uploadProfilePhoto,
  getStudents,
  toggleStudentActive,
  checkParentAlerts,
} = require("../controllers/authController");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOtp);
router.get("/me", authMiddleware, getCurrentUser);
router.put("/update", authMiddleware, updateUser);
router.post("/upload-photo", authMiddleware, upload.single("photo"), uploadProfilePhoto);

// Student management for teachers/principals
router.get("/students", authMiddleware, getStudents);
router.put("/students/toggle-active/:id", authMiddleware, toggleStudentActive);
router.get("/students/parent-alerts", authMiddleware, checkParentAlerts);

module.exports = router;