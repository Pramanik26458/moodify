const express = require("express");
const router = express.Router();
const songModel = require("../models/song.model");
const userModel = require("../models/users.model");

// ================================
// STATS — used by landing page
// Returns live counts from MongoDB
// ================================
router.get("/stats", async (req, res) => {
  try {
    const [totalSongs, totalUsers, moodCounts] = await Promise.all([
      songModel.countDocuments(),
      userModel.countDocuments(),
      songModel.aggregate([
        { $group: { _id: "$mood", count: { $sum: 1 } } }
      ])
    ]);

    return res.status(200).json({
      success: true,
      totalSongs,
      totalUsers,
      moodCategories: moodCounts.length,
      byMood: Object.fromEntries(moodCounts.map(m => [m._id, m.count]))
    });
  } catch (error) {
    console.error("[stats] Error:", error);
    return res.status(500).json({ success: false, message: "Error fetching stats", error: error.message });
  }
});

// ================================
// BATCH UPLOAD ENDPOINT
// ================================
router.post("/batch", async (req, res) => {
  try {
    const songs = req.body;

    if (!Array.isArray(songs)) {
      return res.status(400).json({ message: "Expected array of songs" });
    }

    const validSongs = songs.filter((song) => {
      if (!song.title || !song.url || !song.posterUrl || !song.mood) {
        console.warn("Skipping invalid song:", song);
        return false;
      }
      return true;
    });

    if (validSongs.length === 0) {
      return res.status(400).json({ message: "No valid songs provided" });
    }

    const createdSongs = await songModel.insertMany(validSongs);
    console.log(`✅ Inserted ${createdSongs.length} songs into database`);

    res.status(201).json({
      message: `Successfully added ${createdSongs.length} songs`,
      count: createdSongs.length,
      songs: createdSongs,
    });
  } catch (error) {
    console.error("Error batch uploading songs:", error);
    res.status(500).json({ message: "Error batch uploading songs", error: error.message });
  }
});

// ================================
// GET ALL SONGS
// ================================
router.get("/all", async (req, res) => {
  try {
    const songs = await songModel.find({});
    res.status(200).json({ message: "All songs fetched", total: songs.length, songs });
  } catch (error) {
    res.status(500).json({ message: "Error fetching songs", error: error.message });
  }
});

// ================================
// GET BY MOOD
// ================================
router.get("/by-mood/:mood", async (req, res) => {
  try {
    const songs = await songModel.find({ mood: req.params.mood });
    res.status(200).json({ mood: req.params.mood, count: songs.length, songs });
  } catch (error) {
    res.status(500).json({ message: "Error fetching songs by mood", error: error.message });
  }
});

// ================================
// DELETE ALL SONGS
// ================================
router.delete("/delete-all", async (req, res) => {
  try {
    const result = await songModel.deleteMany({});
    res.status(200).json({ message: "All songs deleted", deletedCount: result.deletedCount });
  } catch (error) {
    res.status(500).json({ message: "Error deleting songs", error: error.message });
  }
});

module.exports = router;