import { useState, useEffect } from "react";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import NotesHelpPage from "./pages/NotesHelpPage";
import ProfilePage from "./pages/ProfilePage";
import api from "./api";

function App() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored && stored !== "undefined" ? JSON.parse(stored) : null;
    } catch (e) {
      console.error("Error parsing user session from localStorage:", e);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return null;
    }
  });
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [otpVerifyEmail, setOtpVerifyEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);

  // Helper to infer role if it is missing
  const inferRole = (email = "") => {
    return email.toLowerCase().endsWith("@gmail.com") ? "student" : "teacher";
  };

  const handleLogin = (data) => {
    if (data.requiresOtp) {
      setOtpVerifyEmail(data.email);
      setOtpError("");
      return;
    }

    const { token, user: returnedUser, role } = data;
    const finalRole = returnedUser?.role || role || inferRole(returnedUser?.email);
    const userWithRole = { ...(returnedUser || {}), role: finalRole };
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userWithRole));
    setUser(userWithRole);
    setCurrentPage(userWithRole.photoUploaded ? "dashboard" : "profile");
  };

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setOtpError("");
    setOtpLoading(true);

    try {
      const response = await api.post("/api/auth/verify-otp", {
        email: otpVerifyEmail,
        otp: otpCode,
      });

      const { token, user: returnedUser } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(returnedUser));
      setUser(returnedUser);
      setOtpVerifyEmail("");
      setOtpCode("");
      setCurrentPage(returnedUser.photoUploaded ? "dashboard" : "profile");
    } catch (err) {
      setOtpError(err.response?.data?.message || "Invalid or expired OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      const response = await api.get("/api/auth/me");
      if (response.data?.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
        setUser(response.data.user);
      }
    } catch (err) {
      console.error("Failed to check status:", err.message);
    }
  };

  const handleUpdateUser = (updatedUser) => {
    const userWithRole = { 
      ...updatedUser, 
      role: updatedUser.role || user?.role || inferRole(updatedUser.email) 
    };
    localStorage.setItem("user", JSON.stringify(userWithRole));
    setUser(userWithRole);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setOtpVerifyEmail("");
    setOtpCode("");
    setCurrentPage("dashboard");
  };

  // If student dashboard is not active, display activation pending block page
  const isPendingStudent = user && user.role === "student" && !user.isDashboardActive;

  if (!user) {
    if (otpVerifyEmail) {
      return (
        <div className="page-shell">
          <div className="card auth-card">
            <h1>Email Verification</h1>
            <p>An OTP code has been generated. For testing, you can enter the master OTP <strong>123456</strong> to complete your login.</p>
            <form onSubmit={handleVerifyOtpSubmit}>
              <label>
                Enter OTP
                <input 
                  type="text" 
                  maxLength="6" 
                  value={otpCode} 
                  onChange={(e) => setOtpCode(e.target.value)} 
                  placeholder="123456" 
                  required 
                />
              </label>
              {otpError && <div className="alert">{otpError}</div>}
              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" className="secondary" onClick={() => setOtpVerifyEmail("")}>Cancel</button>
                <button type="submit" className="primary" disabled={otpLoading}>
                  {otpLoading ? "Verifying..." : "Verify & Login"}
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }
    return <AuthPage onLogin={handleLogin} />;
  }

  if (isPendingStudent) {
    return (
      <div className="page-shell">
        <div className="card auth-card" style={{ textAlign: "center", maxWidth: "600px" }}>
          <h1 style={{ color: "#e11d48", fontSize: "2.2rem" }}>Dashboard Inactive</h1>
          <p style={{ margin: "20px 0", fontSize: "1.1rem" }}>
            Hello, <strong>{user.name}</strong>. Your Student Dashboard is currently pending activation. 
            A Teacher or Principal must activate your account before you can log in.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 24 }}>
            <button className="primary" onClick={checkStatus}>Check Status / Refresh</button>
            <button className="btn-logout" onClick={handleLogout}>Log Out</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {currentPage === "dashboard" && (
        <Dashboard
          user={user}
          onLogout={handleLogout}
          onNavigate={setCurrentPage}
          onUpdateUser={handleUpdateUser}
        />
      )}
      {currentPage === "notes-help" && (
        <NotesHelpPage
          user={user}
          onBack={() => setCurrentPage("dashboard")}
        />
      )}
      {currentPage === "profile" && (
        <ProfilePage
          user={user}
          onBack={() => setCurrentPage("dashboard")}
          onUpdateUser={handleUpdateUser}
        />
      )}
    </div>
  );
}

export default App;
