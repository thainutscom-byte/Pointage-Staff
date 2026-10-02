// 📴 Mode hors ligne : la dernière version des pages est gardée sur le téléphone.
// Réseau d'abord (toujours la version la plus récente quand internet marche), copie locale si pas d'internet.
const CACHE='pointage-v1';
self.addEventListener('install', e=>{ self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c=>c.addAll(['./','./index.html']).catch(()=>{}))); });
self.addEventListener('activate', e=>{ e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch', e=>{
  const r=e.request, u=new URL(r.url);
  if(r.method!=='GET' || u.origin!==location.origin) return;          // Google, LINE, CDN : jamais en cache
  e.respondWith(fetch(r).then(res=>{ if(res && res.ok){ const c=res.clone(); caches.open(CACHE).then(x=>x.put(r, c)).catch(()=>{}); } return res; })
    .catch(()=>caches.match(r, {ignoreSearch:true}).then(m=>m || caches.match('./index.html'))));
});
