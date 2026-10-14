/* ============================================================
   Classroom Tools Hub — Service Worker
   ============================================================
   Strategies:
   - App shell (HTML, JS, CSS, _next/static) → stale-while-revalidate
   - Static media (sounds, icons, fonts)        → cache-first
   - Navigation (page loads)                     → network-first, fallback to cached shell

   The SW only activates in production builds.
   ============================================================ */

const VERSION = "v1.5.25";
const STATIC_CACHE = `cth-static-${VERSION}`;
const RUNTIME_CACHE = `cth-runtime-${VERSION}`;

// Assets to pre-cache on install (app shell + classroom-critical media)
const PRECACHE_URLS = [
  "/images/manga-icons/bitmap-classic.png",
  "/images/manga-icons/bitmap-stopwatch.png",
  "/images/manga-icons/bitmap-rocket.png",
  "/images/manga-icons/bitmap-bomb.png",
  "/images/manga-icons/bitmap-candle.png",
  "/images/manga-icons/bitmap-hourglass.png",
  "/images/manga-icons/bitmap-circle.png",
  "/images/manga-icons/bitmap-snail-race.png",
  "/images/manga-icons/bitmap-traffic-light.png",
  "/images/manga-icons/bitmap-bar.png",
  "/images/manga-icons/bitmap-enter-names.png",
  "/images/manga-icons/bitmap-name-picker.png",
  "/images/manga-icons/bitmap-group-generator.png",
  "/images/manga-icons/bitmap-student-shuffler.png",
  "/images/manga-icons/bitmap-chance-games.png",
  "/images/manga-icons/bitmap-custom-dice.png",
  "/images/manga-icons/bitmap-spinner-wheel.png",
  "/images/manga-icons/bitmap-color-generator.png",
  "/images/manga-icons/bitmap-tally-counter.png",
  "/images/manga-icons/bitmap-stopwatch-splits.png",
  "/images/manga-icons/bitmap-math-facts.png",
  "/images/manga-icons/bitmap-letter-cards.png",
  "/images/manga-icons/bitmap-flash-card-presenter.png",
  "/images/manga-icons/bitmap-weather-cards.png",
  "/images/manga-icons/bitmap-custom-dashboard.png",
  "/images/manga-icons/bitmap-activity-hub.png",
  "/images/manga-icons/bitmap-pe-english-hub.png",
  "/images/manga-icons/bitmap-sound-pad.png",
  "/images/manga-icons/bitmap-audio-player.png",
  "/",
  "/manifest.json",
  "/sounds/ministar-i-can.mp3",
  "/images/i-can/flashcard_jump.png",
  "/images/i-can/flashcard_run.png",
  "/images/i-can/flashcard_stretch.png",
  "/images/i-can/flashcard_spin.png",
  "/images/i-can/flashcard_walk.png",
  "/images/i-can/flashcard_cook.png",
  "/images/i-can/flashcard_climb.png",
  "/images/i-can/flashcard_sing.png",
  "/images/i-can/flashcard_dance.png",
  "/images/i-can/flashcard_swim.png",
  "/images/i-can/flashcard_bonus_do_it_all.png",
  "/sounds/word-l.mp3?v=clean-1",
  "/icons/icon-32.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-192.png",
  "/icons/maskable-512.png",
  // Sound pad audio files (verified by npm run verify:sounds)
  "/sounds/cheer.mp3",
  "/sounds/clap.mp3",
  "/sounds/spoken-great-job.mp3",
  "/sounds/spoken-wrong.mp3",
  "/sounds/spoken-correct.mp3",
  "/sounds/spoken-wow.mp3",
  "/sounds/spoken-lets-play.mp3",
  "/sounds/laugh.mp3",
  "/sounds/ding.mp3",
  "/sounds/boop.mp3",
  "/sounds/buzzer.mp3",
  "/sounds/spring.mp3",
  "/sounds/heartbeat.mp3",
  "/sounds/gameshow.mp3",
  "/sounds/spoken-times-up.mp3",
  "/sounds/sparkle.mp3",
  "/sounds/whoosh.mp3",
  "/sounds/alarm.mp3",
  "/sounds/spoken-true.mp3",
  "/sounds/spoken-false.mp3",
  "/sounds/spoken-yes.mp3",
  "/sounds/spoken-no.mp3",
  "/sounds/spoken-maybe.mp3",
  "/sounds/spoken-try-again.mp3",
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
  "/sounds/timer-60.wav",
  "/sounds/timer-45.wav",
  "/sounds/timer-30.wav",
  "/sounds/elapsed-60.wav",
  "/sounds/elapsed-45.wav",
  "/sounds/elapsed-30.wav",
  "/sounds/card-shuffle.wav",
  "/sounds/card-turn.wav",
  "/sounds/dice-roll.wav",
  "/sounds/classic-finish.wav",
  "/sounds/rocket-finish.wav",
  "/sounds/bomb-finish.wav",
  "/sounds/candle-finish.wav",
  "/sounds/hourglass-finish.wav",
  "/sounds/circle-finish.wav",
  "/sounds/traffic-finish.wav",
  "/sounds/bar-finish.wav",
  "/sounds/pe-finish.wav",
  "/sounds/tally-finish.wav",
  "/sounds/stopwatch-lap.wav",
  // Weather flashcard images
  "/images/weather/sunny.gif",
  "/images/weather/cloudy.gif",
  "/images/weather/rainy.gif",
  "/images/weather/snowy.gif",
  "/images/weather/windy.gif",
  "/images/weather/stormy.gif",
  "/images/weather/hot.gif",
  "/images/weather/cold.gif",
  // Letter Card Generator physical card images
  "/images/cards/card-a.png",
  "/images/cards/card-b.png",
  "/images/cards/card-c.png",
  "/images/cards/card-d.png",
  "/images/cards/card-e.png",
  "/images/cards/card-f.png",
  "/images/cards/card-g.png",
  "/images/cards/card-h.png",
  "/images/cards/card-i.png",
  "/images/cards/card-j.png",
  "/images/cards/card-k.png",
  "/images/cards/card-l.png",
  "/images/cards/card-m.png",
  "/images/cards/card-n.png",
  "/images/cards/card-o.png",
  "/images/cards/card-p.png",
  "/images/cards/card-q.png",
  "/images/cards/card-r.png",
  "/images/cards/card-s.png",
  "/images/cards/card-t.png",
  "/images/cards/card-u.png",
  "/images/cards/card-v.png",
  "/images/cards/card-w.png",
  "/images/cards/card-x.png",
  "/images/cards/card-y.png",
  "/images/cards/card-z.png",
];

// Install — pre-cache the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      // Do not activate an update without a usable offline app shell.
      await cache.add("/");
      await Promise.allSettled(PRECACHE_URLS.filter((url) => url !== "/").map((url) => cache.add(url)));
    }).then(() => self.skipWaiting()),
  );
});

// Activate — clean up old caches and take control
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      const versions = [...new Set(keys.map((key) => key.match(/^cth-(?:static|runtime)-(.+)$/)?.[1])
        .filter((version) => version && version !== VERSION))];
      versions.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      const previous = versions[versions.length - 1];
      // Keep the previous build's chunks for tabs still running that build.
      const keep = new Set([STATIC_CACHE, RUNTIME_CACHE, `cth-static-${previous}`, `cth-runtime-${previous}`]);
      return Promise.all(keys.filter((key) => /^cth-(static|runtime)-/.test(key) && !keep.has(key))
        .map((key) => caches.delete(key)));
    }).then(() => self.clients.claim()),
  );
});

// Helper — tell all open tabs an update is ready
const notifyClients = async () => {
  const clients = await self.clients.matchAll({ includeUncontrolled: true });
  clients.forEach((client) => client.postMessage({ type: "SW_UPDATED" }));
};

async function storeResponse(cacheName, request, response) {
  // Cache.put rejects partial responses; Safari media uses Range requests.
  if (response.status !== 200) return;
  try {
    const copy = response.clone();
    const cache = await caches.open(cacheName);
    await cache.put(request, copy);
  } catch { /* Storage pressure must not break online playback or startup. */ }
}

async function cachedRange(response, range) {
  const bytes = await response.arrayBuffer();
  const size = bytes.byteLength;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  let start = match?.[1] ? Number(match[1]) : 0;
  let end = match?.[2] ? Number(match[2]) : size - 1;
  if (match && !match[1] && match[2]) {
    start = Math.max(0, size - Number(match[2]));
    end = size - 1;
  }
  if (!match || (!match[1] && !match[2]) || start >= size || end < start || !Number.isSafeInteger(start) || !Number.isSafeInteger(end)) {
    return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
  }
  end = Math.min(end, size - 1);
  const headers = new Headers(response.headers);
  headers.delete("Content-Encoding");
  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Content-Length", String(end - start + 1));
  headers.set("Accept-Ranges", "bytes");
  return new Response(bytes.slice(start, end + 1), { status: 206, headers });
}

async function navigationFallback(request) {
  const runtime = await caches.open(RUNTIME_CACHE);
  const shell = await caches.open(STATIC_CACHE);
  return await runtime.match(request) || await shell.match("/") ||
    await caches.match(request) || await caches.match("/") ||
    new Response("Classroom Tools Hub is offline. Reconnect and try again. Saved class data has not been cleared.",
      { status: 503, headers: { "Content-Type": "text/plain;charset=utf-8" } });
}

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
  if (request.headers.get("RSC") === "1") return;

  // --- Navigation requests (page loads): network-first, fall back to cached shell ---
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status >= 500) return navigationFallback(request);
          event.waitUntil(storeResponse(RUNTIME_CACHE, request, response));
          return response;
        })
        .catch(() => navigationFallback(request)),
    );
    return;
  }

  // --- Sounds: cache-first (offline-critical) ---
  if (url.pathname.startsWith("/sounds/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return request.headers.has("Range") ? cachedRange(cached, request.headers.get("Range")) : cached;
        return fetch(request).then((response) => {
          event.waitUntil(storeResponse(STATIC_CACHE, request, response));
          return response;
        }).catch(() => new Response(null, { status: 503 }));
      }),
    );
    return;
  }

  // --- Images, icons & manifest: cache-first ---
  if (url.pathname.startsWith("/images/") || url.pathname.startsWith("/icons/") || url.pathname === "/manifest.json") {
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
              event.waitUntil(storeResponse(RUNTIME_CACHE, request, response));
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
