import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import pkg from "./package.json" with { type: "json" };

// The site is served from https://isaaczenz.github.io/We-Got-Lists/, so every path starts with this.
const base = "/We-Got-Lists/";

export default defineConfig({
  base,
  // Version tag shown in the account panel, e.g. "0.6.0 · b9e4310": lets you check which build your phone has.
  define: { __APP_VERSION__: JSON.stringify(`${pkg.version} · ${(process.env.GITHUB_SHA ?? "dev").slice(0, 7)}`) },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false, // registered in src/main.tsx so we can check for updates on every open
      includeAssets: ["apple-touch-icon.png"],
      // Save the whole app on the phone (code, styles, fonts, icons) so it opens with no signal.
      workbox: { globPatterns: ["**/*.{js,css,html,woff2,png,svg}"] },
      manifest: {
        name: "We Got Lists",
        short_name: "We Got Lists",
        description: "Shared grocery lists with a pixel-art meadow.",
        start_url: base,
        scope: base,
        display: "standalone",
        background_color: "#5cc23c",
        theme_color: "#7cd0ff",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  test: { environment: "node" },
});
