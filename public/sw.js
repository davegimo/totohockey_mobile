// Nome della cache
const CACHE_NAME = 'totohockey-cache-v1';
const OFFLINE_URL = '/offline.html';

// Lista delle risorse da mettere in cache
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/src/main.tsx',
  '/src/index.css',
  '/src/App.tsx',
  OFFLINE_URL
];

// Installazione del service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aperta');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Forza l'attivazione immediata
  );
});

// Attivazione del service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Elimina le cache vecchie
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim()) // Prende il controllo di tutti i client
  );
});

// Strategia di cache: Network First, fallback su Cache
self.addEventListener('fetch', event => {
  // Ignora le richieste non GET
  if (event.request.method !== 'GET') return;
  
  // Ignora le richieste di analytics
  if (event.request.url.includes('analytics')) return;
  
  // Per le richieste di pagine HTML, usa Network First
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request)
            .then(response => {
              return response || caches.match(OFFLINE_URL);
            });
        })
    );
    return;
  }
  
  // Per tutte le altre richieste, usa Cache First, fallback su Network
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - restituisci la risposta dalla cache
        if (response) {
          return response;
        }
        
        // Clona la richiesta perché è un flusso che può essere consumato solo una volta
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest)
          .then(response => {
            // Controlla se abbiamo ricevuto una risposta valida
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clona la risposta
            const responseToCache = response.clone();
            
            // Aggiungi la risposta alla cache
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // Se la rete fallisce e non abbiamo una cache, mostra la pagina offline
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            
            // Per le risorse non HTML, restituisci una risposta vuota
            return new Response();
          });
      })
  );
});

// Gestione delle notifiche push
self.addEventListener('push', event => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'Nuova notifica',
    icon: 'https://fpwoioyevwhsrlasyynp.supabase.co/storage/v1/object/sign/squadre/logowhatsapp.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJzcXVhZHJlL2xvZ293aGF0c2FwcC5wbmciLCJpYXQiOjE3NDEzNDE4OTMsImV4cCI6NDg5NDk0MTg5M30.WGII43W2lOBolX6qC6nmpGCe0ChDNRZtQw54biw9pls',
    badge: 'https://fpwoioyevwhsrlasyynp.supabase.co/storage/v1/object/sign/squadre/logowhatsapp.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJzcXVhZHJlL2xvZ293aGF0c2FwcC5wbmciLCJpYXQiOjE3NDEzNDE4OTMsImV4cCI6NDg5NDk0MTg5M30.WGII43W2lOBolX6qC6nmpGCe0ChDNRZtQw54biw9pls',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Totohockey', options)
  );
});

// Gestione del click sulle notifiche
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(clientList => {
        const url = event.notification.data.url;
        
        // Controlla se c'è già una finestra aperta e naviga a quella URL
        for (const client of clientList) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Altrimenti apri una nuova finestra
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
  );
}); 