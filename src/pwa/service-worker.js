// __CACHE_VERSION__ is replaced by the build script with a hash of the offline assets.
const CACHE = "dentprep-offline-__CACHE_VERSION__";
const OFFLINE_FILES = ["/offline.html", "/offline.css", "/offline.js", "/icon.svg", "/icon-192.png", "/icon-512.png", "/manifest.webmanifest"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(OFFLINE_FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("dentprep-offline-") && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);
  // Never intercept API calls, server functions, other origins or mutations.
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    // Authenticated HTML is network-only; the fallback is a separate public reading shelf.
    event.respondWith(fetch(request).catch(() => caches.match("/offline.html")));
    return;
  }
  if (OFFLINE_FILES.includes(url.pathname) && !url.search) {
    event.respondWith(caches.match(request).then(cached => cached || fetch(request)));
  }
});
