import { useEffect, useState } from "react";
import api from "../api";

const ProfilePage = ({ user, onBack, onUpdateUser }) => {
  const [name, setName] = useState(user.name || "");
  const [email] = useState(user.email || "");
  const [role] = useState(user.role || "student");
  const [phone, setPhone] = useState(user.phone || "");
  const [rollNumber, setRollNumber] = useState(user.rollNumber || "");
  const [lifeProfile, setLifeProfile] = useState(user.lifeProfile || "");
  const [parentEmail, setParentEmail] = useState(user.parentEmail || "");
  const [parentPhone, setParentPhone] = useState(user.parentPhone || "");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const backendBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    setName(user.name || "");
    setPhone(user.phone || "");
    setRollNumber(user.rollNumber || "");
    setLifeProfile(user.lifeProfile || "");
    setParentEmail(user.parentEmail || "");
    setParentPhone(user.parentPhone || "");
    setPhotoPreview(user.photoUrl ? `${backendBaseUrl}${user.photoUrl}?h=${user.photoHash || ""}` : "");
  }, [user, backendBaseUrl]);

  const handleSave = async () => {
    setError("");
    setStatus("");
    setLoading(true);

    try {
      const response = await api.put("/api/auth/update", {
        name,
        phone,
        rollNumber,
        lifeProfile,
        parentEmail: role === "student" ? parentEmail : "",
        parentPhone: role === "student" ? parentPhone : "",
      });

      if (response.data?.user) {
        onUpdateUser({
          ...user,
          ...response.data.user,
        });
        setStatus("Profile updated successfully.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0] || null;
    setPhotoFile(file);
    if (file) setPhotoPreview(URL.createObjectURL(file));
  };

  const handleUploadPhoto = async () => {
    if (!photoFile) return setError("Please choose a photo to upload.");
    setLoading(true);
    try {
      const form = new FormData();
      form.append("photo", photoFile);
      const response = await api.post("/api/auth/upload-photo", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (response.data?.user) {
        onUpdateUser({
          ...user,
          ...response.data.user,
        });
        const uploadedUrl = response.data.user.photoUrl
          ? `${backendBaseUrl}${response.data.user.photoUrl}`
          : photoPreview;
        setPhotoPreview(uploadedUrl);
        setPhotoFile(null);
        setStatus("Profile photo uploaded successfully.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Could not upload photo.");
    } finally {
      setLoading(false);
    }
  };

  const visiblePhotoUrl = (photoFile && photoPreview)
    ? photoPreview
    : (user?.photoUrl
        ? (user.photoUrl.startsWith("data:") ? user.photoUrl : `${backendBaseUrl}${user.photoUrl}?h=${user.photoHash || ""}`)
        : "");

  return (
    <div className="page-shell">
      <header className="header-row">
        <div>
          <h1 style={{ letterSpacing: "-0.04em" }}>Profile Settings</h1>
          <p>Update your details, bio summary, and verify your profile photo.</p>
        </div>
        <div className="header-actions">
          <button className="secondary" onClick={onBack}>← Back</button>
        </div>
      </header>

      {error && <div className="alert">{error}</div>}
      {status && <div className="status-chip">{status}</div>}

      <div className="card wide-card" style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h2>Personal Details</h2>
        
        {/* Profile Photo Display and Upload Section */}
        <div style={{ display: "flex", gap: 24, alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>
          <div>
            {visiblePhotoUrl ? (
              <img
                src={visiblePhotoUrl}
                alt="Profile"
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 20,
                  objectFit: "cover",
                  border: "2px solid var(--primary)",
                  boxShadow: "0 10px 25px rgba(56,189,248,0.2)"
                }}
              />
            ) : (
              <div
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 20,
                  background: "rgba(15,23,42,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--muted)",
                  fontWeight: 600,
                  border: "1px dashed rgba(15,23,42,0.15)"
                }}
              >
                No photo
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: "260px" }}>
            <p style={{ margin: "0 0 10px 0", fontSize: "0.95rem", color: "var(--text-muted)" }}>
              Please upload a clear, front-facing profile photo. This photo is required to join live classes and will be matched via AI verification.
              <strong> You can only upload your profile photo once.</strong>
            </p>
            {!user.photoUploaded ? (
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  style={{ width: "auto", margin: 0, padding: "8px 12px" }}
                />
                <button 
                  className="primary small" 
                  onClick={handleUploadPhoto} 
                  disabled={loading || !photoFile}
                >
                  {loading ? "Uploading..." : "Upload Photo"}
                </button>
              </div>
            ) : (
              <div className="status-chip" style={{ background: "rgba(5, 150, 105, 0.06)", borderColor: "rgba(5, 150, 105, 0.18)", color: "#065f46", marginTop: 10 }}>
                ✓ Profile Photo Verified & Saved
              </div>
            )}
          </div>
        </div>

        <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: "24px 0" }} />

        {/* Profile Information Inputs */}
        <label>
          Full Name
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <label>
            Account Role
            <input value={role.toUpperCase()} readOnly style={{ background: "rgba(15,23,42,0.03)" }} />
          </label>
          <label>
            Email Address
            <input value={email} readOnly style={{ background: "rgba(15,23,42,0.03)" }} />
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <label>
            Phone Number
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 890" />
          </label>
          {role === "student" ? (
            <label>
              Roll Number / Student ID
              <input value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} placeholder="Roll number" required />
            </label>
          ) : (
            <div />
          )}
        </div>

        {role === "student" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, borderLeft: "3px solid var(--primary)", paddingLeft: 16, margin: "18px 0" }}>
            <label>
              Parent's Email
              <input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} placeholder="parent@example.com" required />
            </label>
            <label>
              Parent's Phone
              <input value={parentPhone} onChange={(e) => setParentPhone(e.target.value)} placeholder="+1 987 654 321" required />
            </label>
          </div>
        )}

        <label>
          Life Profile & Bio
          <textarea value={lifeProfile} onChange={(e) => setLifeProfile(e.target.value)} rows="4" placeholder="Write a short bio or summary about yourself..." />
        </label>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 24 }}>
          <button type="button" className="secondary" onClick={onBack}>Cancel</button>
          <button type="button" className="primary" onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
