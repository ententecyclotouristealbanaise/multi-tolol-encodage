/* coi-serviceworker v0.1.7 - github.com/gzuidhof/coi-serviceworker */
/* Ce fichier doit être dans le même dossier que video-converter.html sur GitHub */

(function() {
  // Si déjà rechargé par nous-mêmes, on vérifie si ça a marché
  const reloadedBySelf = window.sessionStorage.getItem("coiReloadedBySelf");
  window.sessionStorage.removeItem("coiReloadedBySelf");

  if (reloadedBySelf) {
    if (!window.crossOriginIsolated) {
      console.warn("coi-serviceworker: échec de l'isolation cross-origin.");
    }
    return;
  }

  // Déjà isolé ? Rien à faire
  if (window.crossOriginIsolated) return;

  // Contexte non sécurisé ?
  if (!window.isSecureContext) {
    console.warn("coi-serviceworker: pas de contexte sécurisé (HTTPS requis).");
    return;
  }

  // Service Workers non supportés ?
  if (!navigator.serviceWorker) {
    console.warn("coi-serviceworker: Service Workers non supportés.");
    return;
  }

  // Enregistrement du Service Worker (ce fichier lui-même !)
  navigator.serviceWorker.register(window.document.currentScript.src).then(
    function(registration) {
      registration.addEventListener("updatefound", function() {
        var sw = registration.installing;
        sw.addEventListener("statechange", function() {
          if (sw.state === "activated") {
            window.sessionStorage.setItem("coiReloadedBySelf", "true");
            window.location.reload();
          }
        });
      });
      if (registration.active) {
        window.sessionStorage.setItem("coiReloadedBySelf", "true");
        window.location.reload();
      }
    },
    function(err) {
      console.error("coi-serviceworker: échec enregistrement", err);
    }
  );
})();

/* ---- CODE DU SERVICE WORKER (exécuté quand installé comme SW) ---- */
if (typeof window === "undefined") {
  self.addEventListener("install", function() { self.skipWaiting(); });
  self.addEventListener("activate", function(e) { e.waitUntil(self.clients.claim()); });
  self.addEventListener("fetch", function(event) {
    if (event.request.cache === "only-if-cached" && event.request.mode !== "same-origin") return;
    event.respondWith(
      fetch(event.request).then(function(response) {
        if (response.status === 0) return response;
        var newHeaders = new Headers(response.headers);
        newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
        newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        });
      })
    );
  });
}
