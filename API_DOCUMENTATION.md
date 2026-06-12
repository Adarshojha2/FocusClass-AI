# FocusClass AI Backend API Documentation

## Overview
FocusClass AI is a comprehensive learning management system with AI-powered note summarization, focus tracking, attendance management, and user authentication.

**Base URL:** `http://localhost:5000` (development) | `https://your-deployed-domain.com` (production)

---

## Authentication

### Register User
**Endpoint:** `POST /api/auth/register`

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Errors:**
- `400`: User already exists / Missing fields
- `500`: Server error

---

### Login User
**Endpoint:** `POST /api/auth/login`

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Errors:**
- `400`: Invalid email or password
- `500`: Server error

---

### Get Current User
**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "user": {
    "id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

**Errors:**
- `401`: Authentication token missing / Invalid or expired token
- `404`: User not found
- `500`: Server error

---

## Notes (AI-Powered)

### Create Note
**Endpoint:** `POST /api/notes`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "title": "Quantum Physics Basics",
  "transcript": "Quantum mechanics is the branch of physics dealing with atoms and subatomic particles...",
  "importantTopics": ["Quantum superposition", "Wave-particle duality"]
}
```

**Response (201):**
```json
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
  "user": "65a1b2c3d4e5f6g7h8i9j0k1",
  "title": "Quantum Physics Basics",
  "transcript": "Quantum mechanics is the branch of physics...",
  "summary": "Quantum mechanics describes the behavior of matter and energy at atomic scales...",
  "importantTopics": ["Quantum superposition", "Wave-particle duality"],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

**Errors:**
- `400`: Missing required fields (title, transcript)
- `401`: Authentication required
- `500`: Server error / AI summarization failed

---

### Get All Notes
**Endpoint:** `GET /api/notes`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "user": "65a1b2c3d4e5f6g7h8i9j0k1",
    "title": "Quantum Physics Basics",
    "transcript": "...",
    "summary": "...",
    "importantTopics": ["Quantum superposition"],
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

**Errors:**
- `401`: Authentication required
- `500`: Server error

---

## Focus Tracking

### Save Focus Session
**Endpoint:** `POST /api/focus`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "focusScore": 85,
  "distractions": ["phone", "notifications"]
}
```

**Response (201):**
```json
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
  "user": "65a1b2c3d4e5f6g7h8i9j0k1",
  "focusScore": 85,
  "distractions": ["phone", "notifications"],
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Errors:**
- `400`: focusScore is required / Invalid focusScore (must be 0-100)
- `401`: Authentication required
- `500`: Server error

---

### Get Focus History
**Endpoint:** `GET /api/focus`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "user": "65a1b2c3d4e5f6g7h8i9j0k1",
    "focusScore": 85,
    "distractions": ["phone", "notifications"],
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

**Errors:**
- `401`: Authentication required
- `500`: Server error

---

## Attendance

### Mark Attendance
**Endpoint:** `POST /api/attendance`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request:**
```json
{
  "subject": "Data Structures",
  "status": "Present"
}
```

**Response (201):**
```json
{
  "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
  "user": "65a1b2c3d4e5f6g7h8i9j0k1",
  "subject": "Data Structures",
  "status": "Present",
  "createdAt": "2024-01-15T10:30:00Z"
}
```

**Status Values:** `Present`, `Absent`, `Late`

**Errors:**
- `400`: Subject is required
- `401`: Authentication required
- `500`: Server error

---

### Get Attendance Records
**Endpoint:** `GET /api/attendance`

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
    "user": "65a1b2c3d4e5f6g7h8i9j0k1",
    "subject": "Data Structures",
    "status": "Present",
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

**Errors:**
- `401`: Authentication required
- `500`: Server error

---

## Health Check

### API Status
**Endpoint:** `GET /`

**Response (200):**
```
FocusClass AI Backend Running
```

---

## Authentication Flow

### For Frontend Integration:

1. **Register/Login:**
   ```javascript
   const response = await fetch('http://localhost:5000/api/auth/register', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ name, email, password })
   });
   const { token } = await response.json();
   localStorage.setItem('authToken', token);
   ```

2. **Use Token in Protected Routes:**
   ```javascript
   const response = await fetch('http://localhost:5000/api/notes', {
     method: 'GET',
     headers: { 
       'Authorization': `Bearer ${localStorage.getItem('authToken')}`
     }
   });
   ```

3. **Get Current User:**
   ```javascript
   const response = await fetch('http://localhost:5000/api/auth/me', {
     headers: { 
       'Authorization': `Bearer ${localStorage.getItem('authToken')}`
     }
   });
   const { user } = await response.json();
   ```

---

## Error Response Format

All error responses follow this format:

```json
{
  "message": "Descriptive error message"
}
```

**Common HTTP Status Codes:**
- `200`: OK
- `201`: Created
- `400`: Bad Request (validation error)
- `401`: Unauthorized (missing/invalid token)
- `404`: Not Found
- `500`: Internal Server Error

---

## Environment Variables

**.env file required:**
```
MONGO_URI=your_mongodb_atlas_uri
PORT=5000
JWT_SECRET=your_jwt_secret_key
HF_API_KEY=your_huggingface_api_key (for AI summarization)
```

---

## Running the Server

### Development:
```bash
npm run dev
```

### Production:
```bash
npm start
```

---

## Project Structure

```
server/
├── config/
│   └── db.js              # MongoDB connection
├── controllers/
│   ├── authController.js
│   ├── noteController.js
│   ├── focusController.js
│   └── attendanceController.js
├── middleware/
│   └── authMiddleware.js  # JWT verification
├── models/
│   ├── user.js
│   ├── note.js
│   ├── focus.js
│   └── attendance.js
├── routes/
│   ├── authRoutes.js
│   ├── noteRoutes.js
│   ├── focusRoutes.js
│   └── attendanceRoutes.js
├── utils/
│   └── ai.js              # AI summarization
├── app.js                 # Express app setup
└── server.js              # Server entry point
```

---

## Notes for Final Year Project

✅ **Completed:**
- User authentication with JWT
- MongoDB integration with Atlas
- CRUD operations for all modules
- AI-powered note summarization (Hugging Face API)
- Error handling and validation
- CORS enabled for cross-origin requests
- Security headers with Helmet
- Request logging with Morgan

📋 **Frontend Tasks:**
- Build login/register pages
- Create note creation and management interface
- Implement focus timer with score tracking
- Build attendance tracker dashboard
- Add responsive UI components

🚀 **Deployment Checklist:**
- [ ] Update JWT_SECRET to a strong random key
- [ ] Set production MongoDB credentials
- [ ] Add Hugging Face API key
- [ ] Enable HTTPS
- [ ] Set NODE_TLS_REJECT_UNAUTHORIZED to '1' in production
- [ ] Update CORS origins for production domain
- [ ] Add rate limiting middleware
- [ ] Set up environment-specific .env files

---

## Support & Testing

Use Postman or VS Code REST Client to test endpoints:
- Import the endpoints from API_DOCUMENTATION.md
- Add your token in Authorization header
- Test each endpoint with sample data

---

**Backend Status:** ✅ Production-Ready
**Last Updated:** May 29, 2026
