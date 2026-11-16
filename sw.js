// ポケットミステリー Service Worker
// 公開のたびに PM_VER を上げること（古いキャッシュを破棄して更新を届けるため）
const PM_VER = 'pm-v73';
const ASSETS = ['./', './index.html', './icon-192.png', './icon-180.png', './icon-512.png', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(PM_VER).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== PM_VER).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin !== location.origin) return;
  const isPage = e.request.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('/index.html');
  if (isPage) {
    // ページはネットワーク優先（更新が届くように）。オフライン時はキャッシュを使う
    e.respondWith(
      fetch(e.request,{cache:'no-cache'}).then(r => {
        const cl = r.clone();
        caches.open(PM_VER).then(c => c.put('./index.html', cl));
        return r;
      }).catch(() => caches.match('./index.html'))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then(m => m || fetch(e.request).then(r => {
        const cl = r.clone();
        caches.open(PM_VER).then(c => c.put(e.request, cl));
        return r;
      }))
    );
  }
});
