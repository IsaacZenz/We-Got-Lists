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
import { registerSW } from "virtual:pwa-register";

// The app is saved on the phone for offline use. Check for a newer version whenever it's opened
// (and every 30 minutes while open); when one is found it installs and the page reloads onto it.
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (!reg) return;
    const check = () => { if (navigator.onLine) void reg.update(); };
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") check(); });
    setInterval(check, 30 * 60 * 1000);
  },
});

captureJoinFromUrl();

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
