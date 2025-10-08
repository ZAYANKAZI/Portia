// File: src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./routes.jsx";

// ---- Prism (global) ----
import "prismjs/themes/prism-okaidia.css"; // pick your theme
import Prism from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-json";
// (optional)
// import "prismjs/components/prism-typescript";
// import "prismjs/components/prism-tsx";
// import "prismjs/components/prism-css";
// import "prismjs/components/prism-markup";

// Mount app
const rootEl = document.getElementById("root");
ReactDOM.createRoot(rootEl).render(<RouterProvider router={router} />);

// Auto-highlight now + whenever new code blocks appear
setupPrismAutoHighlight();

// ===== helpers =====
function setupPrismAutoHighlight() {
  const highlight = () => {
    try {
      Prism.highlightAll();
    } catch {
      // ignore
    }
  };

  // Initial pass (after current paint)
  queueMicrotask(highlight);

  // Re-run on DOM changes that might inject code blocks
  const obs = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (!m.addedNodes || m.addedNodes.length === 0) continue;
      for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue; // elements only
        // If a <pre><code>…</code></pre> is added or contained, re-highlight
        if (n.matches?.("pre code") || n.querySelector?.("pre code")) {
          highlight();
          return;
        }
      }
    }
  });

  obs.observe(document.documentElement, { childList: true, subtree: true });

  // Optional: re-highlight on route navigations fired by history changes
  window.addEventListener("popstate", () => queueMicrotask(highlight));
  window.addEventListener("pushstate", () => queueMicrotask(highlight));
  window.addEventListener("replacestate", () => queueMicrotask(highlight));

  // Patch history methods to emit events (so Router actions trigger highlight)
  patchHistoryForEvents();
}

function patchHistoryForEvents() {
  for (const method of ["pushState", "replaceState"]) {
    const orig = history[method];
    if (typeof orig !== "function") continue;
    history[method] = function (...args) {
      const evName = method.toLowerCase();
      const ret = orig.apply(this, args);
      try {
        window.dispatchEvent(new Event(evName));
      } catch {
        // ignore
      }
      return ret;
    };
  }
}
