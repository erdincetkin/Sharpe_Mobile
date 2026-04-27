// Sharpe Optimizer Mobile - service worker
// Cache-first for the app shell so the page works offline once installed.
// Bump CACHE_VERSION when you ship a new app build to force clients to refresh.

const CACHE_VERSION = 'sharpe-mobile-v3';
const SHELL = [
  './',
  './sharpe-optimizer-mobile.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', evt => {
  // Only handle GET requests
  if (evt.request.method !== 'GET') return;
  evt.respondWith(
    caches.match(evt.request).then(cached => {
      if (cached) return cached;
      return fetch(evt.request).then(resp => {
        // Opportunistically cache successful responses for shell-like resources
        if (resp.ok && (evt.request.url.startsWith(self.location.origin) || evt.request.url.includes('cdnjs.cloudflare.com'))) {
          const clone = resp.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(evt.request, clone));
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
