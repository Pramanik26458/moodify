import { useContext, useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import FaceExpression from "../../Expression/components/FcaeExpression";
import Player from "../components/player";
import { songContext } from "../song.context";
import useSongs from "../hooks/useSongs";
import { useAuth } from "../../auth/hooks/useAuth";
import "../style/home.scss";

const MOOD_CONFIG = {
  happy:     { emoji: "😊", label: "Happy",     color: "#F59E0B", glow: "rgba(245,158,11,0.25)",    gradient: "linear-gradient(135deg,#F59E0B,#FF6B35)", img: "https://images.unsplash.com/photo-1607827448387-a67db87c31d3?w=500&q=75", caption: "Sun's out, vibes up ☀️" },
  sad:       { emoji: "😢", label: "Sad",        color: "#60A5FA", glow: "rgba(96,165,250,0.22)",    gradient: "linear-gradient(135deg,#60A5FA,#3B82F6)", img: "https://images.unsplash.com/photo-1506806732259-39c2d0268443?w=500&q=75", caption: "Let the music hold you 🌧" },
  romantic:  { emoji: "😍", label: "Romantic",   color: "#FB7185", glow: "rgba(251,113,133,0.25)",   gradient: "linear-gradient(135deg,#FB7185,#EC4899)", img: "https://images.unsplash.com/photo-1518568403628-df55038b5e8d?w=500&q=75", caption: "Love is in the air 💕" },
  surprised: { emoji: "😲", label: "Surprised",  color: "#2DD4BF", glow: "rgba(45,212,191,0.22)",    gradient: "linear-gradient(135deg,#2DD4BF,#0891B2)", img: "https://images.unsplash.com/photo-1520171358405-46f2485923e7?w=500&q=75", caption: "Something just hit different ⚡" },
  neutral:   { emoji: "😐", label: "Neutral",    color: "#94A3B8", glow: "rgba(148,163,184,0.18)",   gradient: "linear-gradient(135deg,#94A3B8,#64748B)", img: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=75", caption: "Steady and centered 🎯" },
  angry:     { emoji: "😠", label: "Angry",      color: "#EF4444", glow: "rgba(239,68,68,0.25)",     gradient: "linear-gradient(135deg,#EF4444,#B91C1C)", img: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500&q=75", caption: "Channel that fire 🔥" },
  fearful:   { emoji: "😨", label: "Fearful",    color: "#A78BFA", glow: "rgba(167,139,250,0.22)",   gradient: "linear-gradient(135deg,#A78BFA,#7C3AED)", img: "https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?w=500&q=75", caption: "Music makes dark feel lighter 🌙" },
};

const FALLBACK_THUMB = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=80&q=60";

const Home = () => {
  const navigate = useNavigate();
  const { user, handleLogout } = useAuth();
  const { song, setSong } = useContext(songContext);
  const { songs, loading, handleGetSong } = useSongs();
  const [tab, setTab] = useState("detect");
  const [currentMood, setCurrentMood] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const cfg = MOOD_CONFIG[currentMood] || null;

  // When songs load, auto-select first and switch to player
  useEffect(() => {
    if (songs.length > 0) {
      setSong(songs[0]);
      setTab("player");
    }
  }, [songs]);

  // Close dropdown on outside click
  useEffect(() => {
    const h = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const onMoodDetected = (moodValue) => {
    setCurrentMood(moodValue);
    handleGetSong({ mood: moodValue });
  };

  const onLogout = async () => {
    setMenuOpen(false);
    const ok = await handleLogout();
    if (ok) navigate("/");
  };

  const avatarLetter = user?.username?.[0]?.toUpperCase() || "?";

  return (
    <div
      className="h-root"
      style={cfg ? {
        "--mood-color":  cfg.color,
        "--mood-glow":   cfg.glow,
        "--mood-grad":   cfg.gradient,
      } : {}}
    >
      {/* Ambient glow that reacts to mood */}
      <div className="h-ambient" />

      {/* ── NAV ── */}
      <nav className="h-nav">
        <div className="h-brand">
          <div className="h-brand-icon" style={ cfg ? { background: cfg.gradient } : {} }>🎵</div>
          <span className="h-brand-name">Moodify</span>
        </div>

        <div className="h-tabs">
          <button className={`h-tab ${tab === "detect" ? "active" : ""}`} onClick={() => setTab("detect")}>
            <span></span> Detect Mood
          </button>
          <button className={`h-tab ${tab === "player" ? "active" : ""}`} onClick={() => setTab("player")}>
             Player<span>🎵</span>
          </button>
        </div>

        <div ref={menuRef} className="h-user-wrap">
          <button className={`h-user-btn ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(o => !o)}>
            <div className="h-avatar" style={ cfg ? { background: cfg.gradient } : {} }>{avatarLetter}</div>
            <span className="h-uname">{user?.username}</span>
            <svg className="h-chevron" width="10" height="6" viewBox="0 0 10 6"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
          </button>
          {menuOpen && (
            <div className="h-dropdown">
              <div className="hd-top">
                <p className="hd-name">{user?.username}</p>
                <p className="hd-email">{user?.email}</p>
              </div>
              <button className="hd-logout" onClick={onLogout}>🚪 Sign out</button>
            </div>
          )}
        </div>
      </nav>

      {/* ── BODY ── */}
      <div className="h-body">

        {/* ── MAIN CONTENT ── */}
        <main className="h-main">

          {/* DETECT TAB */}
          {tab === "detect" && (
            <div className="detect-pane">
              <div className="detect-header">
                <h1 className="detect-title">Read your mood</h1>
                <p className="detect-sub">Face the camera — AI detects your emotion and curates a playlist instantly.</p>
              </div>

              {/* Mood face card — shows after detection */}
              {cfg && (
                <div className="mood-result-card" style={{ "--mc": cfg.color, "--mg": cfg.gradient }}>
                  <img key={currentMood} src={cfg.img} alt={cfg.label} className="mrc-img" />
                  <div className="mrc-body">
                    <span className="mrc-emoji">{cfg.emoji}</span>
                    <strong className="mrc-label">{cfg.label}</strong>
                    <p className="mrc-caption">{cfg.caption}</p>
                    <button className="mrc-listen" onClick={() => setTab("player")}>
                      Listen now →
                    </button>
                  </div>
                </div>
              )}

              <FaceExpression onClick={onMoodDetected} />
            </div>
          )}

          {/* PLAYER TAB */}
          {tab === "player" && (
            <div className="player-pane">
              <div className="player-pane-header">
                {cfg ? (
                  <>
                    <span className="pp-emoji">{cfg.emoji}</span>
                    <div>
                      <h1 className="pp-title">{cfg.label} Playlist</h1>
                      <p className="pp-sub">{cfg.caption}</p>
                    </div>
                  </>
                ) : (
                  <h1 className="pp-title">Your Player</h1>
                )}
              </div>

              {loading ? (
                <div className="h-loading">
                  <div className="h-spin" />
                  <p>Curating your {currentMood || "mood"} playlist…</p>
                </div>
              ) : song ? (
                <div className="h-player-layout">
                  {/* Pass songs[] so Next/Prev actually works */}
                  <Player song={song} songs={songs} />

                  {songs.length > 1 && (
                    <div className="h-queue">
                      <p className="q-heading">Queue · {songs.length} songs</p>
                      <div className="q-list">
                        {songs.map((s, i) => (
                          <button
                            key={i}
                            className={`q-row ${song?.url === s.url ? "active" : ""}`}
                            onClick={() => setSong(s)}
                          >
                            <img
                              src={s.posterUrl || FALLBACK_THUMB}
                              alt={s.title}
                              className="q-thumb"
                              onError={e => { e.target.src = FALLBACK_THUMB; }}
                            />
                            <div className="q-info">
                              <span className="q-name">{s.title || "Unknown"}</span>
                              <span className="q-artist">{s.artist || "—"}</span>
                            </div>
                            {song?.url === s.url && <span className="q-now">▶</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-empty">
                  <div className="he-emojis">
                    {Object.values(MOOD_CONFIG).map(m => (
                      <span key={m.label} className="he-e">{m.emoji}</span>
                    ))}
                  </div>
                  <h3>No playlist yet</h3>
                  <p>Detect your mood first and your soundtrack will load here.</p>
                  <button className="btn-primary" onClick={() => setTab("detect")}>
                    🧠 Detect My Mood
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        {/* ── MOOD LIBRARY SIDEBAR ── */}
        <aside className="h-sidebar">
          <p className="sb-heading">Mood Library</p>
          {Object.entries(MOOD_CONFIG).map(([key, m]) => (
            <button
              key={key}
              className={`sb-card ${currentMood === key ? "active" : ""}`}
              style={{ "--sc": m.color, "--sg": m.gradient }}
              onClick={() => {
                setCurrentMood(key);
                handleGetSong({ mood: key });
              }}
            >
              <span className="sb-emoji">{m.emoji}</span>
              <div className="sb-text">
                <span className="sb-label">{m.label}</span>
                <span className="sb-caption">{m.caption}</span>
              </div>
              {currentMood === key && <span className="sb-dot" />}
            </button>
          ))}
        </aside>

      </div>

      <footer className="h-footer">
        Crafted with ❤️ by <strong>Basak</strong> · Moodify 2026
      </footer>
    </div>
  );
};

export default Home;
