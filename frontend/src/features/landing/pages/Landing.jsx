import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../style/landing.scss";

const useRealStats = () => {
  const [stats, setStats] = useState({ totalSongs: 0, totalUsers: 0, moodCategories: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/admin/stats`)
      .then(r => {
        setStats({
          totalSongs:     r.data.totalSongs     || 0,
          totalUsers:     r.data.totalUsers     || 0,
          moodCategories: r.data.moodCategories || 0,
        });
        setLoaded(true);
      })
      .catch((err) => {
        console.error("Stats fetch failed:", err);
        setLoaded(true);
      });
  }, []);

  return { stats, loaded };
};

const useCountUp = (target, duration = 1600, run = false) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!run || target === 0) { setVal(0); return; }
    let raf, start = null;
    const step = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(e * target));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, run, duration]);
  return val;
};

const MOODS = [
  { key: "happy",     emoji: "😊", label: "Happy",     color: "#F59E0B", desc: "Upbeat & euphoric tracks that match your smile" },
  { key: "sad",       emoji: "😢", label: "Sad",        color: "#60A5FA", desc: "Tender melodies for moments that need space" },
  { key: "romantic",  emoji: "😍", label: "Romantic",   color: "#FB7185", desc: "Warm, dreamy sounds for hearts wide open" },
  { key: "surprised", emoji: "😲", label: "Surprised",  color: "#2DD4BF", desc: "Electric energy for unexpected moments" },
  { key: "neutral",   emoji: "😐", label: "Neutral",    color: "#94A3B8", desc: "Ambient calm for a steady, focused mind" },
  { key: "angry",     emoji: "😠", label: "Angry",      color: "#EF4444", desc: "Fierce, charged sounds to channel raw power" },
  { key: "fearful",   emoji: "😨", label: "Fearful",    color: "#A78BFA", desc: "Dark atmospheres for when the mood runs deep" },
];

const STEPS = [
  { n: "01", ico: "📹", title: "Face the Camera",  body: "Grant one-click camera access. Nothing is uploaded. All AI runs locally inside your browser." },
  { n: "02", ico: "🧠", title: "AI Reads You",      body: "MediaPipe maps 478 facial landmarks and isolates your dominant emotional state in real-time." },
  { n: "03", ico: "⚡", title: "Instant Match",     body: "Your mood hits the engine. A curated playlist matching your exact feeling queues in milliseconds." },
  { n: "04", ico: "🎵", title: "Feel the Music",    body: "Lean back. Your perfectly tailored emotional soundtrack begins. No playlist-building needed." },
];

const WORDS = ["😊 Happy","😢 Sad","😍 Romantic","😲 Surprised","😠 Angry","😨 Fearful","😐 Neutral","🎵 50k+ songs","🧠 MediaPipe AI","⚡ <500ms","🔒 Zero Upload"];

const useReveal = () => {
  useEffect(() => {
    const els = document.querySelectorAll(".rv");
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("vis"); });
    }, { threshold: 0.1 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
};

const Landing = () => {
  const navigate = useNavigate();
  const { stats, loaded } = useRealStats();
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef(null);

  useReveal();

  useEffect(() => {
    if (!statsRef.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setStatsVisible(true); obs.disconnect(); }
    }, { threshold: 0.3 });
    obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, [loaded]);

  const songs = useCountUp(stats.totalSongs, 1600, statsVisible && loaded);
  const users = useCountUp(stats.totalUsers, 1600, statsVisible && loaded);
  const cats  = useCountUp(stats.moodCategories, 1000, statsVisible && loaded);

  return (
    <div className="lp">

      {/* NAV */}
      <nav className="lp-nav">
        <div className="lp-logo">🎵 Moodify</div>
        <ul className="lp-nav-links">
          <li><a href="#how">How it works</a></li>
          <li><a href="#moods">Moods</a></li>
        </ul>
        <div className="lp-nav-right">
          <button className="lp-btn-ghost" onClick={() => navigate("/login")}>Sign in</button>
          <button className="lp-btn-cta"   onClick={() => navigate("/register")}>Get started →</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-grid" />
        <div className="lp-orb lp-orb-1" />
        <div className="lp-orb lp-orb-2" />
        <div className="lp-orb lp-orb-3" />

        <div className="lp-hero-badge">
          <span className="lp-badge-dot" />
          AI Face Detection · Zero Data Stored
        </div>

        <h1 className="lp-hero-title">
          <span className="lp-ht-1">Your face.</span>
          <span className="lp-ht-2">Your soundtrack.</span>
        </h1>

        <p className="lp-hero-sub">
          Moodify reads your expression through the camera and picks music that matches
          exactly how you feel — right now, in this moment.
        </p>

        <div className="lp-hero-btns">
          <button className="lp-btn-cta lp-btn-big" onClick={() => navigate("/register")}>
            Start Free →
          </button>
          <button className="lp-btn-ghost" onClick={() => navigate("/login")}>
            Sign in
          </button>
        </div>

        <div className="lp-orbit">
          <div className="lp-orbit-ring lp-ring-1" />
          <div className="lp-orbit-ring lp-ring-2" />
          <div className="lp-orbit-center">😊</div>
          {MOODS.slice(0, 5).map((m, i) => (
            <div
              key={m.key}
              className="lp-orbit-chip"
              style={{
                "--oc": m.color,
                top:  `${50 - 44 * Math.cos((i / 5) * 2 * Math.PI)}%`,
                left: `${50 + 44 * Math.sin((i / 5) * 2 * Math.PI)}%`,
              }}
            >
              {m.emoji} {m.label}
            </div>
          ))}
        </div>
      </section>

      {/* MARQUEE */}
      <div className="lp-marquee">
        <div className="lp-marquee-track">
          {[...WORDS, ...WORDS].map((w, i) => (
            <span key={i} className="lp-mw">{w}</span>
          ))}
        </div>
      </div>

      {/* STATS — real numbers from DB */}
      <div className="lp-stats" ref={statsRef}>
        <div className="lp-stats-inner">
          <div className="lp-stat">
            <span className="lp-stat-n">
              {!loaded ? "…" : songs.toLocaleString()}
            </span>
            <span className="lp-stat-l">Songs in Library</span>
          </div>
          <div className="lp-stat-div" />
          <div className="lp-stat">
            <span className="lp-stat-n">
              {!loaded ? "…" : users.toLocaleString()}
            </span>
            <span className="lp-stat-l">Registered Users</span>
          </div>
          <div className="lp-stat-div" />
          <div className="lp-stat">
            <span className="lp-stat-n">
              {!loaded ? "…" : cats}
            </span>
            <span className="lp-stat-l">Mood Categories</span>
          </div>
          <div className="lp-stat-div" />
          <div className="lp-stat">
            <span className="lp-stat-n">478</span>
            <span className="lp-stat-l">Facial Points</span>
          </div>
        </div>
        <p className="lp-stats-note">Real numbers · Live from the database</p>
      </div>

      {/* HOW IT WORKS */}
      <section className="lp-section" id="how">
        <p className="lp-section-label rv">Process</p>
        <h2 className="lp-section-title rv">Four steps to your perfect track</h2>
        <p className="lp-section-sub rv">From face to music in under two seconds.</p>
        <div className="lp-steps rv">
          {STEPS.map(s => (
            <div key={s.n} className="lp-step">
              <div className="lp-step-n">{s.n}</div>
              <div className="lp-step-ico">{s.ico}</div>
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MOODS */}
      <section className="lp-section" id="moods" style={{ paddingTop: 0 }}>
        <p className="lp-section-label rv">Moods</p>
        <h2 className="lp-section-title rv">Every feeling has a sound</h2>
        <p className="lp-section-sub rv">Seven emotional states. Each one matched to its own curated catalogue.</p>
        <div className="lp-mood-grid rv">
          {MOODS.map(m => (
            <div key={m.key} className="lp-mood-tile" style={{ "--mc": m.color, "--mg": `${m.color}22` }}>
              <span className="lp-mt-emoji">{m.emoji}</span>
              <strong className="lp-mt-label">{m.label}</strong>
              <p className="lp-mt-desc">{m.desc}</p>
            </div>
          ))}
          <div className="lp-mood-tile lp-mt-more">
            <span style={{ fontSize: "1.5rem" }}>+</span>
            <p>More moods<br />coming soon</p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="lp-section" style={{ paddingTop: 0 }}>
        <p className="lp-section-label rv">Under the hood</p>
        <h2 className="lp-section-title rv">Built for the obsessive listener</h2>
        <div className="lp-feat-grid rv">
          {[
            { ico:"🎯", t:"478-Point Detection",  b:"MediaPipe Face Landmarker maps every micro-expression across your full face geometry." },
            { ico:"🔒", t:"Zero Upload Privacy",  b:"All inference runs 100% in your browser. No face data ever leaves your device." },
            { ico:"⚡", t:"Sub-500ms Matching",   b:"Mood-to-song mapping happens instantly. No API calls, no buffer, no wait." },
            { ico:"🌊", t:"Mood-Reactive UI",     b:"Colors, images, and atmosphere shift to match your detected emotion in real time." },
            { ico:"🎵", t:"Live Queue Control",   b:"Skip tracks, rewind 10 seconds, or jump ahead. Full keyboard shortcuts included." },
            { ico:"📱", t:"Works Everywhere",     b:"Fluid layouts from 320px up. Every feature works perfectly on mobile or desktop." },
          ].map(f => (
            <div key={f.t} className="lp-feat-card">
              <div className="lp-feat-ico">{f.ico}</div>
              <h3>{f.t}</h3>
              <p>{f.b}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="lp-cta rv">
        <h2 className="lp-cta-title">
          Your mood deserves<br /><em>a soundtrack.</em>
        </h2>
        <p className="lp-cta-sub">
          No playlist building. No genre searching.<br />
          Just your face, the camera, and music that gets you.
        </p>
        <button className="lp-btn-cta lp-btn-big" onClick={() => navigate("/register")}>
          Start for free →
        </button>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-logo">🎵 Moodify</div>
        <p className="lp-footer-copy">Created by <strong>Basak</strong> · 2026</p>
        <div className="lp-footer-links">
          <button onClick={() => navigate("/login")}>Sign in</button>
          <button onClick={() => navigate("/register")}>Register</button>
        </div>
      </footer>

    </div>
  );
};

export default Landing;