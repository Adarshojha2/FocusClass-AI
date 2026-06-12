// const Note = require("../models/Note");

// const createNote = async (req, res) => {
//   try {

//     const {
//       title,
//       transcript,
//       summary,
//       importantTopics,
//     } = req.body;

//     const note = await Note.create({
//       user: req.user,
//       title,
//       transcript,
//       summary,
//       importantTopics,
//     });

//     res.status(201).json(note);

//   } catch (error) {
//     res.status(500).json({
//       message: error.message,
//     });
//   }
// };

// const getNotes = async (req, res) => {
//   try {

//     const notes = await Note.find({
//       user: req.user,
//     });

//     res.json(notes);

//   } catch (error) {
//     res.status(500).json({
//       message: error.message,
//     });
//   }
// };

// module.exports = {
//   createNote,
//   getNotes,
// };

const Note = require("../models/note");
const { generateSummary, generateExplanation } = require("../utils/ai");

const createNote = async (req, res) => {
  try {
    const { title, transcript, importantTopics } = req.body;

    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required to create notes",
      });
    }

    if (!title || !transcript) {
      return res.status(400).json({
        message: "Title and transcript are required",
      });
    }

    const summary = await generateSummary(transcript);

    const note = await Note.create({
      user: req.user,
      title,
      transcript,
      summary,
      importantTopics: importantTopics || [],
    });

    res.status(201).json(note);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getNotes = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Authentication required to view notes",
      });
    }

    const notes = await Note.find({
      user: req.user,
    });

    res.json(notes);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const explainNote = async (req, res) => {
  try {
    const { noteId } = req.params;
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        message: "A question is required to explain the note",
      });
    }

    const note = await Note.findOne({
      _id: noteId,
      user: req.user,
    });

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
      });
    }

    const sourceText = note.transcript || note.summary || note.title || "";
    const explanation = await generateExplanation(sourceText, question);

    res.json({
      explanation,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createNote,
  getNotes,
  explainNote,
};
