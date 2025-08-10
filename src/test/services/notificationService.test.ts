import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Notification API BEFORE importing anything
Object.defineProperty(global, 'Notification', {
  value: {
    permission: 'granted',
    requestPermission: vi.fn().mockResolvedValue('granted')
  },
  writable: true,
  configurable: true
})

// Also mock it on window
Object.defineProperty(window, 'Notification', {
  value: global.Notification,
  writable: true,
  configurable: true
})

import { notificationService } from '../../services/notificationService'

// Mock service worker registration
const mockServiceWorkerRegistration = {
  showNotification: vi.fn().mockResolvedValue(undefined)
}

// Mock navigator.serviceWorker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    ready: Promise.resolve(mockServiceWorkerRegistration),
    getRegistration: vi.fn().mockResolvedValue(mockServiceWorkerRegistration)
  },
  writable: true
})

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  value: {
    permission: 'granted',
    requestPermission: vi.fn().mockResolvedValue('granted')
  },
  writable: true
})

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset localStorage mock
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
      enabled: true,
      deals: true,
      routes: true,
      reminders: true,
      points: true,
      community: true
    }))
  })

  describe('Initialization', () => {
    it('should initialize with default settings', async () => {
      mockLocalStorage.getItem.mockReturnValueOnce(null)
      
      await notificationService.init()
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'cartpilot_notification_settings',
        expect.stringContaining('"enabled":true')
      )
    })

    it('should load existing settings', async () => {
      await notificationService.init()
      
      const settings = notificationService.getSettings()
      expect(settings.enabled).toBe(true)
      expect(settings.deals).toBe(true)
    })
  })

  describe('Settings Management', () => {
    it('should update notification settings', async () => {
      const newSettings = {
        enabled: false,
        deals: false,
        routes: true,
        reminders: true,
        points: false,
        community: true
      }

      await notificationService.updateSettings(newSettings)
      
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'cartpilot_notification_settings',
        JSON.stringify(newSettings)
      )
    })

    it('should get current settings', () => {
      const settings = notificationService.getSettings()
      
      expect(settings).toHaveProperty('enabled')
      expect(settings).toHaveProperty('deals')
      expect(settings).toHaveProperty('routes')
      expect(settings).toHaveProperty('reminders')
      expect(settings).toHaveProperty('points')
      expect(settings).toHaveProperty('community')
    })
  })

  describe('Notification Display', () => {
    it('should show notification when enabled', async () => {
      await notificationService.showNotification({
        title: 'Test Notification',
        body: 'This is a test',
        tag: 'test',
        data: { type: 'test' }
      })
      
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        'Test Notification',
        expect.objectContaining({
          body: 'This is a test',
          tag: 'test',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-72x72.png'
        })
      )
    })

    it('should not show notification when disabled', async () => {
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({
        enabled: false
      }))
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      await notificationService.showNotification({
        title: 'Test Notification',
        body: 'This is a test',
        tag: 'test',
        data: {}
      })
      
      expect(mockServiceWorkerRegistration.showNotification).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith('🔕 Notifications disabled')
    })

    it('should handle notification permission denied', async () => {
      window.Notification.permission = 'denied'
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      
      await notificationService.showNotification({
        title: 'Test Notification',
        body: 'This is a test',
        tag: 'test',
        data: {}
      })
      
      expect(mockServiceWorkerRegistration.showNotification).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith('❌ Notification permission denied')
    })
  })

  describe('Specific Notification Types', () => {
    it('should notify about deals', async () => {
      await notificationService.notifyDeal('50% off Organic Milk', 'Tesco Manchester')
      
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        '🏷️ Deal Alert!',
        expect.objectContaining({
          body: '50% off Organic Milk at Tesco Manchester',
          tag: 'deal-alert'
        })
      )
    })

    it('should notify when route is ready', async () => {
      await notificationService.notifyRouteReady(5, 'Tesco Manchester')
      
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        '🗺️ Route Ready!',
        expect.objectContaining({
          body: 'Your optimal route for 5 items at Tesco Manchester is ready!',
          tag: 'route-ready'
        })
      )
    })

    it('should notify about points earned', async () => {
      await notificationService.notifyPointsEarned(50, 'completing your shopping')
      
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        '🎉 Points Earned!',
        expect.objectContaining({
          body: 'You earned 50 points for completing your shopping!',
          tag: 'points-earned'
        })
      )
    })

    it('should send cart reminders', async () => {
      await notificationService.scheduleCartReminder(['Milk', 'Bread'], 1000)
      
      setTimeout(() => {
        expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
          '🛒 Don\'t forget your shopping!',
          expect.objectContaining({
            body: 'You have 2 items in your cart: Milk, Bread',
            tag: 'cart-reminder'
          })
        )
      }, 1100)
    })
  })

  describe('Smart Notifications', () => {
    it('should send location-based notifications', async () => {
      await notificationService.notifyNearStore('Tesco Manchester', 0.5)
      
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        '🏪 Store Nearby!',
        expect.objectContaining({
          body: 'You\'re 0.5 miles from Tesco Manchester. Ready to shop?',
          tag: 'store-nearby'
        })
      )
    })

    it('should send item availability notifications', async () => {
      await notificationService.notifyItemAvailable('Organic Milk', 'Tesco Manchester')
      
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        '📦 Item Available!',
        expect.objectContaining({
          body: 'Organic Milk is now available at Tesco Manchester',
          tag: 'item-available'
        })
      )
    })

    it('should send community update notifications', async () => {
      await notificationService.notifyCommunityUpdate('New product location verified', 5)
      
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalledWith(
        '👥 Community Update',
        expect.objectContaining({
          body: 'New product location verified (+5 points)',
          tag: 'community-update'
        })
      )
    })
  })

  describe('Permission Management', () => {
    it('should request notification permission', async () => {
      const permission = await notificationService.requestPermission()
      
      expect(window.Notification.requestPermission).toHaveBeenCalled()
      expect(permission).toBe('granted')
    })

    it('should handle permission already granted', async () => {
      window.Notification.permission = 'granted'
      
      const permission = await notificationService.requestPermission()
      
      expect(permission).toBe('granted')
    })

    it('should handle notification API not supported', async () => {
      delete (window as any).Notification
      
      const permission = await notificationService.requestPermission()
      
      expect(permission).toBe('denied')
    })
  })

  describe('Error Handling', () => {
    it('should handle service worker not available', async () => {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        writable: true
      })
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      await notificationService.showNotification({
        title: 'Test',
        body: 'Test',
        tag: 'test',
        data: {}
      })
      
      expect(consoleSpy).toHaveBeenCalledWith('❌ Service worker not available for notifications')
    })

    it('should handle notification display errors', async () => {
      mockServiceWorkerRegistration.showNotification.mockRejectedValueOnce(new Error('Display failed'))
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      await notificationService.showNotification({
        title: 'Test',
        body: 'Test',
        tag: 'test',
        data: {}
      })
      
      expect(consoleSpy).toHaveBeenCalledWith('❌ Failed to show notification:', expect.any(Error))
    })
  })

  describe('Notification Categories', () => {
    it('should respect category-specific settings', async () => {
      mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({
        enabled: true,
        deals: false,
        routes: true,
        reminders: true,
        points: true,
        community: true
      }))
      
      // Deal notifications should be blocked
      await notificationService.notifyDeal('50% off Milk', 'Tesco')
      expect(mockServiceWorkerRegistration.showNotification).not.toHaveBeenCalled()
      
      // Route notifications should work
      await notificationService.notifyRouteReady(3, 'Tesco')
      expect(mockServiceWorkerRegistration.showNotification).toHaveBeenCalled()
    })
  })

  describe('Notification Scheduling', () => {
    it('should schedule delayed notifications', async () => {
      const originalTimeout = setTimeout
      const mockTimeout = vi.fn()
      global.setTimeout = mockTimeout
      
      await notificationService.scheduleCartReminder(['Milk'], 5000)
      
      expect(mockTimeout).toHaveBeenCalledWith(expect.any(Function), 5000)
      
      global.setTimeout = originalTimeout
    })

    it('should handle scheduling errors', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Pass invalid delay
      await notificationService.scheduleCartReminder(['Milk'], -1000)
      
      // Should default to minimum delay
      expect(setTimeout).toHaveBeenCalled()
    })
  })
})