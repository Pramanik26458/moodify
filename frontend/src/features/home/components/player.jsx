import { useEffect, useRef, useState, useCallback, useContext } from "react";
import { songContext } from "../song.context";
import "./player.scss";

const FALLBACK = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&q=80";
const fmt = (t) => {
  if (!t || isNaN(t)) return "0:00";
  const m = Math.floor(t / 60), s = Math.floor(t % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

// Player now accepts songs[] and song from context so Next/Prev actually work
const Player = ({ song, songs = [] }) => {
  const { setSong } = useContext(songContext);
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [curTime, setCurTime] = useState(0);
  const [dur,     setDur]     = useState(0);
  const [vol,     setVol]     = useState(0.85);
  const [speed,   setSpeed]   = useState(1);
  const [imgErr,  setImgErr]  = useState(false);

  // Current index in queue
  const currentIdx = songs.findIndex(s => s.url === song?.url);

  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    const onTime = () => setCurTime(a.currentTime);
    const onMeta = () => setDur(a.duration || 0);
    const onEnd  = () => {
      setPlaying(false);
      // Auto-advance to next song
      if (songs.length > 1) {
        const next = songs[(currentIdx + 1) % songs.length];
        if (next) setSong(next);
      }
    };
    a.addEventListener("timeupdate",     onTime);
    a.addEventListener("loadedmetadata", onMeta);
    a.addEventListener("durationchange", onMeta);
    a.addEventListener("ended",          onEnd);
    return () => {
      a.removeEventListener("timeupdate",     onTime);
      a.removeEventListener("loadedmetadata", onMeta);
      a.removeEventListener("durationchange", onMeta);
      a.removeEventListener("ended",          onEnd);
    };
  }, [currentIdx, songs, setSong]);

  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    setCurTime(0); setDur(0); setPlaying(false); setImgErr(false);
    a.pause(); a.load();
  }, [song?.url]);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = vol; }, [vol]);
  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = speed; }, [speed]);

  const togglePlay = useCallback(async () => {
    const a = audioRef.current; if (!a) return;
    try {
      if (playing) { a.pause(); setPlaying(false); }
      else { await a.play(); setPlaying(true); }
    } catch (e) { console.error(e); }
  }, [playing]);

  // Skip forward/backward by seconds (not next track)
  const seek = useCallback((s) => {
    const a = audioRef.current; if (!a) return;
    a.currentTime = Math.max(0, Math.min(a.currentTime + s, dur));
  }, [dur]);

  // Jump to prev / next track in queue
  const prevTrack = useCallback(() => {
    if (!songs.length) return;
    const idx = (currentIdx - 1 + songs.length) % songs.length;
    setSong(songs[idx]);
  }, [songs, currentIdx, setSong]);

  const nextTrack = useCallback(() => {
    if (!songs.length) return;
    const idx = (currentIdx + 1) % songs.length;
    setSong(songs[idx]);
  }, [songs, currentIdx, setSong]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName)) return;
      if (e.code === "Space")       { e.preventDefault(); togglePlay(); }
      if (e.code === "ArrowRight")  { e.preventDefault(); seek(10); }
      if (e.code === "ArrowLeft")   { e.preventDefault(); seek(-10); }
      if (e.code === "ArrowUp")     { e.preventDefault(); setVol(v => Math.min(v + .1, 1)); }
      if (e.code === "ArrowDown")   { e.preventDefault(); setVol(v => Math.max(v - .1, 0)); }
      if (e.code === "KeyN")        { e.preventDefault(); nextTrack(); }
      if (e.code === "KeyP")        { e.preventDefault(); prevTrack(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, seek, nextTrack, prevTrack]);

  if (!song) return (
    <div className="player-wrap" style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
      No song selected
    </div>
  );

  const progress = dur > 0 ? (curTime / dur) * 100 : 0;
  const poster   = imgErr || !song.posterUrl ? FALLBACK : song.posterUrl;
  const hasPrev  = songs.length > 1;
  const hasNext  = songs.length > 1;

  return (
    <div className="player-wrap">
      <div className="pw-top-glow" />
      <audio ref={audioRef} src={song.url} preload="metadata" />

      <div className="pw-hero">
        <div className={`pw-poster ${playing ? "spin" : ""}`}>
          <img src={poster} alt={song.title || "Cover"} onError={() => setImgErr(true)} />
          <div className="poster-hover" onClick={togglePlay}>{playing ? "⏸" : "▶"}</div>
        </div>
        <div className="pw-meta">
          <span className="pw-badge">🎵 {song.mood || "mixed"}</span>
          <h2 className="pw-title">{song.title || "Unknown Song"}</h2>
          <p className="pw-artist">{song.artist || "Unknown Artist"}</p>
          {songs.length > 1 && (
            <p className="pw-queue-pos">
              {currentIdx + 1} / {songs.length} in queue
            </p>
          )}
        </div>
      </div>

      <div className="pw-controls">
        {/* Seek bar */}
        <div className="pw-seek">
          <span className="ts">{fmt(curTime)}</span>
          <div className="seek-rail">
            <input
              type="range" min={0} max={dur || 0} step={0.1} value={curTime}
              onChange={(e) => {
                const t = +e.target.value;
                if (audioRef.current) audioRef.current.currentTime = t;
                setCurTime(t);
              }}
            />
            <div className="rail-bg">
              <div className="rail-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <span className="ts">{fmt(dur)}</span>
        </div>

        {/* Control buttons */}
        <div className="pw-btn-row">
          {/* ⏮ PREV TRACK — jumps to previous song in queue */}
          <button
            className={`pw-ctrl pw-track-btn ${!hasPrev ? "disabled" : ""}`}
            onClick={prevTrack}
            title="Previous song (P)"
            disabled={!hasPrev}
          >
            ⏮
          </button>

          {/* ‹‹ SEEK −10s */}
          <button className="pw-ctrl" onClick={() => seek(-10)} title="Rewind 10s">
            −10
          </button>

          {/* ▶ PLAY/PAUSE */}
          <button
            className={`pw-play ${playing ? "playing" : ""}`}
            onClick={togglePlay}
            title="Play/Pause (Space)"
          >
            {playing ? "⏸" : "▶"}
          </button>

          {/* ›› SEEK +10s */}
          <button className="pw-ctrl" onClick={() => seek(10)} title="Forward 10s">
            +10
          </button>

          {/* ⏭ NEXT TRACK — jumps to next song in queue */}
          <button
            className={`pw-ctrl pw-track-btn ${!hasNext ? "disabled" : ""}`}
            onClick={nextTrack}
            title="Next song (N)"
            disabled={!hasNext}
          >
            ⏭
          </button>
        </div>

        {/* Volume + Speed */}
        <div className="pw-secondary">
          <div className="pw-vol">
            <span className="vol-ico">{vol === 0 ? "🔇" : vol < .5 ? "🔉" : "🔊"}</span>
            <div className="vol-rail">
              <input
                type="range" min={0} max={1} step={.02} value={vol}
                onChange={(e) => setVol(+e.target.value)}
              />
              <div className="vr-bg">
                <div className="vr-fill" style={{ width: `${vol * 100}%` }} />
              </div>
            </div>
          </div>
          <select className="pw-speed" value={speed} onChange={(e) => setSpeed(+e.target.value)}>
            {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => (
              <option key={s} value={s}>{s}x</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default Player;
