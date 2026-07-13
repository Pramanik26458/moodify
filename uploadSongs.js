const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https"); // Added to support production 'https' links

// 1. DYNAMIC ENVIRONMENT VARIABLE FOR PRODUCTION
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";

// Points to music folder
const MUSIC_FOLDER = "./music";

// Folder names must match these exactly
const VALID_MOODS = ["angry", "fear", "happy", "neutral", "romantic", "sad", "surprised"];

function uploadSong(fileBuffer, filename, mood) {
  return new Promise((resolve, reject) => {
    const boundary = "----FormBoundary" + Date.now() + Math.random().toString(36).slice(2);
    const CRLF = "\r\n";

    const metaPart =
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="mood"${CRLF}${CRLF}` +
      `${mood}${CRLF}`;

    const filePart =
      `--${boundary}${CRLF}` +
      `Content-Disposition: form-data; name="song"; filename="${filename}"${CRLF}` +
      `Content-Type: audio/mpeg${CRLF}${CRLF}`;

    const closing = `${CRLF}--${boundary}--${CRLF}`;

    const body = Buffer.concat([
      Buffer.from(metaPart),
      Buffer.from(filePart),
      fileBuffer,
      Buffer.from(closing),
    ]);

    // 2. PARSE THE TARGET URL DYNAMICALLY
    const targetUrl = new URL(BACKEND_URL);
    const isHttps = targetUrl.protocol === "https:";
    const requester = isHttps ? https : http;

    const options = {
      hostname: targetUrl.hostname,
      port: targetUrl.port || (isHttps ? 443 : 80),
      path: "/api/songs",
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": body.length,
      },
    };

    const req = requester.request(options, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  console.log("🎵 Moodify Local Upload Script");
  console.log("──────────────────────────────────\n");
  console.log(`Targeting Server: ${BACKEND_URL}\n`);

  if (!fs.existsSync(MUSIC_FOLDER)) {
    console.error(`❌ music folder not found at: ${MUSIC_FOLDER}`);
    console.log("💡 Make sure your music folder is in the project root");
    return;
  }

  let totalSuccess = 0;
  let totalFailed = 0;

  for (const mood of VALID_MOODS) {
    const moodFolder = path.join(MUSIC_FOLDER, mood);

    if (!fs.existsSync(moodFolder)) {
      console.log(`⚠️  Skipping — folder not found: music/${mood}`);
      continue;
    }

    const files = fs.readdirSync(moodFolder).filter(f =>
      f.toLowerCase().endsWith(".mp3") ||
      f.toLowerCase().endsWith(".wav") ||
      f.toLowerCase().endsWith(".ogg")
    );

    if (files.length === 0) {
      console.log(`⚠️  No audio files in music/${mood}`);
      continue;
    }

    console.log(`📁 music/${mood} — ${files.length} file(s)`);

    for (const file of files) {
      const filePath = path.join(moodFolder, file);
      process.stdout.write(`   ↳ ${file.slice(0, 50)}... `);

      try {
        const fileBuffer = fs.readFileSync(filePath);
        const result = await uploadSong(fileBuffer, file, mood);

        if (result.status === 201) {
          console.log("✅");
          totalSuccess++;
        } else {
          console.log(`❌ (${result.status}) ${result.body?.message || JSON.stringify(result.body)}`);
          totalFailed++;
        }
      } catch (err) {
        console.log(`❌ ${err.message}`);
        totalFailed++;
      }
    }

    console.log("");
  }

  console.log("──────────────────────────────────");
  console.log(`✅ Uploaded: ${totalSuccess}`);
  if (totalFailed > 0) console.log(`❌ Failed:   ${totalFailed}`);
  console.log("🎉 Done! All songs processing complete.");
}

run();