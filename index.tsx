import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Target container 'root' not found. Check index.html.");
}

try {
  const root = createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("Critical Failure during application mount:", error);
}

// Service Worker Registration - Relative path to resolve same-origin scope issues
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(reg => {
        console.log('SMP-AI Kernel Service Worker Active:', reg.scope);
      })
      .catch(err => {
        console.warn('Service Worker registration deferred:', err.message);
      });
  });
}