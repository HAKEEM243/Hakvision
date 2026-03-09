/**
 * ELUCCO Service Worker v12
 * Cache uniquement les assets statiques — PAS index.html
 */
const CACHE_NAME = 'elucco-v13';
const ASSETS = [
  '/manifest.json',
  '/elucco_logo_officiel.png',
  '/masambukidi_armoiries.png',
  '/papa_masambukidi_couronne.jpg',
  '/sa_majeste_trone_1.jpg',
  '/sa_majeste_trone_2.jpg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // JAMAIS mettre en cache les pages HTML — toujours aller au réseau
  if (
    e.request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/' ||
    url.pathname === '/article' ||
    url.pathname === '/article-6mars' ||
    url.pathname === '/article-vive6mars'
  ) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Assets statiques : cache first
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

// Push notifications
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || 'ELUCCO';
  const opts = {
    body: data.body || 'Nouvelle notification',
    icon: '/masambukidi_armoiries.png',
    badge: '/masambukidi_armoiries.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data && e.notification.data.url ? e.notification.data.url : '/';
  e.waitUntil(clients.openWindow(url));
});
