# Social Media Frontend

A modern, responsive React frontend for the Social Media API – featuring real-time feed, WebSocket chat, file/image upload, and Tailwind CSS.

## 🚀 Features

### Authentication
- User registration with validation
- JWT login with token refresh
- Protected routes
- Forgot password flow

### Feed & Posts
- Create, edit, delete posts
- Like/unlike posts with real‑time counts
- Comment on posts with delete option
- Image upload with preview
- Infinite scroll (load more)
- Search users

### Social Features
- Follow/unfollow users
- View follower/following counts
- Personalized feed (posts from followed users)
- User profile pages

### Real‑time Chat (Telegram‑like)
- **WebSocket Chat** – Instant messaging
- **Online/Offline Status** – Green dot + last seen
- **Typing Indicator** – Shows when the other user is typing
- **Edit & Delete Messages** – Only your own messages
- **Image Upload** – Send images with thumbnail preview
- **File Upload** – Send PDF, Word, PowerPoint, text files
- **Separate Buttons** – 🖼️ for images, 📎 for documents
- **Message History** – Persistent storage

### Settings
- Change username, email, bio
- Update profile picture
- Change password
- Delete account

### UI/UX
- Modern, clean design with Tailwind CSS
- Mobile responsive
- Loading states
- Error handling with user feedback
- Auto‑scroll to newest message

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| HTTP Client | Axios |
| Routing | React Router v6 |
| Icons | React Icons |
| WebSocket | Native WebSocket API |
| State Management | React Context API |

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Backend API running on `http://127.0.0.1:8000`

### Setup

```bash
# Clone repository
git clone https://github.com/andugetachew/social-media-frontend.git
cd social-media-frontend

# Install dependencies
npm install

# Start development server
npm run dev
Build for Production
bash
npm run build
🎯 Environment Variables
Create .env file:

env
VITE_API_URL=http://127.0.0.1:8000/api
📁 Project Structure
text
social-media-frontend/
├── src/
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Feed.jsx
│   │   ├── Profile.jsx
│   │   ├── Chat.jsx
│   │   └── Settings.jsx
│   ├── components/
│   │   └── SearchBar.jsx
│   ├── context/
│   │   └── AuthContext.jsx
│   ├── services/
│   │   └── api.js
│   ├── App.jsx
│   └── main.jsx
├── public/
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
🔗 API Integration
Feature	API Endpoint
Login	POST /api/auth/login/
Register	POST /api/auth/register/
Feed	GET /api/posts/feed/
Create Post	POST /api/posts/
Like Post	POST /api/posts/{id}/like/
Follow User	POST /api/interactions/follow/{id}/
Comments	GET/POST /api/comments/post/{id}/
Search	GET /api/auth/users/?search={query}
Chat WebSocket	ws://127.0.0.1:8000/ws/chat/{room_id}/
Upload File	POST /api/chat/upload/
📱 Responsive Design
The app is fully responsive and works on:

Desktop (1920x1080)

Tablet (768x1024)

Mobile (375x667)

🚀 Deployment
Deploy to Netlify
bash
# Build the project
npm run build

# Deploy dist folder to Netlify
# Or connect your GitHub repository to Netlify
Deploy to Vercel
bash
npm install -g vercel
vercel
📄 License
MIT License

👨‍💻 Author
Andu Getachew

GitHub: @andugetachew

⭐ Show Your Support
Give a ⭐️ if this project helped you!

text

---

## Step 4: Push README

```bash
cd c:\Users\HP\social-media-frontend
git add README.md
git commit -m "Add comprehensive README with all features"
git push
✅ Your Repositories:
Repository	URL
Backend	https://github.com/andugetachew/social-media-api
Frontend	https://github.com/andugetachew/social-media-frontend
