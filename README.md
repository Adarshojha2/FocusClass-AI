# FocusClass AI - Backend Setup Guide

## 🎯 Project Overview

FocusClass AI is an AI-powered learning management system designed for students to:
- ✍️ Create and manage study notes with AI-powered summaries
- 📊 Track focus levels during study sessions
- 📋 Manage attendance records
- 🔐 Secure user authentication with JWT

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB Atlas account
- Hugging Face API key (for AI summarization)

### Installation

1. **Clone & Navigate to Server:**
```bash
cd server
npm install
```

2. **Setup Environment Variables:**
Create a `.env` file in the server root:
```
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/focusclass?retryWrites=true&w=majority
PORT=5000
JWT_SECRET=your-super-secret-key-change-this
HF_API_KEY=hf_your_huggingface_api_key
```

3. **Start Development Server:**
```bash
npm run dev
```

Expected output:
```
DNS servers: [ '8.8.8.8', '8.8.4.4' ]
Connecting MongoDB...
MongoDB Connected
Server running on 5000
```

---

## 📚 API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Login user and get JWT token
- `GET /api/auth/me` - Get current user profile

### Notes
- `POST /api/notes` - Create note (auto-summarized)
- `GET /api/notes` - Get all user notes

### Focus Tracking
- `POST /api/focus` - Save focus session
- `GET /api/focus` - Get focus history

### Attendance
- `POST /api/attendance` - Mark attendance
- `GET /api/attendance` - Get attendance records

**Full API documentation:** See `API_DOCUMENTATION.md`

---

## 🔐 Security Features

✅ **Implemented:**
- Password hashing with bcryptjs (salt rounds: 10)
- JWT token authentication (7-day expiration)
- Helmet.js security headers
- CORS protection
- Environment variables for sensitive data
- Input validation and sanitization
- Error message obfuscation (no stack traces to client)

---

## 📁 Project Structure

```
server/
├── config/
│   └── db.js                    # MongoDB Atlas connection with DNS fix
├── controllers/
│   ├── authController.js        # Auth logic (register, login, getCurrentUser)
│   ├── noteController.js        # Note CRUD + AI summarization
│   ├── focusController.js       # Focus session tracking
│   └── attendanceController.js  # Attendance management
├── middleware/
│   └── authMiddleware.js        # JWT verification & Bearer token parsing
├── models/
│   ├── user.js                  # User schema (password hashed)
│   ├── note.js                  # Note schema with AI summary field
│   ├── focus.js                 # Focus session schema
│   └── attendance.js            # Attendance schema with status enum
├── routes/
│   ├── authRoutes.js            # Authentication endpoints
│   ├── noteRoutes.js            # Protected note endpoints
│   ├── focusRoutes.js           # Protected focus endpoints
│   └── attendanceRoutes.js      # Protected attendance endpoints
├── utils/
│   └── ai.js                    # Hugging Face API integration
├── app.js                       # Express app configuration
├── server.js                    # Server entry point
├── .env                         # Environment variables
└── API_DOCUMENTATION.md         # Complete API reference
```

---

## 🔧 Technical Stack

| Component | Technology |
|-----------|------------|
| **Runtime** | Node.js |
| **Framework** | Express.js |
| **Database** | MongoDB Atlas |
| **Authentication** | JWT + bcryptjs |
| **AI Summarization** | Hugging Face API |
| **Security** | Helmet.js, CORS, Input Validation |
| **Logging** | Morgan.js |
| **Development** | Nodemon |

---

## 🛠️ Key Implementation Details

### 1. MongoDB Connection
- Uses DNS workaround for SRV record resolution
- Automatically sets Google DNS servers (8.8.8.8, 8.8.4.4)
- Connection pooling with configurable timeouts
- **Location:** `config/db.js`

### 2. Authentication Flow
```javascript
// 1. Register → Hash password → Create user → Return JWT
// 2. Login → Verify email → Compare password → Return JWT
// 3. Protected routes → Verify Bearer token → Extract user ID
```

### 3. AI Summarization
- Uses Hugging Face `facebook/bart-large-cnn` model
- Automatically triggered when creating notes
- Graceful error handling (returns empty if API fails)
- **Location:** `utils/ai.js`

### 4. Error Handling
- Validation errors (400)
- Authentication errors (401)
- Server errors (500) with message logging
- No sensitive data exposed to client

---

## 🧪 Testing with Postman/REST Client

### 1. Register User
```
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "name": "John Student",
  "email": "john@example.com",
  "password": "Password123!"
}
```

### 2. Login
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123!"
}
```
*Save the returned token*

### 3. Create Note (with token)
```
POST http://localhost:5000/api/notes
Authorization: Bearer <your_token_here>
Content-Type: application/json

{
  "title": "Physics Notes",
  "transcript": "Newton's laws of motion describe how objects move...",
  "importantTopics": ["First Law", "Inertia"]
}
```

### 4. Get Notes
```
GET http://localhost:5000/api/notes
Authorization: Bearer <your_token_here>
```

---

## 📊 Database Models

### User
```javascript
{
  name: String (required),
  email: String (unique, required),
  password: String (hashed, required),
  createdAt: Date,
  updatedAt: Date
}
```

### Note
```javascript
{
  user: ObjectId (ref: User),
  title: String,
  transcript: String,
  summary: String (auto-generated),
  importantTopics: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Focus
```javascript
{
  user: ObjectId (ref: User, required),
  focusScore: Number (0-100, required),
  distractions: [String],
  createdAt: Date,
  updatedAt: Date
}
```

### Attendance
```javascript
{
  user: ObjectId (ref: User, required),
  subject: String (required),
  status: String (Present/Absent/Late, default: Present),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
**Error:** `querySrv ECONNREFUSED _mongodb._tcp.cluster0...`
**Solution:** Already fixed! DNS servers are automatically configured to use Google's 8.8.8.8

### AI Summarization Not Working
**Error:** Blank summary field
**Check:**
- Hugging Face API key is valid in `.env`
- Transcript text is long enough (minimum ~50 words)
- Network request completes (may be slow on first request)

### JWT Token Invalid
**Error:** `Invalid or expired token`
**Check:**
- Token is included in Authorization header: `Bearer <token>`
- Token hasn't expired (7-day expiration)
- JWT_SECRET matches between registration and verification

### CORS Errors
**Error:** `Access to XMLHttpRequest blocked by CORS policy`
**Solution:** CORS is enabled for all origins in `app.js`
- Update `cors()` settings if deploying to specific domain

---

## 🚀 Production Deployment

### Before Deploying:

1. **Update Environment Variables:**
```env
JWT_SECRET=generate-strong-random-key
NODE_TLS_REJECT_UNAUTHORIZED=1
NODE_ENV=production
```

2. **Optimize MongoDB:**
- Create indexes on frequently queried fields
- Monitor connection pool size
- Enable read replicas for high load

3. **API Rate Limiting:**
Consider adding `express-rate-limit`:
```bash
npm install express-rate-limit
```

4. **Logging & Monitoring:**
- Use services like Sentry for error tracking
- Set up CloudWatch or similar for logs
- Monitor MongoDB Atlas metrics

5. **CORS Configuration:**
Update for your frontend domain:
```javascript
app.use(cors({
  origin: 'https://your-frontend-domain.com'
}));
```

---

## 📝 Final Checklist for Final Year Project

- ✅ Secure authentication system
- ✅ Database integration (MongoDB)
- ✅ AI/ML integration (Hugging Face)
- ✅ RESTful API design
- ✅ Error handling
- ✅ Environment configuration
- ✅ Code documentation
- ⏳ Frontend integration (Next step)
- ⏳ Testing & deployment (After frontend)

---

## 🎓 Learning Outcomes

This backend project demonstrates:
- RESTful API design principles
- Database schema design and relationships
- Authentication & authorization patterns
- Error handling and validation
- Third-party API integration
- Security best practices
- Code organization and modularity

---

## 📞 Support

For issues or questions:
1. Check `API_DOCUMENTATION.md` for endpoint details
2. Review error messages in server logs
3. Verify `.env` file is properly configured
4. Test endpoints with Postman first

---

**Backend Status:** ✅ Production-Ready
**Created:** May 29, 2026
**Version:** 1.0.0
