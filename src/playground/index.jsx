import React from "react";
import { createRoot } from "react-dom/client";
import PlaygroundApp from "./PlaygroundApp.jsx";

const mount = document.getElementById("root");
createRoot(mount).render(<PlaygroundApp />);