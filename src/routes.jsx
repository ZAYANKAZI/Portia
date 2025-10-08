// File: src/routes.jsx
import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import PlaygroundRoute from "./routes/PlaygroundRoute.jsx";
import EditorRoute from "./routes/EditorRoute.jsx"; // wraps Home with safe Exit

export const router = createBrowserRouter([
  { path: "/", element: <Landing /> },           // Landing is root
  { path: "/editor", element: <EditorRoute /> }, // Editor (Home) behind wrapper
  { path: "/playground", element: <PlaygroundRoute /> }, // Sandbox
  { path: "*", element: <Navigate to="/" replace /> },   // Fallback → Landing
]);

export default router;