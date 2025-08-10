// CartPilot Service Worker - Enhanced PWA Capabilities
const CACHE_VERSION = 'cartpilot-v2.0.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const OFFLINE_CACHE = `${CACHE_VERSION}-offline`;

// Files to cache immediately (static assets)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/static/js/bundle.js',
  '/static/css/main.css',
  // Add other critical assets
];

// API endpoints to cache (dynamic content)
const API_CACHE_PATTERNS = [
  /\/api\/stores/,
  /\/api\/products/,
  /\/api\/floorplans/,
  /\/api\/user/
];

// Network-first patterns (real-time data)
const NETWORK_FIRST_PATTERNS = [
  /\/api\/auth/,
  /\/api\/sync/,
  /\/api\/notifications/,
  /\/api\/crowdsource/
];

// Background sync tags
const SYNC_TAGS = {
  CART_SYNC: 'cart-sync',
  ROUTE_SYNC: 'route-sync',
  PRODUCT_LOCATION_SYNC: 'product-location-sync',
  CROWDSOURCE_SYNC: 'crowdsource-sync'
};

self.addEventListener('install', (event) => {
  console.log('🔧 CartPilot Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Create offline cache
      caches.open(OFFLINE_CACHE).then(cache => {
        console.log('🔌 Creating offline cache...');
        return cache.add(new Request('/offline.html'));
      })
    ]).then(() => {
      console.log('✅ CartPilot Service Worker: Installation complete');
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('🚀 CartPilot Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clear old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => 
              cacheName.startsWith('cartpilot-') && 
              !cacheName.includes(CACHE_VERSION)
            )
            .map(cacheName => {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      }),
      
      // Claim all clients
      self.clients.claim()
    ]).then(() => {
      console.log('✅ CartPilot Service Worker: Activation complete');
    })
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests and browser extensions
  if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // Handle different types of requests
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(handleNavigation(request));
  } else {
    event.respondWith(handleGenericRequest(request));
  }
});

// Static assets - Cache first strategy
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    // Update cache in background
    fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
    }).catch(() => {}); // Ignore network errors
    
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.log('📱 Offline mode: Static asset not in cache:', request.url);
    return new Response('Asset not available offline', { status: 503 });
  }
}

// API requests - Network first with cache fallback
async function handleAPIRequest(request) {
  const isNetworkFirst = NETWORK_FIRST_PATTERNS.some(pattern => 
    pattern.test(request.url)
  );

  if (isNetworkFirst) {
    return handleNetworkFirst(request);
  } else {
    return handleCacheFirst(request);
  }
}

async function handleNetworkFirst(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('🌐 Network failed, checking cache:', request.url);
    
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    
    if (cached) {
      // Add offline header
      const headers = new Headers(cached.headers);
      headers.set('X-Cache-Status', 'offline');
      
      return new Response(cached.body, {
        status: cached.status,
        statusText: cached.statusText,
        headers: headers
      });
    }
    
    return new Response(JSON.stringify({
      error: 'Offline - Data not available',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleCacheFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);
  
  if (cached) {
    // Update cache in background
    fetch(request).then(response => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
    }).catch(() => {});
    
    return cached;
  }
  
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Data not available offline',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Navigation requests - App shell pattern
async function handleNavigation(request) {
  try {
    const response = await fetch(request);
    
    // Cache successful navigation responses
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('📱 Navigation offline, serving app shell');
    
    // Try to serve cached version
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match('/index.html');
    
    if (cached) {
      return cached;
    }
    
    // Fallback to offline page
    const offlineCache = await caches.open(OFFLINE_CACHE);
    const offline = await offlineCache.match('/offline.html');
    
    return offline || new Response('Offline', { status: 503 });
  }
}

// Generic requests - Network with cache fallback
async function handleGenericRequest(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cached = await cache.match(request);
    
    return cached || new Response('Not available offline', { status: 503 });
  }
}

// Background Sync - Handle offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Background Sync:', event.tag);
  
  switch (event.tag) {
    case SYNC_TAGS.CART_SYNC:
      event.waitUntil(syncCartData());
      break;
    case SYNC_TAGS.ROUTE_SYNC:
      event.waitUntil(syncRouteData());
      break;
    case SYNC_TAGS.PRODUCT_LOCATION_SYNC:
      event.waitUntil(syncProductLocations());
      break;
    case SYNC_TAGS.CROWDSOURCE_SYNC:
      event.waitUntil(syncCrowdsourceData());
      break;
  }
});

// Sync functions
async function syncCartData() {
  try {
    console.log('🛒 Syncing cart data...');
    
    // Get offline cart data from IndexedDB
    const cartData = await getOfflineData('cart');
    
    if (cartData && cartData.length > 0) {
      // Sync with server
      const response = await fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartData })
      });
      
      if (response.ok) {
        console.log('✅ Cart data synced successfully');
        await clearOfflineData('cart');
        
        // Notify all clients
        await notifyClients({
          type: 'SYNC_COMPLETE',
          data: { synced: 'cart' }
        });
      }
    }
  } catch (error) {
    console.error('❌ Cart sync failed:', error);
  }
}

async function syncRouteData() {
  try {
    console.log('🗺️ Syncing route data...');
    
    const routeData = await getOfflineData('routes');
    
    if (routeData && routeData.length > 0) {
      const response = await fetch('/api/routes/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routes: routeData })
      });
      
      if (response.ok) {
        console.log('✅ Route data synced successfully');
        await clearOfflineData('routes');
        
        await notifyClients({
          type: 'SYNC_COMPLETE',
          data: { synced: 'routes' }
        });
      }
    }
  } catch (error) {
    console.error('❌ Route sync failed:', error);
  }
}

async function syncProductLocations() {
  try {
    console.log('📍 Syncing product locations...');
    
    const locationData = await getOfflineData('product_locations');
    
    if (locationData && locationData.length > 0) {
      const response = await fetch('/api/products/locations/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locations: locationData })
      });
      
      if (response.ok) {
        console.log('✅ Product locations synced successfully');
        await clearOfflineData('product_locations');
        
        await notifyClients({
          type: 'SYNC_COMPLETE',
          data: { synced: 'product_locations' }
        });
      }
    }
  } catch (error) {
    console.error('❌ Product location sync failed:', error);
  }
}

async function syncCrowdsourceData() {
  try {
    console.log('👥 Syncing crowdsource data...');
    
    const crowdsourceData = await getOfflineData('crowdsource_updates');
    
    if (crowdsourceData && crowdsourceData.length > 0) {
      const response = await fetch('/api/crowdsource/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates: crowdsourceData })
      });
      
      if (response.ok) {
        console.log('✅ Crowdsource data synced successfully');
        await clearOfflineData('crowdsource_updates');
        
        await notifyClients({
          type: 'SYNC_COMPLETE',
          data: { synced: 'crowdsource_updates' }
        });
      }
    }
  } catch (error) {
    console.error('❌ Crowdsource sync failed:', error);
  }
}

// Push Notifications
self.addEventListener('push', (event) => {
  console.log('📬 Push notification received');
  
  let notificationData = {
    title: 'CartPilot',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'default',
    data: {}
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      notificationData = { ...notificationData, ...payload };
    } catch (error) {
      console.error('Failed to parse push payload:', error);
    }
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    data: notificationData.data,
    requireInteraction: notificationData.urgent || false,
    actions: notificationData.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationOptions)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.notification.tag);
  
  event.notification.close();

  const clickAction = event.action;
  const notificationData = event.notification.data;

  let url = '/';
  
  // Handle different notification types
  switch (notificationData.type) {
    case 'deal_alert':
      url = '/deals';
      break;
    case 'route_ready':
      url = '/map';
      break;
    case 'sync_complete':
      url = '/cart';
      break;
    case 'crowdsource':
      url = '/navigate';
      break;
    default:
      url = notificationData.url || '/';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      // Check if there's already a window/tab open
      for (let client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      
      // Open new window/tab
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Message handling (for client communication)
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'SYNC_REQUEST':
      if (data.tag && Object.values(SYNC_TAGS).includes(data.tag)) {
        self.registration.sync.register(data.tag);
      }
      break;
      
    case 'CACHE_UPDATE':
      updateCache(data.url, data.response);
      break;
  }
});

// Helper functions
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|woff2?|ttf|ico)$/i) ||
         STATIC_ASSETS.includes(url.pathname);
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/') ||
         API_CACHE_PATTERNS.some(pattern => pattern.test(request.url));
}

function isNavigationRequest(request) {
  return request.mode === 'navigate' ||
         (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
}

async function getOfflineData(storeName) {
  // This would interface with IndexedDB
  // Implementation depends on your offline storage structure
  return [];
}

async function clearOfflineData(storeName) {
  // Clear synced data from IndexedDB
}

async function updateCache(url, responseData) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const response = new Response(JSON.stringify(responseData), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(url, response);
  } catch (error) {
    console.error('Cache update failed:', error);
  }
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage(message);
  });
}

console.log('🚀 CartPilot Service Worker: Loaded and ready!');