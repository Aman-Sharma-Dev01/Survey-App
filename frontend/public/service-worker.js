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

// Background Sync: attempt to flush queued requests stored in IndexedDB
self.addEventListener('sync', (event) => {
    if (event.tag && event.tag.startsWith('surveyzen-sync')) {
        event.waitUntil(flushQueuedRequests());
    }
});

// Allow page to request immediate flush via message
self.addEventListener('message', (event) => {
    if (!event.data) return;
    if (event.data.type === 'FLUSH_QUEUED') {
        event.waitUntil(flushQueuedRequests());
    }
});

async function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open('surveyzen-offline-db', 1);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('requests')) {
                db.createObjectStore('requests', { keyPath: 'id' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function getAllRequests() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('requests', 'readonly');
        const store = tx.objectStore('requests');
        const r = store.getAll();
        r.onsuccess = () => resolve(r.result || []);
        r.onerror = () => reject(r.error);
    });
}

async function deleteRequest(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('requests', 'readwrite');
        const store = tx.objectStore('requests');
        const r = store.delete(id);
        r.onsuccess = () => resolve();
        r.onerror = () => reject(r.error);
    });
}

async function flushQueuedRequests() {
    try {
        const items = await getAllRequests();
        if (!items || items.length === 0) return;
        // Attempt to send each queued request
        for (const item of items) {
            try {
                const headers = { 'Content-Type': 'application/json' };
                if (item.isProtected && item.token) {
                    headers['Authorization'] = `Bearer ${item.token}`;
                }
                const res = await fetch(item.url, {
                    method: item.method,
                    headers,
                    body: item.body ? JSON.stringify(item.body) : undefined,
                    credentials: 'include'
                });
                if (res && res.ok) {
                    await deleteRequest(item.id);
                }
            } catch (err) {
                // network error - stop and retry later
                console.warn('ServiceWorker: failed to send queued request', err);
                return;
            }
        }
    } catch (e) {
        console.error('ServiceWorker flushQueuedRequests failed', e);
    }
}
