// JimFit service worker — offline resilience only, never a source of stale
// content. Network-first: every request tries the live server first (so
// every update still reaches every client automatically, no new link, no
// reinstall — same guarantee as before this existed). The cache is only
// ever read from when the network request genuinely fails, e.g. a client's
// connection drops mid-workout at the gym.
//
// Sept 10 2026 — root cause of the entire "BMR just won't update" thread:
// this was ALREADY network-first in intent, but `fetch(event.request)`
// with no explicit cache option still goes through the BROWSER's own HTTP
// cache first — it is not a real network round-trip just because it's
// happening inside a service worker. GitHub Pages/Fastly serves index.html
// with real Cache-Control headers, so "network-first" was quietly serving
// an HTTP-cached (stale) copy of index.html most of the time, completely
// invisible from the code itself and immune to a client bumping ?v=N in
// the URL bar (the service worker doesn't look at the query string at
// all). Fixed by forcing every same-origin fetch to go over the wire with
// `cache: "reload"` — genuinely bypasses the HTTP cache every time, so an
// uploaded fix reaches every open tab on its very next request, not
// whenever the browser's own cache happens to expire. CACHE_NAME also
// bumped so every existing client's old offline-fallback cache is thrown
// out on this update, once.
const CACHE_NAME = "jimfit-shell-v2";
const APP_SHELL = ["./", "./index.html"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  // Only handle same-origin requests ourselves — let CDN scripts, fonts,
  // Supabase calls, and everything else go straight to the network as usual.
  if (new URL(event.request.url).origin !== self.location.origin) return;

  // "reload" forces this fetch past the browser's own HTTP cache and onto
  // the network every time — see the note above on why the plain
  // `fetch(event.request)` this used to be was not actually guaranteeing
  // that on its own.
  event.respondWith(
    fetch(event.request, { cache: "reload" })
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match("./index.html"))
      )
  );
});
