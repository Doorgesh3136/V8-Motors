// Keeps the site's files close to the visitor. Pages always ask the network first, so a new version shows up straight away and an
// old copy only serves when there is no connection. Files with a fingerprint in their name, models and the intro never change once
// published, so they come straight from here. Stock photos show at once and refresh quietly behind the scenes.
const VERSION = 'v8-1';
const cache = () => caches.open(VERSION);

addEventListener('install', () => self.skipWaiting());
addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((all) => Promise.all(all.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

const keep = async (req, res) => { if (res.ok && res.type === 'basic' && res.status === 200) (await cache()).put(req, res.clone()); return res; };

addEventListener('fetch', (e) => {
  const { request: req } = e;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || req.headers.has('range')) return; // video asks for byte ranges: leave those to the browser
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((res) => keep(req, res)).catch(async () => (await caches.match(req)) || (await caches.match(new URL('./', location.href).href)) || Response.error()));
    return;
  }
  if (/\/(assets|model|gate|brand)\//.test(url.pathname) || /\.woff2$/.test(url.pathname)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => keep(req, res))));
    return;
  }
  if (/\/stock\//.test(url.pathname)) {
    e.respondWith(caches.match(req).then((hit) => {
      const fresh = fetch(req).then((res) => keep(req, res)).catch(() => hit);
      if (hit) e.waitUntil(fresh);
      return hit || fresh;
    }));
  }
});
