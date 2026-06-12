const User = require("../models/user");
const ClassSession = require("../models/classSession");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { computeImageHash } = require("../utils/ai");

const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role || "student",
  phone: user.phone || "",
  rollNumber: user.rollNumber || "",
  lifeProfile: user.lifeProfile || "",
  photoUrl: user.photoUrl || "",
  photoUploaded: !!user.photoUploaded,
  photoHash: user.photoHash || "",
  isDashboardActive: !!user.isDashboardActive,
  parentEmail: user.parentEmail || "",
  parentPhone: user.parentPhone || "",
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
});

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, rollNumber, lifeProfile, parentEmail, parentPhone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedRole = role === "teacher" || role === "principal" ? role : "student";

    if (normalizedRole === "student" && !normalizedEmail.endsWith("@gmail.com")) {
      return res.status(400).json({
        message: "Student registration requires a valid @gmail.com address.",
      });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60000); // 10 minutes

    // Teacher and Principal start active; Student starts inactive/pending activation
    const isDashboardActive = normalizedRole !== "student";

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: normalizedRole,
      phone: phone?.trim() || "",
      rollNumber: rollNumber?.trim() || "",
      lifeProfile: lifeProfile?.trim() || "",
      isDashboardActive,
      otp,
      otpExpires,
      parentEmail: parentEmail?.trim() || "",
      parentPhone: parentPhone?.trim() || "",
      lastLogin: new Date()
    });

    if (normalizedRole === "student") {
      console.log(`\n==============================================`);
      console.log(`[STUDENT REGISTER OTP] Email: ${normalizedEmail}`);
      console.log(`OTP Code: ${otp}`);
      console.log(`==============================================\n`);

      return res.status(201).json({
        requiresOtp: true,
        email: normalizedEmail,
        message: "OTP sent to your email (check console logs).",
      });
    }

    const token = createToken(user._id);
    res.status(201).json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    if (user.role === "student") {
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60000); // 10 minutes
      await user.save();

      console.log(`\n==============================================`);
      console.log(`[STUDENT LOGIN OTP] Email: ${normalizedEmail}`);
      console.log(`OTP Code: ${otp}`);
      console.log(`==============================================\n`);

      return res.json({
        requiresOtp: true,
        email: normalizedEmail,
        message: "OTP sent to your email (check console logs).",
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = createToken(user._id);
    res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.otp || user.otp !== otp || new Date() > user.otpExpires) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.otp = "";
    user.otpExpires = null;
    user.lastLogin = new Date();
    await user.save();

    const token = createToken(user._id);
    res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, phone, rollNumber, lifeProfile, parentEmail, parentPhone } = req.body;

    const user = await User.findById(req.user);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const activeSession = await ClassSession.findOne({
      students: req.user,
      status: "Active",
      sessionEndTime: { $gt: new Date() },
    });

    if (activeSession) {
      return res.status(403).json({
        message:
          "Dashboard changes are locked while you are in an active class session. Leave the class before updating your profile.",
      });
    }

    if (name) user.name = name.trim();
    if (typeof phone === "string") user.phone = phone.trim();
    if (typeof rollNumber === "string") user.rollNumber = rollNumber.trim();
    if (typeof lifeProfile === "string") user.lifeProfile = lifeProfile.trim();
    if (typeof parentEmail === "string") user.parentEmail = parentEmail.trim();
    if (typeof parentPhone === "string") user.parentPhone = parentPhone.trim();

    await user.save();
    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user).select("-password");
    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }
    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const uploadProfilePhoto = async (req, res) => {
  try {
    const photoFile = req.file;
    if (!photoFile) {
      return res.status(400).json({
        message: "Please upload a photo file."
      });
    }

    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (user.photoUploaded) {
      return res.status(400).json({ message: "Profile photo has already been uploaded once." });
    }

    const hash = computeImageHash(photoFile.buffer);
    if (!hash) {
      return res.status(500).json({ message: "Unable to process uploaded photo." });
    }

    // Convert image buffer to base64 Data URL for serverless compatibility (zero disk requirement)
    const base64Image = photoFile.buffer.toString("base64");
    const dataUrl = `data:${photoFile.mimetype || "image/jpeg"};base64,${base64Image}`;

    user.photoUrl = dataUrl;
    user.photoUploaded = true;
    user.photoHash = hash;

    await user.save();
    res.json({ user: sanitizeUser(user), message: "Profile photo uploaded" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).sort({ name: 1 });
    res.json(students.map(sanitizeUser));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleStudentActive = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found." });

    student.isDashboardActive = !student.isDashboardActive;
    await student.save();
    res.json({ user: sanitizeUser(student) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const checkParentAlerts = async (req, res) => {
  try {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    const inactiveStudents = await User.find({
      role: "student",
      lastLogin: { $lt: twoDaysAgo }
    });

    const alerted = inactiveStudents.map(student => {
      console.log(`[PARENT INACTIVITY ALERT] student: ${student.name}, parentEmail: ${student.parentEmail || "not set"}`);
      return {
        id: student._id,
        name: student.name,
        email: student.email,
        lastLogin: student.lastLogin,
        parentEmail: student.parentEmail || "None Specified",
        parentPhone: student.parentPhone || "None Specified",
        notified: true
      };
    });

    res.json(alerted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  verifyOtp,
  getCurrentUser,
  updateUser,
  uploadProfilePhoto,
  getStudents,
  toggleStudentActive,
  checkParentAlerts,
};
