const CACHE_NAME = 'nihongo-cache-v5';
const ASSETS = [
    './index.html',
    './manifest.json',
    './css/styles.css',
    './js/app.js',
    './js/storage.js',
    './js/audio.js',
    './js/modes/scramble.js',
    './js/modes/cloze.js',
    './js/modes/slot.js',
    './js/modes/roleplay.js',
    './js/modes/dictation.js',
    './data/vocab.json',
    './data/templates.json',
    './data/roleplay.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            for (const url of ASSETS) {
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        await cache.put(url, response);
                    }
                } catch (err) {
                    console.warn(`[SW] Fallo al cachear: ${url}`, err);
                }
            }
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});