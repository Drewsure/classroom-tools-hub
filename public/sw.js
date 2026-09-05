/* ============================================================
   Classroom Tools Hub — Service Worker
   ============================================================
   Strategies:
   - App shell (HTML, JS, CSS, _next/static) → stale-while-revalidate
   - Static media (sounds, icons, fonts)        → cache-first
   - Navigation (page loads)                     → network-first, fallback to cached shell

   The SW only activates in production builds.
   ============================================================ */

const VERSION = "v1.2.0";
const STATIC_CACHE = `cth-static-${VERSION}`;
const RUNTIME_CACHE = `cth-runtime-${VERSION}`;

// Assets to pre-cache on install (app shell + sounds + icons)
// FIXED: removed 11 non-existent files (applause, boo, sad-trombone, etc.)
// ADDED: all 18 actual sound files + 6 new spoken-word TTS files
const PRECACHE_URLS = [
  "/",
  "/manifest.json",
  "/icons/icon-32.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-192.png",
  "/icons/maskable-512.png",
  // Sound pad audio files (verified to exist)
  "/sounds/cheer.mp3",
  "/sounds/clap.mp3",
  "/sounds/tada.mp3",
  "/sounds/laugh.mp3",
  "/sounds/ding.mp3",
  "/sounds/wow.mp3",
  "/sounds/drumroll.mp3",
  "/sounds/buzzer.mp3",
  "/sounds/wrong.mp3",
  "/sounds/heartbeat.mp3",
  "/sounds/gameshow.mp3",
  "/sounds/timeup.mp3",
  "/sounds/sparkle.mp3",
  "/sounds/spring.mp3",
  "/sounds/chirping.mp3",
  "/sounds/dog.mp3",
  "/sounds/whoosh.mp3",
  "/sounds/alarm.mp3",
  // NEW: AAA-quality spoken-word TTS files for sound pad buttons
  "/sounds/spoken-correct.mp3",
  "/sounds/spoken-great-job.mp3",
  "/sounds/spoken-wow.mp3",
  "/sounds/spoken-wrong.mp3",
  "/sounds/spoken-times-up.mp3",
  "/sounds/spoken-lets-play.mp3",
  // Spoken countdown numbers (TTS-generated, used by all timers)
  "/sounds/countdown-1.mp3",
  "/sounds/countdown-2.mp3",
  "/sounds/countdown-3.mp3",
  "/sounds/countdown-4.mp3",
  "/sounds/countdown-5.mp3",
  "/sounds/countdown-6.mp3",
  "/sounds/countdown-7.mp3",
  "/sounds/countdown-8.mp3",
  "/sounds/countdown-9.mp3",
  "/sounds/countdown-10.mp3",
  // Weather flashcard images
  "/images/weather/sunny.gif",
  "/images/weather/cloudy.gif",
  "/images/weather/rainy.gif",
  "/images/weather/snowy.gif",
  "/images/weather/windy.gif",
  "/images/weather/stormy.gif",
  "/images/weather/hot.gif",
  "/images/weather/cold.gif",
];

// Install — pre-cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      // Use addAll with individual failures tolerated (some sounds may 404)
      Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url))),
    ).then(() => self.skipWaiting()),
  );
});

// Activate — clean up old caches and take control
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k)),
      ),
    ).then(() => self.clients.claim()),
  );
});

// Helper — tell all open tabs an update is ready
const notifyClients = async () => {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach((client) => client.postMessage({ type: "SW_UPDATED" }));
};

// Fetch — strategy routing
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only handle GET — never intercept POST/PUT/etc.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Skip cross-origin requests (analytics, fonts CDN, etc.)
  if (url.origin !== self.location.origin) return;

  // Skip Next.js HMR / dev endpoints
  if (url.pathname.startsWith("/_next/webpack-hmr")) return;

  // --- Navigation requests (page loads): network-first, fall back to cached shell ---
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/"))),
    );
    return;
  }

  // --- Sounds: cache-first (offline-critical) ---
  if (url.pathname.startsWith("/sounds/")) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        }).catch(() => cached),
      ),
    );
    return;
  }

  // --- Icons & manifest: cache-first ---
  if (url.pathname.startsWith("/icons/") || url.pathname === "/manifest.json") {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        }).catch(() => cached),
      ),
    );
    return;
  }

  // --- App shell (JS, CSS, _next/static): stale-while-revalidate ---
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".woff") ||
    url.pathname.endsWith(".woff2")
  ) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const fetchPromise = fetch(request)
            .then((response) => {
              if (response.ok) cache.put(request, response.clone());
              return response;
            })
            .catch(() => cached);
          return cached || fetchPromise;
        }),
      ),
    );
    return;
  }

  // --- Default: try network, fall back to cache ---
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })
      .catch(() => caches.match(request)),
  );
});

// Listen for messages from the page (e.g. "SKIP_WAITING" to apply updates immediately)
self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting().then(notifyClients);
  }
});
