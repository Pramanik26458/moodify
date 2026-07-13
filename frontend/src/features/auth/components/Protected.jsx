import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      minHeight:"100vh", gap:"1rem", background:"var(--ink)"
    }}>
      <div style={{
        width:44, height:44, borderRadius:"50%",
        border:"3px solid rgba(13,148,136,.2)", borderTopColor:"var(--teal-bright)",
        animation:"spin .85s linear infinite"
      }} />
      <p style={{ color:"var(--text-muted)", fontSize:".9rem" }}>Loading Moodify…</p>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
};
export default Protected;
