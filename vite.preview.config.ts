import vinext from "vinext";
import { defineConfig } from "vite";

// Lightweight local visual preview. Production builds keep using vite.config.ts
// with the Cloudflare bindings; this config intentionally avoids those bindings.
export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  plugins: [vinext()],
});
