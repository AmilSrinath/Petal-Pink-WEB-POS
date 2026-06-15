import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/",   // Web hosting (changed from Electron)
  plugins: [react()],
});