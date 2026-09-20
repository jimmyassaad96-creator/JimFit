// Static server for the characterization suite. Builds every patched variant
// on startup (Playwright boots webServer before the specs run, so the build
// cannot live in a beforeAll hook) and serves each under its own path,
// alongside the repo's real static assets which index.html loads by relative
// path.
import { existsSync, readFileSync } from "node:fs";
import { join, extname } from "node:path";
import { buildDemo, VARIANTS } from "./demo-build.js";

const PORT = Number(process.env.PORT || 4173);
for (const [name, [role, patch]] of Object.entries(VARIANTS)) {
  buildDemo(join(".demo", name), role, patch);
}

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
    const { pathname } = new URL(req.url);
    const [, head, ...tail] = pathname.split("/");
    if (head in VARIANTS) {
      const rest = tail.join("/");
      if (!rest || rest === "index.html") {
        return send(join(".demo", head, "index.html")) ?? new Response("no build", { status: 500 });
      }
      return send(join(".", rest)) ?? new Response("not found", { status: 404 });
    }
    return send(join(".", pathname.replace(/^\/+/, ""))) ?? new Response("not found", { status: 404 });
  },
});
console.log(`demo server on http://127.0.0.1:${PORT} — ${Object.keys(VARIANTS).join(", ")}`);
