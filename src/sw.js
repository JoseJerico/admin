// Service Worker for Aircon Admin PWA
const CACHE_NAME = 'aircon-admin-v2'
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
]

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // Silently fail if some URLs can't be cached
        return Promise.resolve()
      })
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - prefer fresh files, use cache only when offline
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  // Always request the latest app page first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone()

            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/index.html', responseToCache)
            })
          }

          return response
        })
        .catch(() => {
          return caches.match('/index.html')
        })
    )

    return
  }

  // Use network-first for local JS, CSS, images and other assets
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (
          response &&
          response.status === 200 &&
          response.type !== 'error'
        ) {
          const responseToCache = response.clone()

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }

        return response
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return (
            cachedResponse ||
            new Response('Offline - resource not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: {
                'Content-Type': 'text/plain',
              },
            })
          )
        })
      })
  )
})
// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
