// File: src/App.jsx  (PATCHED)
import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";

const Home = lazy(() => import("./pages/Home.jsx"));                 // ← fixed path
const PlaygroundRoute = lazy(() => import("./routes/PlaygroundRoute.jsx"));

const PLAYGROUND_ENABLED =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    (import.meta.env.VITE_ENABLE_PLAYGROUND === "true" || import.meta.env.DEV)) ||
  false;

function Loader() {
  return <div style={{ padding: 16 }}>Loading…</div>;
}

function NotFound() {
  return (
    <div style={{ padding: 16 }}>
      <h1>404</h1>
      <p>Page not found.</p>
      <p>
        <Link to="/">Go Home</Link>
        {PLAYGROUND_ENABLED && (
          <>
            {" · "}
            <Link to="/playground">Open Playground</Link>
          </>
        )}
      </p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Loader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/playground"
            element={PLAYGROUND_ENABLED ? <PlaygroundRoute /> : <Navigate to="/" replace />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
