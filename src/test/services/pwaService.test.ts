import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { pwaService } from '../../services/pwaService'

// Mock service worker registration
const mockServiceWorkerRegistration = {
  installing: null,
  waiting: null,
  active: null,
  scope: '/',
  update: vi.fn().mockResolvedValue(undefined),
  postMessage: vi.fn(),
  addEventListener: vi.fn(),
  pushManager: {
    getSubscription: vi.fn().mockResolvedValue(null),
    subscribe: vi.fn().mockResolvedValue({
      endpoint: 'https://example.com/push',
      getKey: vi.fn().mockReturnValue(new ArrayBuffer(32))
    })
  },
  sync: {
    register: vi.fn().mockResolvedValue(undefined)
  }
}

// Mock navigator.serviceWorker BEFORE importing pwaService
const mockRegister = vi.fn().mockResolvedValue(mockServiceWorkerRegistration)
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: mockRegister,
    addEventListener: vi.fn(),
    controller: null
  },
  writable: true
})

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  value: {
    permission: 'default',
    requestPermission: vi.fn().mockResolvedValue('granted')
  },
  writable: true
})

// Mock matchMedia for display mode detection
Object.defineProperty(window, 'matchMedia', {
  value: vi.fn(() => ({
    matches: false,
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  })),
  writable: true
})

// Mock caches API
Object.defineProperty(window, 'caches', {
  value: {
    keys: vi.fn().mockResolvedValue(['cartpilot-v1-static', 'cartpilot-v1-dynamic']),
    delete: vi.fn().mockResolvedValue(true),
    open: vi.fn().mockResolvedValue({
      keys: vi.fn().mockResolvedValue([]),
      match: vi.fn().mockResolvedValue(null)
    })
  },
  writable: true
})

describe('PWAService', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    
    // Reset service worker registration mock
    mockRegister.mockResolvedValue(mockServiceWorkerRegistration)
    
    // Reset the pwaService registration
    const service = pwaService as any
    service.registration = mockServiceWorkerRegistration
    
    // Reset install prompt state
    const mockPromptEvent = {
      preventDefault: vi.fn(),
      prompt: vi.fn().mockResolvedValue(),
      userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
      platforms: ['web']
    }
    
    // Simulate install prompt availability
    window.dispatchEvent(new CustomEvent('beforeinstallprompt', { detail: mockPromptEvent }))
    
    // Allow PWA service to initialize
    await new Promise(resolve => setTimeout(resolve, 10))
  })

  describe('Service Worker Registration', () => {
    it('should register service worker successfully', async () => {
      // The service worker registration happens during the module load/constructor
      // Since the test imports pwaService, it should have triggered registration
      // Just verify it was called during module initialization
      expect(mockRegister).toHaveBeenCalledWith('/sw.js', {
        scope: '/'
      })
    })

    it('should handle service worker registration failure', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Mock failed registration
      navigator.serviceWorker.register = vi.fn().mockRejectedValue(new Error('Registration failed'))
      
      // Trigger the service init by accessing the pwaService which calls init in constructor
      const service = pwaService as any
      await service.init()
      
      expect(consoleSpy).toHaveBeenCalledWith('❌ Service Worker registration failed:', expect.any(Error))
    })
  })

  describe('PWA Installation', () => {
    it('should detect when install prompt is available', () => {
      expect(pwaService.isInstallPromptAvailable()).toBe(true)
    })

    it('should get install platforms', () => {
      const platforms = pwaService.getInstallPlatforms()
      expect(Array.isArray(platforms)).toBe(true)
    })

    it('should show install prompt', async () => {
      // Set up the deferred prompt on the service
      const service = pwaService as any
      service.deferredPrompt = {
        prompt: vi.fn().mockResolvedValue(),
        userChoice: Promise.resolve({ outcome: 'accepted', platform: 'web' }),
        platforms: ['web']
      }
      
      const result = await pwaService.showInstallPrompt()
      expect(result).toBe(true)
    })

    it('should handle install prompt rejection', async () => {
      // Mock rejected prompt
      const service = pwaService as any
      service.deferredPrompt = {
        prompt: vi.fn().mockResolvedValue(),
        userChoice: Promise.resolve({ outcome: 'dismissed', platform: 'web' }),
        platforms: ['web']
      }
      
      const result = await pwaService.showInstallPrompt()
      expect(result).toBe(false)
    })

    it('should detect if app is installed', () => {
      // Mock standalone mode
      window.matchMedia = vi.fn(() => ({
        matches: true,
        media: '(display-mode: standalone)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
      
      expect(pwaService.isInstalled()).toBe(true)
    })
  })

  describe('App Updates', () => {
    it('should detect when update is available', () => {
      const service = pwaService as any
      service.updateInfo = { available: true, waiting: mockServiceWorkerRegistration }
      
      expect(pwaService.hasUpdateAvailable()).toBe(true)
    })

    it('should apply updates', async () => {
      const service = pwaService as any
      service.updateInfo = { available: true, waiting: mockServiceWorkerRegistration }
      
      await pwaService.applyUpdate()
      
      expect(mockServiceWorkerRegistration.postMessage).toHaveBeenCalledWith({
        type: 'SKIP_WAITING'
      })
    })

    it('should check for updates', async () => {
      // Set the registration on the service
      const service = pwaService as any
      service.registration = mockServiceWorkerRegistration
      
      const result = await pwaService.checkForUpdates()
      
      expect(mockServiceWorkerRegistration.update).toHaveBeenCalled()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('Background Sync', () => {
    it('should request background sync', async () => {
      // Set the registration on the service
      const service = pwaService as any
      service.registration = mockServiceWorkerRegistration
      
      await pwaService.requestBackgroundSync('test-sync')
      
      expect(mockServiceWorkerRegistration.sync.register).toHaveBeenCalledWith('test-sync')
    })

    it('should handle background sync not supported', async () => {
      const service = pwaService as any
      service.registration = { sync: null }
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      await pwaService.requestBackgroundSync('test-sync')
      
      expect(consoleSpy).toHaveBeenCalledWith('❌ Background Sync not supported')
    })
  })

  describe('Push Notifications', () => {
    it('should request notification permission', async () => {
      const permission = await pwaService.requestNotificationPermission()
      
      expect(window.Notification.requestPermission).toHaveBeenCalled()
      expect(permission).toBe('granted')
    })

    it('should handle notification not supported', async () => {
      // Mock Notification API as undefined
      const originalNotification = window.Notification
      delete (window as any).Notification
      
      const permission = await pwaService.requestNotificationPermission()
      
      expect(permission).toBe('denied')
      
      // Restore original
      Object.defineProperty(window, 'Notification', {
        value: originalNotification,
        configurable: true
      })
    })

    it('should subscribe to push notifications', async () => {
      // Mock existing subscription to null (so new subscription is created)
      mockServiceWorkerRegistration.pushManager.getSubscription.mockResolvedValue(null)
      
      // Mock VAPID key - use import.meta.env for Vite
      const originalEnv = import.meta.env
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, VITE_VAPID_PUBLIC_KEY: 'test-vapid-key' },
        writable: true
      })
      
      const subscription = await pwaService.subscribeToPushNotifications()
      
      expect(mockServiceWorkerRegistration.pushManager.subscribe).toHaveBeenCalled()
      expect(subscription).toBeTruthy()
      
      // Restore original env
      Object.defineProperty(import.meta, 'env', {
        value: originalEnv,
        writable: true
      })
    })

    it('should handle push subscription failure', async () => {
      // Mock subscription failure
      mockServiceWorkerRegistration.pushManager.getSubscription.mockResolvedValue(null)
      mockServiceWorkerRegistration.pushManager.subscribe = vi.fn().mockRejectedValue(new Error('Subscription failed'))
      
      // Mock VAPID key
      const originalEnv = import.meta.env
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, VITE_VAPID_PUBLIC_KEY: 'test-vapid-key' },
        writable: true
      })
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const subscription = await pwaService.subscribeToPushNotifications()
      
      expect(subscription).toBeNull()
      expect(consoleSpy).toHaveBeenCalledWith('❌ Push subscription failed:', expect.any(Error))
      
      // Restore original env
      Object.defineProperty(import.meta, 'env', {
        value: originalEnv,
        writable: true
      })
    })
  })

  describe('Cache Management', () => {
    it('should clear cache', async () => {
      await pwaService.clearCache()
      
      expect(caches.keys).toHaveBeenCalled()
      expect(caches.delete).toHaveBeenCalledWith('cartpilot-v1-static')
      expect(caches.delete).toHaveBeenCalledWith('cartpilot-v1-dynamic')
    })

    it('should get cache size', async () => {
      const size = await pwaService.getCacheSize()
      
      expect(typeof size).toBe('number')
      expect(size).toBeGreaterThanOrEqual(0)
    })

    it('should handle cache not supported', async () => {
      // Mock caches API as undefined
      const originalCaches = window.caches
      Object.defineProperty(window, 'caches', {
        value: undefined,
        configurable: true
      })
      
      await pwaService.clearCache()
      const size = await pwaService.getCacheSize()
      
      expect(size).toBe(0)
      
      // Restore original
      Object.defineProperty(window, 'caches', {
        value: originalCaches,
        configurable: true
      })
    })
  })

  describe('Network Status', () => {
    it('should report online status', () => {
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true })
      expect(pwaService.isOnline()).toBe(true)
      
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true })
      expect(pwaService.isOnline()).toBe(false)
    })

    it('should get connection type', () => {
      // Mock connection API
      Object.defineProperty(navigator, 'connection', {
        value: { effectiveType: '4g' },
        writable: true
      })
      
      expect(pwaService.getConnectionType()).toBe('4g')
    })

    it('should handle missing connection API', () => {
      const originalConnection = navigator.connection
      Object.defineProperty(navigator, 'connection', {
        value: undefined,
        configurable: true
      })
      
      expect(pwaService.getConnectionType()).toBe('unknown')
      
      // Restore original
      if (originalConnection !== undefined) {
        Object.defineProperty(navigator, 'connection', {
          value: originalConnection,
          configurable: true
        })
      }
    })
  })

  describe('Event System', () => {
    it('should register and remove event listeners', () => {
      const mockCallback = vi.fn()
      
      pwaService.on('test-event', mockCallback)
      pwaService.off('test-event', mockCallback)
      
      // Trigger private emit method
      const service = pwaService as any
      service.emit('test-event', { data: 'test' })
      
      expect(mockCallback).not.toHaveBeenCalled()
    })

    it('should handle errors in event callbacks gracefully', () => {
      const mockCallback = vi.fn().mockImplementation(() => {
        throw new Error('Callback error')
      })
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      pwaService.on('test-event', mockCallback)
      
      // Trigger private emit method
      const service = pwaService as any
      expect(() => {
        service.emit('test-event', { data: 'test' })
      }).not.toThrow()
      
      expect(consoleSpy).toHaveBeenCalled()
    })
  })

  describe('PWA Status', () => {
    it('should get comprehensive PWA status', () => {
      // Ensure Notification is available for status check
      if (!window.Notification) {
        Object.defineProperty(window, 'Notification', {
          value: {
            permission: 'default',
            requestPermission: vi.fn().mockResolvedValue('granted')
          },
          configurable: true
        })
      }
      
      const status = pwaService.getStatus()
      
      expect(status).toHaveProperty('isInstalled')
      expect(status).toHaveProperty('installPromptAvailable')
      expect(status).toHaveProperty('hasUpdate')
      expect(status).toHaveProperty('isOnline')
      expect(status).toHaveProperty('connectionType')
      expect(status).toHaveProperty('notificationPermission')
      expect(status).toHaveProperty('platforms')
    })
  })

  describe('Utility Functions', () => {
    it('should convert URL base64 to Uint8Array', () => {
      const service = pwaService as any
      const testString = 'test-string'
      const base64 = btoa(testString)
      
      const result = service.urlBase64ToUint8Array(base64)
      
      expect(result).toBeInstanceOf(Uint8Array)
      expect(result.length).toBeGreaterThan(0)
    })
  })
})