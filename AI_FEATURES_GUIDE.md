# FocusClass AI - Enhanced Backend Features

## 🚀 New Features Added (Auto Attendance + Focus Tracker)

Your backend now includes **smart class session management** with **AI-powered topic detection** and **automatic app blocking tracking**.

---

## 📋 NEW API ENDPOINTS

### 1️⃣ Class Sessions (Auto Attendance)

#### Create Class (Teacher)
```
POST /api/class/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "subject": "Data Structures",
  "title": "Lecture 5: Trees and Graphs",
  "description": "Introduction to tree and graph algorithms"
}

Response:
{
  "classSession": {
    "_id": "65a1b2c3...",
    "teacher": "65a1b2c1...",
    "subject": "Data Structures",
    "title": "Lecture 5",
    "startTime": "2024-01-15T10:30:00Z",
    "status": "Active",
    "students": [teacher_id]
  }
}
```

#### Join Class (Student) - AUTO MARKS ATTENDANCE ✅
```
POST /api/class/join
Authorization: Bearer <token>
Content-Type: application/json

{
  "classSessionId": "65a1b2c3..."
}

Response:
{
  "message": "Joined class successfully - Attendance marked",
  "classSession": {...}
}
```

#### Get All Active Classes
```
GET /api/class/active

Response:
[
  {
    "_id": "65a1b2c3...",
    "subject": "Data Structures",
    "title": "Lecture 5",
    "teacher": {
      "_id": "...",
      "name": "Prof. Smith",
      "email": "smith@university.edu"
    },
    "students": [...],
    "status": "Active"
  }
]
```

#### Get Class Details
```
GET /api/class/:classId

Response:
{
  "_id": "65a1b2c3...",
  "subject": "Data Structures",
  "title": "Lecture 5",
  "status": "Active",
  "startTime": "2024-01-15T10:30:00Z",
  "students": [...],
  "importantTopics": [
    {
      "topic": "Binary Search Tree insertion",
      "timestamp": 120,
      "mentionedBy": "AI"
    }
  ]
}
```

#### End Class (Teacher)
```
PUT /api/class/:classId/end
Authorization: Bearer <token>
Content-Type: application/json

{
  "transcript": "Full lecture transcript..."
}

Response:
{
  "message": "Class ended successfully",
  "classSession": {
    "status": "Ended",
    "endTime": "2024-01-15T11:30:00Z"
  }
}
```

#### Get Student's Classes
```
GET /api/class/student/classes
Authorization: Bearer <token>

Response: [list of all classes student attended]
```

---

### 2️⃣ App Blocking Tracker (Phone/Distraction Management)

#### Log Blocked App
```
POST /api/app-blocking/log
Authorization: Bearer <token>
Content-Type: application/json

{
  "appName": "Instagram",
  "classSessionId": "65a1b2c3...",
  "reason": "Distraction",
  "durationSeconds": 300
}

Response:
{
  "message": "App blocking logged successfully",
  "appBlock": {
    "_id": "65a1b2c4...",
    "user": "65a1b2c1...",
    "appName": "Instagram",
    "blockedAt": "2024-01-15T10:35:00Z",
    "durationSeconds": 300
  }
}
```

#### Get Blocked Apps (with stats)
```
GET /api/app-blocking?classSessionId=65a1b2c3...
Authorization: Bearer <token>

Response:
{
  "blockedApps": [
    {
      "appName": "Instagram",
      "blockedAt": "2024-01-15T10:35:00Z",
      "durationSeconds": 300
    }
  ],
  "stats": {
    "totalBlocked": 3,
    "totalDurationSeconds": 1500,
    "uniqueApps": ["Instagram", "TikTok", "YouTube"]
  }
}
```

#### Unblock App
```
PUT /api/app-blocking/:blockingId/unblock
Authorization: Bearer <token>

Response:
{
  "message": "App unblocked",
  "appBlock": {
    "unblockedAt": "2024-01-15T10:40:00Z"
  }
}
```

---

### 3️⃣ AI Topic Highlighting (Important Topics Detection)

#### Record Important Topic (AI Auto-Detect)
```
POST /api/topics/record
Authorization: Bearer <token>
Content-Type: application/json

{
  "classSessionId": "65a1b2c3...",
  "topic": "Binary Search Tree insertion algorithm",
  "confidence": 0.92,
  "timestamp": 120,
  "importance": "Critical"
}

Response:
{
  "message": "Important topic recorded",
  "topicHighlight": {
    "_id": "65a1b2c5...",
    "topic": "BST insertion",
    "confidence": 0.92,
    "importance": "Critical",
    "timestamp": 120
  }
}
```

#### Get Important Topics from Class
```
GET /api/topics/class/:classSessionId

Response:
{
  "classSessionId": "65a1b2c3...",
  "totalTopics": 8,
  "byImportance": {
    "Critical": [
      {
        "topic": "BST insertion",
        "confidence": 0.92,
        "timestamp": 120
      }
    ],
    "High": [...]
  },
  "topics": [...]
}
```

#### Student Adds Note to Topic
```
POST /api/topics/:topicId/note
Authorization: Bearer <token>
Content-Type: application/json

{
  "note": "Remember to handle null pointers during insertion!"
}

Response:
{
  "message": "Note added to topic",
  "topicHighlight": {
    "studentNotes": [
      {
        "user": "65a1b2c1...",
        "note": "Remember to handle null..."
      }
    ]
  }
}
```

---

## 🎯 How It Works (Student Perspective)

### Scenario: Online Class Starting

**Timeline:**
1. **Class Starts (10:00 AM)**
   - Teacher creates class → `/api/class/create`
   - Status: `Active`

2. **Student Joins (10:02 AM)**
   - Student clicks "Join Class"
   - App calls: `POST /api/class/join`
   - ✅ **Attendance automatically marked**
   - Status: `Present`
   - Phone automatically set to silent

3. **During Class (10:05 AM)**
   - Student opens Instagram
   - App detects distraction
   - App logs: `POST /api/app-blocking/log`
   - Instagram blocked for 5 minutes

4. **AI Detects Important Topic (10:15 AM)**
   - Teacher says: "**Important**: BST insertion is crucial for exams"
   - AI detects keywords: "Important", "crucial"
   - System records: `POST /api/topics/record`
   - Student gets notification

5. **Student Reviews Topic (10:20 AM)**
   - Student clicks on highlighted topic
   - Gets: `GET /api/topics/class/:classId`
   - Adds personal notes: `POST /api/topics/:topicId/note`

6. **Class Ends (11:00 AM)**
   - Teacher uploads transcript
   - Call: `PUT /api/class/:classId/end`
   - System generates study summary

---

## 🤖 AI Features Included

### 1. Automatic Important Topic Detection
- Keyword-based detection (first level)
- Hugging Face API integration (advanced)
- Detects: Critical, High, Medium, Low topics
- Assigns confidence scores (0-1)

### 2. Learning Pattern Analysis
- Analyzes transcript for key concepts
- Identifies frequently mentioned topics
- Generates focus recommendations

### 3. Distraction Tracking
- Logs blocked apps automatically
- Generates focus statistics
- Suggests study improvements

---

## 📊 Database Models

### ClassSession
```javascript
{
  teacher: ObjectId (ref: User),
  subject: String,
  title: String,
  description: String,
  startTime: Date,
  endTime: Date,
  status: "Active" | "Ended" | "Scheduled",
  students: [ObjectId],
  transcript: String,
  importantTopics: [
    { topic: String, timestamp: Number, mentionedBy: String }
  ]
}
```

### AppBlocking
```javascript
{
  user: ObjectId,
  appName: String,
  classSession: ObjectId,
  blockedAt: Date,
  unblockedAt: Date,
  reason: "Distraction" | "Study Focus" | "User Request",
  durationSeconds: Number
}
```

### TopicHighlight
```javascript
{
  classSession: ObjectId,
  topic: String,
  confidence: Number (0-1),
  timestamp: Number (seconds),
  importance: "Low" | "Medium" | "High" | "Critical",
  studentNotes: [
    { user: ObjectId, note: String }
  ]
}
```

---

## 🎨 Frontend Integration Guide

### Step 1: Create Class (Teacher Dashboard)
```javascript
const createClass = async () => {
  const response = await fetch('http://localhost:5000/api/class/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subject: 'Data Structures',
      title: 'Lecture 5',
      description: 'BST Algorithms'
    })
  });
  const { classSession } = await response.json();
  setCurrentClass(classSession._id);
};
```

### Step 2: Join Class (Student)
```javascript
const joinClass = async (classId) => {
  const response = await fetch('http://localhost:5000/api/class/join', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ classSessionId: classId })
  });
  // Attendance automatically marked!
  const { classSession } = await response.json();
  showNotification('✅ Attendance Marked');
};
```

### Step 3: Monitor Focus & Distractions
```javascript
// Log blocked app
const logBlockedApp = (appName, duration) => {
  fetch('http://localhost:5000/api/app-blocking/log', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      appName,
      classSessionId: currentClass,
      durationSeconds: duration
    })
  });
};

// Get focus stats
const getFocusStats = async () => {
  const response = await fetch(
    `http://localhost:5000/api/app-blocking?classSessionId=${currentClass}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  const { stats } = await response.json();
  displayFocusScore(stats);
};
```

### Step 4: Show Important Topics
```javascript
const getImportantTopics = async () => {
  const response = await fetch(
    `http://localhost:5000/api/topics/class/${classId}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  const { byImportance } = await response.json();
  
  // Display Critical topics first
  displayTopics(byImportance.Critical, 'crimson');
  displayTopics(byImportance.High, 'orange');
};
```

---

## ✅ Full API Count

| Category | Count |
|----------|-------|
| Authentication | 3 |
| Notes | 2 |
| Focus | 2 |
| Attendance | 2 |
| **Classes** | **6** |
| **App Blocking** | **3** |
| **Topics** | **3** |
| **TOTAL** | **21** |

---

## 🔄 Complete Workflow Example

```
Teacher Journey:
1. Login → POST /api/auth/login
2. Create Class → POST /api/class/create
3. Wait for students to join
4. Teach class with AI recording important topics
5. End class with transcript → PUT /api/class/:classId/end

Student Journey:
1. Login → POST /api/auth/login
2. See active classes → GET /api/class/active
3. Join class ✅ Auto attendance → POST /api/class/join
4. During class: distracting apps blocked → POST /api/app-blocking/log
5. View important topics → GET /api/topics/class/:classId
6. Add personal notes → POST /api/topics/:topicId/note
7. Review class notes → GET /api/notes
8. Check focus score → GET /api/app-blocking
```

---

## 🚀 Ready for Frontend!

Your backend now has **all the AI features needed** for:
- ✅ Auto attendance marking
- ✅ Real-time class session management
- ✅ Automatic app blocking tracking
- ✅ AI-powered topic detection
- ✅ Student note-taking on important topics
- ✅ Focus score tracking
- ✅ Complete learning analytics

**Next: Build the frontend with React/Next.js!**

---

## 📚 Files Added

```
models/
  ├── classSession.js         (Class/lecture sessions)
  ├── appBlocking.js          (Blocked apps tracking)
  └── topicHighlight.js       (AI-detected topics)

controllers/
  ├── classController.js      (Class management)
  ├── appBlockingController.js (App tracking)
  └── topicController.js      (Topic detection)

routes/
  ├── classRoutes.js
  ├── appBlockingRoutes.js
  └── topicRoutes.js

utils/
  └── topicDetection.js       (AI topic analysis)
```

**Total New Code: ~600 lines**

---

**Backend Status: COMPLETE WITH AI FEATURES ✅**
**Ready for: Frontend Development**
