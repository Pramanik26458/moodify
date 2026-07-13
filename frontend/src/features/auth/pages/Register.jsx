import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-toastify";
import "../style/auth.scss";

const Register = () => {
  const { loading, handleRegister } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Passwords don't match"); return; }
    const ok = await handleRegister({ username, email, password });
    if (ok) navigate("/login");
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-logo-row">
          <div className="brand-mark">🎵</div>
          <span className="brand-word">Moodify</span>
        </div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Join Moodify — let music find you</p>
        <form className="auth-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input id="username" type="text" placeholder="Choose a username"
              value={username} onChange={(e) => setUsername(e.target.value)}
              required autoComplete="username" />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="pramanik@gmail.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              required autoComplete="email" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" placeholder="Create a password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              required autoComplete="new-password" />
          </div>
          <div className="form-group">
            <label htmlFor="confirm">Confirm password</label>
            <input id="confirm" type="password" placeholder="Repeat password"
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
              required autoComplete="new-password" />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Creating…" : "Create Account"}
          </button>
        </form>
        <p className="auth-switch">
          Already have one? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </main>
  );
};
export default Register;
