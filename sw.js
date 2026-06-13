const CACHE = 'hakvision-v4';
const PRECACHE = [
  '/',
  '/index.html',
  '/style-shared.css',
  '/bio.html',
  '/livres.html',
  '/catalogue.html',
  '/katiopa.html',
  '/prix-litteraires.html',
  '/contact.html',
  '/press.html',
  '/papa-masambukidi.html',
  '/okapiplay.html',
  '/merci.html',
  '/oeil-tome2.html',
  '/oeil-kulala.html',
  '/diaku.html',
  '/un-ecrivain-kinshasa.html',
  '/congo-martyrs.html',
  '/politique-magazine.html',
  '/kamerun-1945.html',
  '/zikila.html',
  '/jumeaux-infini.html',
  '/katiopa_cover_hq.jpg',
  '/merveil_photo_officielle.jpg',
  '/oeil_tome2_cover.jpg',
  '/diaku_cover.jpg',
  '/favicon.ico'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first pour les HTML, cache-first pour les assets
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const isHTML = url.pathname.endsWith('.html') || url.pathname === '/';

  if (isHTML) {
    // Network-first : toujours essayer le réseau d'abord pour les pages
    e.respondWith(
      fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match(e.request))
    );
  } else {
    // Cache-first pour les images et CSS
    e.respondWith(
      caches.match(e.request).then(cached => {
        const network = fetch(e.request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        });
        return cached || network;
      })
    );
  }
});
