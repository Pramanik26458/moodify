const cors = require("cors");
const express = require("express");
const cookieParser = require("cookie-parser");

// ================= APP =================

const app = express();

// ================= MIDDLEWARE =================

const allowedOrigins = [
  "http://localhost:5173", 
  process.env.FRONTEND_URL
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, or server-to-server requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ================= MODELS (preload so Mongoose registers them) =================
require("./models/users.model");   // ← ADD THIS LINE
require("./models/song.model");    // ← ADD THIS LINE

// ================= ROUTES =================

const authRoutes = require("./routes/auth.routes");
const songRoutes = require("./routes/song.routes");
const adminRoutes = require("./routes/admin.routes");

app.use("/api/auth", authRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/admin", adminRoutes);

// ================= ERROR HANDLER =================

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err : {}
  });
});

// ================= 404 HANDLER =================

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found"
  });
});

module.exports = app;