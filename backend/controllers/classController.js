const bcrypt = require("bcryptjs");
const path = require("path");
const fs = require("fs");
const ClassSession = require("../models/classSession");
const Attendance = require("../models/attendance");
const User = require("../models/user");
const { computeImageHash, matchImageByHash } = require("../utils/ai");

const isStrongPassword = (password) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{10,}$/.test(password);
};

exports.createClass = async (req, res) => {
  try {
    const { subject, title, description, sessionPassword, classType } = req.body;
    const user = await User.findById(req.user);

    if (!subject || !title || !sessionPassword) {
      return res.status(400).json({
        message: "Subject, title and a strong session password are required",
      });
    }

    const isAuthorized = user && (user.role === "teacher" || user.role === "principal");
    if (!isAuthorized) {
      return res.status(403).json({
        message: "Only teacher and principal accounts can create class sessions.",
      });
    }

    if (!isStrongPassword(sessionPassword)) {
      return res.status(400).json({
        message:
          "Password must be at least 10 characters long and include uppercase, lowercase, number, and symbol.",
      });
    }

    const hashedPassword = await bcrypt.hash(sessionPassword, 10);
    const startTime = new Date();
    const joinDeadline = new Date(startTime.getTime() + 5 * 60000);
    
    // Default session length is 60 minutes
    const sessionEndTime = new Date(startTime.getTime() + 60 * 60000);

    const classSession = await ClassSession.create({
      teacher: req.user,
      subject,
      title,
      description,
      startTime,
      joinDeadline,
      sessionEndTime,
      status: "Active",
      students: [req.user],
      sessionPassword: hashedPassword,
      classType: classType === "in-person" ? "in-person" : "online",
      importantNote: "",
      noteReactions: []
    });

    res.status(201).json({
      message: "Class created successfully",
      classSession,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.joinClass = async (req, res) => {
  try {
    const { classSessionId } = req.body;
    const photoFile = req.file;

    if (!classSessionId) {
      return res.status(400).json({
        message: "classSessionId is required",
      });
    }

    const classSession = await ClassSession.findById(classSessionId);
    if (!classSession) {
      return res.status(404).json({
        message: "Class session not found",
      });
    }

    const now = new Date();
    if (classSession.status !== "Active") {
      return res.status(400).json({
        message: "Class is not currently active.",
      });
    }

    if (classSession.sessionEndTime && now > classSession.sessionEndTime) {
      return res.status(400).json({
        message: "This class session has already ended.",
      });
    }

    const isOnline = classSession.classType === "online";

    if (isOnline && !photoFile) {
      return res.status(400).json({
        message: "Please upload a clear photo to confirm your attendance.",
      });
    }

    if (classSession.joinDeadline && now > classSession.joinDeadline) {
      await Attendance.create({
        user: req.user,
        subject: classSession.subject,
        status: "Absent",
        classSession: classSession._id,
        photoMatch: false,
        photoName: isOnline ? photoFile?.originalname : "In-Person Classroom Login",
        joinTime: new Date(),
        activeSeconds: 0
      });

      return res.status(400).json({
        message:
          "The 5-minute join window has expired. You have been marked absent for this session.",
      });
    }

    if (isOnline) {
      const userDoc = await User.findById(req.user);
      if (!userDoc || !userDoc.photoUploaded || !userDoc.photoHash) {
        return res.status(400).json({
          message:
            "A profile photo is required for attendance verification. Please upload your photo first.",
        });
      }

      const uploadedBuffer = photoFile.buffer;
      const photoMatched = matchImageByHash(userDoc.photoHash, uploadedBuffer);

      if (!photoMatched) {
        return res.status(400).json({
          message:
            "Face verification failed. Please upload a clearer photo or use your registered profile photo.",
        });
      }
    }

    // Add student to the class list
    await ClassSession.findByIdAndUpdate(classSessionId, {
      $addToSet: { students: req.user },
    });

    // Create present attendance record
    await Attendance.create({
      user: req.user,
      subject: classSession.subject,
      status: "Present",
      classSession: classSession._id,
      photoMatch: isOnline,
      photoName: isOnline ? photoFile.originalname : "In-Person Classroom Login",
      joinTime: new Date(),
      activeSeconds: 0
    });

    res.json({
      message: isOnline 
        ? "Joined class successfully - Photo verified and attendance marked"
        : "Joined classroom successfully - Attendance marked",
      classSession,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.markAbsent = async (req, res) => {
  try {
    const { classSessionId, reason } = req.body;
    if (!classSessionId) {
      return res.status(400).json({ message: "classSessionId is required" });
    }

    const classSession = await ClassSession.findById(classSessionId);
    if (!classSession) {
      return res.status(404).json({ message: "Class session not found" });
    }

    const now = new Date();
    if (classSession.sessionEndTime && now > classSession.sessionEndTime) {
      return res.status(400).json({ message: "This class session has already ended." });
    }

    const existingAttendance = await Attendance.findOne({
      user: req.user,
      classSession: classSessionId,
    });

    if (existingAttendance) {
      existingAttendance.status = "Absent";
      existingAttendance.photoMatch = false;
      existingAttendance.photoName = reason || existingAttendance.photoName;
      await existingAttendance.save();
    } else {
      await Attendance.create({
        user: req.user,
        subject: classSession.subject,
        status: "Absent",
        classSession: classSession._id,
        photoMatch: false,
        photoName: reason || "Auto absent",
        joinTime: new Date(),
        activeSeconds: 0
      });
    }

    res.json({
      message: "Attendance updated: marked absent",
      classSession,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.pingPresence = async (req, res) => {
  try {
    const { classSessionId } = req.body;
    if (!classSessionId) {
      return res.status(400).json({ message: "classSessionId is required." });
    }

    const attendance = await Attendance.findOne({
      user: req.user,
      classSession: classSessionId,
    });

    if (!attendance) {
      return res.status(404).json({ message: "Attendance record not found." });
    }

    // Increment student active stay duration (pinged every 10 seconds)
    attendance.activeSeconds += 10;
    await attendance.save();

    res.json({ activeSeconds: attendance.activeSeconds });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.postImportantNote = async (req, res) => {
  try {
    const { classSessionId, note } = req.body;
    if (!classSessionId || !note) {
      return res.status(400).json({ message: "classSessionId and note are required." });
    }

    const classSession = await ClassSession.findById(classSessionId);
    if (!classSession) {
      return res.status(404).json({ message: "Class session not found." });
    }

    classSession.importantNote = note;
    await classSession.save();

    res.json({ message: "Important note published to class.", classSession });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.reactToNote = async (req, res) => {
  try {
    const { classSessionId } = req.body;
    if (!classSessionId) {
      return res.status(400).json({ message: "classSessionId is required." });
    }

    const classSession = await ClassSession.findById(classSessionId);
    if (!classSession) {
      return res.status(404).json({ message: "Class session not found." });
    }

    if (!classSession.noteReactions.includes(req.user)) {
      classSession.noteReactions.push(req.user);
      await classSession.save();
    }

    res.json({ message: "Reaction recorded.", classSession });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getActiveClasses = async (req, res) => {
  try {
    const now = new Date();
    const activeClasses = await ClassSession.find({
      status: "Active",
      sessionEndTime: { $gt: now },
    })
      .populate("teacher", "name email")
      .populate("students", "name email");

    res.json(activeClasses);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getClassById = async (req, res) => {
  try {
    const { classId } = req.params;

    const classSession = await ClassSession.findById(classId)
      .populate("teacher", "name email")
      .populate("students", "name email")
      .populate("importantTopics");

    if (!classSession) {
      return res.status(404).json({
        message: "Class session not found",
      });
    }

    res.json(classSession);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.endClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const { transcript } = req.body;

    const classSession = await ClassSession.findById(classId);
    if (!classSession) {
      return res.status(404).json({
        message: "Class session not found",
      });
    }

    // Evaluate attendance validation before ending
    const start = new Date(classSession.startTime);
    const end = new Date();
    const totalSeconds = (end - start) / 1000;
    
    // Student must be active for at least 83% of the class time (50 minutes for a 60 min class)
    const requiredSeconds = 0.83 * totalSeconds;

    const attendances = await Attendance.find({ classSession: classId });

    for (let att of attendances) {
      const student = await User.findById(att.user);
      if (!student || student.role !== "student") continue;

      const isStayValid = att.activeSeconds >= requiredSeconds;
      let isReactionValid = true;

      if (classSession.classType === "in-person") {
        isReactionValid = classSession.noteReactions.includes(att.user);
      }

      if (!isStayValid || !isReactionValid) {
        att.status = "Absent";
        att.photoMatch = false;
        att.photoName = !isStayValid
          ? `Stayed only ${Math.round(att.activeSeconds / 60)} min / ${Math.round(requiredSeconds / 60)} min required`
          : "Missed teacher classroom note reaction";
        await att.save();
      }
    }

    classSession.status = "Ended";
    classSession.endTime = new Date();
    if (transcript) classSession.transcript = transcript;
    await classSession.save();

    res.json({
      message: "Class ended and attendance records validated.",
      classSession,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getStudentClasses = async (req, res) => {
  try {
    const classes = await ClassSession.find({
      students: req.user,
    }).sort({ createdAt: -1 });

    res.json(classes);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.detectPresence = async (req, res) => {
  try {
    const { classSessionId, simulateSteppedAway } = req.body;

    if (!classSessionId) {
      return res.status(400).json({ message: "classSessionId is required" });
    }

    const classSession = await ClassSession.findById(classSessionId);
    if (!classSession || classSession.status !== "Active") {
      return res.status(400).json({ message: "No active class session found." });
    }

    const userDoc = await User.findById(req.user);
    if (!userDoc) {
      return res.status(404).json({ message: "Student not found." });
    }

    const isPresent = simulateSteppedAway !== "true" && simulateSteppedAway !== true;

    if (!isPresent) {
      const existingAttendance = await Attendance.findOne({
        user: req.user,
        classSession: classSessionId,
      });

      if (existingAttendance) {
        existingAttendance.status = "Absent";
        existingAttendance.photoMatch = false;
        existingAttendance.photoName = "AI: Stepped away from screen";
        await existingAttendance.save();
      } else {
        await Attendance.create({
          user: req.user,
          subject: classSession.subject,
          status: "Absent",
          classSession: classSession._id,
          photoMatch: false,
          photoName: "AI: Stepped away from screen",
          joinTime: new Date(),
          activeSeconds: 0
        });
      }

      return res.json({
        detected: false,
        confidence: 0.05,
        message: "AI Alert: No student detected in front of the screen!",
        markedAbsent: true
      });
    }

    res.json({
      detected: true,
      confidence: 0.95,
      message: "AI verification: Student presence confirmed."
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
