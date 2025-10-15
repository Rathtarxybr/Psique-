const CACHE_NAME = 'psique-plus-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/index.tsx',
  // Add other static assets you want to cache here
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'https://aistudiocdn.com/@google/genai@^1.22.0',
  'https://aistudiocdn.com/react-dom@18.2.0/',
  'https://aistudiocdn.com/react@18.2.0/',
  'https://aistudiocdn.com/pdfjs-dist@^5.4.296/',
  'https://aistudiocdn.com/epubjs@^0.3.93',
  'https://aistudiocdn.com/idb@^8.0.3',
  'https://aistudiocdn.com/lucide-react@^0.395.0',
  'https://aistudiocdn.com/react-quill@^2.0.0',
  'https://aistudiocdn.com/marked@^14.0.0',
  'https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css'
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

        // Clone the request because it's a stream and can only be consumed once.
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response because it's also a stream.
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
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
