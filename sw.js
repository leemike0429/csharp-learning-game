const CACHE_VERSION = 'csharp-game-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/components.css',
  './css/animations.css',
  './js/app.js',
  './js/router.js',
  './js/store.js',
  './js/ui.js',
  './js/pages/home.js',
  './js/pages/topic-select.js',
  './js/pages/level-select.js',
  './js/pages/quiz.js',
  './js/pages/fill-blank.js',
  './js/pages/matching.js',
  './js/pages/result.js',
  './js/pages/profile.js',
  './js/data/questions-basics.js',
  './js/data/questions-oop.js',
  './js/data/questions-advanced.js',
  './js/data/questions-dotnet.js',
  './js/data/achievements.js',
  './js/data/questions-loader.js',
  './icons/icon-192x192.svg',
  './icons/icon-512x512.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_VERSION)
            .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request))
  );
});
