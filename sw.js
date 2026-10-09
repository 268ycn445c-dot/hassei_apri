const CACHE_NAME = "hassei-apri-cache-v2";
// GitHub Pages（/hassei_apri/ の下）でも動くよう、相対パスで書く
const PRECACHE_URLS = [
  "./",
  "./hatsuon.html",
  "https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js",
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js",
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js",
];
// キャッシュしてよい場所（Firestore・ログインの通信はさわらない）
const CACHEABLE_HOSTS = [self.location.host, "cdnjs.cloudflare.com", "www.gstatic.com"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        PRECACHE_URLS.map((url) => cache.add(url).catch(() => {}))
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ネットワークがあれば常に最新を取りに行き、取れなければキャッシュ（オフライン時）を使う
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (!CACHEABLE_HOSTS.includes(url.host)) return;
  // Firebaseのログイン画面（/__/auth/…）はキャッシュしない
  if (url.pathname.startsWith("/__/")) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((cached) => cached || (req.mode === "navigate" ? caches.match("./hatsuon.html") : undefined))
      )
  );
});
