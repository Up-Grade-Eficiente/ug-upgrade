// ═══════════════════════════════════════════════════
// SERVICE WORKER — UG UpGrade Eficiente
// Cache offline + atualização automática
// ═══════════════════════════════════════════════════

const CACHE_NAME = 'ugupgrade-v6';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/upgrade-fixes.js',
  '/upgrade-responsive.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js'
];

// Instala e faz cache dos assets estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// Ativa e limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Estratégia: Network first, cache fallback
self.addEventListener('fetch', event => {
  // Ignora requisições não GET e APIs externas
  if(event.request.method !== 'GET') return;
  if(event.request.url.includes('supabase.co')) return;
  if(event.request.url.includes('groq.com')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Atualiza cache com resposta nova
        if(response.ok){
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Offline: usa cache
        return caches.match(event.request)
          .then(cached => cached || caches.match('/index.html'));
      })
  );
});

// Notificação de atualização disponível
self.addEventListener('message', event => {
  if(event.data === 'skipWaiting') self.skipWaiting();
});
