// Review Ka? — offline app-shell caching
var CACHE_NAME = "reviewka-shell-v1";
var SHELL_URL = "./index.html";

self.addEventListener("install", function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll([SHELL_URL, "./"]);
    })
  );
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Network-first for the app shell so updates are picked up when online,
// but falls back to the cached copy the instant there's no connection.
self.addEventListener("fetch", function(event){
  if(event.request.mode === "navigate" || event.request.method === "GET"){
    event.respondWith(
      fetch(event.request)
        .then(function(response){
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
          return response;
        })
        .catch(function(){
          return caches.match(event.request).then(function(cached){
            return cached || caches.match(SHELL_URL);
          });
        })
    );
  }
});
