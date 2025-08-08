// Simple analytics service for tracking user interactions in CartPilot
// This helps us understand how users interact with the app for improvements

interface AnalyticsEvent {
  event: string
  properties?: Record<string, any>
  timestamp?: number
}

class AnalyticsService {
  private events: AnalyticsEvent[] = []
  private isProduction = import.meta.env.PROD
  
  track(event: string, properties?: Record<string, any>) {
    const analyticsEvent: AnalyticsEvent = {
      event,
      properties,
      timestamp: Date.now()
    }
    
    // Store locally for now
    this.events.push(analyticsEvent)
    
    // Log in development
    if (!this.isProduction) {
      console.log('📊 Analytics:', analyticsEvent)
    }
    
    // In production, you could send to analytics service
    if (this.isProduction) {
      // TODO: Send to analytics service like Google Analytics, Mixpanel, etc.
      this.sendToAnalyticsService(analyticsEvent)
    }
  }
  
  private sendToAnalyticsService(event: AnalyticsEvent) {
    // Placeholder for production analytics
    // Could integrate with Google Analytics, Mixpanel, etc.
    
    // For now, we'll batch events and send them periodically
    if (this.events.length > 10) {
      this.flushEvents()
    }
  }
  
  private flushEvents() {
    // Send batched events to analytics service
    console.log('📊 Flushing analytics events:', this.events.length)
    this.events = []
  }
  
  // Track specific app events
  trackStoreSearch(method: 'location' | 'postcode', resultCount: number) {
    this.track('store_search', {
      method,
      resultCount,
      hasResults: resultCount > 0
    })
  }
  
  trackStoreSelection(storeName: string, distance?: number) {
    this.track('store_selected', {
      storeName,
      distance
    })
  }
  
  trackNavigation(destination: string) {
    this.track('navigation_started', {
      destination
    })
  }
  
  trackProductSearch(query: string, resultCount: number) {
    this.track('product_search', {
      query: query.toLowerCase(),
      resultCount,
      hasResults: resultCount > 0
    })
  }
  
  trackCartAction(action: 'add_item' | 'remove_item' | 'complete_item', itemName?: string) {
    this.track('cart_action', {
      action,
      itemName: itemName?.toLowerCase()
    })
  }
  
  trackAuthAction(action: 'sign_in' | 'sign_up' | 'sign_out') {
    this.track('auth_action', {
      action
    })
  }
  
  trackError(error: string, component?: string) {
    this.track('error_occurred', {
      error,
      component
    })
  }
  
  trackPWAInstall() {
    this.track('pwa_installed')
  }
}

export const analytics = new AnalyticsService()
export default analytics