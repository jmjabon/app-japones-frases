const CACHE_NAME = 'nihongo-cache-v3';
const ASSETS = [
    './index.html',
    './manifest.json',
    './css/styles.css',
    './js/app.js',
    './js/storage.js',
    './js/audio.js',
    './js/modes/scramble.js',
    './js/modes/cloze.js',
    './data/vocab.json'
];

// Instalación: Cacheo tolerante a fallos individuales
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            for (const url of ASSETS) {
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        await cache.put(url, response);
                    } else {
                        console.warn(`[SW] No se pudo cachear (HTTP ${response.status}): ${url}`);
                    }
                } catch (err) {
                    console.warn(`[SW] Fallo al descargar para caché: ${url}`, err);
                }
            }
        })
    );
    self.skipWaiting();
});

// Activación: Limpieza de cachés antiguas (v1, v2)
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

// Intercepción de peticiones de red
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});