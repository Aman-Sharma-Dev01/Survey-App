// Minimal IndexedDB-based offline request queue
const DB_NAME = 'surveyzen-offline-db';
const STORE_NAME = 'requests';
let dbPromise = null;
let baseUrl = '';
let getToken = null;

function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
    return dbPromise;
}

async function addRequest(item) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const r = store.add(item);
        r.onsuccess = () => resolve(item.id);
        r.onerror = () => reject(r.error);
    });
}

async function getAllRequests() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const r = store.getAll();
        r.onsuccess = () => resolve(r.result || []);
        r.onerror = () => reject(r.error);
    });
}

async function deleteRequest(id) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const r = store.delete(id);
        r.onsuccess = () => resolve();
        r.onerror = () => reject(r.error);
    });
}

async function init(base, tokenGetter) {
    baseUrl = base;
    getToken = tokenGetter;
    await openDB();
}

async function flushQueue() {
    if (!navigator.onLine) return;
    const items = await getAllRequests();
    for (const item of items) {
        try {
            const headers = { 'Content-Type': 'application/json' };
            if (item.isProtected && getToken) {
                const token = getToken();
                if (token) headers['Authorization'] = `Bearer ${token}`;
            }
            const res = await fetch(`${baseUrl}${item.url}`, {
                method: item.method,
                headers,
                body: item.body ? JSON.stringify(item.body) : undefined,
            });
            if (res.ok) {
                await deleteRequest(item.id);
            } else {
                // leave it in queue; could add attempt counter here
                console.warn('OfflineQueue: request failed, will retry later', item.id, res.status);
            }
        } catch (err) {
            // network error; stop processing further
            console.warn('OfflineQueue: network error while flushing, will retry later', err);
            return;
        }
    }
}

function listenForOnline() {
    // flush when browser regains connectivity
    window.addEventListener('online', () => {
        flushQueue().catch((e) => console.error('flushQueue failed', e));
    });
}

export { init, addRequest, getAllRequests, deleteRequest, flushQueue, listenForOnline };
