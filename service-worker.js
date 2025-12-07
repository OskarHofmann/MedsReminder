const CACHE_NAME = 'medication-reminder-v2';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log('Cache install error:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'TEST_NOTIFICATION') {
    sendTestNotification();
  } else if (event.data && event.data.type === 'SEND_REMINDER') {
    sendReminderNotification(event.data.data);
  }
});

// Send test notification
function sendTestNotification() {
  self.registration.showNotification('Medikamenten-Erinnerung', {
    body: 'Test-Benachrichtigung erfolgreich! 🎉',
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'test-notification',
    requireInteraction: false
  });
}

// Send reminder notification
function sendReminderNotification(data) {
  const { remaining, total, completed } = data;
  
  const options = {
    body: `Sie haben noch ${remaining.length} von ${total} Medikament(en) zu nehmen:\n${remaining.join(', ')}`,
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'medication-reminder',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'Anzeigen'
      },
      {
        action: 'dismiss',
        title: 'Schließen'
      }
    ],
    data: {
      url: './'
    }
  };

  self.registration.showNotification('⏰ Medikamenten-Erinnerung', options);
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if app is already open
          for (let client of clientList) {
            if (client.url === self.registration.scope && 'focus' in client) {
              return client.focus();
            }
          }
          // Open new window if not
          if (clients.openWindow) {
            return clients.openWindow('./');
          }
        })
    );
  }
});

// Background sync for notifications (optional enhancement)
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-medications') {
    event.waitUntil(checkMedicationsStatus());
  }
});

async function checkMedicationsStatus() {
  // This could be enhanced to check medication status in the background
  console.log('Background sync: checking medications');
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-medication-check') {
    event.waitUntil(checkMedicationsStatus());
  }
});
