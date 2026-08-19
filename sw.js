// JimFit service worker — offline resilience only, never a source of stale
// content. Network-first: every request tries the live server first (so
// every update still reaches every client automatically, no new link, no
// reinstall — same guarantee as before this existed). The cache is only
// ever read from when the network request genuinely fails, e.g. a client's
// connection drops mid-workout at the gym.
const CACHE_NAME = "jimfit-shell-v1";
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

  event.respondWith(
    fetch(event.request)
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
