const cors = require("cors");
const express = require("express");
const cookieParser = require("cookie-parser");

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Models
require("./models/users.model");
require("./models/song.model");

// Routes
const authRoutes = require("./routes/auth.routes");
const songRoutes = require("./routes/song.routes");
const adminRoutes = require("./routes/admin.routes");

app.use("/api/auth", authRoutes);
app.use("/api/songs", songRoutes);
app.use("/api/admin", adminRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;