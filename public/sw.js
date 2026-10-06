/*
 * One-time service-worker retirement script.
 *
 * Older VikasSetu deployments used an aggressive precache. This worker takes
 * control, removes those stale caches, and unregisters itself so deployed
 * fixes always reach the browser immediately.
 */
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    await Promise.all(clients.map(client => client.navigate(client.url)));
  })());
});
