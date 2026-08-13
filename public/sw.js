/* VBNB PWA service worker — installability only (no aggressive caching). */
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// No fetch handler on purpose. A pass-through `respondWith(fetch(request))`
// rejects whenever the browser aborts a request — which Next.js does routinely
// for RSC prefetches — surfacing as random "This page couldn't load" errors.
// Chrome 108+ (mobile) / 112+ (desktop) no longer require one to install.
