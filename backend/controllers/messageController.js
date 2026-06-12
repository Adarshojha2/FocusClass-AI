const Message = require("../models/message");
const User = require("../models/user");

exports.sendMessage = async (req, res) => {
  try {
    const { subject, message, recipientRole } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ message: "Subject and message are required." });
    }

    const sender = await User.findById(req.user);
    if (!sender) return res.status(404).json({ message: "Sender not found" });

    let finalRole = recipientRole || "all";

    // If student, they can only message the principal
    if (sender.role === "student") {
      finalRole = "principal";
    }

    const newMessage = await Message.create({
      sender: req.user,
      recipientRole: finalRole,
      subject,
      message,
    });

    res.status(201).json({
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMyMessages = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (!user) return res.status(404).json({ message: "User not found" });

    let query = {};

    if (user.role === "student") {
      // Students see broadcasts for students/all, plus DMs they sent to the principal
      query = {
        $or: [
          { recipientRole: "student" },
          { recipientRole: "all" },
          { sender: req.user, recipientRole: "principal" }
        ]
      };
    } else if (user.role === "teacher") {
      // Teachers see broadcasts for teachers/all
      query = {
        $or: [
          { recipientRole: "teacher" },
          { recipientRole: "all" }
        ]
      };
    } else if (user.role === "principal") {
      // Principal sees messages sent to "principal" (from students), plus messages they sent
      query = {
        $or: [
          { recipientRole: "principal" },
          { sender: req.user }
        ]
      };
    }

    const messages = await Message.find(query)
      .populate("sender", "name email role")
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
