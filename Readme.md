# 🎵 Moodify

AI-powered music recommendation platform that detects your emotion through your webcam and plays songs that match your mood — no manual searching, no playlists to scroll through.

**Live app:** [moodify-basak.vercel.app](https://moodify-basak.vercel.app/)
**Repo:** [github.com/Pramanik26458/moodify](https://github.com/Pramanik26458/moodify)

---

## ✨ What it does

Moodify uses your webcam and on-device face-landmark detection to read your facial expression in real time, classifies it into a mood (happy, sad, romantic, surprised, angry, fearful, or neutral), and then fetches a matching playlist from the backend for you to play instantly.

- **Camera-based mood detection** — a guided 5-step flow (camera init → face alignment → live detection → confirmation countdown → done) built on Google's MediaPipe Face Landmarker, running fully in the browser.
- **Stability smoothing** — a rolling 8-frame window requires the same emotion to be detected consistently for ~3 seconds before it's confirmed, so a stray blink or smirk won't misfire.
- **Mood-based music playback** — once your mood is confirmed, Moodify pulls songs tagged with that mood from MongoDB and plays them.
- **Authentication** — JWT-based register/login/logout with protected routes on the frontend.
- **Admin utilities** — endpoints for batch-uploading songs, viewing live stats (total songs/users, breakdown by mood), and clearing the song library.

## 🧠 How mood detection works

There's no external emotion-recognition API involved — Moodify computes emotion itself from facial geometry:

1. MediaPipe's `FaceLandmarker` extracts 478 3D facial landmarks from the live video feed.
2. Custom logic measures distances between key points (mouth corners, eyes, eyebrows, cheeks) to derive signals like smile curvature, mouth openness, eye/brow elevation, and cheek compression.
3. Those signals are scored into candidate emotions (happy, sad, romantic, surprised), each with a confidence value.
4. An `EmotionSmoother` keeps a rolling history of recent frames and only accepts an emotion once it dominates the recent window — filtering out noise before it's confirmed.

## 🏗️ Tech stack

**Frontend** (`/frontend`)
- React 19 + Vite
- React Router v7
- `@mediapipe/tasks-vision` for face landmark detection
- Axios for API calls, React Toastify for notifications
- SCSS for styling

**Backend** (`/backend`)
- Node.js + Express 5
- MongoDB with Mongoose
- Redis (via `ioredis`) for caching
- JWT (`jsonwebtoken`) + `bcryptjs` for authentication
- Multer for file uploads, `node-id3` to read metadata (title/artist/embedded artwork) from uploaded MP3s
- ImageKit (`@imagekit/nodejs`) for storing/serving song files and cover art

## 📁 Project structure
moodify/
├── backend/
│ ├── server.js # Entry point
│ └── src/
│ ├── app.js # Express app setup, route mounting
│ ├── config/ # MongoDB + Redis connections
│ ├── controllers/ # auth & song business logic
│ ├── middlewares/ # auth guard, file upload handling
│ ├── models/ # Mongoose schemas (users, songs)
│ ├── routes/ # /api/auth, /api/songs, /api/admin
│ └── service/ # ImageKit storage service
├── frontend/
│ └── src/
│ ├── app.routes.jsx # App routes
│ └── features/
│ ├── landing/ # Landing page
│ ├── auth/ # Login/Register + auth context
│ ├── Expression/ # Webcam mood detection component
│ ├── home/ # Song playback UI
│ └── shared/ # Shared components/styles
├── uploadSongs.js # Script to batch upload a local song library
└── duplicateToNeutral.js # Script to duplicate songs into the "neutral" mood


## 🔌 API overview

| Method | Endpoint                        | Description                              |
|--------|----------------------------------|-------------------------------------------|
| POST   | `/api/auth/register`            | Create a new account                      |
| POST   | `/api/auth/login`               | Log in, sets auth cookie                  |
| POST   | `/api/auth/logout`              | Log out                                   |
| GET    | `/api/auth/get-me`              | Get current user (protected)              |
| GET    | `/api/songs`                    | Get songs, optionally filtered by `?mood=` |
| POST   | `/api/songs`                    | Upload a song file (reads ID3 tags)       |
| GET    | `/api/admin/stats`              | Live counts of songs, users, moods        |
| GET    | `/api/admin/all`                | Get every song                            |
| GET    | `/api/admin/by-mood/:mood`      | Get songs for a specific mood             |
| POST   | `/api/admin/batch`              | Batch-insert songs                        |
| DELETE | `/api/admin/delete-all`         | Delete all songs                          |

## 🚀 Getting started

### Prerequisites
- Node.js
- A MongoDB database (e.g. MongoDB Atlas)
- A Redis instance
- An ImageKit account (for song/image storage)

### 1. Clone the repo
```bash
git clone https://github.com/Pramanik26458/moodify.git
cd moodify
```

### 2. Backend setup
```bash
cd backend
npm install
```

Create a `.env` file in `backend/`:
```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
REDIS_HOST=your_redis_host
REDIS_PORT=your_redis_port
REDIS_PASSWORD=your_redis_password
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint
```

Run it:
```bash
npm run dev     # nodemon
# or
npm start
```

### 3. Frontend setup
```bash
cd frontend
npm install
```

Create a `.env` (or `.env.local`) file in `frontend/`:
```env
VITE_API_URL=http://localhost:3000
```

Run it:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173` by default.

## 📷 Using it

1. Register or log in.
2. On the home page, click **Start Detection** and allow camera access.
3. Align your face inside the guide oval.
4. Hold your expression steady — Moodify confirms your mood after ~3 seconds of consistent detection.
5. Matching songs load automatically and you can start playing.

## 📝 Notes

- Face landmark detection and mood classification run entirely client-side in the browser (via MediaPipe + WebAssembly) — no image or video is sent to the server for emotion detection.
- `uploadSongs.js` and `duplicateToNeutral.js` at the repo root are standalone maintenance scripts for seeding/managing the song library and are not part of the running app.


