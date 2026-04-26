// public/sw.js
// Service Worker — Cache First לנכסים סטטיים, Network First לAPI

const CACHE_VERSION = 'sappir-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo.png',
  '/icon-192.png',
  '/icon-512.png',
];

// ── Install: cache static assets ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // אם נכס לא זמין — אל תיכשל
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_VERSION)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: cache strategy ──
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Supabase API — Network First (נתונים חיים תמיד)
  if (url.hostname.includes('supabase.co') || url.hostname.includes('supabase.io')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // אם נכשל — החזר שגיאה נקייה
        return new Response(JSON.stringify({ error: 'Offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // Unsplash / תמונות חיצוניות — Cache First
  if (url.hostname.includes('unsplash.com') || url.hostname.includes('images.')) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(c => c.put(event.request, clone));
          return response;
        }).catch(() => new Response('', { status: 503 }));
      })
    );
    return;
  }

  // JS/CSS/HTML — Cache First עם network fallback
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.jsx') ||
    url.pathname === '/' ||
    url.pathname.endsWith('.html')
  ) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        const networkFetch = fetch(event.request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then(c => c.put(event.request, clone));
          }
          return response;
        }).catch(() => cached || new Response('Offline', { status: 503 }));
        return cached || networkFetch;
      })
    );
    return;
  }

  // Default: network first
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then(c => c || new Response('', { status: 503 }))
    )
  );
});

// ── Push notifications ──
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'Sappir Fit', {
      body:    data.body   || '',
      icon:    data.icon   || '/icon-192.png',
      badge:   '/icon-192.png',
      dir:     'rtl',
      tag:     data.tag    || 'sappir-notif',
      data:    data.url    || '/',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  );
});
