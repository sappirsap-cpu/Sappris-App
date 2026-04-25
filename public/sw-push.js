// public/sw-push.js
// Service Worker לטיפול ב-Push Notifications
// יש להעלות לשורש האתר (public/) כדי שיהיה זמין ב-/sw-push.js

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Sappir Fit', body: event.data ? event.data.text() : 'תזכורת חדשה' };
  }

  const title = data.title || 'Sappir Fit';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'sappir',
    lang: 'he',
    dir: 'rtl',
    data: data.url ? { url: data.url } : {},
    requireInteraction: false,
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
