// ===== Service Worker - تاجر برو المحاسبي =====
// يقوم بتخزين الملفات الأساسية مؤقتاً لتسريع التحميل وتمكين العمل دون اتصال جزئي

const CACHE_NAME = 'altajer-pro-cache-v1';

// الملفات الأساسية التي يتم تخزينها عند أول زيارة
const CORE_ASSETS = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// تثبيت Service Worker وتخزين الملفات الأساسية
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

// تفعيل النسخة الجديدة وحذف النسخ القديمة من الكاش
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// استراتيجية: شبكة أولاً مع رجوع للكاش عند فشل الاتصال
// هذا يضمن أن المستخدم يحصل على آخر تحديث دائماً عند توفر الإنترنت،
// ويعمل التطبيق بشكل أساسي عند ضعف/انعدام الاتصال
self.addEventListener('fetch', (event) => {
  // تجاهل طلبات Firebase وأي طلبات API خارجية، اتركها تذهب للشبكة مباشرة
  if (
    event.request.url.includes('firestore.googleapis.com') ||
    event.request.url.includes('googleapis.com') ||
    event.request.url.includes('firebaseio.com') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
