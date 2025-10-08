import React, { useEffect } from "react";
import Home from "../pages/Home.jsx";

export default function EditorRoute() {
  useEffect(() => {
    // Intercept any "Exit" / "Leave Editor" / "Back to Home" button clicks (capture phase)
    const exitCapture = (e) => {
      const el = e.target.closest?.("button, a, [role='button']") || e.target;
      if (!el) return;
      const label = (
        el.getAttribute?.("aria-label") ||
        el.getAttribute?.("title") ||
        el.textContent ||
        ""
      ).toLowerCase().trim();
      if (/\bexit\b|leave editor|back to home|go home|close/i.test(label)) {
        e.preventDefault();
        e.stopImmediatePropagation?.();
        e.stopPropagation();
        try { window.onbeforeunload = null; } catch {} // avoid native prompt
        window.location.replace("/"); // hard redirect → Landing
      }
    };
    document.addEventListener("click", exitCapture, true);
    return () => document.removeEventListener("click", exitCapture, true);
  }, []);

  return <Home />;
}