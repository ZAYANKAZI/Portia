// File: src/main.jsx  (RESTORED CSS IMPORTS + minimal app mount)
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./routes.jsx";

/* Restore your app styles (these were removed earlier) */
import "./index.css";        // <- Tailwind/global styles live here in most Vite apps
// If your project uses a different path/name, keep the right one(s) too:
// import "./styles.css";
// import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <RouterProvider router={router} />
);
