// Coquille PWA, réseau d'abord et cache en secours. Le numéro suit exactement
// la version visible dans les options et celle de package.json.

const VERSION = 'snake-1.0.0';
const COQUILLE = [
    './',
    'index.html',
    'manifest.webmanifest',
    'css/interface.css',
    'css/plateau.css',
    'css/themes.css',
    'js/app.js',
    'js/config.js',
    'js/entree.js',
    'js/hasard.js',
    'js/moteur.js',
    'js/partie.js',
    'js/rendu.js',
    'js/son.js',
    'js/stockage.js',
    'js/themes.js',
    'js/ui.js',
    'js/variantes.js',
    'assets/icon.svg',
    'assets/icon-180.png',
    'assets/icon-192.png',
    'assets/icon-512.png'
];

self.addEventListener('install', evenement => {
    evenement.waitUntil(
        caches.open(VERSION)
            .then(cache => cache.addAll(COQUILLE))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', evenement => {
    evenement.waitUntil(
        caches.keys()
            .then(cles => Promise.all(cles.filter(cle => cle !== VERSION).map(cle => caches.delete(cle))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', evenement => {
    if (evenement.request.method !== 'GET') return;
    evenement.respondWith(
        fetch(evenement.request)
            .then(reponse => {
                if (reponse.ok && new URL(evenement.request.url).origin === location.origin) {
                    const copie = reponse.clone();
                    caches.open(VERSION).then(cache => cache.put(evenement.request, copie));
                }
                return reponse;
            })
            .catch(() => caches.match(evenement.request).then(reponse => reponse || caches.match('./')))
    );
});
