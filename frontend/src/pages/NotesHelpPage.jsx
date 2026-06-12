import { useState } from "react";
import api from "../api";

const NotesHelpPage = ({ user, onBack }) => {
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [selectedNote, setSelectedNote] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadNotes = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/notes");
      setNotes(response.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load notes.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectNote = (noteId) => {
    const note = notes.find((n) => n._id === noteId);
    setSelectedNoteId(noteId);
    setSelectedNote(note);
    setQuestions([]);
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();

    if (!currentQuestion.trim()) {
      setError("Please enter a question.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await api.post(`/api/notes/${selectedNoteId}/explain`, {
        question: currentQuestion,
      });

      setQuestions([
        ...questions,
        {
          q: currentQuestion,
          a: response.data.explanation,
          timestamp: new Date(),
        },
      ]);

      setCurrentQuestion("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not get explanation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <header className="header-row">
        <div>
          <h1>AI Notes Help Center</h1>
          <p>Ask questions about your saved notes and get instant AI-powered explanations.</p>
        </div>
        <button className="secondary" onClick={onBack}>
          ← Back to Dashboard
        </button>
      </header>

      {error && <div className="alert">{error}</div>}

      <div className="help-layout">
        <section className="card notes-panel">
          <h2>Your Saved Notes</h2>
          <button className="primary small" onClick={loadNotes} disabled={loading}>
            {loading ? "Loading..." : "Load My Notes"}
          </button>

          <div className="notes-list">
            {notes.length === 0 ? (
              <p>No notes found. Create a note in the dashboard first.</p>
            ) : (
              notes.map((note) => (
                <div
                  key={note._id}
                  className={`note-select-item ${selectedNoteId === note._id ? "active" : ""}`}
                  onClick={() => handleSelectNote(note._id)}
                >
                  <strong>{note.title}</strong>
                  <p className="note-summary">{note.summary || "No summary"}</p>
                  <span className="note-date">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="card qa-panel wide-card">
          <h2>Ask AI Questions</h2>

          {selectedNote ? (
            <>
              <div className="selected-note-info">
                <h3>{selectedNote.title}</h3>
                <p>{selectedNote.summary}</p>
              </div>

              <form onSubmit={handleAskQuestion} className="question-form">
                <label>
                  Your Question
                  <textarea
                    value={currentQuestion}
                    onChange={(e) => setCurrentQuestion(e.target.value)}
                    rows="3"
                    placeholder="Ask anything about this note..."
                    disabled={loading}
                  />
                </label>
                <button
                  type="submit"
                  className="primary"
                  disabled={loading || !currentQuestion.trim()}
                >
                  {loading ? "Thinking..." : "Ask AI"}
                </button>
              </form>

              <div className="qa-history">
                {questions.length === 0 ? (
                  <p className="hint">Ask your first question above to get started.</p>
                ) : (
                  questions.map((item, idx) => (
                    <div key={idx} className="qa-item">
                      <div className="qa-question">
                        <strong>Q:</strong> {item.q}
                      </div>
                      <div className="qa-answer">
                        <strong>A:</strong> {item.a}
                      </div>
                      <span className="qa-time">
                        {item.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <p className="hint-large">Select a note from the left panel to start asking questions.</p>
          )}
        </section>
      </div>
    </div>
  );
};

export default NotesHelpPage;
