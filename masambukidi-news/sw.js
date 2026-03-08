/**
 * ELUCCO Service Worker v2.0
 * PWA + Push Notifications + Offline Cache
 */
const CACHE_NAME = 'elucco-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/elucco_logo_officiel.png',
  '/masambukidi_armoiries.png',
  '/papa_masambukidi_couronne.jpg',
  '/sa_majeste_trone_1.jpg',
  '/sa_majeste_trone_2.jpg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
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

// Push notification handler
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || 'ELUCCO';
  const opts = {
    body: data.body || 'Nouvelle notification',
    icon: '/elucco_logo_officiel.png',
    badge: '/elucco_logo_officiel.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    actions: [{ action: 'open', title: 'Ouvrir', icon: '/elucco_logo_officiel.png' }],
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data && e.notification.data.url ? e.notification.data.url : '/';
  e.waitUntil(clients.openWindow(url));
});

// Background sync for scheduled notifications
self.addEventListener('sync', e => {
  if (e.tag === 'check-feast-days') {
    e.waitUntil(checkUpcomingFeasts());
  }
});

async function checkUpcomingFeasts() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const feasts = [
    { month: 1, day: 11, name: 'Date Sacrée ELUCCO — 11 Janvier' },
    { month: 3, day: 6, name: 'Naissance de Papa Samy Masambukidi — 6 Mars' },
    { month: 4, day: 28, name: 'Commémoration de Papa Samy — 28 Avril' },
    { month: 7, day: 30, name: 'Naissance de Sa Majesté Samuel I — 30 Juillet' },
    { month: 10, day: 20, name: 'Date Importante ELUCCO — 20 Octobre' },
    { month: 10, day: 30, name: 'Intronisation de Sa Majesté — 30 Octobre' },
  ];
  for (const feast of feasts) {
    const daysUntil = getDaysUntil(feast.month, feast.day);
    if (daysUntil === 1 || daysUntil === 7) {
      await self.registration.showNotification('ELUCCO — Date Sacrée', {
        body: daysUntil === 1 ? `Demain: ${feast.name}` : `Dans 7 jours: ${feast.name}`,
        icon: '/elucco_logo_officiel.png',
        badge: '/elucco_logo_officiel.png',
      });
    }
  }
}

function getDaysUntil(month, day) {
  const now = new Date();
  const target = new Date(now.getFullYear(), month - 1, day);
  if (target < now) target.setFullYear(now.getFullYear() + 1);
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
}
