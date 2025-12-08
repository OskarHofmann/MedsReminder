const CACHE_NAME = 'medication-reminder-v3';
const urlsToCache = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Store for reminder check
let reminderCheckInterval = null;

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
  } else if (event.data && event.data.type === 'SCHEDULE_REMINDER') {
    // Start periodic checking when app requests it
    scheduleReminderCheck(event.data.reminderTime);
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

// Schedule reminder check in service worker
function scheduleReminderCheck(reminderTime) {
  // Clear existing interval
  if (reminderCheckInterval) {
    clearInterval(reminderCheckInterval);
  }
  
  // Check every minute
  reminderCheckInterval = setInterval(() => {
    checkIfTimeForReminder(reminderTime);
  }, 60000);
  
  // Also check immediately
  checkIfTimeForReminder(reminderTime);
  
  console.log('Reminder check scheduled for:', reminderTime);
}

async function checkIfTimeForReminder(reminderTime) {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const today = now.toDateString();
  
  // Get last reminder sent date from IndexedDB or cache
  const lastSent = await getLastReminderDate();
  
  if (currentTime === reminderTime && lastSent !== today) {
    await checkMedicationsStatus();
    await setLastReminderDate(today);
  }
}

async function checkMedicationsStatus() {
  console.log('Checking medication status...');
  
  // Open all clients to get current data
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  
  if (clients.length > 0) {
    // App is open, ask it to check
    clients[0].postMessage({ type: 'CHECK_REMINDER_NOW' });
  } else {
    // App is closed, try to get data from cache/storage
    try {
      // We'll need to read from cache storage or trigger notification anyway
      // For now, send a generic reminder
      await sendGenericReminder();
    } catch (error) {
      console.error('Error checking medications:', error);
    }
  }
}

async function sendGenericReminder() {
  await self.registration.showNotification('⏰ Medikamenten-Erinnerung', {
    body: 'Haben Sie heute alle Medikamente eingenommen? Öffnen Sie die App, um Ihre Liste zu überprüfen.',
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [200, 100, 200, 100, 200],
    tag: 'medication-reminder-generic',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'App öffnen'
      },
      {
        action: 'dismiss',
        title: 'Schließen'
      }
    ],
    data: {
      url: './'
    }
  });
}

// Helper functions to store reminder date
async function getLastReminderDate() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match('last-reminder-date');
    if (response) {
      return await response.text();
    }
  } catch (e) {
    console.log('Could not get last reminder date');
  }
  return null;
}

async function setLastReminderDate(date) {
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.put('last-reminder-date', new Response(date));
  } catch (e) {
    console.log('Could not set last reminder date');
  }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-medication-check') {
    event.waitUntil(checkMedicationsStatus());
  }
});
