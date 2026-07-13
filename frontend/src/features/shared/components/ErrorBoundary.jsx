import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            padding: "2rem",
            textAlign: "center",
            background: "linear-gradient(135deg, #0f172a 0%, #020617 100%)",
            color: "#e2e8f0",
          }}
        >
          <div
            style={{
              maxWidth: "500px",
              padding: "2rem",
              background: "rgba(30, 41, 59, 0.8)",
              borderRadius: "1rem",
              border: "1px solid rgba(148, 163, 184, 0.3)",
            }}
          >
            <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>?? Oops!</h1>
            <p style={{ color: "#cbd5e1", marginBottom: "1.5rem" }}>
              Something went wrong. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: "0.875rem 2rem",
                background: "linear-gradient(135deg, #06b6d4, #0891b2)",
                color: "white",
                border: "none",
                borderRadius: "0.75rem",
                cursor: "pointer",
                fontWeight: "600",
                transition: "all 0.3s ease",
              }}
              onMouseOver={(e) => {
                e.target.style.transform = "translateY(-2px)";
              }}
              onMouseOut={(e) => {
                e.target.style.transform = "translateY(0)";
              }}
            >
              Refresh Page
            </button>
            {/* Error details only shown in development - removed for production */}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
