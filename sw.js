const CACHE = 'hakvision-v1';
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
  '/katiopa_cover_hq.jpg',
  '/merveil_photo_officielle.jpg',
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

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
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
});
