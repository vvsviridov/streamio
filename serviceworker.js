const staticCacheName = 's-streamio-v1'

const assetUrls = [
  '.',
  'index.html',
  '/assets/script.js',
  '/assets/style.css',
  '/assets/icon-192x192.png',
  '/assets/icon-256x256.png',
  '/assets/icon-384x384.png',
  '/assets/icon-512x512.png'
]

self.addEventListener('install', async event => {
  const cache = await caches.open(staticCacheName)
  await cache.addAll(assetUrls)
})

self.addEventListener('activate', async event => {
  const cacheNames = await caches.keys()
  await Promise.all(
    cacheNames
      .filter(name => name !== staticCacheName)
      .map(name => caches.delete(name))
  )
})

self.addEventListener('fetch', event => {
  const {request} = event
  event.respondWith(cacheFirst(request))
})


async function cacheFirst(request) {
  const cached = await caches.match(request)
  return cached ?? await fetch(request)
}
