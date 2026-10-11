// Tout a déménagé sur https://pointage-staff.web.app/app/ : plus de cache ici, et les pages ouvertes se rechargent (→ redirection)
self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(k => Promise.all(k.map(x => caches.delete(x))))
  .then(() => self.clients.claim()).then(() => self.clients.matchAll({ type: 'window' })).then(L => L.forEach(c => { try { c.navigate(c.url); } catch (x) {} }))));
self.addEventListener('fetch', e => {});
