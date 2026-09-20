// Static server for the characterization suite. Builds the patched demo copies
// on startup (Playwright boots webServer before the specs run, so the build
// cannot live in a beforeAll hook) and serves them alongside the repo's real
// static assets, which index.html references by relative path.
import { existsSync, readFileSync } from "node:fs";
import { join, extname } from "node:path";
import { buildDemo } from "./demo-build.js";

const PORT = Number(process.env.PORT || 4173);
buildDemo(".demo", "client");
buildDemo(".demo-trainer", "trainer");

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".css": "text/css",
};

function send(path) {
  if (!existsSync(path)) return null;
  return new Response(readFileSync(path), {
    headers: { "content-type": TYPES[extname(path)] || "application/octet-stream" },
  });
}

Bun.serve({
  port: PORT,
  fetch(req) {
    const url = new URL(req.url);
    const trainer = url.pathname.startsWith("/trainer");
    const rest = trainer ? url.pathname.slice("/trainer".length) || "/" : url.pathname;
    const root = trainer ? ".demo-trainer" : ".demo";
    if (rest === "/" || rest === "/index.html") {
      return send(join(root, "index.html")) ?? new Response("no demo build", { status: 500 });
    }
    // icons, manifest, privacy page — served from the repo as in production
    return send(join(".", rest.replace(/^\/+/, ""))) ?? new Response("not found", { status: 404 });
  },
});
console.log(`demo server on http://127.0.0.1:${PORT}`);
