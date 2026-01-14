import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast';
import './index.css'
import App from './App.jsx'

// Service Worker Management
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // First, unregister any old/malicious service workers (sw.js, etc.)
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        // Unregister service workers that are NOT our main service-worker.js
        if (registration.active && 
            !registration.active.scriptURL.endsWith('/service-worker.js')) {
          console.log('Unregistering old/invalid service worker:', registration.active.scriptURL);
          await registration.unregister();
        }
      }

      // Clear all old caches to ensure fresh content
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        // Keep only caches that match our current version pattern
        if (!cacheName.startsWith('surveyzen-offline-v3')) {
          console.log('Deleting old cache:', cacheName);
          await caches.delete(cacheName);
        }
      }

      // Now register our service worker
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        updateViaCache: 'none' // Always fetch fresh service worker
      });
      
      console.log('ServiceWorker registered successfully:', registration.scope);

      // Check for updates immediately
      registration.update();

      // When a new service worker is available, activate it immediately
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker installed, tell it to skip waiting
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });

      // Refresh page when new service worker takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });

    } catch (error) {
      console.log('ServiceWorker registration failed:', error);
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Toaster position="top-right" />
    <App />
  </StrictMode>,
)
