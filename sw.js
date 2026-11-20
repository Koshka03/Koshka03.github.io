// インド旅行攻略本 Service Worker
// 版を上げるたびに VERSION を変更すること。新キャッシュが全部揃ってから旧キャッシュを破棄する。
const VERSION = 'v1-20261120';
const CACHE = 'india-guidebook-' + VERSION;
const CORE = [
  './',
  './index.html',
  './1121.html',
  './manifest.webmanifest',
  './icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('india-guidebook-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 外部リンクは素通り
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    // HTMLはネットワーク優先（最新取得）、失敗したらキャッシュ
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy));
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('./index.html')))
    );
  } else {
    // それ以外はキャッシュ優先
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(req, copy));
        return res;
      }))
    );
  }
});
