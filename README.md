# 🎓 CampusConnect

A full-stack campus social media platform combining features of Instagram, WhatsApp, and LinkedIn — built for colleges and institutions.

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Backend | Node.js + Express |
| Database | MongoDB (local) |
| Real-time | Socket.IO |
| Auth | JWT + bcryptjs |
| Styling | Custom CSS (no UI libraries) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally on port 27017

### 1. Start MongoDB
```bash
mongod
```

### 2. Setup Backend
```bash
cd backend
npm install
npm run dev
# Runs on http://localhost:5000
```

### 3. Setup Frontend
```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000
```

---

## 👥 Roles & Permissions

| Role | Can Post | Can Tag Roles | Can Pin |
|------|----------|---------------|---------|
| Student | ✅ Public | ❌ | ❌ |
| Club Member | ✅ Public + Role-based | ✅ | ❌ |
| Asst. Professor | ✅ | ✅ | ❌ |
| Professor | ✅ | ✅ | ❌ |
| HoD | ✅ | ✅ | ✅ |
| Principal | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ |

---

## 📱 Features

### 🌐 Public Feed
- Post announcements, events, notices, achievements
- Like and comment on posts
- Filter by category
- Pinned posts from HoD/Principal

### 🔒 Targeted Messaging (Role-based)
- Post visible only to specific roles (e.g., only students, only professors)
- Private posts for individuals

### 💬 Real-time Direct Messages
- 1-on-1 private chat powered by Socket.IO
- Message history
- Online status indicators

### 👥 Directory
- Browse all campus members
- Filter by role and department
- Direct message from directory

### 📢 Announcements Board
- Separate view for official announcements, events, notices

### 🌙 Dark / Light Mode
- System-aware with manual toggle

### 📱 Responsive
- Full mobile, tablet, and desktop support

---

## 🗂️ Project Structure

```
campusconnect/
├── backend/
│   ├── models/          # Mongoose schemas
│   │   ├── User.js
│   │   ├── Post.js
│   │   ├── Message.js
│   │   └── Notification.js
│   ├── routes/          # Express routers
│   │   ├── auth.js
│   │   ├── posts.js
│   │   ├── messages.js
│   │   ├── users.js
│   │   └── notifications.js
│   ├── middleware/
│   │   └── auth.js      # JWT middleware
│   ├── uploads/         # Media files (auto-created)
│   ├── server.js
│   └── .env
│
└── frontend/
    ├── public/
    │   └── index.html
    └── src/
        ├── components/
        │   ├── Layout.js
        │   └── CreatePostModal.js
        ├── context/
        │   ├── AuthContext.js
        │   ├── ThemeContext.js
        │   └── SocketContext.js
        ├── pages/
        │   ├── Login.js
        │   ├── Register.js
        │   ├── Feed.js
        │   ├── Messages.js
        │   ├── Notifications.js
        │   ├── Profile.js
        │   ├── Directory.js
        │   └── Announcements.js
        ├── styles/
        │   └── global.css
        └── utils/
            ├── api.js
            └── helpers.js
```

---

## 🔧 Environment Variables

### Backend `.env`
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/campusconnect
JWT_SECRET=your_secret_key_here
CLIENT_URL=http://localhost:3000
```

---

## 🔌 API Endpoints

### Auth
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user

### Posts
- `GET /api/posts/feed` — Get feed
- `POST /api/posts` — Create post
- `POST /api/posts/:id/like` — Like/unlike
- `POST /api/posts/:id/comment` — Comment
- `DELETE /api/posts/:id` — Delete

### Messages
- `GET /api/messages/recent` — Recent chats
- `GET /api/messages/conversation/:userId` — Get conversation
- `POST /api/messages/send` — Send message

### Users
- `GET /api/users/search` — Search users
- `GET /api/users/:id` — Get user
- `PATCH /api/users/profile` — Update profile

### Notifications
- `GET /api/notifications` — Get all
- `PATCH /api/notifications/read-all` — Mark all read

---

## 💡 Customization for Other Organizations

This platform can be adapted for any organization by:

1. **Editing roles** in `frontend/src/utils/helpers.js` and `backend/models/User.js`
2. **Adding departments** in `helpers.js`
3. **Customizing categories** for posts
4. **Branding** in `global.css` CSS variables

---

## 🔮 Future Enhancements

- [ ] Push notifications
- [ ] Group chats
- [ ] File/document sharing
- [ ] Event RSVP system
- [ ] Timetable integration
- [ ] Admin dashboard with analytics
- [ ] Email verification
- [ ] Video calls
