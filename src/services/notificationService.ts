// Push Notification Service for CartPilot
export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  tag?: string
  data?: any
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

class NotificationService {
  private registration: ServiceWorkerRegistration | null = null
  private permission: NotificationPermission = 'default'

  constructor() {
    // Safe access to Notification API with fallback
    this.permission = (typeof Notification !== 'undefined' ? Notification.permission : 'denied') as NotificationPermission
    this.init()
  }

  async init(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.ready
        console.log('🔔 Notification service initialized')
      } catch (error) {
        console.error('Failed to initialize notification service:', error)
      }
    }
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      return false
    }

    if (this.permission === 'granted') {
      return true
    }

    if (this.permission === 'denied') {
      console.log('Notification permission denied')
      return false
    }

    const permission = await Notification.requestPermission()
    this.permission = permission

    if (permission === 'granted') {
      console.log('✅ Notification permission granted')
      return true
    } else {
      console.log('❌ Notification permission denied')
      return false
    }
  }

  // Show local notification
  async showNotification(payload: NotificationPayload): Promise<void> {
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission()
      if (!granted) return
    }

    const options: NotificationOptions = {
      body: payload.body,
      icon: payload.icon || '/icon-192x192.png',
      badge: payload.badge || '/icon-192x192.png',
      image: payload.image,
      tag: payload.tag,
      data: payload.data,
      actions: payload.actions,
      vibrate: [200, 100, 200],
      requireInteraction: true
    }

    if (this.registration && 'showNotification' in this.registration) {
      // Use service worker for better reliability
      await this.registration.showNotification(payload.title, options)
    } else {
      // Fallback to basic notification
      new Notification(payload.title, options)
    }

    console.log('🔔 Notification sent:', payload.title)
  }

  // Smart shopping notifications
  async notifyForgottenItems(items: string[]): Promise<void> {
    if (items.length === 0) return

    await this.showNotification({
      title: '🛒 Don\'t forget your items!',
      body: `You have ${items.length} items waiting in your cart: ${items.slice(0, 3).join(', ')}${items.length > 3 ? '...' : ''}`,
      tag: 'forgotten-items',
      data: { type: 'forgotten-items', items },
      actions: [
        { action: 'view-cart', title: '👀 View Cart' },
        { action: 'dismiss', title: '❌ Dismiss' }
      ]
    })
  }

  async notifyDealAlert(deal: { product: string; store: string; discount: string }): Promise<void> {
    await this.showNotification({
      title: '🔥 Deal Alert!',
      body: `${deal.discount} off ${deal.product} at ${deal.store}`,
      tag: 'deal-alert',
      data: { type: 'deal-alert', deal },
      actions: [
        { action: 'add-to-cart', title: '➕ Add to Cart' },
        { action: 'view-store', title: '🏪 View Store' }
      ]
    })
  }

  async notifyShoppingReminder(storeName: string): Promise<void> {
    await this.showNotification({
      title: '⏰ Shopping Reminder',
      body: `Perfect time to shop at ${storeName}! Less crowded now.`,
      tag: 'shopping-reminder',
      data: { type: 'shopping-reminder', storeName },
      actions: [
        { action: 'start-shopping', title: '🛒 Start Shopping' },
        { action: 'snooze', title: '⏰ Remind Later' }
      ]
    })
  }

  async notifyRouteReady(itemCount: number, storeName: string): Promise<void> {
    await this.showNotification({
      title: '🗺️ Route Ready!',
      body: `Your optimized route for ${itemCount} items at ${storeName} is ready to use.`,
      tag: 'route-ready',
      data: { type: 'route-ready', itemCount, storeName },
      actions: [
        { action: 'view-route', title: '🗺️ View Route' },
        { action: 'start-shopping', title: '🛒 Start Shopping' }
      ]
    })
  }

  async notifyOfflineSync(syncCount: number): Promise<void> {
    await this.showNotification({
      title: '🔄 Data Synced!',
      body: `${syncCount} offline items have been synced successfully.`,
      tag: 'offline-sync',
      data: { type: 'offline-sync', syncCount }
    })
  }

  async notifyLowStock(product: string, store: string): Promise<void> {
    await this.showNotification({
      title: '⚠️ Low Stock Alert',
      body: `${product} is running low at ${store}. Shop now!`,
      tag: 'low-stock',
      data: { type: 'low-stock', product, store },
      actions: [
        { action: 'shop-now', title: '🏃 Shop Now' },
        { action: 'find-alternative', title: '🔍 Find Alternative' }
      ]
    })
  }

  async notifyPointsEarned(points: number, action: string): Promise<void> {
    await this.showNotification({
      title: '⭐ Points Earned!',
      body: `You earned ${points} points for ${action}!`,
      tag: 'points-earned',
      data: { type: 'points-earned', points, action }
    })
  }

  async notifyLevelUp(newLevel: number): Promise<void> {
    await this.showNotification({
      title: '🎉 Level Up!',
      body: `Congratulations! You've reached level ${newLevel}!`,
      tag: 'level-up',
      data: { type: 'level-up', level: newLevel },
      actions: [
        { action: 'view-rewards', title: '🎁 View Rewards' },
        { action: 'share', title: '📤 Share' }
      ]
    })
  }

  // Scheduled notifications
  async scheduleShoppingReminder(delay: number): Promise<void> {
    setTimeout(() => {
      this.notifyShoppingReminder('your selected store')
    }, delay)
  }

  async scheduleCartReminder(items: string[], delay: number = 3600000): Promise<void> {
    setTimeout(() => {
      if (items.length > 0) {
        this.notifyForgottenItems(items)
      }
    }, delay) // Default 1 hour
  }

  // Handle notification clicks
  handleNotificationClick(event: NotificationEvent): void {
    event.notification.close()
    
    const { data } = event.notification
    const { action } = event

    console.log('🔔 Notification clicked:', data?.type, action)

    // Open the app
    event.waitUntil(
      self.clients.openWindow('/')
    )

    // Handle specific actions
    switch (action) {
      case 'view-cart':
        // Navigate to cart tab
        break
      case 'view-route':
        // Navigate to map tab
        break
      case 'start-shopping':
        // Navigate to stores tab
        break
      case 'add-to-cart':
        // Add product to cart
        break
      // Add more action handlers
    }
  }

  // Get notification settings
  getSettings(): { 
    permission: NotificationPermission
    enabled: boolean
    reminders: boolean
    deals: boolean
    points: boolean
  } {
    const settings = localStorage.getItem('cartpilot-notifications')
    const defaults = {
      permission: this.permission,
      enabled: this.permission === 'granted',
      reminders: true,
      deals: true,
      points: true
    }

    return settings ? { ...defaults, ...JSON.parse(settings) } : defaults
  }

  // Update notification settings
  updateSettings(settings: Partial<{
    enabled: boolean
    reminders: boolean
    deals: boolean
    points: boolean
  }>): void {
    const current = this.getSettings()
    const updated = { ...current, ...settings }
    localStorage.setItem('cartpilot-notifications', JSON.stringify(updated))
    console.log('🔔 Notification settings updated:', updated)
  }

  // Clear all notifications with specific tag
  async clearNotifications(tag?: string): Promise<void> {
    if (!this.registration) return

    const notifications = await this.registration.getNotifications({ tag })
    notifications.forEach(notification => notification.close())
    
    console.log(`🧹 Cleared ${notifications.length} notifications`)
  }
}

// Create singleton instance
export const notificationService = new NotificationService()

// Global notification click handler for service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'notification-click') {
      console.log('🔔 Notification click message received:', event.data)
    }
  })
}