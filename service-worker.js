const CACHE_NAME = "pwa-cache-v2"; // Updated version
const CACHE_FILES = [
    "/",
    "/index.html",
    "/style.css",
    "/app.js",
    "/manifest.json",
    "/icon.png"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(CACHE_FILES);
        })
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        })
    );
});

self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});

// Placeholder for Push API (requires server setup)
// self.addEventListener("push", event => {
//     const data = event.data.json();
//     self.registration.showNotification(data.title, {
//         body: data.body,
//         icon: "icon.png"
//     });
// });
