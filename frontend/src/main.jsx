import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// SCSS imported in App.jsx to avoid duplication

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="dark"
        style={{ fontFamily: "var(--font-ui)" }}
      />
    </StrictMode>
  );
}
