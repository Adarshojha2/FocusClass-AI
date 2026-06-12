import { useState } from "react";
import api from "../api";

const AuthPage = ({ onLogin }) => {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [phone, setPhone] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [lifeProfile, setLifeProfile] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setRole("student");
    setName("");
    setEmail("");
    setPassword("");
    setPhone("");
    setRollNumber("");
    setLifeProfile("");
    setParentEmail("");
    setParentPhone("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (mode === "register" && role === "student" && !email.toLowerCase().endsWith("@gmail.com")) {
      setError("Students must register with a valid @gmail.com email address.");
      return;
    }

    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload = mode === "login"
        ? { email, password }
        : { 
            name, 
            email, 
            password, 
            role, 
            phone, 
            rollNumber, 
            lifeProfile, 
            parentEmail: role === "student" ? parentEmail : "", 
            parentPhone: role === "student" ? parentPhone : "" 
          };
      const response = await api.post(endpoint, payload);
      onLogin(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to authenticate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="card auth-card">
        <h1 style={{ textAlign: "center", marginBottom: 6 }}>FocusClass AI</h1>
        <p style={{ textAlign: "center", marginTop: 0, color: "var(--muted)" }}>
          {mode === "login" 
            ? "Login to access attendance, focus tracking, notes, and AI classroom insights." 
            : "Register a new account for your smart classroom assistant."}
        </p>

        <div className="toggle-row" style={{ justifyContent: "center", marginTop: 20 }}>
          <button 
            type="button" 
            className={mode === "login" ? "primary" : "secondary"} 
            onClick={() => { setMode("login"); resetForm(); }}
          >
            Login
          </button>
          <button 
            type="button" 
            className={mode === "register" ? "primary" : "secondary"} 
            onClick={() => { setMode("register"); resetForm(); }}
          >
            Register
          </button>
        </div>

        {/* Role row has three options: Principal, Teacher, Student */}
        <div className="role-row" style={{ justifyContent: "center", marginBottom: 20 }}>
          <button
            type="button"
            className={role === "principal" ? "primary small" : "secondary small"}
            onClick={() => setRole("principal")}
          >
            Principal
          </button>
          <button
            type="button"
            className={role === "teacher" ? "primary small" : "secondary small"}
            onClick={() => setRole("teacher")}
          >
            Teacher
          </button>
          <button
            type="button"
            className={role === "student" ? "primary small" : "secondary small"}
            onClick={() => setRole("student")}
          >
            Student
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === "register" && (
            <>
              <label>
                Full Name
                <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" required />
              </label>
              <label>
                Phone Number
                <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+1 234 567 890" />
              </label>
              
              {role === "student" && (
                <>
                  <label style={{ borderLeft: "3px solid var(--primary)", paddingLeft: 10, margin: "16px 0" }}>
                    Roll Number / Student ID
                    <input value={rollNumber} onChange={(event) => setRollNumber(event.target.value)} placeholder="Roll number" required />
                  </label>
                  <label style={{ borderLeft: "3px solid var(--primary)", paddingLeft: 10, margin: "16px 0" }}>
                    Parent's Email Address
                    <input type="email" value={parentEmail} onChange={(event) => setParentEmail(event.target.value)} placeholder="parent@example.com" required />
                  </label>
                  <label style={{ borderLeft: "3px solid var(--primary)", paddingLeft: 10, margin: "16px 0" }}>
                    Parent's Phone Number
                    <input value={parentPhone} onChange={(event) => setParentPhone(event.target.value)} placeholder="+1 987 654 321" required />
                  </label>
                </>
              )}

              <label>
                Life Profile Bio
                <textarea value={lifeProfile} onChange={(event) => setLifeProfile(event.target.value)} rows="3" placeholder="A short life profile or bio" />
              </label>
            </>
          )}
          
          <label>
            Email Address
            <input 
              value={email} 
              onChange={(event) => setEmail(event.target.value)} 
              type="email" 
              placeholder={role === "student" ? "must end with @gmail.com" : "name@example.com"} 
              required 
            />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Enter password" required />
          </label>

          {error && <div className="alert">{error}</div>}
          <button type="submit" className="primary" style={{ width: "100%", marginTop: 12 }} disabled={loading}>
            {loading ? "Processing..." : mode === "login" ? "Login" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
