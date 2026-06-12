const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
// Expose uploads directory statically before helmet to avoid cross-origin header blocks
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/uploads", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
  next();
}, express.static(uploadsDir));

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);
app.use(morgan("dev"));

// Routes
app.get("/", (req, res) => {
  res.send("FocusClass AI Backend Running");
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/notes", require("./routes/noteRoutes"));
app.use("/api/attendance", require("./routes/attendanceRoutes"));
app.use("/api/focus", require("./routes/focusRoutes"));
app.use("/api/class", require("./routes/classRoutes"));
app.use("/api/app-blocking", require("./routes/appBlockingRoutes"));
app.use("/api/topics", require("./routes/topicRoutes"));
app.use("/api/feedback", require("./routes/feedbackRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));
app.use("/api/assignments", require("./routes/assignmentRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));

// IMPORTANT EXPORT
module.exports = app;