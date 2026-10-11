const CACHE_VERSION = "spl3gear-pwa-v16";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./SRC/styles.css",
  "./SRC/data/catalog.js",
  "./SRC/data/sendou-data.js",
  "./SRC/state.js",
  "./SRC/utils.js",
  "./SRC/calculations.js",
  "./SRC/operations.js",
  "./SRC/renderer.js",
  "./SRC/app.js",
  "./asset/asset_manifest.json",
  "./asset/pwa/icon-180.png",
  "./asset/pwa/icon-192.png",
  "./asset/pwa/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      await cache.addAll(APP_SHELL);
      try {
        const response = await fetch("./asset/asset_manifest.json", { cache: "no-store" });
        const manifest = await response.json();
        const assetUrls = (manifest.assets || [])
          .map((asset) => asset.File)
          .filter(Boolean)
          .map((file) => `./asset/${file}`);
        await cache.addAll(assetUrls);
      } catch (error) {
        console.warn("Optional asset pre-cache failed:", error);
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(async () => {
        return (await caches.match("./index.html")) || Response.error();
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
