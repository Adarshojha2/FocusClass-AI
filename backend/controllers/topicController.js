const TopicHighlight = require("../models/topicHighlight");
const ClassSession = require("../models/classSession");

exports.recordImportantTopic = async (req, res) => {
  try {
    const { classSessionId, topic, confidence, timestamp, importance } =
      req.body;

    if (!classSessionId || !topic || timestamp === undefined) {
      return res.status(400).json({
        message: "classSessionId, topic, and timestamp are required",
      });
    }

    const topicHighlight = await TopicHighlight.create({
      classSession: classSessionId,
      topic,
      confidence: confidence || 0.85,
      timestamp,
      importance: importance || "High",
    });

    // Also add to class session
    await ClassSession.findByIdAndUpdate(
      classSessionId,
      {
        $push: {
          importantTopics: {
            topic,
            timestamp,
            mentionedBy: "AI",
          },
        },
      },
      { new: true }
    );

    res.status(201).json({
      message: "Important topic recorded",
      topicHighlight,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.getTopicsFromClass = async (req, res) => {
  try {
    const { classSessionId } = req.params;

    const topics = await TopicHighlight.find({
      classSession: classSessionId,
    }).sort({ timestamp: 1 });

    if (topics.length === 0) {
      return res.status(404).json({
        message: "No important topics found for this class",
      });
    }

    const grouped = topics.reduce((acc, topic) => {
      const importance = topic.importance;
      if (!acc[importance]) {
        acc[importance] = [];
      }
      acc[importance].push(topic);
      return acc;
    }, {});

    res.json({
      classSessionId,
      totalTopics: topics.length,
      byImportance: grouped,
      topics,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

exports.addStudentNote = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({
        message: "Note is required",
      });
    }

    const topicHighlight = await TopicHighlight.findByIdAndUpdate(
      topicId,
      {
        $push: {
          studentNotes: {
            user: req.user,
            note,
          },
        },
      },
      { new: true }
    );

    if (!topicHighlight) {
      return res.status(404).json({
        message: "Topic not found",
      });
    }

    res.json({
      message: "Note added to topic",
      topicHighlight,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
