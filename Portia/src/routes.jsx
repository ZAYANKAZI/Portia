// src/routes.jsx
import { createBrowserRouter } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import PreviewPage from "./pages/PreviewPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Landing /> },    // NEW landing page
      { path: "editor", element: <Home /> },    // Editor moved here
    ],
  },
  { path: "/preview", element: <PreviewPage /> },
]);

export default router;
