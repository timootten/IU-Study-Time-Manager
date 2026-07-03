const CACHE_VERSION = "stm-v4";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DATA_CACHE = `${CACHE_VERSION}-data`;

// Only precache immutable static assets — never HTML pages.
// HTML embeds build-specific script references that go stale across deploys.
const PRECACHE_ASSETS = [
  "/offline.html",
  "/manifest.json",
  "/icons/app-icon.svg",
  "/icons/apple-touch-icon.svg",
  "/icons/favicon.svg",
  "/icons/mask-icon.svg",
  "/fonts/fonts.css",
  "/fonts/fraunces-500-latin.woff2",
  "/fonts/fraunces-500-latin-ext.woff2",
  "/fonts/fraunces-700-latin.woff2",
  "/fonts/fraunces-700-latin-ext.woff2",
  "/fonts/manrope-400-latin.woff2",
  "/fonts/manrope-400-latin-ext.woff2",
  "/fonts/manrope-500-latin.woff2",
  "/fonts/manrope-500-latin-ext.woff2",
  "/fonts/manrope-600-latin.woff2",
  "/fonts/manrope-600-latin-ext.woff2",
  "/fonts/manrope-700-latin.woff2",
  "/fonts/manrope-700-latin-ext.woff2",
  "/fonts/manrope-800-latin.woff2",
  "/fonts/manrope-800-latin-ext.woff2",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE_ASSETS)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => !key.startsWith(CACHE_VERSION))
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

// Hashed production assets are immutable (e.g. /assets/vendor-react-Ab3kZ9.js)
function isImmutableAsset(pathname) {
  return /^\/assets\/.+-[a-zA-Z0-9_-]{8,}\.\w+$/.test(pathname);
}

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  // Skip Vite dev-server internals and source files
  if (
    url.pathname.startsWith("/node_modules/") ||
    url.pathname.startsWith("/@") ||
    url.pathname.startsWith("/__vite") ||
    url.pathname.startsWith("/src/")
  ) {
    return;
  }

  // Navigation → network-only, offline fallback
  if (request.mode === "navigate") {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Server functions & auth → network-only
  if (url.pathname.startsWith("/_serverFn") || url.pathname.startsWith("/api/auth")) {
    event.respondWith(networkOnly(request));
    return;
  }

  // API data → network-first
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, DATA_CACHE, 5000));
    return;
  }

  // Hashed build assets (immutable) → cache-first
  if (isImmutableAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  const destination = request.destination;

  // Fonts & images → cache-first
  if (destination === "font" || destination === "image") {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Non-hashed scripts/styles → network-first to avoid stale code
  if (destination === "script" || destination === "style" || destination === "worker") {
    event.respondWith(networkFirst(request, STATIC_CACHE, 3000));
    return;
  }
});

async function handleNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    const offlinePage = await caches.match("/offline.html");
    if (offlinePage) return offlinePage;
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

async function networkFirst(request, cacheName, timeoutMs) {
  try {
    const response = await fetchWithTimeout(request, timeoutMs);

    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }

    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 504, statusText: "Offline" });
  }
}

function fetchWithTimeout(request, timeoutMs) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error("timeout")), timeoutMs);

    fetch(request)
      .then((response) => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

// ── Push Notifications ────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();
    const { title, body, icon, badge, tag, data } = payload;

    event.waitUntil(
      self.registration.showNotification(title, {
        body: body || "",
        icon: icon || "/icons/app-icon.svg",
        badge: badge || "/icons/app-icon.svg",
        tag: tag || "study-session",
        vibrate: [200, 100, 200],
        requireInteraction: true,
        data: data || {},
      }),
    );
  } catch {
    // If JSON parsing fails, show a generic notification
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification("Study Time Manager", {
        body: text,
        icon: "/icons/app-icon.svg",
        badge: "/icons/app-icon.svg",
      }),
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/dashboard/timer";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Focus an existing window if one matches our origin
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus().then(() => client.navigate(urlToOpen));
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    }),
  );
});
