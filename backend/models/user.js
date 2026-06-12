const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["teacher", "student", "principal"], default: "student" },
  phone: { type: String, default: "" },
  rollNumber: { type: String, default: "" },
  lifeProfile: { type: String, default: "" },
  photoUrl: { type: String, default: "" },
  photoUploaded: { type: Boolean, default: false },
  photoHash: { type: String, default: "" },
  isDashboardActive: { type: Boolean, default: false },
  otp: { type: String, default: "" },
  otpExpires: { type: Date },
  lastLogin: { type: Date, default: Date.now },
  parentEmail: { type: String, default: "" },
  parentPhone: { type: String, default: "" },
});

module.exports = mongoose.model("User", userSchema);