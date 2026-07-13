const CACHE_NAME = "medax-cache-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Stale-while-revalidate: يخدم فوراً من التخزين المؤقت (يعمل بالكامل بدون إنترنت)،
// وبنفس الوقت يجرّب التحديث بالخلفية من الشبكة إذا كان الإنترنت متوفراً،
// ويبلّغ الصفحة المفتوحة إذا في نسخة جديدة عشان تعرض إشعار "تحديث متوفر".
self.addEventListener("fetch", (event) => {
  if(event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if(response && response.ok){
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, copy);
              if(cached){
                self.clients.matchAll().then(clients=>{
                  clients.forEach(client => client.postMessage({type:"MEDAX_UPDATE_AVAILABLE"}));
                });
              }
            });
          }
          return response;
        })
        .catch(() => null);

      return cached || networkFetch || caches.match("./index.html");
    })
  );
});
