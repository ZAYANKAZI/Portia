// File: src/routes.jsx
import React from "react";
import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/Home.jsx";
import PlaygroundRoute from "./routes/PlaygroundRoute.jsx";

export const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/playground", element: <PlaygroundRoute /> },
]);

export default router;
