/* Service Worker StockPro — version 2
   Stratégie : réseau d'abord pour les pages (mises à jour rapides),
   cache d'abord pour les fichiers statiques. Hors ligne complet. */
const CACHE = "stockpro-v3";
const ASSETS = [
  ".",
  "index.html",
  "manifest.webmanifest",
  "html5-qrcode.min.js",
  "icons/icon-192.png",
  "icons/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || !req.url.startsWith(self.location.origin)) return;

  // Pages HTML : réseau d'abord, repli sur le cache si hors ligne
  if (req.mode === "navigate" || req.destination === "document") {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then(hit => hit || caches.match("index.html")))
    );
    return;
  }

  // Fichiers statiques (icônes, manifest) : cache d'abord
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match("index.html")))
  );
});
