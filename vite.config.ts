import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages serves the app from /<repo>/, so the base must match.
// Override with BASE_PATH if the repository is renamed.
const base = process.env.BASE_PATH ?? "/notion-widget/";

export default defineConfig({
  base,
  plugins: [react()],
  build: { outDir: "dist", sourcemap: false },
});
