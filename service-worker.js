/**
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 *  GIS VIEWER â€” SERVICE WORKER (Offline Mod)
 *  Versiyon : v2.0.0
 *  Dosya    : service-worker.js  (kÃ¶k dizinde olmalÄ±)
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 *
 *  AMAÃ‡
 *  â”€â”€â”€â”€â”€
 *  Siteyi ilk ziyarette tÃ¼m JS/CSS/HTML/ikon dosyalarÄ±nÄ± tarayÄ±cÄ±
 *  Ã¶nbelleÄŸine (Cache API) alÄ±r. Sonraki ziyaretlerde internet
 *  olmasa bile uygulama Ã§alÄ±ÅŸÄ±r.
 *
 *  KISITLAMA â€” HArita TILE'LARI OFFLÄ°NE Ã‡ALIÅMAZ
 *  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *  OSM, Google Maps, Uydu vb. harita arka planlarÄ± harici
 *  sunuculardan gelir (tile.openstreetmap.org vb.). Bunlar
 *  Ã¶nbelleÄŸe alÄ±namaz (CORS + sonsuz sayÄ±da tile). Offline
 *  modda harita arka planÄ± gri/boÅŸ gÃ¶rÃ¼nÃ¼r â€” bu normaldir.
 *  NCZ/GeoJSON dosyasÄ± yÃ¼klenince geometriler Ã¼stte gÃ¶rÃ¼nÃ¼r.
 *
 *  STRATEJÄ°: Cache-First + Network Fallback
 *  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *  1. Ä°stek cache'de var mÄ±? â†’ cache'den dÃ¶ndÃ¼r (hÄ±zlÄ±, offline Ã§alÄ±ÅŸÄ±r)
 *  2. Cache'de yok? â†’ aÄŸdan Ã§ek, cache'e kaydet, dÃ¶ndÃ¼r
 *  3. AÄŸ da yoksa? â†’ offline fallback sayfasÄ± gÃ¶ster (sadece HTML iÃ§in)
 *
 *  Harita tile istekleri (openstreetmap.org, googleapis.com vb.)
 *  iÃ§in strateji farklÄ±: Network-First (tile varsa aÄŸdan al,
 *  yoksa cache'den dene, ikisi de yoksa sessizce baÅŸarÄ±sÄ±z ol).
 *
 *  CACHE GÃœNCELLEME
 *  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *  Siteyi gÃ¼ncelleyince CACHE_VERSION'Ä± artÄ±r (Ã¶rn. v2 â†’ v3).
 *  Service Worker yeni versiyonu algÄ±lar, eski cache'i siler,
 *  tÃ¼m dosyalarÄ± yeniden indirir.
 *
 *  CACHE_VERSION'Ä± ne zaman artÄ±rmalÄ±sÄ±n?
 *    - Yeni modÃ¼l eklendiÄŸinde
 *    - Mevcut JS/CSS deÄŸiÅŸtiÄŸinde
 *    - index.html deÄŸiÅŸtiÄŸinde
 *  ArtÄ±rmazsan kullanÄ±cÄ±lar eski kodu gÃ¶rmeye devam eder!
 *
 *  HATA AYIKLAMA
 *  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *  Chrome DevTools â†’ Application â†’ Service Workers
 *    "Update on reload" â†’ geliÅŸtirme sÄ±rasÄ±nda her yenilemede gÃ¼nceller
 *    "Bypass for network" â†’ SW'yi devre dÄ±ÅŸÄ± bÄ±rakÄ±r (test iÃ§in)
 *
 *  Cache iÃ§eriÄŸini gÃ¶rmek iÃ§in:
 *    DevTools â†’ Application â†’ Cache Storage â†’ gisviewer-v2
 *
 *  SW'yi sÄ±fÄ±rlamak iÃ§in:
 *    DevTools â†’ Application â†’ Service Workers â†’ Unregister
 *
 *  Offline testi:
 *    DevTools â†’ Network â†’ Offline checkbox â†’ sayfayÄ± yenile
 *
 *  DOSYA YAPISI GEREKSÄ°NÄ°MÄ°
 *  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 *  Bu dosya kÃ¶k dizinde olmalÄ± (index.html ile aynÄ± klasÃ¶r).
 *  Alt klasÃ¶rde olursa scope kÄ±sÄ±tlanÄ±r ve bazÄ± dosyalar
 *  Ã¶nbelleÄŸe alÄ±namaz.
 *
 * â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
 */

// â”€â”€ CACHE VERSÄ°YONU â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Dosyalar deÄŸiÅŸtiÄŸinde bu numarayÄ± artÄ±r â†’ eski cache otomatik silinir.
// Format: 'gisviewer-vN' â€” N'i her deploy'da 1 artÄ±r.
const CACHE_VERSION = 'gisviewer-v1793910578936';

// â”€â”€ Ã–NBELLEÄe ALINACAK DOSYALAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TÃ¼m uygulama dosyalarÄ± burada listelenmiÅŸtir.
// Yeni modÃ¼l eklenince buraya da ekle!
//
// DIKKAT: Bir dosya bile 404 dÃ¶nerse install baÅŸarÄ±sÄ±z olur.
// Emin olmadÄ±ÄŸÄ±n dosyalarÄ± OPTIONAL_FILES listesine koy.
const CACHE_FILES = [
  '/',
  '/index.html',
  '/bundle.min.js',
  '/site.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon.svg',
  '/icons/favicon-32.png',
  '/icons/favicon-16.png'
];

// â”€â”€ OPSÄ°YONEL DOSYALAR â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Bunlar Ã¶nbelleÄŸe alÄ±namazsa install baÅŸarÄ±sÄ±z OLMAZ.
// VarlÄ±ÄŸÄ±ndan emin olmadÄ±ÄŸÄ±n dosyalarÄ± buraya koy.
const OPTIONAL_FILES = [];

// â”€â”€ TILE KAYNAKLARI (Network-First stratejisi) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Bu domain'lerden gelen istekler iÃ§in Ã¶nce aÄŸ denenir.
// AÄŸ yoksa cache'e bakÄ±lÄ±r. Tile cache'i ayrÄ± tutulur (TILE_CACHE).
const TILE_ORIGINS = [
  'tile.openstreetmap.org',
  'maps.googleapis.com',
  'mt0.google.com',
  'mt1.google.com',
  'mt2.google.com',
  'mt3.google.com',
  'server.arcgisonline.com',
  'tile.opentopomap.org',
  'tiles.wmflabs.org',
];

// Tile Ã¶nbellek adÄ± â€” ayrÄ± cache (uygulama cache'inden baÄŸÄ±msÄ±z)
const TILE_CACHE    = 'gisviewer-tiles-v1';
// Maksimum Ã¶nbellekte tutulacak tile sayÄ±sÄ±
const TILE_MAX      = 500;

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  INSTALL â€” Uygulama dosyalarÄ±nÄ± Ã¶nbelleÄŸe al
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
self.addEventListener('install', event => {
  console.log(`[SW] Install: ${CACHE_VERSION}`);

  event.waitUntil(
    caches.open(CACHE_VERSION).then(async cache => {

      // Zorunlu dosyalarÄ± tek seferde Ã¶nbelleÄŸe al
      // Bir tane bile 404 dÃ¶nerse install baÅŸarÄ±sÄ±z olur
      const required = CACHE_FILES.filter(f => !OPTIONAL_FILES.includes(f));
      await cache.addAll(required);

      // Opsiyonel dosyalarÄ± teker teker dene (baÅŸarÄ±sÄ±z olsa sorun yok)
      for (const url of OPTIONAL_FILES) {
        try {
          await cache.add(url);
        } catch (e) {
          console.warn(`[SW] Opsiyonel dosya Ã¶nbelleÄŸe alÄ±namadÄ±: ${url}`);
        }
      }

      console.log(`[SW] ${required.length} dosya Ã¶nbelleÄŸe alÄ±ndÄ±`);
    })
  );

  // Eski SW beklemeden hemen aktif ol
  self.skipWaiting();
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  ACTIVATE â€” Eski cache versiyonlarÄ±nÄ± temizle
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
self.addEventListener('activate', event => {
  console.log(`[SW] Activate: ${CACHE_VERSION}`);

  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          // GeÃ§erli versiyon ve tile cache dÄ±ÅŸÄ±ndakileri sil
          .filter(k => k !== CACHE_VERSION && k !== TILE_CACHE)
          .map(k => {
            console.log(`[SW] Eski cache siliniyor: ${k}`);
            return caches.delete(k);
          })
      );
    })
  );

  // AÃ§Ä±k sekmeleri hemen yeni SW ile kontrol et (sayfa yenilemesiz)
  self.clients.claim();
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  FETCH â€” Ä°stekleri yakala ve uygun stratejiye yÃ¶nlendir
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // â”€â”€ GET dÄ±ÅŸÄ±ndaki istekleri (POST, PUT vb.) geÃ§ â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (event.request.method !== 'GET') return;

  // â”€â”€ Harita tile isteÄŸi mi? â†’ Network-First â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (TILE_ORIGINS.some(origin => url.hostname.includes(origin))) {
    event.respondWith(networkFirstTile(event.request));
    return;
  }

  // â”€â”€ CDN isteÄŸi (Leaflet, proj4, Google Fonts) â†’ Network-First â”€
  // Bu kaynaklar lokal deÄŸil, CORS kÄ±sÄ±tlamasÄ± olabilir
  if (url.origin !== self.location.origin) {
    event.respondWith(networkFirstExternal(event.request));
    return;
  }

  // â”€â”€ Uygulama dosyalarÄ± â†’ Cache-First â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  event.respondWith(cacheFirst(event.request));
});

// â”€â”€ STRATEJÄ° 1: Cache-First (uygulama dosyalarÄ±) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Ã–nce cache'e bak â†’ varsa dÃ¶ndÃ¼r (offline Ã§alÄ±ÅŸÄ±r, hÄ±zlÄ±)
// Cache'de yoksa â†’ aÄŸdan Ã§ek, cache'e kaydet
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    // Sadece baÅŸarÄ±lÄ± yanÄ±tlarÄ± cache'e al
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Hem cache hem aÄŸ yoksa â†’ offline fallback
    console.warn('[SW] Offline, cache miss:', request.url);
    return offlineFallback(request);
  }
}

// â”€â”€ STRATEJÄ° 2: Network-First Tile (harita tile'larÄ±) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Ã–nce aÄŸdan Ã§ek â†’ baÅŸarÄ±lÄ±ysa cache'e kaydet
// AÄŸ yoksa â†’ tile cache'den bak
// Ä°kisi de yoksa â†’ boÅŸ yanÄ±t (harita gri gÃ¶rÃ¼nÃ¼r, hata vermez)
async function networkFirstTile(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(TILE_CACHE);
      cache.put(request, response.clone());
      // Tile cache limitini aÅŸÄ±nca eski tile'larÄ± temizle
      trimTileCache();
    }
    return response;
  } catch (_) {
    // AÄŸ yok â†’ cache'den dene
    const cached = await caches.match(request, { cacheName: TILE_CACHE });
    if (cached) return cached;
    // Ä°kisi de yoksa â†’ boÅŸ 200 yanÄ±tÄ± (hata konsola dÃ¼ÅŸmez)
    return new Response('', { status: 200 });
  }
}

// â”€â”€ STRATEJÄ° 3: Network-First External (CDN) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Harici CDN kaynaklarÄ± (Leaflet CSS/JS, proj4 vb.)
// AÄŸdan gelirse gÃ¼zel, yoksa cache'den dene
async function networkFirstExternal(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response('', { status: 503 });
  }
}

// â”€â”€ OFFLÄ°NE FALLBACK â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Hem cache hem aÄŸ yoksa:
//   HTML isteÄŸi â†’ index.html'den dÃ¶n (uygulama Ã§alÄ±ÅŸmaya devam eder)
//   DiÄŸerleri   â†’ boÅŸ yanÄ±t
async function offlineFallback(request) {
  const accept = request.headers.get('Accept') || '';
  if (accept.includes('text/html')) {
    const cached = await caches.match('/index.html');
    if (cached) return cached;
  }
  return new Response('', { status: 503, statusText: 'Offline' });
}

// â”€â”€ TÄ°LE CACHE LÄ°MÄ°TÄ° â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// TILE_MAX'Ä± aÅŸÄ±nca en eski tile'larÄ± sil.
// Cache API FIFO garantisi vermez, bu nedenle tÃ¼m anahtarlarÄ±
// alÄ±p baÅŸÄ±ndan TILE_MAX kadar bÄ±rakÄ±yoruz.
async function trimTileCache() {
  const cache = await caches.open(TILE_CACHE);
  const keys  = await cache.keys();
  if (keys.length > TILE_MAX) {
    const toDelete = keys.slice(0, keys.length - TILE_MAX);
    await Promise.all(toDelete.map(k => cache.delete(k)));
    console.log(`[SW] Tile cache kÄ±rpÄ±ldÄ±: ${toDelete.length} tile silindi`);
  }
}
