const CACHE_NAME = 'lost-found-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './login.html',
  './signup.html',
  './list.html',
  './lost.html',
  './found.html',
  './admin-dashboard.html',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // IMPORTANT: Clone the request. A request is a stream and
        // can only be consumed once.
        let fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            let responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // Don't cache API calls or firestore calls locally this way 
                // (Firestore has its own offline persistence mechanism)
                if(event.request.url.startsWith('http') && !event.request.url.includes('firestore')) {
                   cache.put(event.request, responseToCache);
                }
              });

            return response;
          }
        ).catch(() => {
           // If network fails and it's not in cache, fallback gracefully
           console.log("Offline mode triggered for: ", event.request.url);
        });
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Auto-sync listener
self.addEventListener('sync', event => {
    if (event.tag === 'sync-reports') {
        console.log("Internet restored! Auto-syncing pending lost & found reports to database.");
        // Logic to push indexedDB queue to Firebase would execute here.
    }
});
