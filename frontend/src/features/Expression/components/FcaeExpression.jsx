import { getMoodValue } from "../utils/utils";
import { useEffect, useRef, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { init, detect, EmotionSmoother } from "../utils/utils";
import "./FcaeExpression.scss";

/**
 * FaceExpression — Production-grade emotion detection
 *
 * 5-step flow:
 * INIT → ALIGN → DETECTING → CONFIRMING (countdown) → DONE
 *
 * Improvements:
 * - EmotionSmoother: rolling window of 8 frames, 60% agreement required
 * - 3-second stable confirmation before firing onClick
 * - Real-time confidence display per emotion
 * - Clear visual steps / guidance at every stage
 * - Robust camera init with retry
 */

const STEP = {
  IDLE: "idle",
  INIT: "init",
  ALIGN: "align",
  DETECTING: "detecting",
  CONFIRMING: "confirming",
  DONE: "done",
  ERROR: "error",
};

const STABLE_SECONDS = 3; // how long emotion must hold
const DETECT_INTERVAL_MS = 250; // detection runs 4x/sec
const SMOOTHER_WINDOW = 8; // frames in rolling average

const EMOTION_META = {
  "😊 Happy": { color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  "😢 Sad": { color: "#60A5FA", bg: "rgba(96,165,250,0.12)" },
  "😍 Romantic": { color: "#FB7185", bg: "rgba(251,113,133,0.12)" },
  "😲 Surprised": { color: "#2DD4BF", bg: "rgba(45,212,191,0.12)" },
  "😠 Angry": { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
  "😨 Fearful": { color: "#A78BFA", bg: "rgba(167,139,250,0.12)" },
  "😐 Neutral": { color: "#94A3B8", bg: "rgba(148,163,184,0.12)" },
};

const FaceExpression = ({ onClick = () => {} }) => {
  const videoRef = useRef(null);
  const landmarkerRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);
  const smootherRef = useRef(new EmotionSmoother(SMOOTHER_WINDOW));
  const stableRef = useRef({ emotion: null, since: null });
  const isMounted = useRef(true);
  const countdownRef = useRef(null);

  const [step, setStep] = useState(STEP.IDLE);
  const [emotion, setEmotion] = useState(null); // current displayed emotion
  const [confidence, setConfidence] = useState(0);
  const [countdown, setCountdown] = useState(STABLE_SECONDS);
  const [allScores, setAllScores] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [errorHelp, setErrorHelp] = useState(null);
  const [noFace, setNoFace] = useState(false);

  // ── Cleanup ──────────────────────────────────────────────
  const _stopDetectionLoop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const _stopCamera = useCallback(() => {
    _stopDetectionLoop();
    try {
      landmarkerRef.current?.close();
    } catch {}
    landmarkerRef.current = null;
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    streamRef.current = null;
    try {
      if (videoRef.current) videoRef.current.srcObject = null;
    } catch {}
    smootherRef.current.reset();
    stableRef.current = { emotion: null, since: null };
  }, []);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      _stopCamera();
    };
  }, [_stopCamera]);

  // ── STEP 3: Detection loop ────────────────────────────────
  const _beginDetecting = () => {
    if (!isMounted.current) return;
    setStep(STEP.DETECTING);
    setNoFace(false);
    smootherRef.current.reset();
    stableRef.current = { emotion: null, since: null };

    _stopDetectionLoop();

    intervalRef.current = setInterval(() => {
      if (!isMounted.current) {
        _stopDetectionLoop();
        return;
      }

      const result = detect({ landmarkerRef, videoRef, setExpression: null });

      if (!result) {
        // No face — reset stability
        setNoFace(true);
        setEmotion(null);
        setConfidence(0);
        setAllScores(null);
        smootherRef.current.reset();
        stableRef.current = { emotion: null, since: null };
        return;
      }

      setNoFace(false);
      setEmotion(result.emotion);
      setConfidence(result.confidence);
      setAllScores(result.scores);

      // Feed smoother
      smootherRef.current.push(result.emotion, result.scores);

      const stableEmotion = smootherRef.current.getStableEmotion(4);

      if (!stableEmotion) {
        // Not stable yet — reset timer
        stableRef.current = { emotion: null, since: null };
        return;
      }

      // Stable emotion detected
      if (stableRef.current.emotion !== stableEmotion) {
        // New stable emotion — reset timer
        stableRef.current = { emotion: stableEmotion, since: Date.now() };
        setCountdown(STABLE_SECONDS);
        return;
      }

      // Same emotion is holding — check duration
      const elapsed = (Date.now() - stableRef.current.since) / 1000;
      const remaining = Math.max(0, STABLE_SECONDS - elapsed);
      setCountdown(Math.ceil(remaining));

      if (elapsed >= STABLE_SECONDS) {
        // ✅ Confirmed! Move to step 4
        _stopDetectionLoop();
        if (isMounted.current) {
          setStep(STEP.CONFIRMING);
          setTimeout(() => {
            if (isMounted.current) {
              setStep(STEP.DONE);
              onClick(getMoodValue(stableEmotion));
            }
          }, 800);
        }
      }
    }, DETECT_INTERVAL_MS);
  };

  // ── STEP 1: Init camera ───────────────────────────────────
  const startFlow = useCallback(async () => {
    if (!isMounted.current) return;
    setStep(STEP.INIT);
    setErrorMsg(null);
    setErrorHelp(null);
    setEmotion(null);
    setAllScores(null);
    smootherRef.current.reset();
    stableRef.current = { emotion: null, since: null };

    const result = await init({ landmarkerRef, videoRef, streamRef });

    if (!isMounted.current) return;

    if (result?.error) {
      setErrorMsg(result.error);
      setErrorHelp(result.helpText || null);
      setStep(STEP.ERROR);
      toast.error(result.error);
      return;
    }

    // STEP 2: Face alignment guide (brief pause)
    setStep(STEP.ALIGN);
    toast.success("Camera ready — please position your face");

    // Auto-start detection after 2s alignment window
    setTimeout(() => {
      if (!isMounted.current) return;
      _beginDetecting();
    }, 2000);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Retry ─────────────────────────────────────────────────
  const retry = useCallback(() => {
    _stopCamera();
    if (isMounted.current) {
      setStep(STEP.IDLE);
      setEmotion(null);
      setAllScores(null);
      setConfidence(0);
      setNoFace(false);
    }
    setTimeout(() => {
      if (isMounted.current) startFlow();
    }, 400);
  }, [_stopCamera, startFlow]);

  // ── Reset to idle ─────────────────────────────────────────
  const reset = useCallback(() => {
    _stopCamera();
    if (isMounted.current) {
      setStep(STEP.IDLE);
      setEmotion(null);
      setAllScores(null);
      setConfidence(0);
      setNoFace(false);
      setErrorMsg(null);
    }
  }, [_stopCamera]);

  // ── Emotion meta ──────────────────────────────────────────
  const emoMeta = emotion
    ? EMOTION_META[emotion] || EMOTION_META["😐 Neutral"]
    : null;

  // ── Progress bar ─────────────────────────────────────────
  const stabilityPct =
    step === STEP.DETECTING && stableRef.current.since
      ? Math.min(100, ((STABLE_SECONDS - countdown) / STABLE_SECONDS) * 100)
      : 0;

  const isActive =
    step === STEP.DETECTING ||
    step === STEP.ALIGN ||
    step === STEP.INIT ||
    step === STEP.CONFIRMING;

  return (
    <div className="fxw">
      {/* ── STEP INDICATOR ── */}
      <div className="fx-steps">
        {[
          { id: STEP.INIT, n: 1, label: "Camera Init" },
          { id: STEP.ALIGN, n: 2, label: "Align Face" },
          { id: STEP.DETECTING, n: 3, label: "Detecting" },
          { id: STEP.CONFIRMING, n: 4, label: "Confirming" },
          { id: STEP.DONE, n: 5, label: "Done" },
        ].map((s) => {
          const stepOrder = [
            STEP.IDLE,
            STEP.INIT,
            STEP.ALIGN,
            STEP.DETECTING,
            STEP.CONFIRMING,
            STEP.DONE,
          ];
          const currentIdx = stepOrder.indexOf(step);
          const thisIdx = stepOrder.indexOf(s.id);
          const past = currentIdx > thisIdx;
          const current = currentIdx === thisIdx;
          return (
            <div
              key={s.id}
              className={`fx-step ${current ? "current" : ""} ${past ? "past" : ""}`}
            >
              <div className="fx-step-dot">{past ? "✓" : s.n}</div>
              <span className="fx-step-label">{s.label}</span>
            </div>
          );
        })}
      </div>

      <div className="fx-zone">
        {/* ── VIDEO BOX ── */}
        <div
          className={`fx-video-box ${isActive ? "active" : ""} ${step === STEP.CONFIRMING ? "confirmed" : ""}`}
        >
          {/* Video element always in DOM when not idle/error */}
          <video
            ref={videoRef}
            className="fx-video"
            style={{
              display:
                step !== STEP.IDLE && step !== STEP.ERROR ? "block" : "none",
            }}
            autoPlay
            playsInline
            muted
          />

          {/* Idle placeholder */}
          {(step === STEP.IDLE || step === STEP.ERROR) && (
            <div className="fx-placeholder">
              <div className="ph-ico">{step === STEP.ERROR ? "⚠️" : "📷"}</div>
              <p>
                {step === STEP.ERROR ? "Camera unavailable" : "Camera is off"}
              </p>
              <small>
                {step === STEP.ERROR
                  ? errorMsg
                  : "Click Start to begin emotion detection"}
              </small>
              {step === STEP.ERROR && errorHelp && (
                <small className="ph-help">{errorHelp}</small>
              )}
            </div>
          )}

          {/* Face guide overlay (step 2) */}
          {step === STEP.ALIGN && (
            <div className="fx-align-overlay">
              <div className="align-oval" />
              <p className="align-hint">Position your face inside the oval</p>
            </div>
          )}

          {/* Scan line animation */}
          {step === STEP.DETECTING && <div className="fx-scan" />}

          {/* Init spinner */}
          {step === STEP.INIT && (
            <div className="fx-init-overlay">
              <div className="fx-spin" />
              <p>Loading camera &amp; AI model…</p>
              <small>First load may take a moment</small>
            </div>
          )}

          {/* Confirming flash */}
          {step === STEP.CONFIRMING && (
            <div className="fx-confirm-overlay">
              <div className="confirm-burst">✓</div>
              <p>Emotion locked in!</p>
            </div>
          )}

          {/* No-face warning */}
          {step === STEP.DETECTING && noFace && (
            <div className="fx-no-face">
              👤 No face detected — look at the camera
            </div>
          )}

          {/* Countdown badge */}
          {step === STEP.DETECTING &&
            !noFace &&
            emotion &&
            stableRef.current.since && (
              <div className="fx-countdown-badge">
                <div className="cd-ring">
                  <svg viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="17" className="cd-track" />
                    <circle
                      cx="20"
                      cy="20"
                      r="17"
                      className="cd-fill"
                      style={{
                        strokeDashoffset: `${107 * (1 - stabilityPct / 100)}`,
                      }}
                    />
                  </svg>
                  <span className="cd-num">{countdown}</span>
                </div>
              </div>
            )}

          {/* Live status badge */}
          {(step === STEP.DETECTING || step === STEP.ALIGN) && (
            <div className="fx-live-badge">
              <span className="live-dot" />
              {step === STEP.ALIGN ? "Aligning…" : "Live"}
            </div>
          )}
        </div>

        {/* ── EMOTION STATUS ── */}
        {step === STEP.DETECTING && (
          <div
            className="fx-emotion-display"
            style={
              emoMeta
                ? { borderColor: emoMeta.color, background: emoMeta.bg }
                : {}
            }
          >
            {emotion ? (
              <>
                <span className="fx-emo-label">{emotion}</span>
                <div className="fx-conf-bar-wrap">
                  <div
                    className="fx-conf-bar"
                    style={{
                      width: `${Math.round(confidence * 100)}%`,
                      background: emoMeta?.color || "var(--teal)",
                    }}
                  />
                </div>
                <span className="fx-conf-pct">
                  {Math.round(confidence * 100)}% confidence
                </span>
                {stableRef.current.since && (
                  <div className="fx-verifying">
                    Verifying… {countdown}s remaining
                  </div>
                )}
              </>
            ) : (
              <span className="fx-emo-label muted">
                Reading your expression…
              </span>
            )}
          </div>
        )}

        {/* All emotion scores mini-bars */}
        {step === STEP.DETECTING && allScores && (
          <div className="fx-score-grid">
            {Object.entries(allScores).map(([key, val]) => (
              <div key={key} className="fx-score-row">
                <span className="sc-key">{key}</span>
                <div className="sc-bar-wrap">
                  <div
                    className="sc-bar"
                    style={{ width: `${Math.round(val * 100)}%` }}
                  />
                </div>
                <span className="sc-val">{Math.round(val * 100)}%</span>
              </div>
            ))}
          </div>
        )}

        {/* Done state */}
        {step === STEP.DONE && emotion && (
          <div
            className="fx-done-card"
            style={emoMeta ? { borderColor: emoMeta.color } : {}}
          >
            <span className="fx-done-emoji">{emotion.split(" ")[0]}</span>
            <div>
              <p className="fx-done-label">Mood detected</p>
              <p className="fx-done-emotion">
                {emotion.split(" ").slice(1).join(" ")}
              </p>
            </div>
            <button className="fx-retry-sm" onClick={() => _beginDetecting()}>
              Re-detect
            </button>
          </div>
        )}

        {/* ── CONTROLS ── */}
        <div className="fx-btns">
          {step === STEP.IDLE && (
            <button className="fx-btn fx-btn-primary" onClick={startFlow}>
              <span>▶</span> Start Detection
            </button>
          )}

          {step === STEP.ERROR && (
            <button className="fx-btn fx-btn-primary" onClick={retry}>
              ↺ Try Again
            </button>
          )}

          {(step === STEP.INIT ||
            step === STEP.ALIGN ||
            step === STEP.DETECTING) && (
            <button className="fx-btn fx-btn-ghost" onClick={reset}>
              ✕ Cancel
            </button>
          )}

          {step === STEP.DONE && (
            <button className="fx-btn fx-btn-ghost" onClick={reset}>
              ↺ Detect Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceExpression;
