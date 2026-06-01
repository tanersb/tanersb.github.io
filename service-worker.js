/**
 * ════════════════════════════════════════════════════════════════════
 *  GIS VIEWER — SERVICE WORKER (Offline Mod)
 *  Versiyon : v2.0.0
 *  Dosya    : service-worker.js  (kök dizinde olmalı)
 * ════════════════════════════════════════════════════════════════════
 *
 *  AMAÇ
 *  ─────
 *  Siteyi ilk ziyarette tüm JS/CSS/HTML/ikon dosyalarını tarayıcı
 *  önbelleğine (Cache API) alır. Sonraki ziyaretlerde internet
 *  olmasa bile uygulama çalışır.
 *
 *  KISITLAMA — HArita TILE'LARI OFFLİNE ÇALIŞMAZ
 *  ───────────────────────────────────────────────
 *  OSM, Google Maps, Uydu vb. harita arka planları harici
 *  sunuculardan gelir (tile.openstreetmap.org vb.). Bunlar
 *  önbelleğe alınamaz (CORS + sonsuz sayıda tile). Offline
 *  modda harita arka planı gri/boş görünür — bu normaldir.
 *  NCZ/GeoJSON dosyası yüklenince geometriler üstte görünür.
 *
 *  STRATEJİ: Cache-First + Network Fallback
 *  ─────────────────────────────────────────
 *  1. İstek cache'de var mı? → cache'den döndür (hızlı, offline çalışır)
 *  2. Cache'de yok? → ağdan çek, cache'e kaydet, döndür
 *  3. Ağ da yoksa? → offline fallback sayfası göster (sadece HTML için)
 *
 *  Harita tile istekleri (openstreetmap.org, googleapis.com vb.)
 *  için strateji farklı: Network-First (tile varsa ağdan al,
 *  yoksa cache'den dene, ikisi de yoksa sessizce başarısız ol).
 *
 *  CACHE GÜNCELLEME
 *  ─────────────────
 *  Siteyi güncelleyince CACHE_VERSION'ı artır (örn. v2 → v3).
 *  Service Worker yeni versiyonu algılar, eski cache'i siler,
 *  tüm dosyaları yeniden indirir.
 *
 *  CACHE_VERSION'ı ne zaman artırmalısın?
 *    - Yeni modül eklendiğinde
 *    - Mevcut JS/CSS değiştiğinde
 *    - index.html değiştiğinde
 *  Artırmazsan kullanıcılar eski kodu görmeye devam eder!
 *
 *  HATA AYIKLAMA
 *  ──────────────
 *  Chrome DevTools → Application → Service Workers
 *    "Update on reload" → geliştirme sırasında her yenilemede günceller
 *    "Bypass for network" → SW'yi devre dışı bırakır (test için)
 *
 *  Cache içeriğini görmek için:
 *    DevTools → Application → Cache Storage → gisviewer-v2
 *
 *  SW'yi sıfırlamak için:
 *    DevTools → Application → Service Workers → Unregister
 *
 *  Offline testi:
 *    DevTools → Network → Offline checkbox → sayfayı yenile
 *
 *  DOSYA YAPISI GEREKSİNİMİ
 *  ─────────────────────────
 *  Bu dosya kök dizinde olmalı (index.html ile aynı klasör).
 *  Alt klasörde olursa scope kısıtlanır ve bazı dosyalar
 *  önbelleğe alınamaz.
 *
 * ════════════════════════════════════════════════════════════════════
 */

// ── CACHE VERSİYONU ───────────────────────────────────────────────
// Dosyalar değiştiğinde bu numarayı artır → eski cache otomatik silinir.
// Format: 'gisviewer-vN' — N'i her deploy'da 1 artır.
const CACHE_VERSION = 'gisviewer-v1780344781667';

// ── ÖNBELLEĞe ALINACAK DOSYALAR ──────────────────────────────────
// Tüm uygulama dosyaları burada listelenmiştir.
// Yeni modül eklenince buraya da ekle!
//
// DIKKAT: Bir dosya bile 404 dönerse install başarısız olur.
// Emin olmadığın dosyaları OPTIONAL_FILES listesine koy.
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

// ── OPSİYONEL DOSYALAR ───────────────────────────────────────────
// Bunlar önbelleğe alınamazsa install başarısız OLMAZ.
// Varlığından emin olmadığın dosyaları buraya koy.
const OPTIONAL_FILES = [];

// ── TILE KAYNAKLARI (Network-First stratejisi) ────────────────────
// Bu domain'lerden gelen istekler için önce ağ denenir.
// Ağ yoksa cache'e bakılır. Tile cache'i ayrı tutulur (TILE_CACHE).
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

// Tile önbellek adı — ayrı cache (uygulama cache'inden bağımsız)
const TILE_CACHE    = 'gisviewer-tiles-v1';
// Maksimum önbellekte tutulacak tile sayısı
const TILE_MAX      = 500;

// ════════════════════════════════════════════════════════════════════
//  INSTALL — Uygulama dosyalarını önbelleğe al
// ════════════════════════════════════════════════════════════════════
self.addEventListener('install', event => {
  console.log(`[SW] Install: ${CACHE_VERSION}`);

  event.waitUntil(
    caches.open(CACHE_VERSION).then(async cache => {

      // Zorunlu dosyaları tek seferde önbelleğe al
      // Bir tane bile 404 dönerse install başarısız olur
      const required = CACHE_FILES.filter(f => !OPTIONAL_FILES.includes(f));
      await cache.addAll(required);

      // Opsiyonel dosyaları teker teker dene (başarısız olsa sorun yok)
      for (const url of OPTIONAL_FILES) {
        try {
          await cache.add(url);
        } catch (e) {
          console.warn(`[SW] Opsiyonel dosya önbelleğe alınamadı: ${url}`);
        }
      }

      console.log(`[SW] ${required.length} dosya önbelleğe alındı`);
    })
  );

  // Eski SW beklemeden hemen aktif ol
  self.skipWaiting();
});

// ════════════════════════════════════════════════════════════════════
//  ACTIVATE — Eski cache versiyonlarını temizle
// ════════════════════════════════════════════════════════════════════
self.addEventListener('activate', event => {
  console.log(`[SW] Activate: ${CACHE_VERSION}`);

  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          // Geçerli versiyon ve tile cache dışındakileri sil
          .filter(k => k !== CACHE_VERSION && k !== TILE_CACHE)
          .map(k => {
            console.log(`[SW] Eski cache siliniyor: ${k}`);
            return caches.delete(k);
          })
      );
    })
  );

  // Açık sekmeleri hemen yeni SW ile kontrol et (sayfa yenilemesiz)
  self.clients.claim();
});

// ════════════════════════════════════════════════════════════════════
//  FETCH — İstekleri yakala ve uygun stratejiye yönlendir
// ════════════════════════════════════════════════════════════════════
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // ── GET dışındaki istekleri (POST, PUT vb.) geç ──────────────
  if (event.request.method !== 'GET') return;

  // ── Harita tile isteği mi? → Network-First ───────────────────
  if (TILE_ORIGINS.some(origin => url.hostname.includes(origin))) {
    event.respondWith(networkFirstTile(event.request));
    return;
  }

  // ── CDN isteği (Leaflet, proj4, Google Fonts) → Network-First ─
  // Bu kaynaklar lokal değil, CORS kısıtlaması olabilir
  if (url.origin !== self.location.origin) {
    event.respondWith(networkFirstExternal(event.request));
    return;
  }

  // ── Uygulama dosyaları → Cache-First ─────────────────────────
  event.respondWith(cacheFirst(event.request));
});

// ── STRATEJİ 1: Cache-First (uygulama dosyaları) ─────────────────
// Önce cache'e bak → varsa döndür (offline çalışır, hızlı)
// Cache'de yoksa → ağdan çek, cache'e kaydet
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    // Sadece başarılı yanıtları cache'e al
    if (response.ok) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    // Hem cache hem ağ yoksa → offline fallback
    console.warn('[SW] Offline, cache miss:', request.url);
    return offlineFallback(request);
  }
}

// ── STRATEJİ 2: Network-First Tile (harita tile'ları) ────────────
// Önce ağdan çek → başarılıysa cache'e kaydet
// Ağ yoksa → tile cache'den bak
// İkisi de yoksa → boş yanıt (harita gri görünür, hata vermez)
async function networkFirstTile(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(TILE_CACHE);
      cache.put(request, response.clone());
      // Tile cache limitini aşınca eski tile'ları temizle
      trimTileCache();
    }
    return response;
  } catch (_) {
    // Ağ yok → cache'den dene
    const cached = await caches.match(request, { cacheName: TILE_CACHE });
    if (cached) return cached;
    // İkisi de yoksa → boş 200 yanıtı (hata konsola düşmez)
    return new Response('', { status: 200 });
  }
}

// ── STRATEJİ 3: Network-First External (CDN) ─────────────────────
// Harici CDN kaynakları (Leaflet CSS/JS, proj4 vb.)
// Ağdan gelirse güzel, yoksa cache'den dene
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

// ── OFFLİNE FALLBACK ─────────────────────────────────────────────
// Hem cache hem ağ yoksa:
//   HTML isteği → index.html'den dön (uygulama çalışmaya devam eder)
//   Diğerleri   → boş yanıt
async function offlineFallback(request) {
  const accept = request.headers.get('Accept') || '';
  if (accept.includes('text/html')) {
    const cached = await caches.match('/index.html');
    if (cached) return cached;
  }
  return new Response('', { status: 503, statusText: 'Offline' });
}

// ── TİLE CACHE LİMİTİ ────────────────────────────────────────────
// TILE_MAX'ı aşınca en eski tile'ları sil.
// Cache API FIFO garantisi vermez, bu nedenle tüm anahtarları
// alıp başından TILE_MAX kadar bırakıyoruz.
async function trimTileCache() {
  const cache = await caches.open(TILE_CACHE);
  const keys  = await cache.keys();
  if (keys.length > TILE_MAX) {
    const toDelete = keys.slice(0, keys.length - TILE_MAX);
    await Promise.all(toDelete.map(k => cache.delete(k)));
    console.log(`[SW] Tile cache kırpıldı: ${toDelete.length} tile silindi`);
  }
}
