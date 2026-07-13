const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    posterUrl: {
        type: String,
        required: true,
    },
    title: {
        type: String,
        required: true
    },
    mood: {
        type: String,
        enum: {
            values: [ "sad", "happy", "surprised", "romantic", "neutral", "angry", "fear"],
            message: "Enum this is"
        }
    },
    artist: {
        type: String,
        default: "Unknown Artist"
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
})

const songModel = mongoose.model("songs", songSchema)

module.exports = songModel