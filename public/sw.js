const CACHE_NAME = 'heimdal-spilletid-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://via.placeholder.com/192x192/E55A1B/FFFFFF?text=Heimdal',
  'https://via.placeholder.com/512x512/E55A1B/FFFFFF?text=Heimdal'
];
// Install: Open cache and add core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});
// Fetch: Apply caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  event.respondWith((async () => {
    try {
      // For API calls, use a stale-while-revalidate strategy
      if (request.url.includes('/api/')) {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(request);
        const fetchPromise = fetch(request).then(networkResponse => {
          cache.put(request, networkResponse.clone());
          return networkResponse;
        });
        return cachedResponse || fetchPromise;
      }
      // For navigation requests, use network-first, then cache, then fallback
      if (request.mode === 'navigate') {
        const networkResponse = await fetch(request);
        const responseToCache = networkResponse.clone();
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, responseToCache);
        return networkResponse;
      }
      // For other requests (CSS, JS, images), use cache-first
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      const networkResponse = await fetch(request);
      const responseToCache = networkResponse.clone();
      cache.put(request, responseToCache);
      return networkResponse;
    } catch (error) {
      console.error('SW fetch error:', error, 'for request:', request.url);
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
      if (request.mode === 'navigate') {
        return await caches.match('/index.html');
      }
      // For other failed requests, return a simple error response
      return new Response('Network error', {
        status: 408,
        headers: { 'Content-Type': 'text/plain' },
      });
    }
  })());
});
// Activate: Clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
// Background Sync (conceptual - requires registration from client-side)
self.addEventListener('sync', event => {
  if (event.tag === 'oplog-sync') {
    console.log('Background sync triggered for oplog-sync');
    // This is where you would put the logic to sync data with the server.
    // The actual implementation is in `src/lib/sync.ts` which runs in the window context.
  }
});
self.addEventListener('online', () => {
    console.log('App is online, attempting to sync...');
    // You can trigger a sync here if needed, but the app's online listener should handle it.
});