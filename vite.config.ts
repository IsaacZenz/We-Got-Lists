import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import pkg from "./package.json" with { type: "json" };

// The site is served from https://isaaczenz.github.io/We-Got-Lists/, so every path starts with this.
const base = "/We-Got-Lists/";

export default defineConfig({
  base,
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["apple-touch-icon.png"],
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
