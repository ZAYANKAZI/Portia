// ===========================
// File: src/main.jsx  (REPLACE)
// ===========================
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./routes";
import "./index.css";

// Fonts bootstrap: link CSS + load manifest early (no UI race conditions)
import { injectCssLink, ensureManifestLoaded } from "./components/lib/fonts";
injectCssLink();
ensureManifestLoaded();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
