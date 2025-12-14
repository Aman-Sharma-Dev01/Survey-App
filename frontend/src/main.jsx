import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast';
import './index.css'
import App from './App.jsx'

// Register Service Worker for offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('ServiceWorker registered successfully:', registration.scope);
      })
      .catch((error) => {
        console.log('ServiceWorker registration failed:', error);
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Toaster position="top-right" />
    <App />
  </StrictMode>,
)
