// This cache is exclusively for static, same-origin Pages assets. Socket.IO is never cached.
let currentManifest;
const manifest = () => currentManifest || (currentManifest = fetch(new URL('offline-manifest.json',self.registration.scope)).then(r=>r.json()).catch(()=>null));
self.addEventListener('install',event=>event.waitUntil(manifest().then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin||url.pathname.includes('/socket.io/'))return;
  if(!/\/(windows|assets)\//.test(url.pathname))return;
  event.respondWith((async()=>{
    const current=await manifest();
    if(current){const cache=await caches.open('techmanager-assets-'+current.version);const cached=await cache.match(event.request,{ignoreSearch:true});if(cached)return cached;const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;}
    return await caches.match(event.request,{ignoreSearch:true})||fetch(event.request);
  })());
});
