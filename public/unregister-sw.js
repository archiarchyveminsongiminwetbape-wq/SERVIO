// This script helps unregister the service worker
// Run this in the browser console or temporarily include it in your app

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
      console.log('Service worker unregistered:', registration);
    }
  }).then(function() {
    // Clear caches
    if ('caches' in window) {
      caches.keys().then(function(cacheNames) {
        return Promise.all(
          cacheNames.map(function(cacheName) {
            return caches.delete(cacheName);
          })
        );
      }).then(function() {
        console.log('All caches cleared');
        location.reload();
      });
    } else {
      console.log('Service workers unregistered, reloading page');
      location.reload();
    }
  });
}
