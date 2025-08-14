// Enhanced PWA Service - Installation, Updates, and Lifecycle Management

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

interface PWAUpdateInfo {
  available: boolean
  waiting?: ServiceWorkerRegistration
  installing?: ServiceWorkerRegistration
}

class PWAService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null
  private registration: ServiceWorkerRegistration | null = null
  private updateInfo: PWAUpdateInfo = { available: false }
  private listeners: Map<string, Array<(...args: any[]) => void>> = new Map()

  constructor() {
    this.init()
  }

  private async init() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })

        console.log('🚀 PWA Service Worker registered:', this.registration.scope)

        // Handle service worker updates
        this.handleServiceWorkerUpdates()

        // Listen for SW messages
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event.data)
        })

      } catch (error) {
        console.error('❌ Service Worker registration failed:', error)
      }
    }

    // Handle install prompt
    window.addEventListener('beforeinstallprompt', (e: any) => {
      console.log('📱 PWA install prompt available')
      e.preventDefault()
      this.deferredPrompt = e as BeforeInstallPromptEvent
      this.emit('installPromptAvailable', e)
    })

    // Handle successful installation
    window.addEventListener('appinstalled', (e) => {
      console.log('✅ PWA installed successfully')
      this.deferredPrompt = null
      this.emit('appInstalled', e)
    })

    // Handle online/offline status
    window.addEventListener('online', () => {
      console.log('🌐 Back online')
      this.emit('online')
      this.triggerBackgroundSync()
    })

    window.addEventListener('offline', () => {
      console.log('📵 Gone offline')
      this.emit('offline')
    })
  }

  // Service Worker Update Handling
  private handleServiceWorkerUpdates() {
    if (!this.registration) return

    // Check for updates immediately
    this.registration.update()

    // Listen for new service worker
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration!.installing

      if (newWorker) {
        console.log('🔄 New service worker installing...')
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Update available
              console.log('📦 Update available!')
              this.updateInfo = {
                available: true,
                installing: this.registration!,
                waiting: this.registration!
              }
              this.emit('updateAvailable', this.updateInfo)
            } else {
              // First install
              console.log('✅ Service worker installed for first time')
              this.emit('firstInstall')
            }
          }

          if (newWorker.state === 'activated') {
            console.log('🚀 New service worker activated')
            this.emit('updateActivated')
            window.location.reload()
          }
        })
      }
    })

    // Check for waiting service worker
    if (this.registration.waiting) {
      this.updateInfo = {
        available: true,
        waiting: this.registration
      }
      this.emit('updateAvailable', this.updateInfo)
    }
  }

  private handleServiceWorkerMessage(message: any) {
    const { type, data } = message

    switch (type) {
      case 'SYNC_COMPLETE':
        console.log('🔄 Background sync completed:', data)
        this.emit('syncComplete', data)
        break

      case 'CACHE_UPDATE':
        console.log('📦 Cache updated:', data)
        this.emit('cacheUpdate', data)
        break

      case 'PUSH_RECEIVED':
        console.log('📬 Push notification received:', data)
        this.emit('pushReceived', data)
        break
    }
  }

  // PWA Installation
  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('❌ Install prompt not available')
      return false
    }

    try {
      await this.deferredPrompt.prompt()
      const result = await this.deferredPrompt.userChoice

      console.log('📱 Install prompt result:', result.outcome)
      
      if (result.outcome === 'accepted') {
        this.deferredPrompt = null
        return true
      }
      
      return false
    } catch (error) {
      console.error('❌ Install prompt failed:', error)
      return false
    }
  }

  isInstallPromptAvailable(): boolean {
    return !!this.deferredPrompt
  }

  isInstalled(): boolean {
    // Check if running in standalone mode (installed PWA)
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.matchMedia('(display-mode: fullscreen)').matches ||
           (window.navigator as any).standalone === true
  }

  getInstallPlatforms(): string[] {
    return this.deferredPrompt?.platforms || []
  }

  // App Updates
  hasUpdateAvailable(): boolean {
    return this.updateInfo.available
  }

  async applyUpdate(): Promise<void> {
    if (!this.updateInfo.waiting) {
      console.log('❌ No update waiting')
      return
    }

    console.log('🔄 Applying update...')
    
    // Tell the waiting service worker to skip waiting
    this.updateInfo.waiting.postMessage({ type: 'SKIP_WAITING' })
    
    this.updateInfo = { available: false }
  }

  async checkForUpdates(): Promise<boolean> {
    if (!this.registration) return false

    try {
      await this.registration.update()
      return this.updateInfo.available
    } catch (error) {
      console.error('❌ Update check failed:', error)
      return false
    }
  }

  // Background Sync
  async requestBackgroundSync(tag: string): Promise<void> {
    if (!this.registration || !this.registration.sync) {
      console.log('❌ Background Sync not supported')
      return
    }

    try {
      await this.registration.sync.register(tag)
      console.log('🔄 Background sync requested:', tag)
    } catch (error) {
      console.error('❌ Background sync request failed:', error)
    }
  }

  private async triggerBackgroundSync() {
    const syncTags = [
      'cart-sync',
      'route-sync', 
      'product-location-sync',
      'crowdsource-sync'
    ]

    for (const tag of syncTags) {
      await this.requestBackgroundSync(tag)
    }
  }

  // Push Notifications
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('❌ Notifications not supported')
      return 'denied'
    }

    if (Notification.permission === 'granted') {
      return 'granted'
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      console.log('🔔 Notification permission:', permission)
      return permission
    }

    return Notification.permission
  }

  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.log('❌ Service worker not registered')
      return null
    }

    const permission = await this.requestNotificationPermission()
    if (permission !== 'granted') {
      console.log('❌ Notification permission denied')
      return null
    }

    try {
      // Check for existing subscription
      let subscription = await this.registration.pushManager.getSubscription()
      
      if (!subscription) {
        // Create new subscription
        const vapidPublicKey = typeof process !== 'undefined' ? process.env.REACT_APP_VAPID_PUBLIC_KEY : import.meta.env.VITE_VAPID_PUBLIC_KEY
        
        if (!vapidPublicKey) {
          console.log('❌ VAPID key not configured')
          return null
        }

        subscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
        })

        console.log('🔔 Push subscription created')
      }

      return subscription
    } catch (error) {
      console.error('❌ Push subscription failed:', error)
      return null
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Cache Management
  async clearCache(): Promise<void> {
    if (!('caches' in window)) return

    try {
      const cacheNames = await caches.keys()
      
      await Promise.all(
        cacheNames
          .filter(name => name.startsWith('cartpilot-'))
          .map(name => caches.delete(name))
      )
      
      console.log('🗑️ Cache cleared')
      this.emit('cacheCleared')
    } catch (error) {
      console.error('❌ Cache clear failed:', error)
    }
  }

  async getCacheSize(): Promise<number> {
    if (!('caches' in window)) return 0

    try {
      const cacheNames = await caches.keys()
      let totalSize = 0

      for (const name of cacheNames) {
        if (name.startsWith('cartpilot-')) {
          const cache = await caches.open(name)
          const requests = await cache.keys()
          
          for (const request of requests) {
            const response = await cache.match(request)
            if (response && response.body) {
              const reader = response.body.getReader()
              let size = 0
              
              while (true) {
                const { done, value } = await reader.read()
                if (done) break
                size += value.length
              }
              
              totalSize += size
            }
          }
        }
      }

      return totalSize
    } catch (error) {
      console.error('❌ Cache size calculation failed:', error)
      return 0
    }
  }

  // Network Status
  isOnline(): boolean {
    return navigator.onLine
  }

  getConnectionType(): string {
    const connection = (navigator as any).connection
    return connection?.effectiveType || 'unknown'
  }

  // Event System
  on(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback: (...args: any[]) => void) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error('❌ PWA Service event callback error:', error)
        }
      })
    }
  }

  // PWA Status
  getStatus() {
    return {
      isInstalled: this.isInstalled(),
      installPromptAvailable: this.isInstallPromptAvailable(),
      hasUpdate: this.hasUpdateAvailable(),
      isOnline: this.isOnline(),
      connectionType: this.getConnectionType(),
      notificationPermission: Notification.permission,
      platforms: this.getInstallPlatforms()
    }
  }
}

// Create singleton instance
export const pwaService = new PWAService()

// Export types for use in components
export type { PWAUpdateInfo, BeforeInstallPromptEvent }