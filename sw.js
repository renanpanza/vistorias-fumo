/* Service worker — mantém o app disponível offline */
const VERSAO = 'vistorias-fumo-v1.0.0';
const ARQUIVOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Apps Script etc. seguem direto para a rede

  // Rede primeiro (para receber atualizações), cache como reserva (offline)
  ev.respondWith(
    fetch(req).then((resp) => {
      if (resp && resp.ok) {
        const copia = resp.clone();
        caches.open(VERSAO).then((c) => c.put(req, copia));
      }
      return resp;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});

self.addEventListener('message', (ev) => {
  if (ev.data === 'skipWaiting') self.skipWaiting();
});
