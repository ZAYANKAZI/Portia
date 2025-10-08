// src/components/BackgroundLayer.jsx
import React from "react";
import { useScreenBackground } from "../hooks/useScreenBackground";

export default function BackgroundLayer({ background }) {
  const style = useScreenBackground(background);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        ...style,
      }}
    />
  );
}
