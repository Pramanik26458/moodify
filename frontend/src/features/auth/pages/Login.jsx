import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../style/auth.scss";

const Login = () => {
  const { loading, handleLogin } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    const ok = await handleLogin({ email, password });
    if (ok) navigate("/home");
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-logo-row">
          <div className="brand-mark">🎵</div>
          <span className="brand-word">Moodify</span>
        </div>
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Sign in to continue your journey</p>
        <form className="auth-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="pramanik@gmail.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
              required autoComplete="email" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" placeholder="Your password"
              value={password} onChange={(e) => setPassword(e.target.value)}
              required autoComplete="current-password" />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p className="auth-switch">
          No account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </main>
  );
};
export default Login;
