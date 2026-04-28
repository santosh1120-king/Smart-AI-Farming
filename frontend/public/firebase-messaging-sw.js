/**
 * Firebase Cloud Messaging Service Worker
 * This enables browser push notifications even when the website is closed.
 *
 * When you add Firebase credentials later:
 * 1. This file will need to import Firebase SDK and initialize messaging
 * 2. It handles background messages (when browser is closed)
 * 3. For now, it acts as a placeholder so the browser doesn't error
 *
 * To activate: Create a Firebase project, get your web config,
 * and update this file with the initialization code.
 */

// Placeholder - doesn't do anything until Firebase is configured
// When you add Firebase later, replace this with real FCM setup

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Basic service worker functionality
// TODO: Replace with Firebase messaging when you get credentials
