const songModel = require("../models/song.model");
const id3 = require("node-id3");
const { uploadFile } = require("../service/storage.service");

const DEFAULT_POSTER_URL = "https://ik.imagekit.io/demo/default-music-cover.jpg"; // replace with any placeholder you like

async function uploadSong(req, res) {
  console.log("[uploadSong] request received, mood:", req.body?.mood, "file:", req.file?.originalname);
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const songBuffer = req.file.buffer;
    const { mood } = req.body;

    if (!mood) {
      return res.status(400).json({ success: false, message: "Mood is required" });
    }

    const tags = id3.read(req.file.buffer);
    const artist = tags?.artist || tags?.TPE1 || "Unknown Artist";
    const title = tags?.title || req.file.originalname || "Untitled";
    const hasEmbeddedImage = !!tags?.image?.imageBuffer?.length;

    console.log("[uploadSong] uploading to ImageKit...", { hasEmbeddedImage });

    const uploadJobs = [
      uploadFile({ buffer: songBuffer, filename: title + ".mp3", folder: "/Moodify/songs" })
    ];

    if (hasEmbeddedImage) {
      uploadJobs.push(
        uploadFile({ buffer: tags.image.imageBuffer, filename: title + ".jpeg", folder: "/Moodify/poster" })
      );
    }

    const [songFile, posterFile] = await Promise.all(uploadJobs);
    const posterUrl = hasEmbeddedImage ? posterFile.url : DEFAULT_POSTER_URL;

    console.log("[uploadSong] ImageKit upload complete", { songUrl: songFile.url, posterUrl });

    const song = await songModel.create({ title, artist, url: songFile.url, posterUrl, mood });
    console.log("[uploadSong] saved to MongoDB");

    return res.status(201).json({ success: true, message: "Song created successfully", song });
  } catch (error) {
    console.error("[uploadSong] Error:", error);
    return res.status(500).json({ success: false, message: "Error uploading song", error: error.message });
  }
}

async function getSong(req, res) {
  try {
    const { mood } = req.query;
    const query = {};
    if (mood) query.mood = mood.toLowerCase().trim();

    const songs = await songModel.find(query);
    return res.status(200).json({ success: true, message: "Songs fetched successfully", songs: songs || [] });
  } catch (error) {
    console.error("[getSong] Error:", error);
    return res.status(500).json({ success: false, message: "Error fetching songs", error: error.message });
  }
}

module.exports = { uploadSong, getSong };