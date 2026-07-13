const http = require("http");

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
function getRequest(path) {
  return new Promise((resolve, reject) => {
    http.get(BACKEND_URL + path, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(raw));
        } catch (err) {
          reject(err);
        }
      });
    }).on("error", reject);
  });
}

function postRequest(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const req = http.request(
      BACKEND_URL + path,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(raw) });
          } catch {
            resolve({ status: res.statusCode, body: raw });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function run() {
  console.log("Moodify — Duplicate Songs to Neutral Mood");
  console.log("──────────────────────────────────────────\n");

  // 1. Fetch all existing songs from the database
  const allSongsResponse = await getRequest("/api/admin/all");
  const allSongs = allSongsResponse.songs || [];

  // 2. Filter out songs that are already tagged as "neutral"
  const nonNeutralSongs = allSongs.filter((song) => song.mood !== "neutral");

  console.log(`Total songs in database: ${allSongs.length}`);
  console.log(`Non-neutral songs to duplicate: ${nonNeutralSongs.length}\n`);

  if (nonNeutralSongs.length === 0) {
    console.log("Nothing to duplicate. Exiting.");
    return;
  }

  // 3. Build new entries with mood = "neutral" (reuses existing ImageKit URLs)
  const neutralCopies = nonNeutralSongs.map((song) => ({
    title: song.title,
    artist: song.artist,
    url: song.url,
    posterUrl: song.posterUrl,
    mood: "neutral",
  }));

  // 4. Batch insert into the database
  const result = await postRequest("/api/admin/batch", neutralCopies);

  if (result.status === 201) {
    console.log(`Successfully added ${result.body.count} songs to neutral mood.`);
    console.log("Done. Neutral mood now contains the original songs plus a copy of every other mood.");
  } else {
    console.error("Failed:", result.status, result.body);
  }
}

run();