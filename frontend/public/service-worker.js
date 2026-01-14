// SurveyZen Service Worker - Handles offline functionality
// IMPORTANT: Increment version whenever you deploy new changes to force cache refresh
const CACHE_VERSION = 'v3';
const CACHE_NAME = `surveyzen-offline-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Files to cache for offline use - only static assets, NOT HTML pages
const PRECACHE_ASSETS = [
    '/offline.html',
    '/favicon.ico',
    '/logo.svg',
    '/android-chrome-192x192.png'
];

// Normalize URLs - remove trailing slashes for consistency
const normalizeUrl = (url) => {
    const urlObj = new URL(url);
    // Remove trailing slash except for root
    if (urlObj.pathname !== '/' && urlObj.pathname.endsWith('/')) {
        urlObj.pathname = urlObj.pathname.slice(0, -1);
    }
    return urlObj.href;
};

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
// NETWORK-FIRST strategy for HTML to always get fresh content
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);
    
    // Skip caching for API requests and external resources
    if (requestUrl.origin !== location.origin || 
        requestUrl.pathname.startsWith('/api')) {
        return;
    }

    // Only handle navigation requests (page loads)
    if (event.request.mode === 'navigate') {
        event.respondWith(
            // Always try network first for navigation - ensures fresh content
            fetch(event.request, { cache: 'no-store' })
                .then((response) => {
                    // Got a response from network, return it
                    return response;
                })
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

    // For non-navigation requests (assets), try network first, then cache
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
