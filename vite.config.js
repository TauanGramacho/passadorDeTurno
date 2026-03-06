import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ajuste a porta aqui se preferir trocar (5173 ou 5174)
const PORT = 5173;

const codespaceHost = process.env.CODESPACE_NAME
  ? `${process.env.CODESPACE_NAME}-${PORT}.app.github.dev`
  : undefined;

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: PORT,
    strictPort: true,
    origin: codespaceHost ? `https://${codespaceHost}` : undefined,
    hmr: {
      host: codespaceHost,  // sem protocolo
      protocol: "wss",
      clientPort: 443
    }
  },
  preview: {
    port: 10000
  }
});