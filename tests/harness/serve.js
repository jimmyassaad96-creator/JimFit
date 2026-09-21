// Static server for the characterization suite. Builds every patched variant
// on startup (Playwright boots webServer before the specs run, so the build
// cannot live in a beforeAll hook) and serves each under its own path,
// alongside the repo's real static assets which index.html loads by relative
// path.
import { existsSync, readFileSync } from "node:fs";
import { join, extname } from "node:path";
import { buildDemo, VARIANTS, demoState } from "./demo-build.js";
import { buildSrc, builtHtml } from "./build-src.js";

const PORT = Number(process.env.PORT || 4173);
for (const [name, [role, patch]] of Object.entries(VARIANTS)) {
  buildDemo(join(".demo", name), role, patch);
}

// The same variants again, this time from the src/ module tree, so the suite
// can see refactors of src/ instead of only exercising index.html.
buildSrc();
const built = Bun.spawnSync(["bun", "x", "vite", "build", "--config", "tests/harness/vite.src.config.js"]);
if (built.exitCode !== 0) {
  console.error(new TextDecoder().decode(built.stderr).slice(0, 2000));
  throw new Error("src harness build failed");
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
    if (head.startsWith("src-")) {
      const name = head.slice(4);
      if (name in VARIANTS) {
        const [role, patch] = VARIANTS[name];
        return new Response(builtHtml(role === "gates" ? {} : demoState(role, patch)),
          { headers: { "content-type": "text/html; charset=utf-8" } });
      }
    }
    if (head === "assets") {
      return send(join(".demo-src", "dist", "assets", tail.join("/"))) ?? new Response("not found", { status: 404 });
    }
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
console.log(`demo server on http://127.0.0.1:${PORT}\n  index.html: ${Object.keys(VARIANTS).join(", ")}\n  src build : ${Object.keys(VARIANTS).map((v) => "src-" + v).join(", ")}`);
