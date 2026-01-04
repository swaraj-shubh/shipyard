import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite"; // Added back

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    global: "globalThis",
    "process.env": {},
  },
  resolve: {
    alias: {
      // 🎯 Fix for the "@" import error
      "@": path.resolve(__dirname, "./src"),
      
      // Fix for Solana/Buffer
      buffer: "buffer",
      process: "process/browser",
    },
  },
  optimizeDeps: {
    include: ["buffer", "process"],
  },
});