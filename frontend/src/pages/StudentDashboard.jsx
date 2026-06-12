import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";

const StudentDashboard = ({ user, onLogout, onNavigate, onUpdateUser }) => {
  const [status, setStatus] = useState("Ready");
  const [silentMode, setSilentMode] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [focusHistory, setFocusHistory] = useState([]);
  const [notes, setNotes] = useState([]);
  const [activeClasses, setActiveClasses] = useState([]);
  const [myClasses, setMyClasses] = useState([]);
  const [topicsForClass, setTopicsForClass] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [blockedApps, setBlockedApps] = useState([]);
  const [availableSubjects] = useState(["Math", "Physics", "Biology", "Chemistry", "English"]);

  const [attendanceSubject, setAttendanceSubject] = useState(availableSubjects[0]);
  const [focusScore, setFocusScore] = useState(75);
  const [focusDistractions, setFocusDistractions] = useState("");
  
  // Tab Navigation state
  const [activeTab, setActiveTab] = useState("hub");
  
  // Note Q&A
  const [noteTitle, setNoteTitle] = useState("");
  const [noteTranscript, setNoteTranscript] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState("");
  const [noteQuestion, setNoteQuestion] = useState("");
  const [noteExplanation, setNoteExplanation] = useState("");

  // Class Session Join
  const [joinClassId, setJoinClassId] = useState("");
  const [currentSessionId, setCurrentSessionId] = useState("");
  const [joinPhoto, setJoinPhoto] = useState(null);
  const [joinPreview, setJoinPreview] = useState("");
  const [joinDeadline, setJoinDeadline] = useState(null);
  const [sessionEndTime, setSessionEndTime] = useState(null);
  const [classLocked, setClassLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState("");
  const [hasAutoMarkedAbsent, setHasAutoMarkedAbsent] = useState(false);
  const [offlineAbsentPending, setOfflineAbsentPending] = useState(false);
  const [activeTimeSeconds, setActiveTimeSeconds] = useState(0);
  
  // Webcam & AI Presence states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const presenceIntervalRef = useRef(null);
  const [simulateSteppedAway, setSimulateSteppedAway] = useState(false);
  const [aiPresenceStatus, setAiPresenceStatus] = useState("Inactive");

  // Profile Edit
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isHomeMenuOpen, setIsHomeMenuOpen] = useState(false);
  const [profileName, setProfileName] = useState(user.name || "");
  const [profilePhone, setProfilePhone] = useState(user.phone || "");
  const [profileRollNumber, setProfileRollNumber] = useState(user.rollNumber || "");
  const [profileLifeProfile, setProfileLifeProfile] = useState(user.lifeProfile || "");
  const [profileParentEmail, setProfileParentEmail] = useState(user.parentEmail || "");
  const [profileParentPhone, setProfileParentPhone] = useState(user.parentPhone || "");

  // App simulation
  const [appName, setAppName] = useState("");
  const [appReason, setAppReason] = useState("");
  const [appDuration, setAppDuration] = useState(60);
  const [appClassSessionId, setAppClassSessionId] = useState("");

  // Principal Message box
  const [messages, setMessages] = useState([]);
  const [principalSubject, setPrincipalSubject] = useState("");
  const [principalBody, setPrincipalBody] = useState("");
  const [principalStatus, setPrincipalStatus] = useState("");

  // AI Chatbot State
  const [aiChatQuestion, setAiChatQuestion] = useState("");
  const [aiChatHistory, setAiChatHistory] = useState([
    { role: "assistant", text: "Hello! I am FocusClass AI. Ask me any question about your studies, assignments, focus scores, or virtual classes!" }
  ]);
  const [aiChatLoading, setAiChatLoading] = useState(false);

  // Assignments State
  const [assignments, setAssignments] = useState([]);
  const [submissionTextMap, setSubmissionTextMap] = useState({});

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const stats = useMemo(() => {
    const totalBlocked = blockedApps.length;
    const totalDuration = blockedApps.reduce((sum, entry) => sum + (entry.durationSeconds || 0), 0);
    const uniqueApps = [...new Set(blockedApps.map((entry) => entry.appName))].length;
    return { totalBlocked, totalDuration, uniqueApps };
  }, [blockedApps]);

  const selectedClassObj = activeClasses.find((item) => item._id === joinClassId);
  const activeClassDetails = activeClasses.find((item) => item._id === currentSessionId);
  const userId = user?._id || user?.id;

  const loadDashboard = async () => {
    try {
      setStatus("Loading data...");
      const [
        attendance,
        focus,
        noteList,
        active,
        classes,
        blocked,
        assignmentsRes,
        messagesRes
      ] = await Promise.all([
        api.get("/api/attendance"),
        api.get("/api/focus"),
        api.get("/api/notes"),
        api.get("/api/class/active"),
        api.get("/api/class/student/classes"),
        api.get("/api/app-blocking"),
        api.get("/api/assignments/list"),
        api.get("/api/messages/my-messages")
      ]);

      setAttendanceHistory(attendance.data);
      setFocusHistory(focus.data);
      setNotes(noteList.data);
      setActiveClasses(active.data);
      setMyClasses(classes.data);
      setBlockedApps(blocked.data.blockedApps || []);
      setAssignments(assignmentsRes.data);
      setMessages(messagesRes.data);

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
    setProfileParentEmail(user.parentEmail || "");
    setProfileParentPhone(user.parentPhone || "");
  }, [user]);

  const handleToggleEditProfile = () => {
    setError("");
    setIsEditingProfile((current) => !current);
  };

  const handleSaveProfile = async () => {
    if (classLocked) {
      setError("Dashboard updates are locked while you are in an active class session.");
      return;
    }

    try {
      setError("");
      const response = await api.put("/api/auth/update", {
        name: profileName,
        phone: profilePhone,
        rollNumber: profileRollNumber,
        lifeProfile: profileLifeProfile,
        parentEmail: profileParentEmail,
        parentPhone: profileParentPhone,
      });
      setIsEditingProfile(false);
      if (response.data?.user) {
        if (typeof onUpdateUser === "function") {
          onUpdateUser(response.data.user);
        }
      }
      setStatus("Profile saved");
    } catch (err) {
      setError(err.response?.data?.message || "Could not save profile.");
    }
  };

  const handleAttendance = async () => {
    try {
      await api.post("/api/attendance", { subject: attendanceSubject });
      setStatus("Attendance marked");
      loadDashboard();
    } catch (err) {
      setError(err.response?.data?.message || "Could not mark attendance.");
    }
  };

  const handleFocusSave = async () => {
    if (classLocked) {
      setError("Focus tracking is locked while you are in an active class session.");
      return;
    }

    try {
      await api.post("/api/focus", { focusScore, distractions: focusDistractions });
      setStatus("Focus saved");
      setFocusDistractions("");
      loadDashboard();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save focus data.");
    }
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0] || null;
    setCameraError("");
    setJoinPhoto(file);
    if (file) {
      setJoinPreview(URL.createObjectURL(file));
    } else {
      setJoinPreview("");
    }
  };

  const handleStartCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      setCameraError("Camera access denied or unavailable. Please allow access or use the file upload.");
    }
  };

  const stopCameraStream = () => {
    if (videoRef.current?.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) {
      setCameraError("Camera is not ready yet.");
      return;
    }

    const video = videoRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      setCameraError("Wait for the camera preview before capturing a photo.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, width, height);

    canvas.toBlob((blob) => {
      if (blob) {
        const photoFile = new File([blob], "attendance.jpg", { type: "image/jpeg" });
        setJoinPhoto(photoFile);
        setJoinPreview(URL.createObjectURL(photoFile));
        setCameraError("");
      }
    }, "image/jpeg", 0.92);
  };

  const startPresenceTracking = (sessionId) => {
    setAiPresenceStatus("Confirmed Present");
    presenceIntervalRef.current = setInterval(async () => {
      if (!videoRef.current) return;
      
      const video = videoRef.current;
      const width = video.videoWidth;
      const height = video.videoHeight;
      if (!width || !height) return;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, width, height);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const photoFile = new File([blob], "presence.jpg", { type: "image/jpeg" });
        
        const formData = new FormData();
        formData.append("photo", photoFile);
        formData.append("classSessionId", sessionId);
        
        const steppedAwayFlag = localStorage.getItem("temp_stepped_away") === "true";
        if (steppedAwayFlag) {
          formData.append("simulateSteppedAway", "true");
        }

        try {
          const res = await api.post("/api/class/detect-presence", formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
          
          if (res.data?.detected === false) {
            setAiPresenceStatus("ALERT: Stepped Away!");
            setClassLocked(false);
            setLockMessage("AI Alert: You stepped away from the screen during a live class! Attendance auto-marked as Absent.");
            setCurrentSessionId("");
            stopPresenceTracking();
            stopCameraStream();
            loadDashboard();
            localStorage.removeItem("temp_stepped_away");
            setSimulateSteppedAway(false);
          } else {
            setAiPresenceStatus("Confirmed Present");
          }
        } catch (err) {
          console.error("AI Presence query error:", err.message);
        }
      }, "image/jpeg", 0.85);

    }, 15000); // 15 seconds
  };

  const stopPresenceTracking = () => {
    if (presenceIntervalRef.current) {
      clearInterval(presenceIntervalRef.current);
      presenceIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
      stopPresenceTracking();
    };
  }, []);

  // Heartbeat active time check & class data syncing
  useEffect(() => {
    if (!classLocked || !currentSessionId) return;

    const pingInterval = setInterval(async () => {
      try {
        const [pingRes, classRes] = await Promise.all([
          api.post("/api/class/ping-presence", { classSessionId: currentSessionId }),
          api.get(`/api/class/${currentSessionId}`)
        ]);

        setActiveTimeSeconds(pingRes.data.activeSeconds || 0);

        if (classRes.data) {
          setActiveClasses(prev => prev.map(c => c._id === currentSessionId ? { ...c, ...classRes.data } : c));
        }
      } catch (err) {
        console.error("Presence ping heartbeat failed:", err.message);
      }
    }, 10000); // 10 seconds

    return () => clearInterval(pingInterval);
  }, [classLocked, currentSessionId]);

  useEffect(() => {
    if (!classLocked || !sessionEndTime) return;

    const timer = setInterval(() => {
      if (new Date() > new Date(sessionEndTime)) {
        setClassLocked(false);
        setLockMessage("Class session has ended; dashboard is now unlocked.");
        stopPresenceTracking();
        stopCameraStream();
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [classLocked, sessionEndTime]);

  // Visibility and blur tracking
  useEffect(() => {
    if (!classLocked || !currentSessionId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        markAbsentForCurrentClass("screen switched or tab hidden");
      }
    };

    const handleWindowBlur = () => {
      markAbsentForCurrentClass("clicked away / window blurred");
    };

    const handleOffline = () => {
      markAbsentForCurrentClass("network offline");
    };

    const handleOnline = () => {
      if (offlineAbsentPending) {
        markAbsentForCurrentClass("reconnected online");
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [classLocked, currentSessionId, offlineAbsentPending, hasAutoMarkedAbsent]);

  const handleJoinClass = async () => {
    try {
      if (!joinClassId) {
        setError("Please choose a class to join.");
        return;
      }

      const selectedClass = activeClasses.find(c => c._id === joinClassId);
      const isOnline = selectedClass?.classType === "online";

      if (isOnline && !joinPhoto) {
        setError("Please upload a photo before joining this online class.");
        return;
      }

      const formData = new FormData();
      formData.append("classSessionId", joinClassId);
      if (isOnline) {
        formData.append("photo", joinPhoto);
      }

      if (isOnline && !navigator.onLine) {
        setError("You must be online to join class with AI photo verification.");
        return;
      }

      const response = await api.post("/api/class/join", formData, {
        headers: isOnline ? { "Content-Type": "multipart/form-data" } : {},
      });

      const joinedClass = response.data.classSession;
      setStatus(isOnline ? "Joined class with AI photo verification" : "Entered classroom session");
      setCurrentSessionId(joinedClass._id);
      setHasAutoMarkedAbsent(false);
      setOfflineAbsentPending(false);
      setJoinClassId("");
      setJoinPhoto(null);
      setJoinPreview("");
      setActiveTimeSeconds(0);
      setClassLocked(true);
      setLockMessage(
        isOnline 
          ? "Online class session active. Do not switch tabs, click away, or go offline."
          : "In-person class session active. React to the teacher's important note and wait for the class timer."
      );
      
      if (joinedClass?.joinDeadline) {
        setJoinDeadline(new Date(joinedClass.joinDeadline));
      }
      if (joinedClass?.sessionEndTime) {
        setSessionEndTime(new Date(joinedClass.sessionEndTime));
      }

      if (isOnline) {
        await handleStartCamera();
        startPresenceTracking(joinedClass._id);
      }

      loadDashboard();
    } catch (err) {
      setError(err.response?.data?.message || "Could not join class.");
    }
  };

  const markAbsentForCurrentClass = async (reason) => {
    if (!currentSessionId || hasAutoMarkedAbsent) return;
    setHasAutoMarkedAbsent(true);
    setLockMessage(`Live session interrupted: ${reason}. Your attendance has been marked absent.`);
    setStatus("Auto-marking absence for lost focus...");
    stopPresenceTracking();
    stopCameraStream();

    try {
      await api.post("/api/class/absent", {
        classSessionId: currentSessionId,
        reason,
      });
      setStatus("Marked absent due to session interruption.");
      setClassLocked(false);
      setCurrentSessionId("");
      setOfflineAbsentPending(false);
      loadDashboard();
    } catch (err) {
      if (!navigator.onLine) {
        setOfflineAbsentPending(true);
        setLockMessage("You are offline. Attendance will be marked absent when connection returns.");
      } else {
        setError(err.response?.data?.message || "Could not mark absence.");
      }
    }
  };

  const handleExitClassEarly = () => {
    const minStaySeconds = 50 * 60;
    if (activeTimeSeconds < minStaySeconds) {
      if (window.confirm("Warning: You have not met the minimum 50-minute stay requirement. Exiting now will mark you ABSENT. Are you sure you want to leave?")) {
        markAbsentForCurrentClass("student exited early");
      }
    } else {
      setClassLocked(false);
      setCurrentSessionId("");
      stopPresenceTracking();
      stopCameraStream();
      setStatus("Exited class session safely.");
      loadDashboard();
    }
  };

  const handleReactToNote = async () => {
    try {
      setError("");
      setSuccess("");
      await api.post("/api/class/react-note", { classSessionId: currentSessionId });
      setSuccess("Acknowledge reaction recorded 👍");
      loadDashboard();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record reaction.");
    }
  };

  const handleNavigateWithLock = (page) => {
    if (classLocked) {
      setError("Dashboard navigation is locked while you are in a live class session.");
      return;
    }
    onNavigate(page);
  };

  const handleLoadTopics = async (classId) => {
    try {
      setError("");
      const response = await api.get(`/api/topics/class/${classId}`);
      setSelectedClassId(classId);
      setTopicsForClass(response.data);
      setStatus("Important topics loaded");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load topics.");
    }
  };

  const handleAskNoteQuestion = async () => {
    try {
      if (!selectedNoteId) {
        setError("Please select a note first.");
        return;
      }
      if (!noteQuestion) {
        setError("Please enter a question for the note.");
        return;
      }

      const response = await api.post(`/api/notes/${selectedNoteId}/explain`, {
        question: noteQuestion,
      });

      setNoteExplanation(response.data.explanation);
      setStatus("AI explanation ready");
    } catch (err) {
      setError(err.response?.data?.message || "Could not get note explanation.");
    }
  };

  const handleAskAiChat = async (e) => {
    e.preventDefault();
    if (!aiChatQuestion.trim()) return;

    const userMsg = { role: "user", text: aiChatQuestion };
    setAiChatHistory(h => [...h, userMsg]);
    setAiChatQuestion("");
    setAiChatLoading(true);

    try {
      const res = await api.post("/api/ai/ask-problem", { question: userMsg.text });
      setAiChatHistory(h => [...h, { role: "assistant", text: res.data.answer }]);
    } catch (err) {
      setAiChatHistory(h => [...h, { role: "assistant", text: "I'm having trouble connecting to my brain right now. Please check if the server is running." }]);
    } finally {
      setAiChatLoading(false);
    }
  };

  const handleSubmissionTextChange = (assId, text) => {
    setSubmissionTextMap(prev => ({ ...prev, [assId]: text }));
  };

  const handleSubmitAssignment = async (assignmentId) => {
    const text = submissionTextMap[assignmentId];
    if (!text) {
      setError("Please write down your answers before submitting.");
      return;
    }

    try {
      setError("");
      setSuccess("");
      await api.post("/api/assignments/submit", { assignmentId, submissionText: text });
      setSuccess("Homework assignment submitted successfully.");
      loadDashboard();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit assignment.");
    }
  };

  const handleSendDMToPrincipal = async (e) => {
    e.preventDefault();
    if (!principalSubject || !principalBody) return;

    setPrincipalStatus("Sending...");
    try {
      await api.post("/api/messages/send", {
        subject: principalSubject,
        message: principalBody,
        recipientRole: "principal",
      });
      setPrincipalStatus("Message delivered to Principal.");
      setPrincipalSubject("");
      setPrincipalBody("");
      loadDashboard();
    } catch (err) {
      setPrincipalStatus("Failed to send message.");
    }
  };

  const isOnlineClass = activeClassDetails?.classType === "online";
  const hasReacted = activeClassDetails?.noteReactions?.includes(userId);

  // Computations
  const pendingAssignments = assignments.filter(a => !a.submissions?.some(s => s.student === userId || s.student?._id === userId));
  const principalBroadcasts = messages.filter(m => m.recipientRole === "student" || m.recipientRole === "all");

  const avatarUrl = user.photoUrl ? `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${user.photoUrl}?h=${user.photoHash || ""}` : "";
  const selectedNoteDetails = notes.find(n => n._id === selectedNoteId);

  return (
    <div className="page-shell">
      <header className="header-row">
        <div>
          <h1>Student Terminal</h1>
          <p>Logged in as <strong>{user.name}</strong>. Learn focused, attend virtual lectures, ask AI assistant, and complete assignments.</p>
        </div>
        <div className="header-actions">
          <div className="home-menu">
            <button className="secondary home-menu-button" onClick={() => setIsHomeMenuOpen((open) => !open)}>
              <span>🏠 Navigation</span>
              <span className="menu-caret">▾</span>
            </button>
            {isHomeMenuOpen && (
              <div className="home-menu-dropdown">
                <button className="dropdown-item" onClick={() => { handleNavigateWithLock("dashboard"); setIsHomeMenuOpen(false); }}>
                  Dashboard Hub
                </button>
                <button className="dropdown-item" onClick={() => { handleNavigateWithLock("profile"); setIsHomeMenuOpen(false); }}>
                  Profile Settings
                </button>
              </div>
            )}
          </div>
          {user.photoUrl && (
            <img src={avatarUrl} alt="Profile" className="header-avatar" />
          )}
          <button className="secondary" onClick={() => handleNavigateWithLock("notes-help")}>📚 AI Notes Help</button>
          <button className="secondary" onClick={() => setSilentMode(!silentMode)}>
            {silentMode ? "🔊 Enable Audio" : "🔇 Silent Mode"}
          </button>
          <button className="btn-logout" onClick={onLogout}>🚪 Log Out</button>
        </div>
      </header>

      {/* Class Session Interruption Lock Banner */}
      {classLocked && (
        <div className="alert" style={{ background: "rgba(220, 38, 38, 0.06)", color: "#991b1b", border: "2px solid rgba(220, 38, 38, 0.2)", padding: 24, borderRadius: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <h2 style={{ margin: "0 0 4px 0", fontSize: "1.4rem", color: "#991b1b" }}>⚠️ ACTIVE LIVE CLASS: {activeClassDetails?.title}</h2>
            <button className="primary small" style={{ background: "var(--danger)" }} onClick={handleExitClassEarly}>Exit Class Session</button>
          </div>
          <p style={{ margin: "4px 0" }}>{lockMessage}</p>
          <p style={{ margin: "10px 0 0 0", fontSize: "0.92rem", fontWeight: "bold", color: "#991b1b" }}>
            Do not change tabs or close the window. Any focus loss will automatically record you as absent.
          </p>

          {/* Real-time active stay duration stats */}
          <div style={{ marginTop: 16, background: "rgba(66, 153, 225, 0.05)", padding: 18, borderRadius: 16, border: "1px solid var(--border)" }}>
            <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--text-main)" }}>⏱️ Stay Duration Tracker:</div>
            <div style={{ fontSize: "1.1rem", margin: "6px 0", color: "var(--text-main)" }}>
              Time Spent: <strong style={{ color: "var(--primary)" }}>{Math.floor(activeTimeSeconds / 60)} minutes</strong> / <strong style={{ color: "var(--accent)" }}>50 minutes required</strong>
            </div>
            <div style={{ width: "100%", background: "rgba(16, 42, 67, 0.1)", height: 8, borderRadius: 4, overflow: "hidden", marginTop: 8 }}>
              <div style={{ width: `${Math.min(100, (activeTimeSeconds / 3000) * 100)}%`, background: "var(--primary)", height: "100%" }} />
            </div>
          </div>

          {/* Classroom note reaction section */}
          {!isOnlineClass && activeClassDetails && (
            <div style={{ marginTop: 20, background: "rgba(66, 153, 225, 0.04)", padding: 18, borderRadius: 16, border: "1px solid var(--border)" }}>
              <h3 style={{ margin: "0 0 6px 0", color: "var(--primary)" }}> Classroom Important Notice</h3>
              {activeClassDetails.importantNote ? (
                <div>
                  <p style={{ margin: "6px 0 12px 0", background: "rgba(255,255,255,0.8)", padding: 12, borderRadius: 12, fontSize: "0.95rem", color: "var(--text-main)", border: "1px solid var(--border)" }}>
                    "{activeClassDetails.importantNote}"
                  </p>
                  <button 
                    className={hasReacted ? "secondary" : "primary"} 
                    onClick={handleReactToNote} 
                    disabled={hasReacted}
                    style={{ width: "100%" }}
                  >
                    {hasReacted ? "Acknowledge Reaction Logged 👍" : "React & Acknowledge Note"}
                  </button>
                </div>
              ) : (
                <p style={{ fontStyle: "italic", margin: 0, color: "var(--text-muted)" }}>Waiting for the teacher to post an important note...</p>
              )}
            </div>
          )}
          
          {/* Webcam presence loop preview (Online Classes only) */}
          {isOnlineClass && (
            <div style={{ marginTop: 20, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <video ref={videoRef} style={{ width: 140, height: 105, borderRadius: 12, objectFit: "cover", transform: "scaleX(-1)", background: "#000", border: "1px solid var(--border)" }} muted playsInline />
              <div>
                <div style={{ fontWeight: 700 }}>AI Presence Status: <span style={{ color: aiPresenceStatus.includes("ALERT") ? "var(--danger)" : "var(--accent)" }}>{aiPresenceStatus}</span></div>
                <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "4px 0" }}>Webcam is scanning for your presence every 15 seconds.</p>
                
                {/* Test Simulation Button */}
                <button 
                  className="secondary small" 
                  style={{ background: simulateSteppedAway ? "rgba(239, 68, 68, 0.2)" : "rgba(255, 255, 255, 0.05)", marginTop: 8 }}
                  onClick={() => {
                    const val = !simulateSteppedAway;
                    setSimulateSteppedAway(val);
                    localStorage.setItem("temp_stepped_away", val ? "true" : "false");
                  }}
                >
                  {simulateSteppedAway ? "Simulating: Stepped Away" : "Simulate Stepping Away"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Global Alerts */}
      {error && <div className="alert">{error}</div>}
      {success && <div className="status-chip" style={{ marginBottom: 20 }}>{success}</div>}

      {/* Tabs Navigation */}
      <div className="tab-navigation">
        <button className={`tab-button ${activeTab === 'hub' ? 'active' : ''}`} onClick={() => setActiveTab('hub')}>🏫 College Hub</button>
        <button className={`tab-button ${activeTab === 'join' ? 'active' : ''}`} onClick={() => setActiveTab('join')}>🎒 Join Class {activeClasses.length > 0 && <span className="tab-badge">{activeClasses.length}</span>}</button>
        <button className={`tab-button ${activeTab === 'chatbot' ? 'active' : ''}`} onClick={() => setActiveTab('chatbot')}>🤖 AI Assistant</button>
        <button className={`tab-button ${activeTab === 'notes' ? 'active' : ''}`} onClick={() => setActiveTab('notes')}>📚 AI Lecture Notes</button>
        <button className={`tab-button ${activeTab === 'assignments' ? 'active' : ''}`} onClick={() => setActiveTab('assignments')}>✍️ Homework {pendingAssignments.length > 0 && <span className="tab-badge warning">{pendingAssignments.length}</span>}</button>
        <button className={`tab-button ${activeTab === 'focus' ? 'active' : ''}`} onClick={() => setActiveTab('focus')}>⏱️ Focus Tracker</button>
        <button className={`tab-button ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>📊 Attendance & Logs</button>
      </div>

      {/* Tab Panels */}
      <div className="tab-panels">
        
        {/* TAB 1: COLLEGE HUB */}
        {activeTab === "hub" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }} className="top-dashboard-row">
            
            {/* Left Panel: Profile summary & edit bio inline overlay */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <section className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                  {user.photoUrl ? (
                    <img src={avatarUrl} alt="Avatar" style={{ width: 64, height: 64, borderRadius: 16, objectFit: "cover", border: "2px solid var(--primary)", boxShadow: "var(--glow-cyan)" }} />
                  ) : (
                    <div style={{ width: 64, height: 64, borderRadius: 16, background: "rgba(255, 255, 255, 0.05)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontWeight: "bold", border: "1px dashed var(--border)" }}>No Photo</div>
                  )}
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.2rem" }}>{user.name}</h2>
                    <span style={{ fontSize: "0.85rem", color: "var(--primary)", fontWeight: 700, textTransform: "uppercase" }}>STUDENT</span>
                  </div>
                </div>
                
                <div className="profile-summary-details">
                  <div>📧 <strong>Email:</strong> {user.email}</div>
                  <div>🆔 <strong>Roll ID:</strong> {user.rollNumber || "N/A"}</div>
                  <div>📱 <strong>Phone:</strong> {user.phone || "Not set"}</div>
                  
                  <div style={{ background: "rgba(6, 182, 212, 0.06)", padding: 12, borderRadius: 12, marginTop: 4, border: "1px solid rgba(6, 182, 212, 0.15)" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--primary)", marginBottom: 4 }}>👨‍👩‍👦 Parent Contact:</div>
                    <div style={{ fontSize: "0.8rem" }}>Email: {user.parentEmail || "N/A"}</div>
                    <div style={{ fontSize: "0.8rem" }}>Phone: {user.parentPhone || "N/A"}</div>
                  </div>
                </div>
                
                <button className="secondary small" style={{ marginTop: 8, width: "100%" }} onClick={handleToggleEditProfile}>
                  {isEditingProfile ? "Close Profile Form" : "🔧 Edit Profile Details"}
                </button>
              </section>

              {isEditingProfile && (
                <section className="card" style={{ border: "1px solid var(--primary)" }}>
                  <h3 style={{ margin: "0 0 16px 0", color: "var(--text-main)" }}>🔧 Edit Profile Settings</h3>
                  <label style={{ marginBottom: 12 }}>
                    Full Name
                    <input value={profileName} onChange={(e) => setProfileName(e.target.value)} />
                  </label>
                  <label style={{ marginBottom: 12 }}>
                    Phone Number
                    <input value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} />
                  </label>
                  <label style={{ marginBottom: 12 }}>
                    Roll Number / Student ID
                    <input value={profileRollNumber} onChange={(e) => setProfileRollNumber(e.target.value)} />
                  </label>
                  <label style={{ marginBottom: 12 }}>
                    Parent's Email
                    <input type="email" value={profileParentEmail} onChange={(e) => setProfileParentEmail(e.target.value)} />
                  </label>
                  <label style={{ marginBottom: 12 }}>
                    Parent's Phone
                    <input value={profileParentPhone} onChange={(e) => setProfileParentPhone(e.target.value)} />
                  </label>
                  <label style={{ marginBottom: 16 }}>
                    Bio Summary
                    <textarea value={profileLifeProfile} onChange={(e) => setProfileLifeProfile(e.target.value)} rows="2" />
                  </label>
                  <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                    <button className="secondary small" onClick={() => setIsEditingProfile(false)}>Cancel</button>
                    <button className="primary small" onClick={handleSaveProfile}>Save Changes</button>
                  </div>
                </section>
              )}
            </div>

            {/* Right Panel: College Info & Notices & Sessions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              
              {/* College overview and rules */}
              <section className="card">
                <h2 style={{ fontSize: "1.4rem", color: "var(--primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>🏫 FocusClass AI Academy</span>
                </h2>
                <p style={{ fontSize: "0.95rem", lineHeight: 1.6, color: "var(--text-muted)", marginTop: 10 }}>
                  Welcome to FocusClass smart digitized campus. We run an automated attendance validation protocol based on student stay times and webcam presence verification.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 12 }}>
                  <div style={{ background: "rgba(6, 182, 212, 0.03)", padding: 12, borderRadius: 12, border: "1px solid rgba(6, 182, 212, 0.08)" }}>
                    <div style={{ fontWeight: 700, color: "var(--primary)", fontSize: "0.88rem", marginBottom: 2 }}>⏱️ 50-Min Active Stay</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>To receive class attendance, you must remain checked in for at least 50 minutes of each class hour.</div>
                  </div>
                  <div style={{ background: "rgba(139, 92, 246, 0.03)", padding: 12, borderRadius: 12, border: "1px solid rgba(139, 92, 246, 0.08)" }}>
                    <div style={{ fontWeight: 700, color: "var(--purple)", fontSize: "0.88rem", marginBottom: 2 }}>⚠️ Focus Presence Checks</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Switching tabs, clicking away, or stepping out of the webcam frame triggers auto-absence reports.</div>
                  </div>
                </div>
              </section>

              {/* Notice board */}
              <section className="card">
                <h2>Notice Board & Broadcasts</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
                  {principalBroadcasts.length === 0 ? (
                    <p style={{ fontStyle: "italic", margin: 0, color: "var(--text-muted)" }}>No broadcasts from the administration.</p>
                  ) : (
                    principalBroadcasts.map((m) => (
                      <div key={m._id} style={{ background: "rgba(66, 153, 225, 0.04)", padding: 14, borderRadius: 14, border: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", color: "var(--text-muted)", marginBottom: 4 }}>
                          <span style={{ color: "var(--purple)", fontWeight: "bold" }}>From: School Administration</span>
                          <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-main)" }}>{m.subject}</div>
                        <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "var(--text-muted)", whiteSpace: "pre-wrap" }}>{m.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </section>

              {/* Scheduled class sessions */}
              <section className="card">
                <h2>Scheduled Class Sessions</h2>
                <p style={{ color: "var(--text-muted)", marginTop: -8 }}>List of live or upcoming lecture schedules configured by your teachers.</p>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                  {activeClasses.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontStyle: "italic", fontSize: "0.9rem" }}>
                      No active sessions scheduled right now.
                    </div>
                  ) : (
                    activeClasses.map(cls => (
                      <div key={cls._id} style={{ background: "rgba(6, 182, 212, 0.03)", padding: 16, borderRadius: 16, border: "1px solid rgba(6, 182, 212, 0.15)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: "0.75rem", background: "var(--primary)", color: "#ffffff", fontWeight: "bold", padding: "2px 8px", borderRadius: 8 }}>{cls.classType?.toUpperCase()}</span>
                            <strong style={{ fontSize: "1.05rem", color: "var(--text-main)" }}>{cls.title}</strong>
                          </div>
                          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 4 }}>
                            📚 Subject: <strong>{cls.subject}</strong> · Educator: <strong>{cls.teacher?.name || "Teacher"}</strong>
                          </div>
                          {cls.description && <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontStyle: "italic", marginTop: 4 }}>{cls.description}</div>}
                        </div>
                        <button 
                          className="primary small" 
                          onClick={() => {
                            setJoinClassId(cls._id);
                            setActiveTab("join");
                          }}
                        >
                          🚀 Enter Class
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </section>

            </div>

          </div>
        )}

        {/* TAB 2: JOIN SESSION */}
        {activeTab === "join" && (
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <section className="card">
              <h2>Join Class Session</h2>
              <p>Select an active session to join. Online classes require photo verification; In-Person classes require only your session password.</p>
              
              <label style={{ marginTop: 20 }}>
                Select Active Class
                <select value={joinClassId} onChange={(event) => setJoinClassId(event.target.value)}>
                  <option value="">Choose an active class</option>
                  {activeClasses.map((item) => (
                    <option key={item._id} value={item._id}>{item.title} ({item.subject})</option>
                  ))}
                </select>
              </label>

              {selectedClassObj && (
                <div style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border)", padding: 14, borderRadius: 14, marginBottom: 16 }}>
                  <div style={{ fontSize: "0.95rem", marginBottom: 4 }}>
                    <strong>Class Type:</strong> <span style={{ fontWeight: 700, color: "var(--primary)", textTransform: "uppercase" }}>{selectedClassObj.classType || "online"}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.88rem", color: "var(--text-muted)" }}>{selectedClassObj.description || "No description provided."}</p>
                </div>
              )}

              {selectedClassObj?.classType === "online" && (
                <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                  <div style={{ fontWeight: "bold", fontSize: "0.9rem", color: "var(--primary)", marginBottom: 12 }}>AI Face Recognition Attendance:</div>
                  {cameraActive ? (
                    <div className="camera-panel" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <video ref={videoRef} style={{ width: "100%", height: 240, borderRadius: 16, objectFit: "cover", transform: "scaleX(-1)", background: "#000", border: "1px solid var(--border)" }} muted playsInline />
                      <div style={{ display: "flex", gap: 10 }}>
                        <button className="primary small" onClick={handleCapturePhoto}>📸 Capture Verification Photo</button>
                        <button className="secondary small" onClick={stopCameraStream}>Turn Off Camera</button>
                      </div>
                    </div>
                  ) : (
                    <button className="secondary small" style={{ marginBottom: 12, width: "100%" }} onClick={handleStartCamera}>🎥 Start Verification Webcam</button>
                  )}

                  {cameraError && <div style={{ color: "var(--danger)", fontSize: "0.85rem", margin: "10px 0" }}>{cameraError}</div>}

                  <label style={{ marginTop: 14 }}>
                    Or upload a verification photo file
                    <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ marginTop: 6 }} />
                  </label>

                  {joinPreview && (
                    <div style={{ margin: "14px 0" }}>
                      <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 4 }}>Verification Photo Preview:</div>
                      <img src={joinPreview} alt="Selfie preview" style={{ width: 100, height: 100, borderRadius: 16, objectFit: "cover", border: "2px solid var(--primary)" }} />
                    </div>
                  )}
                </div>
              )}

              <button className="primary" style={{ width: "100%", marginTop: 20 }} onClick={handleJoinClass} disabled={classLocked}>
                {classLocked ? "Active Session Locked" : "Join Virtual Lecture"}
              </button>
            </section>
          </div>
        )}

        {/* TAB 3: AI ASSISTANT CHATBOT */}
        {activeTab === "chatbot" && (
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <section className="card" style={{ display: "flex", flexDirection: "column", height: "650px" }}>
              <h2>🤖 FocusClass AI Chatbot</h2>
              <p style={{ color: "var(--text-muted)", marginTop: -8 }}>Ask direct academic questions, query homework insights, or request class advice.</p>
              
              {/* suggestion chips */}
              <div style={{ display: "flex", gap: 8, margin: "12px 0", flexWrap: "wrap" }}>
                <button 
                  className="secondary small" 
                  style={{ borderRadius: 99, padding: "6px 12px", fontSize: "0.78rem" }}
                  onClick={() => setAiChatQuestion("Summarize my active classroom requirements.")}
                >
                  📜 Stay Rules
                </button>
                <button 
                  className="secondary small" 
                  style={{ borderRadius: 99, padding: "6px 12px", fontSize: "0.78rem" }}
                  onClick={() => setAiChatQuestion("How do I request help from the Principal?")}
                >
                  📧 Contact Principal
                </button>
                <button 
                  className="secondary small" 
                  style={{ borderRadius: 99, padding: "6px 12px", fontSize: "0.78rem" }}
                  onClick={() => setAiChatQuestion("What subjects does FocusClass cover?")}
                >
                  📚 Available Subjects
                </button>
              </div>

              <div style={{ flex: 1, border: "1px solid var(--border)", borderRadius: 16, background: "rgba(10, 15, 30, 0.4)", padding: 18, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>
                {aiChatHistory.map((msg, i) => (
                  <div key={i} className={`chat-bubble ${msg.role}`} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    {msg.text}
                  </div>
                ))}
                {aiChatLoading && <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontStyle: "italic", alignSelf: "flex-start" }}>AI is computing answer...</div>}
              </div>

              <form onSubmit={handleAskAiChat} style={{ display: "flex", gap: 10 }}>
                <input 
                  type="text" 
                  value={aiChatQuestion} 
                  onChange={(e) => setAiChatQuestion(e.target.value)} 
                  placeholder="Type your question..." 
                  style={{ margin: 0, padding: 12 }}
                  required 
                />
                <button type="submit" className="primary" style={{ padding: "0 24px" }}>Ask AI</button>
              </form>
            </section>
          </div>
        )}

        {/* TAB 4: LECTURE NOTES & Q&A */}
        {activeTab === "notes" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2.2fr", gap: 24 }}>
            
            {/* Notes List (Left) */}
            <section className="card" style={{ height: "fit-content" }}>
              <h2>Lecture Summaries</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14, maxHeight: "550px", overflowY: "auto" }}>
                {notes.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontStyle: "italic" }}>No notes summarized yet.</div>
                ) : (
                  notes.map((note) => (
                    <div 
                      key={note._id} 
                      className={`note-select-item ${selectedNoteId === note._id ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedNoteId(note._id);
                        setNoteExplanation("");
                        setNoteQuestion("");
                      }}
                      style={{
                        cursor: "pointer",
                        padding: 14,
                        background: selectedNoteId === note._id ? "rgba(6, 182, 212, 0.12)" : "rgba(66, 153, 225, 0.03)",
                        border: "1px solid",
                        borderColor: selectedNoteId === note._id ? "var(--primary)" : "var(--border)",
                        borderRadius: 14,
                        transition: "all 0.2s ease"
                      }}
                    >
                      <strong style={{ color: "var(--text-main)", display: "block" }}>{note.title}</strong>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", display: "block", marginTop: 4 }}>
                        📅 {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Note Details & AI Notes Q&A (Right) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {selectedNoteDetails ? (
                <>
                  <section className="card">
                    <h2 style={{ color: "var(--primary)" }}>📖 {selectedNoteDetails.title}</h2>
                    <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: 16 }}>
                      Published on: {new Date(selectedNoteDetails.createdAt).toLocaleString()}
                    </div>
                    
                    <div style={{ background: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 14, border: "1px solid var(--border)", marginBottom: 16 }}>
                      <h3 style={{ margin: "0 0 6px 0", fontSize: "0.95rem", color: "var(--primary)" }}>✨ Lecture AI Summary</h3>
                      <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.6 }}>{selectedNoteDetails.summary || "Generating summary..."}</p>
                    </div>

                    <details style={{ background: "rgba(0,0,0,0.15)", padding: 12, borderRadius: 12, border: "1px solid var(--border)" }}>
                      <summary style={{ cursor: "pointer", fontWeight: "bold", fontSize: "0.88rem", color: "var(--text-muted)" }}>View Full Lecture Transcript</summary>
                      <p style={{ marginTop: 10, fontSize: "0.88rem", whiteSpace: "pre-wrap", color: "var(--text-muted)", lineHeight: 1.5, maxHeight: "250px", overflowY: "auto" }}>
                        {selectedNoteDetails.transcript || "No transcript available."}
                      </p>
                    </details>
                  </section>

                  {/* AI Note explaining widget */}
                  <section className="card polished-qa">
                    <h2>❓ AI Lecture Assistant</h2>
                    <p style={{ color: "var(--text-muted)", marginTop: -8 }}>Ask questions about concepts and formulas discussed in this lecture.</p>
                    
                    <div className="question-form" style={{ marginTop: 14 }}>
                      <input 
                        type="text" 
                        value={noteQuestion} 
                        onChange={(e) => setNoteQuestion(e.target.value)} 
                        placeholder="What did the teacher mean by this concept?" 
                      />
                      <button className="primary" style={{ width: "100%", marginTop: 10 }} onClick={handleAskNoteQuestion}>
                        Query Lecture Context
                      </button>
                    </div>

                    {noteExplanation && (
                      <div className="explanation-box">
                        <div className="explanation-header">🧠 AI Lecture Explanation:</div>
                        <div className="explanation-content">{noteExplanation}</div>
                      </div>
                    )}
                  </section>
                </>
              ) : (
                <section className="card" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "300px" }}>
                  <p style={{ fontStyle: "italic", color: "var(--text-muted)" }}>Select a lecture from the list to view notes and ask AI queries.</p>
                </section>
              )}
            </div>

          </div>
        )}

        {/* TAB 5: HOMEWORK ASSIGNMENTS */}
        {activeTab === "assignments" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", gap: 24 }}>
            
            {/* Assignments Roster */}
            <section className="card">
              <h2>My Homework Tasks</h2>
              <p style={{ color: "var(--text-muted)", marginTop: -8 }}>Write and submit answers for assignment sheets published by educators.</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
                {assignments.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)" }}>No homework sheets assigned yet.</div>
                ) : (
                  assignments.map((ass) => {
                    const submission = ass.submissions?.find((s) => s.student === userId || s.student?._id === userId);
                    const isSubmitted = !!submission;
                    
                    return (
                      <div key={ass._id} style={{ border: "1px solid var(--border)", padding: 18, borderRadius: 18, background: "rgba(255, 255, 255, 0.01)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                          <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{ass.title} <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "normal" }}>({ass.subject})</span></h3>
                          <span style={{ 
                            fontSize: "0.78rem", 
                            padding: "2px 8px", 
                            borderRadius: 6, 
                            fontWeight: 700,
                            background: isSubmitted ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                            color: isSubmitted ? "#a7f3d0" : "#fca5a5"
                          }}>
                            {isSubmitted ? "Submitted" : "Pending"}
                          </span>
                        </div>
                        <p style={{ margin: "0 0 12px 0", fontSize: "0.9rem", color: "var(--text-muted)" }}>{ass.description}</p>
                        <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: 12 }}>⏳ Due Date: {new Date(ass.dueDate).toLocaleDateString()}</div>
                        
                        {isSubmitted ? (
                          <div style={{ background: "rgba(0,0,0,0.15)", border: "1px solid var(--border)", padding: 12, borderRadius: 12 }}>
                            <div><strong>Your Text Answer:</strong></div>
                            <p style={{ margin: "4px 0", fontSize: "0.88rem", color: "var(--text-muted)" }}>{submission.submissionText}</p>
                            
                            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 8, marginTop: 8, fontSize: "0.82rem" }}>
                              <span>Grade: <strong style={{ color: "var(--primary)" }}>{submission.grade}</strong></span>
                              {submission.feedback && <span>Feedback: <em style={{ color: "var(--text-muted)" }}>"{submission.feedback}"</em></span>}
                            </div>
                          </div>
                        ) : (
                          <div style={{ marginTop: 12 }}>
                            <textarea 
                              value={submissionTextMap[ass._id] || ""} 
                              onChange={(e) => handleSubmissionTextChange(ass._id, e.target.value)} 
                              placeholder="Type your homework answers here..."
                              rows="3"
                            />
                            <div style={{ textAlign: "right", marginTop: 8 }}>
                              <button className="primary small" onClick={() => handleSubmitAssignment(ass._id)}>
                                Submit Homework Sheet
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            {/* Principal DM Help channel */}
            <section className="card">
              <h2>Direct Support Channel</h2>
              <p style={{ color: "var(--text-muted)", fontSize: "0.88rem", marginTop: -8 }}>Submit an inquiry, feedback, or complain directly to the School Principal.</p>
              
              <form onSubmit={handleSendDMToPrincipal} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 16, marginBottom: 16, marginTop: 12 }}>
                <label>
                  Query Subject
                  <input type="text" value={principalSubject} onChange={(e) => setPrincipalSubject(e.target.value)} placeholder="Subject of query" required />
                </label>
                <label>
                  Inquiry Message
                  <textarea value={principalBody} onChange={(e) => setPrincipalBody(e.target.value)} placeholder="Type details here..." rows="3" required />
                </label>
                <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                  <button type="submit" className="primary small">Submit query</button>
                  <span style={{ fontSize: "0.8rem", color: "var(--primary)" }}>{principalStatus}</span>
                </div>
              </form>

              {/* DM History */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "220px", overflowY: "auto" }}>
                <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "var(--text-muted)" }}>Recent Messages:</div>
                {messages.length === 0 ? (
                  <div style={{ textAlign: "center", fontStyle: "italic", color: "var(--text-muted)", fontSize: "0.85rem" }}>No direct messages.</div>
                ) : (
                  messages.map((m) => (
                    <div key={m._id} style={{ padding: 10, border: "1px solid var(--border)", borderRadius: 10, background: "rgba(66, 153, 225, 0.04)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: "bold" }}>
                        <span>Role: {m.sender?.role === "principal" ? "Principal" : "Me"}</span>
                        <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: "0.85rem", marginTop: 2, color: "var(--text-main)" }}>{m.subject}</div>
                      <p style={{ margin: "2px 0 0 0", fontSize: "0.8rem", color: "var(--text-muted)", whiteSpace: "pre-wrap" }}>{m.message}</p>
                    </div>
                  ))
                )}
              </div>
            </section>

          </div>
        )}

        {/* TAB 6: FOCUS TRACKER */}
        {activeTab === "focus" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            
            {/* Input card */}
            <section className="card">
              <h2>Focus Rating Input</h2>
              <p style={{ color: "var(--text-muted)" }}>Manually log your self-evaluated study focus score and identify primary distractions.</p>
              
              <label style={{ marginTop: 14 }}>
                Focus Score Rating (0-100)
                <input type="number" value={focusScore} onChange={(event) => setFocusScore(Number(event.target.value))} min="0" max="100" />
              </label>
              
              <label>
                Distraction Tags (comma-separated list)
                <input value={focusDistractions} onChange={(event) => setFocusDistractions(event.target.value)} placeholder="YouTube, phone notifications, noise" />
              </label>
              
              <button className="primary" style={{ width: "100%" }} onClick={handleFocusSave}>
                Save Focus Entry
              </button>
            </section>

            {/* History card */}
            <section className="card">
              <h2>Focus Log History</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "350px", overflowY: "auto", marginTop: 14 }}>
                {focusHistory.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontStyle: "italic" }}>No focus records logged yet.</div>
                ) : (
                  focusHistory.map((session) => (
                    <div key={session._id} style={{ padding: 12, border: "1px solid var(--border)", borderRadius: 12, display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.01)" }}>
                      <div>
                        <strong>Focus Score: <span style={{ color: "var(--primary)" }}>{session.focusScore}/100</span></strong>
                        {session.distractions?.length > 0 && (
                          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 4 }}>
                            🚫 Distractions: {session.distractions.join(", ")}
                          </div>
                        )}
                      </div>
                      <span style={{ font_size: "0.82rem", color: "var(--text-muted)" }}>{new Date(session.createdAt).toLocaleDateString()}</span>
                    </div>
                  ))
                )}
              </div>
            </section>

          </div>
        )}

        {/* TAB 7: ATTENDANCE & LOGS */}
        {activeTab === "history" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 24 }}>
            
            {/* Backup mark */}
            <section className="card" style={{ height: "fit-content" }}>
              <h2>Manual Attendance Backup</h2>
              <p style={{ color: "var(--text-muted)" }}>Log backup attendance directly for specific course classes.</p>
              
              <label style={{ marginTop: 14 }}>
                Choose Subject
                <select value={attendanceSubject} onChange={(event) => setAttendanceSubject(event.target.value)}>
                  {availableSubjects.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </label>
              <button className="primary" style={{ width: "100%", marginTop: 10 }} onClick={handleAttendance}>
                Mark Subject Attendance
              </button>
            </section>

            {/* Logs List */}
            <section className="card">
              <h2>Subject Attendance History</h2>
              <p style={{ color: "var(--text-muted)", marginTop: -8 }}>Historical log of your webcam AI validations and manual backup inputs.</p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14, maxHeight: "400px", overflowY: "auto" }}>
                {attendanceHistory.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontStyle: "italic" }}>No attendance history logged.</div>
                ) : (
                  attendanceHistory.map((entry) => (
                    <div key={entry._id} style={{ padding: 14, border: "1px solid var(--border)", borderRadius: 14, display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(66, 153, 225, 0.03)" }}>
                      <div>
                        <strong style={{ color: "var(--text-main)" }}>{entry.subject}</strong>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: 4 }}>
                          Logged: {new Date(entry.joinTime || entry.createdAt).toLocaleString()}
                        </div>
                        {entry.photoName && (
                          <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                            Note: <em>"{entry.photoName}"</em>
                          </div>
                        )}
                      </div>
                      <span style={{ 
                        fontSize: "0.82rem", 
                        padding: "4px 10px", 
                        borderRadius: 8, 
                        fontWeight: 700,
                        background: entry.status === "Present" ? "rgba(5, 150, 105, 0.06)" : "rgba(220, 38, 38, 0.06)",
                        color: entry.status === "Present" ? "#065f46" : "#991b1b"
                      }}>
                        {entry.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </section>

          </div>
        )}

      </div>
    </div>
  );
};

export default StudentDashboard;
