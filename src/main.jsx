// File: src/main.jsx  (PATCHED)
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// (Kept) Fonts bootstrap; safe to run before render.
import { injectCssLink, ensureManifestLoaded } from "./components/lib/fonts";
injectCssLink();
ensureManifestLoaded();

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
