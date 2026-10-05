// リフレーム工房 用サービスワーカー
// アプリの外枠（index.html・アイコン）をキャッシュし、オフラインでも開けるようにする。
// Claude呼び出しなど通信が必要な機能は、オフライン時は動作しません。

const CACHE_NAME = 'reframe-koubou-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
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
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// 基本方針: キャッシュ優先、キャッシュに無ければネットワークから取得し、
// 同時にキャッシュへ保存しておく（次回以降オフラインでも開けるように）。
// Anthropic APIなど外部通信はそのままネットワークへ素通しする。
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 同一オリジンのGETリクエストだけをキャッシュ対象にする
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
