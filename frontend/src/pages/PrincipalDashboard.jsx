import { useEffect, useState } from "react";
import api from "../api";

const PrincipalDashboard = ({ user, onLogout, onNavigate, onUpdateUser }) => {
  const [status, setStatus] = useState("Ready");
  const [students, setStudents] = useState([]);
  const [parentAlerts, setParentAlerts] = useState([]);
  const [messages, setMessages] = useState([]);
  
  // Message broadcast state
  const [broadcastTarget, setBroadcastTarget] = useState("student");
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastContent, setBroadcastContent] = useState("");
  
  // Message reply state
  const [replyMessageId, setReplyMessageId] = useState(null);
  const [replyContent, setReplyContent] = useState("");

  // Profile Edit
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user.name || "");
  const [profilePhone, setProfilePhone] = useState(user.phone || "");
  const [profileLifeProfile, setProfileLifeProfile] = useState(user.lifeProfile || "");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const loadPrincipalData = async () => {
    try {
      setStatus("Loading dashboard data...");
      const [studentsRes, alertsRes, messagesRes] = await Promise.all([
        api.get("/api/auth/students"),
        api.get("/api/auth/students/parent-alerts"),
        api.get("/api/messages/my-messages"),
      ]);

      setStudents(studentsRes.data);
      setParentAlerts(alertsRes.data);
      setMessages(messagesRes.data);
      setStatus("Ready");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load Principal data.");
      setStatus("Error");
    }
  };

  useEffect(() => {
    loadPrincipalData();
  }, []);

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
        lifeProfile: profileLifeProfile,
      });
      setIsEditingProfile(false);
      if (response.data?.user) {
        if (typeof onUpdateUser === "function") {
          onUpdateUser(response.data.user);
        }
      }
      setSuccess("Profile saved successfully.");
      loadPrincipalData();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save profile.");
    }
  };

  const handleToggleActivation = async (studentId) => {
    try {
      setError("");
      setSuccess("");
      const response = await api.put(`/api/auth/students/toggle-active/${studentId}`);
      setSuccess(`Updated activation for student ${response.data.user.name}.`);
      loadPrincipalData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to toggle activation status.");
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!broadcastSubject || !broadcastContent) {
      setError("Please fill in both subject and message contents.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await api.post("/api/messages/send", {
        subject: broadcastSubject,
        message: broadcastContent,
        recipientRole: broadcastTarget,
      });

      setSuccess(`Announcement broadcast to ${broadcastTarget === "student" ? "Students" : "Teachers"} successfully.`);
      setBroadcastSubject("");
      setBroadcastContent("");
      loadPrincipalData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send announcement.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyContent) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const parentMsg = messages.find(m => m._id === replyMessageId);
      const studentName = parentMsg?.sender?.name || "Student";
      
      await api.post("/api/messages/send", {
        subject: `Reply to: ${parentMsg?.subject || "Your message"}`,
        message: replyContent,
        recipientRole: "student",
      });

      setSuccess(`Reply sent to ${studentName}.`);
      setReplyContent("");
      setReplyMessageId(null);
      loadPrincipalData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reply.");
    } finally {
      setLoading(false);
    }
  };

  const pendingActivations = students.filter(s => !s.isDashboardActive);
  const directMessages = messages.filter(m => m.recipientRole === "principal");

  const avatarUrl = user.photoUrl
    ? (user.photoUrl.startsWith("data:") ? user.photoUrl : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${user.photoUrl}?h=${user.photoHash || ""}`)
    : "";

  return (
    <div className="page-shell">
      <header className="header-row">
        <div>
          <h1 style={{ letterSpacing: "-0.04em" }}>Principal Dashboard</h1>
          <p>Welcome back, Administrator <strong>{user.name}</strong>. Control student roster access, read DMs, and broadcast school-wide announcements.</p>
        </div>
        <div className="header-actions">
          <button className="secondary" onClick={() => onNavigate("profile")}>👤 Profile Settings</button>
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
              <span style={{ fontSize: "0.85rem", color: "var(--primary-600)", fontWeight: 700 }}>PRINCIPAL</span>
            </div>
          </div>
          
          <div style={{ fontSize: "0.88rem", display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
            <div>📧 <strong>Email:</strong> {user.email}</div>
            <div>📱 <strong>Phone:</strong> {user.phone || "Not set"}</div>
            <div>✍️ <strong>Life Profile:</strong> {user.lifeProfile || "No bio details shared yet."}</div>
          </div>
          
          <button className="secondary small" style={{ marginTop: "auto", width: "100%" }} onClick={handleToggleEditProfile}>
            {isEditingProfile ? "Close Profile Form" : "🔧 Edit Profile Details"}
          </button>
        </section>

        {/* Right: FocusClass Priority Action & Bulletins Hub */}
        <section className="card" style={{ background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)", border: "1px solid #bae6fd", display: "flex", flexDirection: "column", gap: 16 }}>
          <h2 style={{ fontSize: "1.4rem", color: "#0369a1", margin: 0 }}>🔔 Administrative Action Bulletins</h2>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, flex: 1 }}>
            
            {/* Student Approval Alerts */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <h3 style={{ fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#0369a1", margin: 0 }}>Student Access Requests</h3>
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
                      <button className="primary small" style={{ padding: "4px 8px", fontSize: "0.78rem" }} onClick={() => handleToggleActivation(std.id)}>Activate</button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Direct message inbox & parent notification items */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <h3 style={{ fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#0369a1", margin: 0 }}>Direct Message Inquiries</h3>
              <div style={{ background: "#ffffff", padding: "10px 14px", borderRadius: 12, border: "1px solid #bae6fd", fontSize: "0.9rem" }}>
                {directMessages.length === 0 ? (
                  <div style={{ color: "#047857", fontWeight: "bold" }}>📬 Inbox is currently empty.</div>
                ) : (
                  <div>
                    📩 You have <strong>{directMessages.length} direct queries</strong> from students waiting in the inbox below.
                  </div>
                )}
              </div>

              <h3 style={{ fontSize: "0.95rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#0369a1", margin: 0 }}>Parent Notifications Active</h3>
              <div style={{ background: "#ffffff", padding: "8px 12px", borderRadius: 10, border: "1px solid #bae6fd", fontSize: "0.85rem" }}>
                👨‍👩‍👦 Total Stale Student Alerts: <strong>{parentAlerts.length}</strong>
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
            Bio Details
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
        
        {/* Student Activation List */}
        <div className="card wide-card" style={{ gridColumn: "span 2" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2>Student Access Management</h2>
            <button className="secondary small" onClick={loadPrincipalData}>🔄 Refresh List</button>
          </div>
          <p style={{ color: "var(--muted)", marginTop: -8 }}>Students register, but their dashboards are disabled until you or a teacher activates them.</p>
          
          <div style={{ overflowX: "auto", marginTop: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)", color: "var(--muted)" }}>
                  <th style={{ padding: "12px 8px" }}>Name</th>
                  <th style={{ padding: "12px 8px" }}>ID / Roll</th>
                  <th style={{ padding: "12px 8px" }}>Email</th>
                  <th style={{ padding: "12px 8px" }}>Photo Verify</th>
                  <th style={{ padding: "12px 8px" }}>Status</th>
                  <th style={{ padding: "12px 8px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: "20px 8px", textAlign: "center", color: "var(--muted)" }}>No students registered yet.</td>
                  </tr>
                ) : (
                  students.map((std) => (
                    <tr key={std.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 8px", fontWeight: 600 }}>{std.name}</td>
                      <td style={{ padding: "12px 8px" }}>{std.rollNumber || "N/A"}</td>
                      <td style={{ padding: "12px 8px", fontSize: "0.9rem" }}>{std.email}</td>
                      <td style={{ padding: "12px 8px" }}>
                        <span style={{
                          padding: "4px 8px",
                          borderRadius: 8,
                          fontSize: "0.8rem",
                          background: std.photoUploaded ? "rgba(52,211,153,0.15)" : "rgba(244,63,94,0.15)",
                          color: std.photoUploaded ? "#047857" : "#be123c"
                        }}>
                          {std.photoUploaded ? "Uploaded" : "No Photo"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 8px" }}>
                        <span style={{
                          padding: "4px 8px",
                          borderRadius: 8,
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          background: std.isDashboardActive ? "rgba(56,189,248,0.15)" : "rgba(245,158,11,0.15)",
                          color: std.isDashboardActive ? "#0369a1" : "#b45309"
                        }}>
                          {std.isDashboardActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 8px", textAlign: "right" }}>
                        <button 
                          className={std.isDashboardActive ? "secondary small" : "primary small"}
                          onClick={() => handleToggleActivation(std.id)}
                          style={{ padding: "6px 12px", borderRadius: 10 }}
                        >
                          {std.isDashboardActive ? "Deactivate" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right column: Broadcast Announcement & Inactivity Alerts */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* Broadcast Form */}
          <div className="card">
            <h2>Send Broadcast Announcement</h2>
            <form onSubmit={handleSendBroadcast} style={{ marginTop: 12 }}>
              <label>
                Target Audience
                <select value={broadcastTarget} onChange={(e) => setBroadcastTarget(e.target.value)}>
                  <option value="student">Broadcast to Students Only</option>
                  <option value="teacher">Broadcast to Teachers Only</option>
                  <option value="all">Broadcast to All Users</option>
                </select>
              </label>

              <label>
                Subject Header
                <input 
                  type="text" 
                  value={broadcastSubject} 
                  onChange={(e) => setBroadcastSubject(e.target.value)} 
                  placeholder="e.g. Exam Schedule / Classroom Rules" 
                  required 
                />
              </label>

              <label>
                Message Content
                <textarea 
                  value={broadcastContent} 
                  onChange={(e) => setBroadcastContent(e.target.value)} 
                  placeholder="Type your official announcement here..." 
                  rows="4" 
                  required 
                />
              </label>

              <button type="submit" className="primary" style={{ width: "100%" }} disabled={loading}>
                {loading ? "Sending..." : "Publish Broadcast"}
              </button>
            </form>
          </div>

          {/* Parent Inactivity Alerts */}
          <div className="card" style={{ borderLeft: "4px solid #f59e0b" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <h2 style={{ fontSize: "1.2rem", margin: 0 }}>⚠️ Parent Inactivity Alerts</h2>
              <span style={{ fontSize: "0.8rem", color: "#b45309", background: "rgba(245,158,11,0.15)", padding: "2px 8px", borderRadius: 8, fontWeight: 700 }}>2+ Days Inactive</span>
            </div>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: "0 0 16px 0" }}>System automatically sends parent alerts to these students who haven't logged in for 2 days.</p>
            
            <div style={{ maxHeight: "280px", overflowY: "auto" }}>
              {parentAlerts.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 0", color: "var(--muted)", fontSize: "0.9rem" }}>No students are currently inactive. All students verified active!</div>
              ) : (
                parentAlerts.map(alert => (
                  <div key={alert.id} style={{ padding: "12px", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 12, marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>{alert.name}</div>
                    <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>Last Login: {new Date(alert.lastLogin).toLocaleDateString()}</div>
                    <div style={{ fontSize: "0.85rem", color: "#b45309", marginTop: 4 }}>
                      👨‍👩‍👦 Notified Parent: <strong>{alert.parentEmail}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Message Box / Inbox for Principal */}
      <div className="card" style={{ marginTop: 24 }}>
        <h2>Direct Student Message Inbox</h2>
        <p style={{ color: "var(--muted)", marginTop: -8 }}>View messages sent directly to you by students. You can review their problem and submit a direct response.</p>
        
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 16 }}>
          
          {/* Inbox Messages list */}
          <div style={{ maxHeight: "400px", overflowY: "auto", borderRight: "1px solid var(--border)", paddingRight: 16 }}>
            {messages.filter(m => m.recipientRole === "principal").length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>Your direct message box is empty.</div>
            ) : (
              messages.filter(m => m.recipientRole === "principal").map((msg) => (
                <div 
                  key={msg._id} 
                  onClick={() => setReplyMessageId(msg._id)}
                  style={{ 
                    padding: 16, 
                    borderRadius: 16, 
                    border: "1px solid var(--border)", 
                    background: replyMessageId === msg._id ? "rgba(56,189,248,0.06)" : "#ffffff",
                    borderColor: replyMessageId === msg._id ? "var(--primary)" : "var(--border)",
                    cursor: "pointer",
                    marginBottom: 12,
                    boxShadow: "0 2px 10px rgba(0,0,0,0.01)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: "0.95rem" }}>{msg.sender?.name || "Student"}</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{new Date(msg.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ fontWeight: 600, color: "var(--muted)", fontSize: "0.9rem" }}>Subject: {msg.subject}</div>
                  <p style={{ margin: "6px 0 0 0", fontSize: "0.88rem", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{msg.message}</p>
                </div>
              ))
            )}
          </div>

          {/* Reply and Details Pane */}
          <div>
            {replyMessageId ? (
              <div>
                {(() => {
                  const currentMsg = messages.find(m => m._id === replyMessageId);
                  return (
                    <div className="card" style={{ background: "rgba(15,23,42,0.02)", border: "1px solid var(--border)", padding: 20 }}>
                      <h3 style={{ marginTop: 0 }}>Message details</h3>
                      <div style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: 12 }}>
                        <div>From: <strong>{currentMsg?.sender?.name}</strong> ({currentMsg?.sender?.email})</div>
                        <div>Date: {currentMsg ? new Date(currentMsg.createdAt).toLocaleString() : ""}</div>
                        <div style={{ marginTop: 4 }}>Subject: <strong style={{ color: "#000" }}>{currentMsg?.subject}</strong></div>
                      </div>
                      <p style={{ whiteSpace: "pre-wrap", background: "#ffffff", padding: 12, borderRadius: 12, border: "1px solid var(--border)", fontSize: "0.92rem", margin: "12px 0" }}>
                        {currentMsg?.message}
                      </p>

                      <form onSubmit={handleSendReply}>
                        <label>
                          Reply Message
                          <textarea 
                            value={replyContent} 
                            onChange={(e) => setReplyContent(e.target.value)} 
                            placeholder={`Type your reply to ${currentMsg?.sender?.name || "Student"}...`}
                            rows="4"
                            required
                          />
                        </label>
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                          <button type="button" className="secondary small" onClick={() => setReplyMessageId(null)}>Close</button>
                          <button type="submit" className="primary small" disabled={loading}>
                            {loading ? "Sending..." : "Send Reply"}
                          </button>
                        </div>
                      </form>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", minHeight: "200px", color: "var(--muted)", border: "2px dashed var(--border)", borderRadius: 16 }}>
                Click a student message on the left to read and send replies.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default PrincipalDashboard;
