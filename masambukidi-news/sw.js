/**
 * ELUCCO Service Worker v3.0
 * PWA + Push Notifications — réseau prioritaire pour les pages,
 * cache pour les seuls actifs statiques (images, logos).
 */
const CACHE_NAME = 'elucco-v4';
const STATIC_ASSETS = [
  '/manifest.json',
  '/elucco_logo_officiel.png',
  '/masambukidi_armoiries.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
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
  if (url.origin !== self.location.origin) return;

  // Pages HTML (navigation) et JS/CSS : toujours le réseau d'abord,
  // pour que chaque déploiement soit visible immédiatement. Le cache
  // ne sert que si le réseau est indisponible (mode hors-ligne).
  const isNavigation = e.request.mode === 'navigate' || e.request.destination === 'document';
  const isCode = e.request.destination === 'script' || e.request.destination === 'style';
  if (isNavigation || isCode) {
    e.respondWith(
      fetch(e.request).then(resp => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Images et autres actifs statiques : cache d'abord (rapide),
  // mise à jour du cache en arrière-plan.
  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(resp => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => cached);
      return cached || network;
    })
  );
});

// Push notification handler
self.addEventListener('push', e => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) { data = {}; }
  const title = data.title || 'ELUCCO';
  const opts = {
    body: data.body || 'Nouvelle activite sur le site',
    icon: '/elucco_logo_officiel.png',
    badge: '/elucco_logo_officiel.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/' },
    // Un meme article regroupe ses notifications au lieu de les empiler.
    tag: data.tag || 'elucco',
    renotify: true,
    actions: [{ action: 'open', title: 'Ouvrir', icon: '/elucco_logo_officiel.png' }],
  };
  e.waitUntil(self.registration.showNotification(title, opts));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data && e.notification.data.url ? e.notification.data.url : '/';
  // Si le site est deja ouvert, on y navigue au lieu d'ouvrir un nouvel onglet.
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) {
          if ('navigate' in client) client.navigate(url).catch(() => {});
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
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
