/**
 * Service Worker for Xuan Shu
 * This provides the baseline PWA functionality required for "Install" prompts.
 */

const CACHE_NAME = 'xuanshu-v1';

// Install event: skip waiting to activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event: claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Fetch event: Network-first or simply pass-through
// Required for the browser to consider this a valid PWA
self.addEventListener('fetch', (event) => {
  // Simple pass-through to ensure online functionality remains standard
  event.respondWith(fetch(event.request));
});
