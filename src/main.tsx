import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
// Fonts are bundled with the app (not loaded from Google) so they work offline.
import "@fontsource/press-start-2p/latin-400.css";
import "@fontsource/pixelify-sans/latin-400.css";
import "@fontsource/pixelify-sans/latin-600.css";
import "@fontsource/nunito/latin-700.css";
import "./styles.css";
import { captureJoinFromUrl } from "./join";

captureJoinFromUrl();

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
