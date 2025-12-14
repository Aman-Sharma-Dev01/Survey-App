// SurveyZen Service Worker - Handles offline functionality
const CACHE_NAME = 'surveyzen-offline-v1';
const OFFLINE_URL = '/offline.html';

// Files to cache for offline use
const PRECACHE_ASSETS = [
    '/offline.html',
    '/favicon.ico',
    '/logo.svg',
    '/android-chrome-192x192.png'
];

// Install event - cache offline page
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[ServiceWorker] Caching offline page');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .then(() => {
                // Force the waiting service worker to become active
                return self.skipWaiting();
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((cacheName) => cacheName !== CACHE_NAME)
                    .map((cacheName) => {
                        console.log('[ServiceWorker] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    })
            );
        }).then(() => {
            // Take control of all pages immediately
            return self.clients.claim();
        })
    );
});

// Fetch event - serve offline page when network fails
self.addEventListener('fetch', (event) => {
    // Only handle navigation requests (page loads)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    // Network failed, serve offline page
                    return caches.open(CACHE_NAME)
                        .then((cache) => {
                            return cache.match(OFFLINE_URL);
                        });
                })
        );
        return;
    }

    // For non-navigation requests, try network first, then cache
    event.respondWith(
        fetch(event.request)
            .catch(() => {
                return caches.match(event.request);
            })
    );
});

// Listen for messages from the main app
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
