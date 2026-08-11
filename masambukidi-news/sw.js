/**
 * ELUCCO Service Worker v16
 * HTML: network-first | Static assets: cache-first
 */
const CACHE_NAME = 'elucco-v30';
const STATIC_ASSETS = [
  '/manifest.json',
  '/masambukidi_armoiries.png',
  '/icon-192.png',
  '/icon-512.png',
  '/papa_masambukidi_couronne.jpg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS).catch(()=>{}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // ── HTML pages: NETWORK FIRST (always fresh) ──────────────────────────
  if (
    e.request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/'
  ) {
    e.respondWith(
      fetch(e.request, {cache:'no-store'})
        .catch(() => caches.match(e.request).then(r => r || caches.match('/index.html')))
    );
    return;
  }

  // ── Static assets: CACHE FIRST ─────────────────────────────────────────
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => cached);
    })
  );
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(data.title || 'ELUCCO', {
    body: data.body || 'Nouvelle notification',
    icon: '/masambukidi_armoiries.png',
    badge: '/masambukidi_armoiries.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(clients.openWindow(url));
});
