import { defineConfig } from "vite";

// index.html at the repo root is the SHIPPED app and must stay untouched, so
// the dev/build entry is a separate shell that loads the module tree instead.
export default defineConfig({
  root: ".",
  build: { rollupOptions: { input: "index.dev.html" }, outDir: "dist" },
  server: { port: 5173 },
  test: {
    environment: "happy-dom",
    include: ["tests/unit/**/*.test.{js,ts}"],
  },
});
