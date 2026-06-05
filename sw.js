// BadForgery service worker — network-first, no caching.
// Every fetch goes to the network fresh; cache is only a fallback
// when the network is completely unavailable.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request, { cache: 'no-store' })
      .catch(() => caches.match(event.request))
  );
});
