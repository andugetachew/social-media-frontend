
## ✅ Frontend README – `social-media-frontend/README.md`

```markdown
# Social Media Frontend

A modern, responsive React frontend for the Social Media API – featuring real-time feed, WebSocket chat, file/image upload, and Tailwind CSS.

## 🚀 Features

- **Authentication** – Register, login, JWT token refresh
- **Feed** – Create, edit, delete posts, infinite scroll
- **Social Actions** – Like, comment, follow/unfollow
- **User Profiles** – View profiles, follower/following counts
- **Real-time Chat** – WebSocket chat with typing indicator
- **File Upload** – Send images (preview) and documents (PDF, Word, PPT)
- **Settings** – Update profile, change password, upload profile picture
- **Search** – Search users by username
- **Responsive** – Mobile-friendly Tailwind CSS

## 🛠 Tech Stack

- React 18 + Vite
- Tailwind CSS
- Axios
- React Router v6
- WebSocket API

## 📦 Installation

```bash
git clone https://github.com/andugetachew/social-media-frontend.git
cd social-media-frontend
npm install
npm run dev
🔗 Environment Variables
Create .env:

text
VITE_API_URL=http://127.0.0.1:8000/api
📁 Project Structure
text
src/
├── pages/
│   ├── Login.jsx
│   ├── Register.jsx
│   ├── Feed.jsx
│   ├── Profile.jsx
│   ├── Chat.jsx
│   └── Settings.jsx
├── components/
│   └── SearchBar.jsx
├── context/
│   └── AuthContext.jsx
├── services/
│   └── api.js
├── App.jsx
└── main.jsx
📄 License
MIT

👨‍💻 Author
Andu Getachew

GitHub: @andugetachew

text

---

**Add these READMEs to your repositories and push.** 🚀
