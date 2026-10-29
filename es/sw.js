// リフレーム工房 スペイン語版（Taller de Reencuadre）用サービスワーカー
// 方針: HTML（index.html / manual.html）は「ネットワーク優先」にして、更新がすぐ反映されるようにする。
// 圏外・オフラインのときだけ、保存しておいたコピーで開く。
// アイコンなどの画像・設定ファイルは「キャッシュ優先＋裏で更新」。
// アプリを更新したら、下の CACHE_VERSION の数字を1つ上げると、古いキャッシュが自動で消えます。

const CACHE_VERSION = 'v5';
const CACHE_PREFIX = 'reframe-taller-es-';
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './manual.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)) // 日本語版のキャッシュは消さない
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 同一オリジンのGETだけ扱う（Claude APIなど外部通信は素通し）
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  const isHtml = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html') ||
    url.pathname.endsWith('.html') || url.pathname.endsWith('/');

  if (isHtml){
    // ネットワーク優先（ブラウザのHTTPキャッシュも使わず最新を取得）
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((response) => {
          if (response && response.status === 200){
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return response;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
    );
    return;
  }

  // それ以外: キャッシュ優先＋裏で更新
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((response) => {
        if (response && response.status === 200){
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
