"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (/sw.js) so the app:
 *  - Loads instantly on repeat visits (cache-first for shell assets)
 *  - Works offline (sounds, icons, fonts all cached)
 *  - Is installable as a PWA on Android tablets, iPads, and Chromebooks
 *
 * The registration only happens in production builds — in dev (next dev)
 * the SW is skipped to avoid caching hot-reloaded assets.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    // Wait until the page has fully loaded before registering — defer to keep
    // first-paint snappy on slow tablets.
    let disposed = false;
    let updateTimer: ReturnType<typeof setInterval> | undefined;
    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((reg) => {
          if (disposed) return;
          // Ask for a fresh worker immediately, then periodically. This helps
          // iOS home-screen installs pick up Vercel deployments without waiting.
          reg.update().catch(() => {});
          updateTimer = setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
        })
        .catch((err) => {
          // SW registration failure is non-fatal — the app still works online
          console.warn("[PWA] Service worker registration failed:", err);
        });
    };

    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad, { once: true });
    }
    return () => {
      disposed = true;
      window.removeEventListener("load", onLoad);
      if (updateTimer) clearInterval(updateTimer);
    };
  }, []);

  return null;
}
