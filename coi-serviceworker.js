/*
 * coi-serviceworker.js
 * Ce fichier doit être à la RACINE de ton dépôt GitHub (même dossier que video-converter.html)
 * Il ajoute les headers Cross-Origin nécessaires pour que SharedArrayBuffer fonctionne.
 */

/* ═══════════════════════════════════════════════════════
   PARTIE 1 — Code exécuté dans la PAGE (script classique)
   Enregistre ce fichier comme Service Worker
   ═══════════════════════════════════════════════════════ */
if (typeof window !== 'undefined') {
  if ('serviceWorker' in navigator) {
    // Enregistrement du SW (ce fichier lui-même)
    navigator.serviceWorker.register(document.currentScript.src)
      .then(function(reg) {
        // Si un nouveau SW vient de s'installer → on attend qu'il soit actif puis on recharge
        if (reg.installing) {
          reg.installing.addEventListener('statechange', function(e) {
            if (e.target.state === 'activated') {
              window.location.reload();
            }
          });
        }
        // Si le SW était déjà actif mais qu'on n'est pas encore isolé → recharge
        else if (reg.active && !window.crossOriginIsolated) {
          window.location.reload();
        }
      })
      .catch(function(err) {
        console.error('[COI] Echec enregistrement Service Worker :', err);
      });
  } else {
    console.warn('[COI] Service Workers non supportés par ce navigateur.');
  }
}

/* ═══════════════════════════════════════════════════════
   PARTIE 2 — Code exécuté dans le SERVICE WORKER lui-même
   Intercepte toutes les requêtes et ajoute les headers
   ═══════════════════════════════════════════════════════ */
if (typeof self !== 'undefined' && typeof window === 'undefined') {

  // Installation immédiate, sans attendre
  self.addEventListener('install', function(event) {
    self.skipWaiting();
  });

  // Prise de contrôle immédiate de tous les onglets
  self.addEventListener('activate', function(event) {
    event.waitUntil(self.clients.claim());
  });

  // Interception de toutes les requêtes réseau
  self.addEventListener('fetch', function(event) {
    // On ignore les requêtes "only-if-cached" qui ne sont pas same-origin
    if (
      event.request.cache === 'only-if-cached' &&
      event.request.mode !== 'same-origin'
    ) {
      return;
    }

    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          // On ne modifie pas les réponses d'erreur réseau
          if (response.status === 0) return response;

          // On recrée la réponse avec les headers d'isolation cross-origin
          var newHeaders = new Headers(response.headers);
          newHeaders.set('Cross-Origin-Opener-Policy',   'same-origin');
          newHeaders.set('Cross-Origin-Embedder-Policy', 'require-corp');

          return new Response(response.body, {
            status:     response.status,
            statusText: response.statusText,
            headers:    newHeaders,
          });
        })
        .catch(function(err) {
          // En cas d'erreur réseau, on laisse passer normalement
          console.error('[COI SW] Erreur fetch :', err);
          return fetch(event.request);
        })
    );
  });
}
