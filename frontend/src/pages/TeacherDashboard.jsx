import { useEffect, useMemo, useState } from "react";
import api from "../api";

const TeacherDashboard = ({ user, onLogout, onNavigate, onUpdateUser }) => {
  const [status, setStatus] = useState("Ready");
  const [silentMode, setSilentMode] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [focusHistory, setFocusHistory] = useState([]);
  const [notes, setNotes] = useState([]);
  const [activeClasses, setActiveClasses] = useState([]);
  const [topicsForClass, setTopicsForClass] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [blockedApps, setBlockedApps] = useState([]);
  const [availableSubjects] = useState(["Math", "Physics", "Biology", "Chemistry", "English"]);

  const [attendanceSubject, setAttendanceSubject] = useState(availableSubjects[0]);
  const [focusScore, setFocusScore] = useState(75);
  const [focusDistractions, setFocusDistractions] = useState("");
  
  // Note Creation
  const [noteTitle, setNoteTitle] = useState("");
  const [noteTranscript, setNoteTranscript] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [noteQuestion, setNoteQuestion] = useState("");
  const [noteExplanation, setNoteExplanation] = useState("");

  // Class Creation
  const [classTitle, setClassTitle] = useState("");
  const [classSubject, setClassSubject] = useState(availableSubjects[0]);
  const [classDescription, setClassDescription] = useState("");
  const [classPassword, setClassPassword] = useState("");
  const [classType, setClassType] = useState("online");
  const [selectedClassStudents, setSelectedClassStudents] = useState([]);
  const [selectedClassSession, setSelectedClassSession] = useState(null);
  const [selectedTeacherClassId, setSelectedTeacherClassId] = useState("");
  const [importantNoteText, setImportantNoteText] = useState("");

  // Blocked App Simulation
  const [appName, setAppName] = useState("");
  const [appReason, setAppReason] = useState("");
  const [appDuration, setAppDuration] = useState(60);

  // Profile Edit
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isHomeMenuOpen, setIsHomeMenuOpen] = useState(false);
  const [profileName, setProfileName] = useState(user.name || "");
  const [profilePhone, setProfilePhone] = useState(user.phone || "");
  const [profileRollNumber, setProfileRollNumber] = useState(user.rollNumber || "");
  const [profileLifeProfile, setProfileLifeProfile] = useState(user.lifeProfile || "");

  // Messages / Inbox
  const [messages, setMessages] = useState([]);
  const [feedbackSubject, setFeedbackSubject] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState("");

  // Student Activation & Inactivity Alerts
  const [students, setStudents] = useState([]);
  const [parentAlerts, setParentAlerts] = useState([]);

  // Assignment Management
  const [assignments, setAssignments] = useState([]);
  const [assignTitle, setAssignTitle] = useState("");
  const [assignDesc, setAssignDesc] = useState("");
  const [assignSubject, setAssignSubject] = useState(availableSubjects[0]);
  const [assignDueDate, setAssignDueDate] = useState("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [gradingStudentId, setGradingStudentId] = useState("");
  const [gradeValue, setGradeValue] = useState("A");
  const [gradeFeedback, setGradeFeedback] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const stats = useMemo(() => {
    const totalBlocked = blockedApps.length;
    const totalDuration = blockedApps.reduce((sum, entry) => sum + (entry.durationSeconds || 0), 0);
    const uniqueApps = [...new Set(blockedApps.map((entry) => entry.appName))].length;
    return { totalBlocked, totalDuration, uniqueApps };
  }, [blockedApps]);

  const userId = user?._id || user?.id;

  const loadDashboard = async () => {
    try {
      setStatus("Loading data...");
      setError("");
      setSuccess("");

      const [
        attendance,
        focus,
        noteList,
        active,
        blocked,
        studentsList,
        alertsList,
        messagesList,
        assignmentsList,
      ] = await Promise.all([
        api.get("/api/attendance"),
        api.get("/api/focus"),
        api.get("/api/notes"),
        api.get("/api/class/active"),
        api.get("/api/app-blocking"),
        api.get("/api/auth/students"),
        api.get("/api/auth/students/parent-alerts"),
        api.get("/api/messages/my-messages"),
        api.get("/api/assignments/list"),
      ]);

      setAttendanceHistory(attendance.data);
      setFocusHistory(focus.data);
      setNotes(noteList.data);
      setActiveClasses(active.data);
      setBlockedApps(blocked.data.blockedApps || []);
      setStudents(studentsList.data);
      setParentAlerts(alertsList.data);
      setMessages(messagesList.data);
      setAssignments(assignmentsList.data);

      if (!selectedNoteId && noteList.data.length > 0) {
        setSelectedNoteId(noteList.data[0]._id);
      }
      setStatus("Ready");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to load dashboard data.");
      setStatus("Error");
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    setProfileName(user.name || "");
    setProfilePhone(user.phone || "");
    setProfileRollNumber(user.rollNumber || "");
    setProfileLifeProfile(user.lifeProfile || "");
  }, [user]);

  const handleToggleEditProfile = () => {
    setError("");
    setSuccess("");
    setIsEditingProfile((current) => !current);
  };

  const handleSaveProfile = async () => {
    try {
      setError("");
      setSuccess("");
      const response = await api.put("/api/auth/update", {
        name: profileName,
        phone: profilePhone,
        rollNumber: profileRollNumber,
        lifeProfile: profileLifeProfile,
      });
      setIsEditingProfile(false);
      if (response.data?.user) {
        if (typeof onUpdateUser === "function") {
          onUpdateUser(response.data.user);
        }
      }
      setSuccess("Profile saved successfully.");
      loadDashboard();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save profile.");
    }
  };

  const handleToggleStudentActive = async (studentId) => {
    try {
      setError("");
      setSuccess("");
      const response = await api.put(`/api/auth/students/toggle-active/${studentId}`);
      setSuccess(`Status updated for student ${response.data.user.name}`);
      loadDashboard();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to toggle student activation.");
    }
  };

  const handleCreateClass = async () => {
    try {
      setError("");
      setSuccess("");
      await api.post("/api/class/create", {
        subject: classSubject,
        title: classTitle,
        description: classDescription,
        sessionPassword: classPassword,
        classType: classType,
      });
      setSuccess("Class session created successfully.");
      setClassTitle("");
      setClassDescription("");
      setClassPassword("");
      setClassType("online");
      loadDashboard();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create class.");
    }
  };

  const handleViewStudents = async (classId) => {
    try {
      setError("");
      const response = await api.get(`/api/class/${classId}`);
      setSelectedTeacherClassId(classId);
      setSelectedClassSession(response.data);
      setSelectedClassStudents(response.data.students || []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load student list.");
    }
  };

  const handlePostImportantNote = async () => {
    if (!importantNoteText.trim()) return;
    try {
      setError("");
      setSuccess("");
      await api.post("/api/class/post-note", {
        classSessionId: selectedTeacherClassId,
        note: importantNoteText,
      });
      setSuccess("Important note published to classroom.");
      setImportantNoteText("");
      handleViewStudents(selectedTeacherClassId);
    } catch (err) {
      setError(err.response?.data?.message || "Could not publish note.");
    }
  };

  const handleLoadTopics = async (classId) => {
    try {
      setError("");
      const response = await api.get(`/api/topics/class/${classId}`);
      setSelectedClassId(classId);
      setTopicsForClass(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load topics.");
    }
  };

  const handleCreateNote = async () => {
    try {
      setError("");
      setSuccess("");
      await api.post("/api/notes", { title: noteTitle, transcript: noteTranscript });
      setSuccess("Lecture notes created with AI summary.");
      setNoteTitle("");
      setNoteTranscript("");
      loadDashboard();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create note.");
    }
  };

  const handleAskNoteQuestion = async () => {
    try {
      setError("");
      const response = await api.post(`/api/notes/${selectedNoteId}/explain`, {
        question: noteQuestion,
      });
      setNoteExplanation(response.data.explanation);
    } catch (err) {
      setError(err.response?.data?.message || "Could not get note explanation.");
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!assignTitle || !assignDesc || !assignDueDate) {
      setError("Please fill in all assignment fields.");
      return;
    }

    try {
      setError("");
      setSuccess("");
      await api.post("/api/assignments/create", {
        title: assignTitle,
        description: assignDesc,
        subject: assignSubject,
        dueDate: assignDueDate,
      });
      setSuccess("Assignment task published successfully.");
      setAssignTitle("");
      setAssignDesc("");
      setAssignDueDate("");
      loadDashboard();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create assignment.");
    }
  };

  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    if (!gradeValue) return;

    try {
      setError("");
      setSuccess("");
      await api.post("/api/assignments/grade", {
        assignmentId: selectedAssignmentId,
        studentId: gradingStudentId,
        grade: gradeValue,
        feedback: gradeFeedback,
      });
      setSuccess("Submission graded successfully.");
      setGradingStudentId("");
      setGradeFeedback("");
      loadDashboard();
    } catch (err) {
      setError(err.response?.data?.message || "Could not submit grade.");
    }
  };

  const handleEndClass = async (classId) => {
    try {
      setError("");
      setSuccess("");
      await api.put(`/api/class/${classId}/end`);
      setSuccess("Class session ended and attendance validated.");
      loadDashboard();
    } catch (err) {
      setError(err.response?.data?.message || "Could not end class.");
    }
  };

  const handleLogBlockedApp = async () => {
    if (!appName.trim()) return;
    try {
      setError("");
      setSuccess("");
      await api.post("/api/app-blocking/log", {
        appName,
        reason: appReason,
        durationSeconds: appDuration,
      });
      setSuccess("Distracting app logged successfully.");
      setAppName("");
      setAppReason("");
      setAppDuration(60);
      loadDashboard();
    } catch (err) {
      setError(err.response?.data?.message || "Could not log blocked app.");
    }
  };

  const teacherClasses = activeClasses.filter(
    (item) => item.teacher?._id === userId || item.teacher?.id === userId
  );

  const selectedAssignment = assignments.find((a) => a._id === selectedAssignmentId);

  // Comput Bulletins/Notices for Teacher Dashboard Top Panel
  const pendingActivations = students.filter(s => !s.isDashboardActive);
  const ungradedSubmissionsCount = assignments.reduce((sum, ass) => {
    const ungraded = ass.submissions?.filter(s => s.grade === "Not Graded") || [];
    return sum + ungraded.length;
  }, 0);
  const principalBroadcasts = messages.filter(m => m.recipientRole === "teacher" || m.recipientRole === "all");

  const avatarUrl = user.photoUrl ? `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${user.photoUrl}?h=${user.photoHash || ""}` : "";

  return (
    <div className="page-shell">
      <header className="header-row">
        <div>
          <h1 style={{ letterSpacing: "-0.04em" }}>Teacher Dashboard</h1>
          <p>Welcome back, Educator <strong>{user.name}</strong>. Manage your classes, create assignments, activate student profiles, and review AI analytics.</p>
        </div>
        <div className="header-actions">
          <div className="home-menu">
            <button className="secondary home-menu-button" onClick={() => setIsHomeMenuOpen((open) => !open)}>
              <span>🏠 Home</span>
              <span className="menu-caret">▾</span>
            </button>
            {isHomeMenuOpen && (
              <div className="home-menu-dropdown">
                <button className="dropdown-item" onClick={() => { onNavigate("dashboard"); setIsHomeMenuOpen(false); }}>
                  Dashboard
                </button>
                <button className="dropdown-item" onClick={() => { onNavigate("profile"); setIsHomeMenuOpen(false); }}>
                  Profile Settings
                </button>
              </div>
            )}
          </div>
          {user.photoUrl && (
            <img src={avatarUrl} alt="Profile" className="header-avatar" />
          )}
          <button className="secondary" onClick={() => onNavigate("notes-help")}>📚 AI Notes Help</button>
          <button className="secondary" onClick={() => setSilentMode(!silentMode)}>
            {silentMode ? "Disable Silent Mode" : "Enable Silent Mode"}
          </button>
          <button className="btn-logout" onClick={onLogout}>🚪 Log Out</button>
        </div>
      </header>

      {/* Profile & Bulletins Top Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24, marginBottom: 24, alignItems: "stretch" }} className="top-dashboard-row">
        
        {/* Left: Detailed Profile Summary Card */}
        <section className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" style={{ width: 64, height: 64, borderRadius: 16, objectFit: "cover", border: "1px solid var(--border)" }} />
            ) : (
              <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(15,23,42,0.06)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)", fontWeight: "bold" }}>No Photo</div>
            )}
            <div>
              <h2 style={{ margin: 0, fontSize: "1.2rem" }}>{user.name}</h2>
              <span style={{ fontSize: "0.85rem", color: "var(--primary-600)", fontWeight: 700 }}>TEACHER</span>
            </div>
          </div>
          
          <div style={{ fontSize: "0.88rem", display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
            <div>📧 <strong>Email:</strong> {user.email}</div>
            <div>📱 <strong>Phone:</strong> {user.phone || "Not set"}</div>
            <div>✍️ <strong>Summary:</strong> {user.lifeProfile || "No bio summary shared yet."}</div>
          </div>
          
          <button className="secondary small" style={{ marginTop: "auto", width: "100%" }} onClick={handleToggleEditProfile}>
            {isEditingProfile ? "Close Profile Form" : "🔧 Edit Profile Details"}
          </button>
        </section>

        {/* Right: FocusClass Priority Action & Bulletins Hub */}
        <section className="card" style={{ background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)", border: "1px solid #bae6fd", display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 style={{ fontSize: "1.4rem", color: "#0369a1", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <span>🔔 Priority Action Bulletins</span>
          </h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, flex: 1 }}>
            
            {/* Active Classes & Messages */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <h3 style={{ fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#0369a1", margin: 0 }}>Pending Student Activations</h3>
              <div style={{ maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                {pendingActivations.length === 0 ? (
                  <div style={{ fontSize: "0.88rem", color: "#047857", opacity: 0.8, fontStyle: "italic", background: "rgba(52,211,153,0.1)", padding: "8px 12px", borderRadius: 10, border: "1px dashed rgba(52,211,153,0.3)" }}>
                    All student dashboards approved!
                  </div>
                ) : (
                  pendingActivations.map(std => (
                    <div key={std.id} style={{ background: "#ffffff", padding: "8px 12px", borderRadius: 10, border: "1px solid #bae6fd", fontSize: "0.85rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <strong>{std.name}</strong> (Roll: {std.rollNumber || "N/A"})
                      </div>
                      <button className="primary small" style={{ padding: "4px 8px", fontSize: "0.78rem" }} onClick={() => handleToggleStudentActive(std.id)}>Activate</button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Ungraded Tasks & Principal announcements */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <h3 style={{ fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#0369a1", margin: 0 }}>Work Items To Grade</h3>
              <div style={{ background: "#ffffff", padding: "10px 14px", borderRadius: 12, border: "1px solid #bae6fd", fontSize: "0.9rem" }}>
                {ungradedSubmissionsCount === 0 ? (
                  <div style={{ color: "#047857", fontWeight: "bold" }}>✅ All homework submissions graded.</div>
                ) : (
                  <div>
                    ⚠️ You have <strong>{ungradedSubmissionsCount} ungraded submissions</strong> awaiting review in the assignment panel.
                  </div>
                )}
              </div>

              <h3 style={{ fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#0369a1", margin: 0 }}>Latest Principal Broadcast</h3>
              <div style={{ maxHeight: "80px", overflowY: "auto" }}>
                {principalBroadcasts.length === 0 ? (
                  <div style={{ fontSize: "0.85rem", color: "#0369a1", opacity: 0.8, fontStyle: "italic" }}>No announcements from Principal.</div>
                ) : (
                  <div style={{ background: "#ffffff", padding: 8, borderRadius: 8, border: "1px solid #bae6fd", fontSize: "0.8rem" }}>
                    <strong>{principalBroadcasts[0].subject}:</strong> "{principalBroadcasts[0].message}"
                  </div>
                )}
              </div>
            </div>

          </div>
        </section>

      </div>

      {/* Editing Profile Mode inline block overlay */}
      {isEditingProfile && (
        <div className="card wide-card" style={{ marginBottom: 24, border: "1px solid var(--primary)" }}>
          <h2>🔧 Edit Profile Details</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <label>
              Full Name
              <input value={profileName} onChange={(e) => setProfileName(e.target.value)} />
            </label>
            <label>
              Phone Number
              <input value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} />
            </label>
          </div>
          <label>
            Bio Summary
            <textarea value={profileLifeProfile} onChange={(e) => setProfileLifeProfile(e.target.value)} rows="3" />
          </label>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 12 }}>
            <button className="secondary small" onClick={() => setIsEditingProfile(false)}>Cancel</button>
            <button className="primary small" onClick={handleSaveProfile}>Save Changes</button>
          </div>
        </div>
      )}

      {error && <div className="alert">{error}</div>}
      {success && <div className="status-chip" style={{ background: "rgba(52,211,153,0.15)", borderColor: "rgba(52,211,153,0.3)" }}>{success}</div>}
      
      <div className="grid-layout">

        {/* Middle Column: Class Management Controls */}
        <section className="card">
          <h2>Class Sessions Control</h2>
          <p>Create and monitor active virtual classroom sessions.</p>

          <div className="small-list" style={{ maxHeight: "250px", overflowY: "auto", marginBottom: 20 }}>
            {teacherClasses.length === 0 ? (
              <p style={{ color: "var(--muted)", fontStyle: "italic" }}>No active sessions found. Create a new class below.</p>
            ) : (
              teacherClasses.map((item) => (
                <div key={item._id} className="list-item" style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{item.title}</strong>
                    <span style={{ fontSize: "0.8rem", color: "var(--primary-600)", fontWeight: 700 }}>{item.classType.toUpperCase()} · {item.status}</span>
                  </div>
                  <div style={{ fontSize: "0.9rem", color: "var(--muted)" }}>{item.subject}</div>
                  <div style={{ fontSize: "0.9rem" }}>Joined: {item.students?.length || 0} students</div>
                  <div className="session-actions" style={{ marginTop: 8, display: "flex", gap: 6 }}>
                    <button className="secondary small" onClick={() => handleViewStudents(item._id)}>Students</button>
                    <button className="secondary small" onClick={() => handleLoadTopics(item._id)}>Topics</button>
                    <button className="primary small" style={{ background: "#e11d48" }} onClick={() => handleEndClass(item._id)}>End Class</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <h3 style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>Launch New Class Session</h3>
          <label>
            Class Type
            <select value={classType} onChange={(e) => setClassType(e.target.value)}>
              <option value="online">Online Live Class (Webcam AI Match)</option>
              <option value="in-person">In-Person Classroom Class (Important Note Reaction)</option>
            </select>
          </label>
          <label>
            Class Title
            <input value={classTitle} onChange={(e) => setClassTitle(e.target.value)} placeholder="Intro to Algorithms" />
          </label>
          <label>
            Subject Category
            <select value={classSubject} onChange={(e) => setClassSubject(e.target.value)}>
              {availableSubjects.map((subject) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </label>
          <label>
            Brief Description
            <input value={classDescription} onChange={(e) => setClassDescription(e.target.value)} placeholder="Lesson materials..." />
          </label>
          <label>
            Session Password (lock dashboard)
            <input type="password" value={classPassword} onChange={(e) => setClassPassword(e.target.value)} placeholder="At least 10 chars, uppercase, symbol" />
          </label>
          <button className="primary" style={{ width: "100%" }} onClick={handleCreateClass}>Create Class Session</button>
        </section>

        {/* Selected Class Student Details Roster & In-Classroom note posting */}
        <section className="card">
          <h2>Class Session Manager</h2>
          {selectedClassSession ? (
            <div>
              <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
                Class: <strong>{selectedClassSession.title}</strong> ({selectedClassSession.classType.toUpperCase()})
              </p>

              {selectedClassSession.classType === "in-person" && (
                <div style={{ background: "rgba(56,189,248,0.06)", border: "1px solid var(--primary)", padding: 14, borderRadius: 12, marginBottom: 16 }}>
                  <h4 style={{ margin: "0 0 6px 0" }}>Post Important Note</h4>
                  <p style={{ margin: "0 0 10px 0", fontSize: "0.85rem", color: "var(--muted)" }}>In-person students must click "Acknowledge" to be marked Present.</p>
                  <input 
                    type="text" 
                    value={importantNoteText} 
                    onChange={(e) => setImportantNoteText(e.target.value)} 
                    placeholder="e.g. Read Chapter 5 before tomorrow"
                    style={{ padding: 8 }}
                  />
                  <button className="primary small" style={{ width: "100%", marginTop: 8 }} onClick={handlePostImportantNote}>
                    Broadcast Note
                  </button>
                  {selectedClassSession.importantNote && (
                    <div style={{ marginTop: 10, fontSize: "0.85rem", borderTop: "1px dashed var(--border)", paddingTop: 8 }}>
                      <strong>Active Note:</strong> "{selectedClassSession.importantNote}"
                    </div>
                  )}
                </div>
              )}

              <h3>Roster & Reaction Status</h3>
              <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                {selectedClassStudents.length === 0 ? (
                  <p style={{ color: "var(--muted)", fontStyle: "italic", fontSize: "0.88rem" }}>No students have joined yet.</p>
                ) : (
                  selectedClassStudents.map((std) => {
                    const reacted = selectedClassSession.noteReactions?.includes(std._id);
                    return (
                      <div key={std._id} className="list-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, padding: 10 }}>
                        <div>
                          <strong>{std.name}</strong>
                          <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{std.email}</div>
                        </div>
                        {selectedClassSession.classType === "in-person" && (
                          <span style={{ 
                            fontSize: "0.78rem", 
                            padding: "2px 6px", 
                            borderRadius: 6,
                            background: reacted ? "rgba(52,211,153,0.12)" : "rgba(245,158,11,0.12)",
                            color: reacted ? "#047857" : "#b45309"
                          }}>
                            {reacted ? "Acknowledged 👍" : "Pending ⏳"}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--muted)", border: "2px dashed var(--border)", borderRadius: 16, minHeight: "200px" }}>
              Select a class on the left to manage it here.
            </div>
          )}
        </section>

        {/* Right Column: Inactivity Alerts */}
        <section className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <h2 style={{ fontSize: "1.3rem", margin: "0 0 8px 0" }}>⚠️ Inactive Student Alerts</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: "0 0 12px 0" }}>Students inactive for 2 days. System automatically logs notification to their parent's email.</p>
            <div style={{ maxHeight: "200px", overflowY: "auto" }}>
              {parentAlerts.length === 0 ? (
                <div style={{ fontStyle: "italic", fontSize: "0.9rem", color: "var(--muted)" }}>No students are currently inactive.</div>
              ) : (
                parentAlerts.map(alert => (
                  <div key={alert.id} style={{ background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.2)", padding: 10, borderRadius: 12, marginBottom: 8, fontSize: "0.88rem" }}>
                    <div style={{ fontWeight: 700 }}>{alert.name}</div>
                    <div style={{ color: "var(--muted)" }}>Parent Email: {alert.parentEmail}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

      </div>

      {/* Roster & Assignments Grid */}
      <div className="grid-layout" style={{ marginTop: 24 }}>
        
        {/* Student Activation Roster Controls */}
        <section className="card wide-card" style={{ gridColumn: "span 2" }}>
          <h2>Student Activation Roster</h2>
          <p style={{ color: "var(--muted)", marginTop: -8 }}>Approve student access so they can log in and view their study metrics.</p>
          <div style={{ maxHeight: "300px", overflowY: "auto", marginTop: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)", color: "var(--muted)", fontSize: "0.9rem" }}>
                  <th style={{ padding: 8 }}>Name</th>
                  <th style={{ padding: 8 }}>Email</th>
                  <th style={{ padding: 8 }}>Roll/ID</th>
                  <th style={{ padding: 8 }}>Photo Status</th>
                  <th style={{ padding: 8 }}>Access Dashboard</th>
                  <th style={{ padding: 8, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: 8, fontWeight: 600 }}>{student.name}</td>
                    <td style={{ padding: 8, fontSize: "0.88rem" }}>{student.email}</td>
                    <td style={{ padding: 8 }}>{student.rollNumber || "N/A"}</td>
                    <td style={{ padding: 8 }}>
                      <span style={{
                        padding: "2px 6px",
                        borderRadius: 6,
                        fontSize: "0.78rem",
                        background: student.photoUploaded ? "rgba(52,211,153,0.12)" : "rgba(244,63,94,0.12)",
                        color: student.photoUploaded ? "#047857" : "#be123c"
                      }}>
                        {student.photoUploaded ? "Uploaded" : "No Photo"}
                      </span>
                    </td>
                    <td style={{ padding: 8 }}>
                      <span style={{
                        padding: "2px 6px",
                        borderRadius: 6,
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        background: student.isDashboardActive ? "rgba(56,189,248,0.12)" : "rgba(245,158,11,0.12)",
                        color: student.isDashboardActive ? "#0369a1" : "#b45309"
                      }}>
                        {student.isDashboardActive ? "Activated" : "Disabled"}
                      </span>
                    </td>
                    <td style={{ padding: 8, textAlign: "right" }}>
                      <button 
                        className={student.isDashboardActive ? "secondary small" : "primary small"} 
                        onClick={() => handleToggleStudentActive(student.id)}
                        style={{ padding: "4px 8px", borderRadius: 8 }}
                      >
                        {student.isDashboardActive ? "Disable" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      {/* Assignment Management System */}
      <section className="card" style={{ marginTop: 24 }}>
        <h2>Assignment Task board</h2>
        <p style={{ color: "var(--muted)", marginTop: -8 }}>Give tasks to students, view student homework responses, and assign letter grades.</p>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 18 }}>
          
          {/* Create Assignment & List */}
          <div>
            <h3>Publish New Homework</h3>
            <form onSubmit={handleCreateAssignment}>
              <label>
                Title of Task
                <input type="text" value={assignTitle} onChange={(e) => setAssignTitle(e.target.value)} placeholder="Quiz 1: Javascript loops" required />
              </label>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label>
                  Subject
                  <select value={assignSubject} onChange={(e) => setAssignSubject(e.target.value)}>
                    {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
                <label>
                  Due Date
                  <input type="date" value={assignDueDate} onChange={(e) => setAssignDueDate(e.target.value)} required />
                </label>
              </div>

              <label>
                Description & Instructions
                <textarea value={assignDesc} onChange={(e) => setAssignDesc(e.target.value)} rows="3" placeholder="Explain the assignment tasks..." required />
              </label>

              <button type="submit" className="primary" style={{ width: "100%", marginTop: 8 }}>Publish Assignment</button>
            </form>

            <h3 style={{ borderTop: "1px solid var(--border)", paddingTop: 16, marginTop: 20 }}>Existing Assignments</h3>
            <div style={{ maxHeight: "250px", overflowY: "auto" }}>
              {assignments.length === 0 ? (
                <p style={{ color: "var(--muted)", fontStyle: "italic" }}>No assignments created yet.</p>
              ) : (
                assignments.map((ass) => (
                  <div 
                    key={ass._id} 
                    onClick={() => setSelectedAssignmentId(ass._id)}
                    style={{ 
                      padding: 12, 
                      borderRadius: 12, 
                      border: "1px solid var(--border)", 
                      background: selectedAssignmentId === ass._id ? "rgba(56,189,248,0.08)" : "#ffffff",
                      borderColor: selectedAssignmentId === ass._id ? "var(--primary)" : "var(--border)",
                      marginBottom: 8, 
                      cursor: "pointer" 
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{ass.title} ({ass.subject})</div>
                    <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>Due Date: {new Date(ass.dueDate).toLocaleDateString()}</div>
                    <div style={{ fontSize: "0.85rem", marginTop: 4 }}>Submissions: <strong>{ass.submissions?.length || 0}</strong></div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Submissions & Grading Pane */}
          <div>
            <h3>Review Student Submissions</h3>
            {selectedAssignment ? (
              <div>
                <div style={{ background: "rgba(15,23,42,0.02)", border: "1px solid var(--border)", padding: 14, borderRadius: 12, marginBottom: 16 }}>
                  <h4 style={{ margin: 0, color: "var(--primary-600)" }}>{selectedAssignment.title}</h4>
                  <p style={{ fontSize: "0.88rem", margin: "6px 0 0 0" }}>{selectedAssignment.description}</p>
                </div>

                <div style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {selectedAssignment.submissions.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "30px 0", color: "var(--muted)", fontSize: "0.9rem" }}>No student answers submitted yet.</div>
                  ) : (
                    selectedAssignment.submissions.map((sub) => (
                      <div 
                        key={sub._id} 
                        style={{ 
                          padding: 12, 
                          border: "1px solid var(--border)", 
                          borderRadius: 12, 
                          marginBottom: 10, 
                          background: gradingStudentId === sub.student?._id ? "rgba(52,211,153,0.05)" : "#ffffff" 
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "0.9rem" }}>
                          <span>{sub.student?.name || "Student"} (Roll: {sub.student?.rollNumber || "N/A"})</span>
                          <span style={{ 
                            fontSize: "0.8rem", 
                            background: sub.grade === "Not Graded" ? "rgba(245,158,11,0.15)" : "rgba(52,211,153,0.15)",
                            color: sub.grade === "Not Graded" ? "#b45309" : "#047857",
                            padding: "2px 8px", 
                            borderRadius: 6 
                          }}>
                            {sub.grade}
                          </span>
                        </div>
                        <p style={{ margin: "6px 0", background: "#f8fafc", padding: 8, borderRadius: 8, fontSize: "0.88rem" }}>
                          {sub.submissionText}
                        </p>
                        {sub.feedback && <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Feedback: <em>{sub.feedback}</em></div>}
                        
                        <div style={{ textAlign: "right", marginTop: 8 }}>
                          <button 
                            className="secondary small" 
                            style={{ padding: "4px 10px", fontSize: "0.8rem" }} 
                            onClick={() => { setGradingStudentId(sub.student?._id); setSelectedAssignmentId(selectedAssignment._id); }}
                          >
                            Grade Work
                          </button>
                        </div>

                        {/* Inline Grading Form */}
                        {gradingStudentId === sub.student?._id && (
                          <form onSubmit={handleGradeSubmission} style={{ marginTop: 12, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginBottom: 8 }}>
                              <label style={{ margin: 0, fontSize: "0.85rem" }}>
                                Score Grade
                                <select value={gradeValue} onChange={(e) => setGradeValue(e.target.value)} style={{ padding: 8, margin: 0 }}>
                                  <option value="A">Grade A</option>
                                  <option value="B">Grade B</option>
                                  <option value="C">Grade C</option>
                                  <option value="D">Grade D</option>
                                  <option value="F">Grade F (Fail)</option>
                                  <option value="Pass">Pass</option>
                                </select>
                              </label>
                              <label style={{ margin: 0, fontSize: "0.85rem" }}>
                                Teacher Comments
                                <input 
                                  value={gradeFeedback} 
                                  onChange={(e) => setGradeFeedback(e.target.value)} 
                                  placeholder="Well done / needs review..." 
                                  style={{ padding: 8, margin: 0 }} 
                                />
                              </label>
                            </div>
                            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                              <button type="button" className="secondary small" onClick={() => setGradingStudentId("")}>Cancel</button>
                              <button type="submit" className="primary small">Save Grade</button>
                            </div>
                          </form>
                        )}

                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: "220px", border: "2px dashed var(--border)", borderRadius: 12, color: "var(--muted)" }}>
                Select an assignment on the left to review student answers.
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Notes & AI summaries section */}
      <div className="grid-layout" style={{ marginTop: 24 }}>
        
        {/* Lecture Notes creation */}
        <section className="card">
          <h2>Lecture Transcripts & Notes</h2>
          <p>Create lecture transcripts and have them summarized by Hugging Face AI.</p>
          <label>
            Note Title
            <input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Lecture summary title" />
          </label>
          <label>
            Transcript Content
            <textarea value={noteTranscript} onChange={(e) => setNoteTranscript(e.target.value)} rows="5" placeholder="Paste class transcript or lecture notes here"></textarea>
          </label>
          <button className="primary" onClick={handleCreateNote}>Create AI Note</button>

          <div style={{ maxHeight: "250px", overflowY: "auto", marginTop: 16 }}>
            {notes.slice(-4).reverse().map((note) => (
              <div key={note._id} className="note-item" style={{ padding: 12, marginBottom: 10 }}>
                <strong>{note.title}</strong>
                <p style={{ fontSize: "0.88rem", margin: "4px 0" }}>{note.summary || "Summary pending..."}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Explain Concepts Q&A section */}
        <section className="card wide-card">
          <h2>✨ Ask AI About a Note</h2>
          <p>Select any lecture note to ask questions and receive explanations.</p>
          <label>
            Select Lecture Note
            <select value={selectedNoteId} onChange={(e) => setSelectedNoteId(e.target.value)}>
              <option value="">Choose a note</option>
              {notes.map((note) => (
                <option key={note._id} value={note._id}>{note.title}</option>
              ))}
            </select>
          </label>
          <label>
            Your Question
            <textarea value={noteQuestion} onChange={(e) => setNoteQuestion(e.target.value)} rows="3" placeholder="Ask AI to explain this concept in simple terms..."></textarea>
          </label>
          <div className="button-group">
            <button className="primary" onClick={handleAskNoteQuestion} disabled={!selectedNoteId || !noteQuestion}>Ask AI</button>
            <button className="secondary" onClick={() => onNavigate("notes-help")}>Open Full Q&A Page</button>
          </div>
          {noteExplanation && (
            <div className="explanation-box" style={{ marginTop: 16, background: "rgba(56,189,248,0.06)", border: "1px solid var(--primary)", padding: 16, borderRadius: 16 }}>
              <div className="explanation-header" style={{ fontWeight: 700, marginBottom: 8, color: "var(--primary-600)" }}>AI Explanation</div>
              <div className="explanation-content" style={{ fontSize: "0.92rem", lineHeight: "1.5" }}>{noteExplanation}</div>
            </div>
          )}
        </section>

      </div>

      {/* Feedback & App Blocking Log details */}
      <div className="grid-layout" style={{ marginTop: 24 }}>
        
        {/* AI Topics */}
        <section className="card">
          <h2>AI Topic Detection</h2>
          <p>Select an active class session to view automatically identified topics.</p>
          <label>
            Select Class Session
            <select value={selectedClassId} onChange={(e) => handleLoadTopics(e.target.value)}>
              <option value="">Choose a class</option>
              {teacherClasses.map((item) => (
                <option key={item._id} value={item._id}>{item.title} ({item.subject})</option>
              ))}
            </select>
          </label>

          {topicsForClass ? (
            <div style={{ maxHeight: "250px", overflowY: "auto", marginTop: 12 }}>
              {topicsForClass.topics?.map((topic) => (
                <div key={topic._id} className="topic-card" style={{ padding: 12, marginBottom: 8 }}>
                  <strong>{topic.topic}</strong>
                  <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Importance: {topic.importance} · Confidence: {(topic.confidence * 100).toFixed(0)}%</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "var(--muted)", fontStyle: "italic" }}>Select a class session to display AI-highlighted topics.</p>
          )}
        </section>

        {/* Blocked App Log Simulation */}
        <section className="card">
          <h2>App Blocking Log</h2>
          <p>Log instances of distracting applications during class sessions.</p>
          <label>
            App Name
            <input value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="YouTube" />
          </label>
          <label>
            Reason for Block
            <input value={appReason} onChange={(e) => setAppReason(e.target.value)} placeholder="Social media video feed" />
          </label>
          <label>
            Duration blocked (seconds)
            <input type="number" value={appDuration} onChange={(e) => setAppDuration(Number(e.target.value))} min="5" />
          </label>
          <button className="primary" onClick={handleLogBlockedApp}>Log Blocked App</button>

          <div style={{ display: "flex", gap: 10, margin: "16px 0", flexWrap: "wrap" }}>
            <div className="stat-card" style={{ padding: 10, fontSize: "0.8rem" }}>Blocked: {stats.totalBlocked}</div>
            <div className="stat-card" style={{ padding: 10, fontSize: "0.8rem" }}>Time: {stats.totalDuration}s</div>
            <div className="stat-card" style={{ padding: 10, fontSize: "0.8rem" }}>Apps: {stats.uniqueApps}</div>
          </div>
        </section>

        {/* Message Principal / Feedback */}
        <section className="card">
          <h2>Send Message to Principal</h2>
          <p>Write directly to the school principal for support or feedback.</p>
          <label>
            Subject
            <input value={feedbackSubject} onChange={(e) => setFeedbackSubject(e.target.value)} placeholder="Subject of query" />
          </label>
          <label>
            Detailed Message
            <textarea value={feedbackMessage} onChange={(e) => setFeedbackMessage(e.target.value)} rows="3" placeholder="Write your query here..."></textarea>
          </label>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="primary" onClick={async () => {
              try {
                if (!feedbackSubject || !feedbackMessage) return;
                setFeedbackStatus("Sending...");
                await api.post('/api/feedback', { subject: feedbackSubject, message: feedbackMessage });
                setFeedbackStatus('Sent to Principal.');
                setFeedbackSubject('');
                setFeedbackMessage('');
              } catch (err) {
                setFeedbackStatus('Failed to send.');
              }
            }}>Send Message</button>
            <div style={{ color: "var(--primary-600)", fontSize: "0.9rem" }}>{feedbackStatus}</div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default TeacherDashboard;
