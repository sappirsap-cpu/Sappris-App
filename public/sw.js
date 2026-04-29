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
  const notif = event.notification;
  const action = event.action;
  const data = notif.data || {};

  notif.close();

  // לחיצה על "סגור" — פשוט סוגר
  if (action === 'dismiss') return;

  // האם צריך להוסיף מים?
  const shouldAddWater = action === 'add_water_250' ||
                         (data.action === 'add_water');

  // URL ייעד
  let targetUrl = '/';
  if (shouldAddWater) {
    targetUrl = '/?action=add_water&amount=' + (data.amount_ml || 250);
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // אם יש כבר חלון פתוח — שלח אליו message ופוקס
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) || client.url.startsWith(self.location.origin)) {
            return client.focus().then(() => {
              if (shouldAddWater) {
                client.postMessage({ type: 'add_water', amount_ml: data.amount_ml || 250 });
              }
            });
          }
        }
        // אחרת פתח חדש
        return self.clients.openWindow(targetUrl);
      })
  );
});
