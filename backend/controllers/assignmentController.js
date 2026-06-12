const Assignment = require("../models/assignment");
const User = require("../models/user");

exports.createAssignment = async (req, res) => {
  try {
    const { title, description, dueDate, subject } = req.body;
    if (!title || !description || !dueDate || !subject) {
      return res.status(400).json({ message: "Title, description, dueDate, and subject are required." });
    }

    const user = await User.findById(req.user);
    if (!user || (user.role !== "teacher" && user.role !== "principal")) {
      return res.status(403).json({ message: "Only teachers or principals can create assignments." });
    }

    const newAssignment = await Assignment.create({
      title,
      description,
      dueDate,
      subject,
      teacher: req.user,
    });

    res.status(201).json({ message: "Assignment created successfully", assignment: newAssignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAssignments = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: "User not found" });

    let assignments;
    if (user.role === "teacher" || user.role === "principal") {
      // Teachers see assignments they created
      assignments = await Assignment.find({ teacher: req.user })
        .populate("submissions.student", "name email rollNumber")
        .sort({ createdAt: -1 });
    } else {
      // Students see all assignments
      assignments = await Assignment.find()
        .populate("teacher", "name email")
        .sort({ createdAt: -1 });
    }

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.submitAssignment = async (req, res) => {
  try {
    const { assignmentId, submissionText } = req.body;
    if (!assignmentId || !submissionText) {
      return res.status(400).json({ message: "assignmentId and submissionText are required." });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: "Assignment not found." });

    // Check if student already submitted
    const existingIndex = assignment.submissions.findIndex(
      (sub) => sub.student.toString() === req.user.toString()
    );

    if (existingIndex !== -1) {
      // Update submission
      assignment.submissions[existingIndex].submissionText = submissionText;
      assignment.submissions[existingIndex].submittedAt = new Date();
    } else {
      // Add new submission
      assignment.submissions.push({
        student: req.user,
        submissionText,
      });
    }

    await assignment.save();
    res.json({ message: "Assignment submitted successfully.", assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.gradeSubmission = async (req, res) => {
  try {
    const { assignmentId, studentId, grade, feedback } = req.body;
    if (!assignmentId || !studentId || !grade) {
      return res.status(400).json({ message: "assignmentId, studentId and grade are required." });
    }

    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ message: "Assignment not found." });

    const submissionIndex = assignment.submissions.findIndex(
      (sub) => sub.student.toString() === studentId.toString()
    );

    if (submissionIndex === -1) {
      return res.status(404).json({ message: "Submission not found for this student." });
    }

    assignment.submissions[submissionIndex].grade = grade;
    if (feedback) assignment.submissions[submissionIndex].feedback = feedback;

    await assignment.save();
    res.json({ message: "Submission graded successfully.", assignment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
