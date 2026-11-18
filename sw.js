// Network first, so the family always gets the newest page; the saved copy is only used when there is no
// connection (or it takes over 4 s), so the app still opens at the house. Calls to the Genie are never cached.
const C = 'bratteng-v04', SHELL = ['./', 'index.html', 'config.js', 'manifest.webmanifest', 'icon-192.png', 'apple-touch-icon.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(C).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== C).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(new Promise((resolve) => {
    let done = false;
    const fallback = () => caches.match(e.request, { ignoreSearch: true }).then((r) => { if (!done && r) { done = true; resolve(r); } });
    const t = setTimeout(fallback, 4000);
    fetch(e.request).then((r) => {
      clearTimeout(t);
      if (r.ok) { const copy = r.clone(); caches.open(C).then((c) => c.put(e.request, copy)); }
      if (!done) { done = true; resolve(r); }
    }).catch(() => { clearTimeout(t); caches.match(e.request, { ignoreSearch: true }).then((r) => { if (!done) { done = true; resolve(r || Response.error()); } }); });
  }));
});
