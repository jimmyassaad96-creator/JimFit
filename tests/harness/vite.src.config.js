import { defineConfig } from "vite";

// Builds the patched copy of src/ that the characterization suite drives.
// Separate from the app config because the root and entry differ, and this
// output is throwaway.
export default defineConfig({
  root: ".demo-src",
  build: { outDir: "dist", emptyOutDir: true },
});
