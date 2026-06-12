# Frontend Starter Template - React/Next.js

Quick reference for building the FocusClass AI frontend.

---

## 🎨 Frontend Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── ClassCard.jsx
│   │   ├── TopicHighlight.jsx
│   │   ├── FocusTracker.jsx
│   │   └── AttendanceTable.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── ClassList.jsx
│   │   ├── ClassDetail.jsx
│   │   ├── Notes.jsx
│   │   ├── Focus.jsx
│   │   └── Attendance.jsx
│   ├── services/
│   │   └── api.js          # All API calls
│   ├── context/
│   │   └── AuthContext.js  # Auth state management
│   ├── App.jsx
│   └── index.css
├── public/
└── package.json
```

---

## 📦 Required Dependencies

```bash
npm install react react-dom react-router-dom axios zustand
npm install tailwindcss postcss autoprefixer  # Styling
npm install chart.js react-chartjs-2          # Charts
npm install lucide-react                      # Icons
```

---

## 🔐 Auth Service (services/api.js)

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('authToken');

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
};

// Class endpoints
export const classAPI = {
  createClass: (data) => api.post('/class/create', data),
  joinClass: (classSessionId) => api.post('/class/join', { classSessionId }),
  getActiveClasses: () => api.get('/class/active'),
  getClassById: (classId) => api.get(`/class/${classId}`),
  endClass: (classId, data) => api.put(`/class/${classId}/end`, data),
  getStudentClasses: () => api.get('/class/student/classes'),
};

// Topic endpoints
export const topicAPI = {
  getTopics: (classId) => api.get(`/topics/class/${classId}`),
  recordTopic: (data) => api.post('/topics/record', data),
  addNote: (topicId, note) => api.post(`/topics/${topicId}/note`, { note }),
};

// Focus endpoints
export const focusAPI = {
  logBlockedApp: (data) => api.post('/app-blocking/log', data),
  getBlockedApps: (classId) => 
    api.get('/app-blocking', { params: { classSessionId: classId } }),
};

export default api;
```

---

## 🎯 Pages Overview

### 1. Login Page
```javascript
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await authAPI.login({ email, password });
      localStorage.setItem('authToken', data.token);
      navigate('/dashboard');
    } catch (error) {
      alert(error.response?.data?.message);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input 
        type="email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input 
        type="password" 
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### 2. Class List Page
```javascript
import { useEffect, useState } from 'react';
import { classAPI } from '../services/api';

export default function ClassList() {
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    const fetchClasses = async () => {
      const { data } = await classAPI.getActiveClasses();
      setClasses(data);
    };
    fetchClasses();
  }, []);

  const handleJoin = async (classId) => {
    try {
      await classAPI.joinClass(classId);
      alert('✅ Joined class - Attendance marked!');
    } catch (error) {
      alert('Failed to join class');
    }
  };

  return (
    <div>
      <h1>Active Classes</h1>
      {classes.map((cls) => (
        <div key={cls._id} className="class-card">
          <h2>{cls.title}</h2>
          <p>{cls.subject}</p>
          <p>Teacher: {cls.teacher.name}</p>
          <button onClick={() => handleJoin(cls._id)}>Join Class</button>
        </div>
      ))}
    </div>
  );
}
```

### 3. Important Topics Display
```javascript
import { useEffect, useState } from 'react';
import { topicAPI } from '../services/api';

export default function TopicsPage({ classId }) {
  const [topics, setTopics] = useState({});
  const [selectedTopic, setSelectedTopic] = useState(null);

  useEffect(() => {
    const fetchTopics = async () => {
      const { data } = await topicAPI.getTopics(classId);
      setTopics(data.byImportance);
    };
    fetchTopics();
  }, [classId]);

  const handleAddNote = async (topicId, note) => {
    try {
      await topicAPI.addNote(topicId, note);
      alert('✅ Note added!');
    } catch (error) {
      alert('Failed to add note');
    }
  };

  return (
    <div>
      <h1>Important Topics</h1>
      
      {/* Critical Topics */}
      <section className="critical-topics">
        <h2>🔴 Critical</h2>
        {topics.Critical?.map((topic) => (
          <TopicCard 
            key={topic._id} 
            topic={topic}
            onSelectNote={(note) => handleAddNote(topic._id, note)}
          />
        ))}
      </section>

      {/* High Topics */}
      <section className="high-topics">
        <h2>🟠 High Priority</h2>
        {topics.High?.map((topic) => (
          <TopicCard key={topic._id} topic={topic} />
        ))}
      </section>
    </div>
  );
}
```

### 4. Focus Tracker
```javascript
import { useEffect, useState } from 'react';
import { focusAPI } from '../services/api';

export default function FocusTracker({ classId }) {
  const [blockedApps, setBlockedApps] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await focusAPI.getBlockedApps(classId);
      setBlockedApps(data.blockedApps);
      setStats(data.stats);
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [classId]);

  return (
    <div className="focus-tracker">
      <h2>📱 Focus Score</h2>
      <div className="stats">
        <p>Apps Blocked: {stats?.totalBlocked}</p>
        <p>Total Duration: {Math.round(stats?.totalDurationSeconds / 60)} mins</p>
        <p>Distracting Apps: {stats?.uniqueApps?.join(', ')}</p>
      </div>
      
      <div className="blocked-apps">
        {blockedApps.map((app) => (
          <div key={app._id} className="app-item">
            <span>{app.appName}</span>
            <span>{Math.round(app.durationSeconds / 60)} mins blocked</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🎨 Key Components

### ClassCard Component
```javascript
export function ClassCard({ classData, onJoin, onView }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-xl font-bold">{classData.title}</h3>
      <p className="text-gray-600">{classData.subject}</p>
      <p className="text-sm text-gray-500">
        👨‍🏫 {classData.teacher.name}
      </p>
      <p className="text-sm">📍 {classData.students.length} students</p>
      <div className="mt-3 space-x-2">
        <button 
          onClick={() => onJoin(classData._id)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Join Class
        </button>
        <button 
          onClick={() => onView(classData._id)}
          className="bg-gray-300 px-4 py-2 rounded"
        >
          View Details
        </button>
      </div>
    </div>
  );
}
```

### TopicHighlight Component
```javascript
export function TopicHighlight({ topic, onAddNote }) {
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [note, setNote] = useState('');

  const handleSubmitNote = () => {
    onAddNote(note);
    setNote('');
    setShowNoteForm(false);
  };

  const importanceColor = {
    'Critical': 'red',
    'High': 'orange',
    'Medium': 'yellow',
    'Low': 'gray'
  };

  return (
    <div className={`bg-${importanceColor[topic.importance]}-50 border-l-4 border-${importanceColor[topic.importance]}-500 p-4 mb-3`}>
      <h4 className="font-bold">{topic.topic}</h4>
      <p className="text-sm text-gray-600">
        ⏱️ {Math.floor(topic.timestamp / 60)}:{String(topic.timestamp % 60).padStart(2, '0')}
        {' '} | 📊 Confidence: {(topic.confidence * 100).toFixed(0)}%
      </p>
      
      {showNoteForm ? (
        <div className="mt-2">
          <textarea 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add your notes..."
            className="w-full p-2 border rounded"
          />
          <button 
            onClick={handleSubmitNote}
            className="bg-green-500 text-white px-3 py-1 rounded mt-1"
          >
            Save Note
          </button>
        </div>
      ) : (
        <button 
          onClick={() => setShowNoteForm(true)}
          className="text-blue-500 text-sm mt-2"
        >
          + Add Note
        </button>
      )}

      {topic.studentNotes && topic.studentNotes.length > 0 && (
        <div className="mt-2 text-sm">
          <strong>My Notes:</strong>
          {topic.studentNotes.map((n, i) => (
            <p key={i} className="text-gray-700">• {n.note}</p>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 📱 Full App Flow

```
User Opens App
    ↓
Is Logged In? → No → Login/Register Page
    ↓ Yes
Dashboard
    ├→ Show User Profile
    ├→ Show Statistics
    └→ Quick Access Buttons

View Classes
    ├→ GET /api/class/active (List all active classes)
    └→ Teacher + Students visible

Join Class
    ├→ POST /api/class/join (Auto-marks attendance ✅)
    ├→ Show class details
    ├→ Get important topics: GET /api/topics/class/:id
    └→ Track focus: GET /api/app-blocking

During Class
    ├→ Monitor: /api/app-blocking (blocked apps)
    ├→ View Topics: /api/topics/class/:id
    ├→ Add Notes: POST /api/topics/:id/note
    └→ Check Focus Score

After Class
    ├→ View Attendance ✅ (auto-marked)
    ├→ Review Topics & Notes
    ├→ Check Focus Statistics
    └→ Go to Notes: GET /api/notes
```

---

## 🚀 Setup Instructions

### Create React App
```bash
npx create-react-app focusclass-frontend
cd focusclass-frontend
npm install axios react-router-dom zustand chart.js react-chartjs-2 tailwindcss
```

### Setup Tailwind
```bash
npx tailwindcss init -p
```

### Start Frontend
```bash
npm start
```

---

## ✅ Feature Checklist

Frontend Pages to Build:
- [ ] Login/Register
- [ ] Dashboard (overview)
- [ ] Class List (with join button)
- [ ] Class Detail (with topics & focus tracker)
- [ ] Important Topics (with note-taking)
- [ ] Focus Score (with app blocking stats)
- [ ] Attendance (view/history)
- [ ] Notes (create/view/edit)
- [ ] Student Profile
- [ ] Settings

---

## 🎯 Ready to Start Building!

**Backend:** ✅ Complete with all AI features
**Frontend:** ⏳ Ready to build using this template

All API endpoints are documented in `AI_FEATURES_GUIDE.md` and `API_DOCUMENTATION.md`

Start with Login page, then build Dashboard, then Class List, and expand from there!

---

**Good luck with frontend development! 🚀**
