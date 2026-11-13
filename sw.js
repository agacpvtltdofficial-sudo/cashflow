// CASHFLOW service worker: app opens fast and works offline; always tries the newest version first.
const C='cashflow-v5';
const SHELL=['./','index.html','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin===location.origin){
    // network first for the app itself, cache as fallback (offline)
    const net=fetch(r).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));return res});
    const slow=new Promise((_,rej)=>setTimeout(rej,3000));
    e.respondWith(Promise.race([net,slow]).catch(()=>caches.match(r).then(m=>m||caches.match('index.html').then(x=>x||net))));
  } else if(/cdn\.jsdelivr\.net/.test(u.host)){
    // libraries: cache first
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));return res})));
  }
});
