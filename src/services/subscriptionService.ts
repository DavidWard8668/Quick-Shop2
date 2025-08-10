// Subscription & Monetization Service
export interface SubscriptionTier {
  id: string
  name: string
  price: number
  currency: string
  interval: 'monthly' | 'yearly'
  features: string[]
  limits: {
    stores?: number
    shoppingLists?: number
    aiRequests?: number
    syncDevices?: number
  }
}

export interface UserSubscription {
  userId: string
  tier: string
  status: 'active' | 'canceled' | 'expired' | 'trial'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  trialEnd?: Date
  cancelAtPeriodEnd: boolean
}

class SubscriptionService {
  private subscriptions: Map<string, UserSubscription> = new Map()
  
  // Subscription tiers
  readonly tiers: SubscriptionTier[] = [
    {
      id: 'free',
      name: 'CartPilot Free',
      price: 0,
      currency: 'GBP',
      interval: 'monthly',
      features: [
        'Basic store search',
        'Simple shopping lists',
        'Basic navigation',
        'Barcode scanning',
        'Up to 3 stores'
      ],
      limits: {
        stores: 3,
        shoppingLists: 5,
        syncDevices: 1
      }
    },
    {
      id: 'premium',
      name: 'CartPilot Premium',
      price: 4.99,
      currency: 'GBP', 
      interval: 'monthly',
      features: [
        'All Free features',
        'AI-powered product search',
        'Advanced route optimization',
        'Real-time sync across devices',
        'Voice navigation',
        'Comprehensive allergen alerts',
        'Shopping analytics',
        'Unlimited stores & lists',
        'Priority customer support'
      ],
      limits: {
        syncDevices: 5
      }
    },
    {
      id: 'premium-yearly',
      name: 'CartPilot Premium (Annual)',
      price: 49.99, // 2 months free
      currency: 'GBP',
      interval: 'yearly',
      features: [
        'All Premium features',
        '2 months free (save £10)',
        'Early access to new features',
        'Priority feature requests'
      ],
      limits: {
        syncDevices: 5
      }
    },
    {
      id: 'family',
      name: 'CartPilot Family',
      price: 8.99,
      currency: 'GBP',
      interval: 'monthly',
      features: [
        'All Premium features',
        'Up to 6 family members',
        'Shared shopping lists',
        'Family allergen profiles',
        'Parental controls',
        'Family spending insights'
      ],
      limits: {
        syncDevices: 10
      }
    },
    {
      id: 'enterprise',
      name: 'CartPilot Enterprise',
      price: 49.99,
      currency: 'GBP',
      interval: 'monthly',
      features: [
        'All Family features',
        'Custom store integrations',
        'Advanced analytics API',
        'White-label options',
        'Dedicated account manager',
        '24/7 priority support',
        'Custom reporting'
      ],
      limits: {}
    }
  ]

  constructor() {
    this.initializePaymentProviders()
  }

  private async initializePaymentProviders() {
    // Initialize Stripe for payments
    if (typeof window !== 'undefined') {
      try {
        // Load Stripe
        const stripe = await import('@stripe/stripe-js')
        // Initialize with your publishable key
        // const stripeInstance = await stripe.loadStripe('pk_live_...')
      } catch (error) {
        console.error('Failed to initialize payment providers:', error)
      }
    }
  }

  // Check if user has access to feature
  hasFeatureAccess(userId: string, feature: string): boolean {
    const subscription = this.subscriptions.get(userId)
    if (!subscription || subscription.status !== 'active') {
      // Check free tier access
      const freeTier = this.tiers.find(t => t.id === 'free')
      return freeTier?.features.includes(feature) || false
    }

    const tier = this.tiers.find(t => t.id === subscription.tier)
    return tier?.features.includes(feature) || false
  }

  // Check usage limits
  checkLimit(userId: string, limitType: keyof SubscriptionTier['limits']): { allowed: boolean, limit?: number, current?: number } {
    const subscription = this.subscriptions.get(userId)
    const tierKey = subscription?.tier || 'free'
    const tier = this.tiers.find(t => t.id === tierKey)
    
    const limit = tier?.limits[limitType]
    if (limit === undefined) {
      return { allowed: true } // No limit set
    }

    // Get current usage (would integrate with your analytics)
    const currentUsage = this.getCurrentUsage(userId, limitType)
    
    return {
      allowed: currentUsage < limit,
      limit,
      current: currentUsage
    }
  }

  private getCurrentUsage(userId: string, limitType: string): number {
    // This would integrate with your actual usage tracking
    // For now, return mock data
    return 0
  }

  // Start subscription
  async createSubscription(userId: string, tierId: string, paymentMethodId?: string): Promise<{ success: boolean, clientSecret?: string, error?: string }> {
    try {
      const tier = this.tiers.find(t => t.id === tierId)
      if (!tier) {
        throw new Error('Invalid subscription tier')
      }

      if (tier.price === 0) {
        // Free tier - no payment needed
        const subscription: UserSubscription = {
          userId,
          tier: tierId,
          status: 'active',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
          cancelAtPeriodEnd: false
        }
        
        this.subscriptions.set(userId, subscription)
        return { success: true }
      }

      // For paid tiers, integrate with Stripe
      const response = await fetch('/api/subscriptions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          tierId,
          paymentMethodId
        })
      })

      const result = await response.json()
      if (result.success) {
        // Start trial period
        const subscription: UserSubscription = {
          userId,
          tier: tierId,
          status: 'trial',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 day trial
          trialEnd: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false
        }
        
        this.subscriptions.set(userId, subscription)
      }

      return result
    } catch (error) {
      console.error('Subscription creation failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  // Cancel subscription
  async cancelSubscription(userId: string, immediate = false): Promise<boolean> {
    try {
      const subscription = this.subscriptions.get(userId)
      if (!subscription) return false

      if (immediate) {
        subscription.status = 'canceled'
        subscription.currentPeriodEnd = new Date()
      } else {
        subscription.cancelAtPeriodEnd = true
      }

      // Call API to cancel on payment provider
      await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, immediate })
      })

      return true
    } catch (error) {
      console.error('Subscription cancellation failed:', error)
      return false
    }
  }

  // Get subscription status
  getSubscriptionStatus(userId: string): UserSubscription | null {
    return this.subscriptions.get(userId) || null
  }

  // Get upgrade recommendations
  getUpgradeRecommendations(userId: string): SubscriptionTier[] {
    const currentSubscription = this.subscriptions.get(userId)
    const currentTier = this.tiers.find(t => t.id === (currentSubscription?.tier || 'free'))
    
    if (!currentTier) return []

    // Return higher tier options
    const currentIndex = this.tiers.indexOf(currentTier)
    return this.tiers.slice(currentIndex + 1)
  }

  // Track feature usage for upselling
  trackFeatureUsage(userId: string, feature: string, blocked = false) {
    // Log usage for analytics
    const event = {
      userId,
      feature,
      blocked,
      timestamp: new Date(),
      tier: this.subscriptions.get(userId)?.tier || 'free'
    }

    // Send to analytics service
    this.sendAnalytics('feature_usage', event)

    // Show upgrade prompt if feature was blocked
    if (blocked) {
      this.showUpgradePrompt(userId, feature)
    }
  }

  private sendAnalytics(eventType: string, data: any) {
    // Send to your analytics service (Google Analytics, Mixpanel, etc.)
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventType, data)
    }
  }

  private showUpgradePrompt(userId: string, feature: string) {
    // Show contextual upgrade prompt
    const recommendations = this.getUpgradeRecommendations(userId)
    if (recommendations.length > 0) {
      // Trigger UI to show upgrade prompt
      window.dispatchEvent(new CustomEvent('show-upgrade-prompt', {
        detail: { feature, recommendations }
      }))
    }
  }

  // Revenue analytics
  getRevenueMetrics(): {
    totalSubscribers: number
    monthlyRevenue: number
    yearlyRevenue: number
    tierBreakdown: Record<string, number>
  } {
    const activeSubscriptions = Array.from(this.subscriptions.values())
      .filter(s => s.status === 'active')

    const tierBreakdown: Record<string, number> = {}
    let monthlyRevenue = 0

    for (const subscription of activeSubscriptions) {
      const tier = this.tiers.find(t => t.id === subscription.tier)
      if (tier) {
        tierBreakdown[tier.name] = (tierBreakdown[tier.name] || 0) + 1
        
        // Calculate monthly equivalent revenue
        if (tier.interval === 'yearly') {
          monthlyRevenue += tier.price / 12
        } else {
          monthlyRevenue += tier.price
        }
      }
    }

    return {
      totalSubscribers: activeSubscriptions.length,
      monthlyRevenue,
      yearlyRevenue: monthlyRevenue * 12,
      tierBreakdown
    }
  }
}

export const subscriptionService = new SubscriptionService()

// React hook for subscription status
export function useSubscription(userId: string) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSubscription = async () => {
      setLoading(true)
      const sub = subscriptionService.getSubscriptionStatus(userId)
      setSubscription(sub)
      setLoading(false)
    }

    loadSubscription()
  }, [userId])

  return {
    subscription,
    loading,
    hasFeature: (feature: string) => subscriptionService.hasFeatureAccess(userId, feature),
    checkLimit: (limitType: keyof SubscriptionTier['limits']) => subscriptionService.checkLimit(userId, limitType),
    upgrade: (tierId: string) => subscriptionService.createSubscription(userId, tierId),
    cancel: (immediate = false) => subscriptionService.cancelSubscription(userId, immediate)
  }
}

// Component to show upgrade prompts
export function FeatureGate({ 
  userId, 
  feature, 
  children, 
  fallback 
}: { 
  userId: string
  feature: string
  children: React.ReactNode
  fallback?: React.ReactNode 
}) {
  const hasAccess = subscriptionService.hasFeatureAccess(userId, feature)

  useEffect(() => {
    if (!hasAccess) {
      subscriptionService.trackFeatureUsage(userId, feature, true)
    }
  }, [userId, feature, hasAccess])

  if (hasAccess) {
    return <>{children}</>
  }

  return <>{fallback || <div>Upgrade to access this feature</div>}</>
}