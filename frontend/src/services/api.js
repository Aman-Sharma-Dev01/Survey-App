// Replace with your backend server URL

// export const BASE_URL = 'https://survey-app-egj3.onrender.com/api'; // new backend
export const BASE_URL = 'https://survey-app-e5xz.onrender.com/api'; // old backend
// export const BASE_URL = 'http://localhost:5000/api';
// Helper to access token storage directly (AuthContext stores token in localStorage)
const getAuthToken = () => localStorage.getItem('token');
const removeAuthToken = () => localStorage.removeItem('token');

// Offline queue: will store outgoing mutating requests when offline and flush them when online
import { init as initOfflineQueue, addRequest as addOfflineRequest, listenForOnline, flushQueue } from './offlineQueue';
// initialize offline queue with base URL and token getter
initOfflineQueue(BASE_URL, getAuthToken).catch((e) => console.warn('offlineQueue init failed', e));
listenForOnline();

/**
 * Generic utility function to make API requests.
 * @param {string} url - The endpoint URL segment (e.g., '/auth/login').
 * @param {string} method - HTTP method (e.g., 'GET', 'POST', 'PUT').
 * @param {object|null} data - Request body data.
 * @param {boolean} isProtected - Whether the route requires a JWT token.
 * @returns {Promise<object>} The parsed JSON response data.
 * @throws {Error} If the network request fails or the API returns a non-2xx status.
 */
export const fetchApi = async (url, method = 'GET', data = null, isProtected = false) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (isProtected) {
        const token = getAuthToken();
        if (!token) {
            // If the application expects a token but none is found, throw an error
            throw new Error('Authorization required: JWT token is missing.');
        }
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
    };

    try {
        const response = await fetch(`${BASE_URL}${url}`, config);

        if (response.status === 401) {
            // Handle unauthorized access (token expired/invalid) globally
            removeAuthToken(); // Clear token from local storage
            if (isProtected) {
                window.location.hash = '#login'; // Redirect to login page
                throw new Error('Session expired. Please log in again.');
            }
        }

        const responseData = await response.json();

        if (!response.ok) {
            // API returned a non-2xx status (e.g., 400, 404, 500)
            const err = new Error(responseData?.message || `API error on ${url}: ${response.status}`);
            // Attach full response data for callers to inspect (e.g., schedule info)
            err.data = responseData;
            throw err;
        }

        return responseData;
    } catch (error) {
        // If network error and this is a mutating request, queue it for later
        const isNetworkError = (error instanceof TypeError) || (error.message && error.message.toLowerCase().includes('network'));
        if (isNetworkError && ['POST', 'PUT', 'DELETE'].includes(method.toUpperCase())) {
            try {
                const tempId = generateTempId();
                await addOfflineRequest({
                    id: tempId,
                    url,
                    method,
                    body: data,
                    isProtected,
                    createdAt: Date.now(),
                });
                // Try to register a background sync (if supported)
                try {
                    if ('serviceWorker' in navigator && 'SyncManager' in window) {
                        const reg = await navigator.serviceWorker.ready;
                        // register a sync with a tag; include timestamp to allow multiple registrations
                        await reg.sync.register(`surveyzen-sync-${Date.now()}`);
                    } else if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                        // fallback: post message to service worker to trigger a flush when possible
                        navigator.serviceWorker.controller.postMessage({ type: 'FLUSH_QUEUED' });
                    }
                } catch (se) {
                    // ignore sync registration failures
                    console.warn('Background sync registration failed', se);
                }
                // return a minimal queued response so callers know it's queued
                return { queued: true, id: tempId };
            } catch (qe) {
                // if queuing fails, fall through and rethrow original error
                console.warn('Failed to queue request', qe);
            }
        }
        throw error;
    }
};

/**
 * Helper to POST with offline support explicitly. Returns server response or { queued: true, id }
 */
export const postWithOffline = async (url, data, isProtected = false) => {
    return fetchApi(url, 'POST', data, isProtected);
};

// API Call: DELETE /surveys/:surveyId
export const deleteSurvey = async (surveyId) => {
    return fetchApi(`/surveys/${surveyId}`, 'DELETE', null, true);
};
// Utility to create small temporary IDs used for client-side keys
export const generateTempId = () => `t_${Math.random().toString(36).slice(2,9)}_${Date.now().toString(36)}`;

// Default export compatibility wrapper
// Provides a simple `api.get/post/put/del` interface used across the frontend
const api = {
    get: (url, isProtected = false) => fetchApi(url, 'GET', null, isProtected),
    post: (url, data, isProtected = false) => fetchApi(url, 'POST', data, isProtected),
    postWithOffline: (url, data, isProtected = false) => postWithOffline(url, data, isProtected),
    put: (url, data, isProtected = false) => fetchApi(url, 'PUT', data, isProtected),
    del: (url, isProtected = false) => fetchApi(url, 'DELETE', null, isProtected),
    // expose underlying helper if needed
    fetchApi,
};

export default api;
