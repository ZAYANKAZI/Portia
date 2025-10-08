// ============================================================================
// File: src/layouts/MainLayout.jsx
// Desc: Main layout with Prism background (calibrated defaults, no debug panel)
// ============================================================================
import { useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import Prism from "../components/backgrounds/Prism";

const LOGO_URL =
  "https://res.cloudinary.com/djx3wbdnr/image/upload/v1755290420/c014ff13-f93f-4d9c-be76-89d43feaabc5.png";

export default function MainLayout() {
  // Calibrated defaults
  const [dbg] = useState({
    scale: 3,
    offsetY: -229,
    glow: 0.5,
    noise: 0,
    timeScale: 0.19,
  });

  const prismProps = useMemo(
    () => ({
      animationType: "rotate",
      timeScale: dbg.timeScale,
      height: 3.5,
      baseWidth: 5.5,
      scale: dbg.scale,
      noise: dbg.noise,
      glow: dbg.glow,
      colorFrequency: 1,
      hueShift: 0,
      offset: { x: 0, y: dbg.offsetY }, // Prism expects offset object
    }),
    [dbg]
  );

  return (
    <div className="relative min-h-screen flex flex-col text-white">
      {/* Solid black base under everything */}
      <div className="fixed inset-0 -z-20 bg-black" />
      {/* Prism lights */}
      <Prism className="-z-10" {...prismProps} />

      {/* Transparent header/footer for continuous background */}
      <header className="relative flex items-center justify-center py-4 bg-transparent">
        <img src={LOGO_URL} alt="Foodinn" className="h-10 md:h-12 w-auto" />
      </header>

      <main className="relative flex-1">
        <div className="relative z-10">
          <Outlet />
        </div>
      </main>

      <footer className="relative bg-transparent text-white/80 text-center py-4">
        &copy; {new Date().getFullYear()} Foodinn. All rights reserved.
      </footer>
    </div>
  );
}
