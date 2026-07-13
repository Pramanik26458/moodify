const mongoose = require("mongoose");

function connectToDB() {
    mongoose
        .connect(process.env.MONGO_URI)
        .then(() => {
            console.log("✅ Connected to MongoDB");
        })
        .catch((error) => {
            console.error("❌ Database Connection Error:", error.message);
            process.exit(1);
        });
}

module.exports = connectToDB;