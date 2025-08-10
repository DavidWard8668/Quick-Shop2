// 🌐 API Marketplace Service - Ecosystem Dominance Platform
// Transform CartPilot into the central platform for shopping automation

import { useState, useEffect } from 'react'

export interface APIPartner {
  id: string
  name: string
  type: 'delivery' | 'grocery' | 'restaurant' | 'loyalty' | 'payment' | 'smart_home' | 'ai_assistant'
  status: 'active' | 'pending' | 'disabled'
  apiVersion: string
  endpoints: APIEndpoint[]
  authentication: {
    type: 'api_key' | 'oauth2' | 'basic' | 'bearer'
    credentials?: any
  }
  rateLimit: {
    requestsPerMinute: number
    requestsPerDay: number
  }
  revenueShare: number // Percentage
  integrationLevel: 'basic' | 'premium' | 'enterprise'
  supportedRegions: string[]
  createdAt: Date
  lastActive: Date
}

export interface APIEndpoint {
  id: string
  partnerId: string
  path: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  purpose: string
  parameters: APIParameter[]
  responseSchema: any
  isPublic: boolean
  usageCount: number
  lastUsed: Date
}

export interface APIParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required: boolean
  description: string
  example: any
}

export interface APIIntegration {
  id: string
  partnerId: string
  userId: string
  status: 'connected' | 'disconnected' | 'error'
  permissions: string[]
  lastSync: Date
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly'
  dataMapping: { [key: string]: string }
  webhookUrl?: string
}

export interface MarketplaceAnalytics {
  totalPartners: number
  activeIntegrations: number
  apiCallsToday: number
  revenueToday: number
  topPartners: { partnerId: string; name: string; usage: number }[]
  growthMetrics: {
    newPartnersThisMonth: number
    integrationGrowthRate: number
    apiUsageGrowthRate: number
  }
}

class APIMarketplaceService {
  private partners: Map<string, APIPartner> = new Map()
  private integrations: Map<string, APIIntegration> = new Map()
  private apiUsage: Map<string, number> = new Map()
  private webhookHandlers: Map<string, Function> = new Map()

  constructor() {
    this.initializeCorePartners()
  }

  // 🏪 CORE MARKETPLACE PARTNERS
  private initializeCorePartners(): void {
    const corePartners: APIPartner[] = [
      {
        id: 'uber_eats',
        name: 'Uber Eats',
        type: 'delivery',
        status: 'active',
        apiVersion: 'v1.0',
        endpoints: [
          {
            id: 'get_restaurants',
            partnerId: 'uber_eats',
            path: '/restaurants',
            method: 'GET',
            purpose: 'Get nearby restaurants and menus',
            parameters: [
              { name: 'latitude', type: 'number', required: true, description: 'User latitude', example: 51.5074 },
              { name: 'longitude', type: 'number', required: true, description: 'User longitude', example: -0.1278 },
              { name: 'radius', type: 'number', required: false, description: 'Search radius in meters', example: 5000 }
            ],
            responseSchema: { restaurants: [] },
            isPublic: true,
            usageCount: 15420,
            lastUsed: new Date()
          }
        ],
        authentication: { type: 'api_key' },
        rateLimit: { requestsPerMinute: 100, requestsPerDay: 10000 },
        revenueShare: 5.0,
        integrationLevel: 'premium',
        supportedRegions: ['US', 'UK', 'EU', 'AU'],
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        lastActive: new Date()
      },
      {
        id: 'instacart',
        name: 'Instacart',
        type: 'delivery',
        status: 'active',
        apiVersion: 'v2.1',
        endpoints: [
          {
            id: 'create_order',
            partnerId: 'instacart',
            path: '/orders',
            method: 'POST',
            purpose: 'Create grocery delivery order',
            parameters: [
              { name: 'items', type: 'array', required: true, description: 'List of grocery items', example: [] },
              { name: 'delivery_address', type: 'string', required: true, description: 'Delivery address', example: '123 Main St' },
              { name: 'delivery_time', type: 'string', required: false, description: 'Preferred delivery time', example: '2023-12-01T15:00:00Z' }
            ],
            responseSchema: { orderId: 'string', estimatedDelivery: 'string' },
            isPublic: false,
            usageCount: 8750,
            lastUsed: new Date()
          }
        ],
        authentication: { type: 'oauth2' },
        rateLimit: { requestsPerMinute: 50, requestsPerDay: 5000 },
        revenueShare: 3.5,
        integrationLevel: 'enterprise',
        supportedRegions: ['US', 'CA'],
        createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        lastActive: new Date()
      },
      {
        id: 'alexa',
        name: 'Amazon Alexa',
        type: 'smart_home',
        status: 'active',
        apiVersion: 'v3.0',
        endpoints: [
          {
            id: 'voice_commands',
            partnerId: 'alexa',
            path: '/skills/cartpilot/commands',
            method: 'POST',
            purpose: 'Handle voice shopping commands',
            parameters: [
              { name: 'command', type: 'string', required: true, description: 'Voice command text', example: 'Add milk to shopping list' },
              { name: 'user_id', type: 'string', required: true, description: 'Alexa user ID', example: 'alexa_user_123' }
            ],
            responseSchema: { response: 'string', action: 'string' },
            isPublic: true,
            usageCount: 25000,
            lastUsed: new Date()
          }
        ],
        authentication: { type: 'bearer' },
        rateLimit: { requestsPerMinute: 1000, requestsPerDay: 50000 },
        revenueShare: 0.0, // Strategic partnership
        integrationLevel: 'enterprise',
        supportedRegions: ['US', 'UK', 'DE', 'FR', 'ES', 'IT', 'JP', 'AU'],
        createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
        lastActive: new Date()
      },
      {
        id: 'google_assistant',
        name: 'Google Assistant',
        type: 'smart_home',
        status: 'active',
        apiVersion: 'v2.5',
        endpoints: [
          {
            id: 'actions_on_google',
            partnerId: 'google_assistant',
            path: '/actions/cartpilot',
            method: 'POST',
            purpose: 'Handle Google Assistant actions',
            parameters: [
              { name: 'intent', type: 'string', required: true, description: 'Assistant intent', example: 'shopping.add_item' },
              { name: 'parameters', type: 'object', required: true, description: 'Intent parameters', example: { item: 'bread', quantity: 1 } }
            ],
            responseSchema: { speech: 'string', displayText: 'string' },
            isPublic: true,
            usageCount: 18500,
            lastUsed: new Date()
          }
        ],
        authentication: { type: 'oauth2' },
        rateLimit: { requestsPerMinute: 500, requestsPerDay: 25000 },
        revenueShare: 0.0, // Strategic partnership
        integrationLevel: 'enterprise',
        supportedRegions: ['US', 'UK', 'CA', 'AU', 'IN'],
        createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000),
        lastActive: new Date()
      },
      {
        id: 'tesco_clubcard',
        name: 'Tesco Clubcard',
        type: 'loyalty',
        status: 'active',
        apiVersion: 'v1.8',
        endpoints: [
          {
            id: 'get_offers',
            partnerId: 'tesco_clubcard',
            path: '/clubcard/offers',
            method: 'GET',
            purpose: 'Get personalized Clubcard offers',
            parameters: [
              { name: 'member_id', type: 'string', required: true, description: 'Clubcard member ID', example: 'TC123456789' }
            ],
            responseSchema: { offers: [] },
            isPublic: false,
            usageCount: 12000,
            lastUsed: new Date()
          }
        ],
        authentication: { type: 'api_key' },
        rateLimit: { requestsPerMinute: 200, requestsPerDay: 15000 },
        revenueShare: 2.0,
        integrationLevel: 'premium',
        supportedRegions: ['UK', 'IE'],
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        lastActive: new Date()
      },
      {
        id: 'openai',
        name: 'OpenAI GPT',
        type: 'ai_assistant',
        status: 'active',
        apiVersion: 'v1.0',
        endpoints: [
          {
            id: 'smart_suggestions',
            partnerId: 'openai',
            path: '/completions',
            method: 'POST',
            purpose: 'Generate AI-powered shopping suggestions',
            parameters: [
              { name: 'prompt', type: 'string', required: true, description: 'Shopping context prompt', example: 'Family of 4, healthy meals for the week' },
              { name: 'max_tokens', type: 'number', required: false, description: 'Response length', example: 150 }
            ],
            responseSchema: { suggestions: [] },
            isPublic: false,
            usageCount: 45000,
            lastUsed: new Date()
          }
        ],
        authentication: { type: 'bearer' },
        rateLimit: { requestsPerMinute: 100, requestsPerDay: 5000 },
        revenueShare: 8.0, // Higher for AI services
        integrationLevel: 'enterprise',
        supportedRegions: ['Global'],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        lastActive: new Date()
      }
    ]

    corePartners.forEach(partner => {
      this.partners.set(partner.id, partner)
    })

    console.log('🌐 API Marketplace initialized with', corePartners.length, 'core partners')
  }

  // 🔗 PARTNER INTEGRATION MANAGEMENT
  async connectPartner(partnerId: string, userId: string, credentials: any): Promise<APIIntegration> {
    const partner = this.partners.get(partnerId)
    if (!partner) {
      throw new Error(`Partner ${partnerId} not found`)
    }

    const integration: APIIntegration = {
      id: `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      partnerId,
      userId,
      status: 'connected',
      permissions: this.getDefaultPermissions(partner.type),
      lastSync: new Date(),
      syncFrequency: 'daily',
      dataMapping: this.getDefaultDataMapping(partner.type),
      webhookUrl: `https://api.cartpilot.com/webhooks/${partnerId}`
    }

    // Simulate authentication
    const isAuthenticated = await this.authenticatePartner(partner, credentials)
    if (!isAuthenticated) {
      integration.status = 'error'
      throw new Error('Authentication failed')
    }

    this.integrations.set(integration.id, integration)
    
    console.log(`🔗 Connected ${partner.name} for user ${userId}`)
    return integration
  }

  private async authenticatePartner(partner: APIPartner, credentials: any): Promise<boolean> {
    // Simulate API authentication based on partner type
    switch (partner.authentication.type) {
      case 'api_key':
        return credentials.apiKey && credentials.apiKey.length > 10
      case 'oauth2':
        return credentials.accessToken && credentials.refreshToken
      case 'bearer':
        return credentials.token && credentials.token.startsWith('Bearer ')
      default:
        return false
    }
  }

  private getDefaultPermissions(partnerType: APIPartner['type']): string[] {
    const permissionMap: { [key: string]: string[] } = {
      'delivery': ['read_menu', 'create_order', 'track_delivery'],
      'grocery': ['read_products', 'check_availability', 'create_order'],
      'restaurant': ['read_menu', 'make_reservation', 'order_food'],
      'loyalty': ['read_points', 'redeem_offers', 'view_history'],
      'payment': ['process_payment', 'refund', 'view_transactions'],
      'smart_home': ['voice_commands', 'notifications', 'device_control'],
      'ai_assistant': ['generate_suggestions', 'analyze_preferences', 'optimize_routes']
    }
    return permissionMap[partnerType] || ['basic_access']
  }

  private getDefaultDataMapping(partnerType: APIPartner['type']): { [key: string]: string } {
    const mappingTemplates: { [key: string]: { [key: string]: string } } = {
      'delivery': {
        'shopping_list_items': 'order.items',
        'delivery_address': 'user.address',
        'delivery_preferences': 'user.preferences'
      },
      'loyalty': {
        'user_points': 'member.points',
        'available_offers': 'offers.active',
        'purchase_history': 'transactions.history'
      },
      'smart_home': {
        'voice_commands': 'commands.voice',
        'device_status': 'devices.status',
        'user_preferences': 'settings.preferences'
      }
    }
    return mappingTemplates[partnerType] || {}
  }

  // 📊 MARKETPLACE ANALYTICS
  getMarketplaceAnalytics(): MarketplaceAnalytics {
    const activePartners = Array.from(this.partners.values()).filter(p => p.status === 'active')
    const activeIntegrations = Array.from(this.integrations.values()).filter(i => i.status === 'connected')
    
    const totalApiCalls = Array.from(this.apiUsage.values()).reduce((sum, count) => sum + count, 0)
    const dailyRevenue = this.calculateDailyRevenue()

    const topPartners = activePartners
      .map(partner => ({
        partnerId: partner.id,
        name: partner.name,
        usage: partner.endpoints.reduce((sum, endpoint) => sum + endpoint.usageCount, 0)
      }))
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5)

    return {
      totalPartners: activePartners.length,
      activeIntegrations: activeIntegrations.length,
      apiCallsToday: totalApiCalls,
      revenueToday: dailyRevenue,
      topPartners,
      growthMetrics: {
        newPartnersThisMonth: this.calculateNewPartnersThisMonth(),
        integrationGrowthRate: this.calculateIntegrationGrowthRate(),
        apiUsageGrowthRate: this.calculateApiUsageGrowthRate()
      }
    }
  }

  private calculateDailyRevenue(): number {
    let revenue = 0
    this.partners.forEach(partner => {
      const dailyUsage = partner.endpoints.reduce((sum, endpoint) => sum + endpoint.usageCount, 0)
      const revenuePerCall = 0.01 // $0.01 per API call
      revenue += dailyUsage * revenuePerCall * (partner.revenueShare / 100)
    })
    return Math.round(revenue * 100) / 100
  }

  private calculateNewPartnersThisMonth(): number {
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    return Array.from(this.partners.values())
      .filter(partner => partner.createdAt > oneMonthAgo)
      .length
  }

  private calculateIntegrationGrowthRate(): number {
    // Simulate 15% monthly growth rate
    return 15.2
  }

  private calculateApiUsageGrowthRate(): number {
    // Simulate 25% monthly growth rate
    return 25.7
  }

  // 🔄 API CALL ROUTING
  async routeAPICall(
    partnerId: string, 
    endpointId: string, 
    parameters: any, 
    userId?: string
  ): Promise<any> {
    const partner = this.partners.get(partnerId)
    if (!partner) {
      throw new Error(`Partner ${partnerId} not found`)
    }

    const endpoint = partner.endpoints.find(e => e.id === endpointId)
    if (!endpoint) {
      throw new Error(`Endpoint ${endpointId} not found for partner ${partnerId}`)
    }

    // Check rate limits
    if (!this.checkRateLimit(partnerId)) {
      throw new Error('Rate limit exceeded')
    }

    // Validate parameters
    const validationError = this.validateParameters(endpoint, parameters)
    if (validationError) {
      throw new Error(`Parameter validation failed: ${validationError}`)
    }

    // Log API usage
    endpoint.usageCount++
    endpoint.lastUsed = new Date()
    this.apiUsage.set(`${partnerId}_${endpointId}`, (this.apiUsage.get(`${partnerId}_${endpointId}`) || 0) + 1)

    // Simulate API call
    const response = await this.simulateAPICall(partner, endpoint, parameters)
    
    console.log(`📡 API call routed: ${partner.name} -> ${endpoint.purpose}`)
    return response
  }

  private checkRateLimit(partnerId: string): boolean {
    const partner = this.partners.get(partnerId)
    if (!partner) return false

    // Simplified rate limiting - in production, use Redis or similar
    const currentUsage = this.apiUsage.get(`${partnerId}_minute`) || 0
    return currentUsage < partner.rateLimit.requestsPerMinute
  }

  private validateParameters(endpoint: APIEndpoint, parameters: any): string | null {
    for (const param of endpoint.parameters) {
      if (param.required && !(param.name in parameters)) {
        return `Missing required parameter: ${param.name}`
      }
      
      if (param.name in parameters) {
        const value = parameters[param.name]
        if (param.type === 'number' && typeof value !== 'number') {
          return `Parameter ${param.name} must be a number`
        }
        if (param.type === 'string' && typeof value !== 'string') {
          return `Parameter ${param.name} must be a string`
        }
      }
    }
    return null
  }

  private async simulateAPICall(partner: APIPartner, endpoint: APIEndpoint, parameters: any): Promise<any> {
    // Simulate different API responses based on partner and endpoint
    switch (partner.id) {
      case 'uber_eats':
        if (endpoint.id === 'get_restaurants') {
          return {
            restaurants: [
              { id: 'r1', name: 'Pizza Express', cuisine: 'Italian', eta: '30-45 min' },
              { id: 'r2', name: 'Nando\'s', cuisine: 'Portuguese', eta: '20-35 min' },
              { id: 'r3', name: 'Wagamama', cuisine: 'Asian', eta: '25-40 min' }
            ]
          }
        }
        break
      
      case 'instacart':
        if (endpoint.id === 'create_order') {
          return {
            orderId: `ORD_${Date.now()}`,
            estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            items: parameters.items,
            total: Math.random() * 100 + 50
          }
        }
        break
      
      case 'alexa':
        if (endpoint.id === 'voice_commands') {
          return {
            response: `I've ${parameters.command.toLowerCase().includes('add') ? 'added that to' : 'updated'} your CartPilot shopping list!`,
            action: 'list_updated'
          }
        }
        break
      
      case 'tesco_clubcard':
        if (endpoint.id === 'get_offers') {
          return {
            offers: [
              { product: 'Milk', discount: '25% off', points: 50 },
              { product: 'Bread', discount: '2 for 1', points: 25 },
              { product: 'Chicken', discount: '£2 off', points: 100 }
            ]
          }
        }
        break
      
      case 'openai':
        if (endpoint.id === 'smart_suggestions') {
          return {
            suggestions: [
              'Based on your family size, consider buying larger quantities of staples like rice and pasta',
              'Add seasonal vegetables like butternut squash and Brussels sprouts for winter nutrition',
              'Include protein sources like chicken, fish, and legumes for balanced meals',
              'Don\'t forget healthy snacks like nuts, fruits, and yogurt for the kids'
            ]
          }
        }
        break
    }

    return { success: true, data: parameters, timestamp: new Date().toISOString() }
  }

  // 🎯 SMART INTEGRATIONS
  async createSmartIntegration(userId: string, integrationType: 'meal_to_delivery' | 'list_to_loyalty' | 'voice_to_action'): Promise<string> {
    const integrationId = `smart_${integrationType}_${Date.now()}`
    
    switch (integrationType) {
      case 'meal_to_delivery':
        // Connect meal planning with delivery services
        await this.setupMealDeliveryPipeline(userId, integrationId)
        break
      
      case 'list_to_loyalty':
        // Connect shopping lists with loyalty programs for automatic offers
        await this.setupLoyaltyOptimization(userId, integrationId)
        break
      
      case 'voice_to_action':
        // Connect voice assistants with shopping actions
        await this.setupVoiceActionPipeline(userId, integrationId)
        break
    }

    console.log(`🎯 Created smart integration: ${integrationType} for user ${userId}`)
    return integrationId
  }

  private async setupMealDeliveryPipeline(userId: string, integrationId: string): Promise<void> {
    // When user creates meal plan, automatically check delivery options
    console.log(`🍽️ Meal-to-delivery pipeline active for user ${userId}`)
  }

  private async setupLoyaltyOptimization(userId: string, integrationId: string): Promise<void> {
    // When items added to list, check all loyalty programs for best offers
    console.log(`💳 Loyalty optimization active for user ${userId}`)
  }

  private async setupVoiceActionPipeline(userId: string, integrationId: string): Promise<void> {
    // Voice commands automatically trigger appropriate actions across all connected services
    console.log(`🗣️ Voice-to-action pipeline active for user ${userId}`)
  }

  // 💰 REVENUE OPTIMIZATION
  getRevenueOptimizationSuggestions(): {
    suggestions: string[]
    potentialRevenue: number
    implementation: string[]
  } {
    return {
      suggestions: [
        'Add premium API tiers with higher rate limits and advanced features',
        'Implement usage-based pricing for high-volume partners',
        'Create exclusive partnerships with major retailers',
        'Offer white-label API solutions to smaller businesses',
        'Develop marketplace for third-party shopping apps'
      ],
      potentialRevenue: 150000, // Monthly potential
      implementation: [
        'Launch enterprise API packages at £499-£2,999/month',
        'Create revenue-sharing agreements with top 20 grocery chains',
        'Develop CartPilot API marketplace with 30% commission',
        'Offer consulting services for API integration',
        'License CartPilot technology to competitors'
      ]
    }
  }

  // 🔍 PARTNER DISCOVERY
  discoverPotentialPartners(): { category: string; partners: string[]; opportunity: string }[] {
    return [
      {
        category: 'UK Grocery Chains',
        partners: ['Sainsbury\'s', 'ASDA', 'Morrisons', 'Waitrose', 'Iceland', 'Aldi', 'Lidl'],
        opportunity: 'Direct integration for price comparison and stock checking'
      },
      {
        category: 'Delivery Services',
        partners: ['Just Eat', 'Deliveroo', 'Amazon Fresh', 'Ocado', 'Getir', 'Gorillas'],
        opportunity: 'One-click ordering from shopping lists'
      },
      {
        category: 'Meal Kit Services',
        partners: ['HelloFresh', 'Gousto', 'Mindful Chef', 'Simply Cook'],
        opportunity: 'Meal plan integration with ingredient sourcing'
      },
      {
        category: 'Price Comparison',
        partners: ['MySupermarket', 'Trolley.co.uk', 'PriceSpy', 'Google Shopping'],
        opportunity: 'Real-time price alerts and best deal recommendations'
      },
      {
        category: 'Smart Home Ecosystems',
        partners: ['Samsung SmartThings', 'Apple HomeKit', 'Philips Hue', 'Ring'],
        opportunity: 'Smart shopping based on consumption patterns'
      }
    ]
  }

  // 🛠️ DEVELOPER TOOLS
  generateAPIDocumentation(): {
    endpoints: number
    partners: number
    sampleCode: { [language: string]: string }
    authentication: string[]
  } {
    return {
      endpoints: Array.from(this.partners.values())
        .reduce((total, partner) => total + partner.endpoints.length, 0),
      partners: this.partners.size,
      sampleCode: {
        javascript: `
// Connect to CartPilot API Marketplace
const cartpilot = new CartPilotAPI('your-api-key');

// Get nearby restaurants
const restaurants = await cartpilot.partners.uberEats.getRestaurants({
  latitude: 51.5074,
  longitude: -0.1278,
  radius: 5000
});

// Create delivery order
const order = await cartpilot.partners.instacart.createOrder({
  items: ['milk', 'bread', 'eggs'],
  delivery_address: '123 Main St',
  delivery_time: 'ASAP'
});
        `,
        python: `
# CartPilot API Marketplace Python SDK
from cartpilot import CartPilotAPI

api = CartPilotAPI('your-api-key')

# Voice command integration
response = api.partners.alexa.process_command(
    command="Add organic tomatoes to my shopping list",
    user_id="user123"
)

# Get loyalty offers
offers = api.partners.tesco.get_clubcard_offers(
    member_id="TC123456789"
)
        `,
        curl: `
# Direct API calls using curl
curl -X GET "https://api.cartpilot.com/partners/uber-eats/restaurants" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"latitude": 51.5074, "longitude": -0.1278}'
        `
      },
      authentication: ['API Key', 'OAuth 2.0', 'JWT Bearer Token', 'Basic Auth']
    }
  }

  // Public API methods
  getPartners(): APIPartner[] {
    return Array.from(this.partners.values()).filter(p => p.status === 'active')
  }

  getPartner(partnerId: string): APIPartner | undefined {
    return this.partners.get(partnerId)
  }

  getUserIntegrations(userId: string): APIIntegration[] {
    return Array.from(this.integrations.values()).filter(i => i.userId === userId)
  }

  async disconnectPartner(integrationId: string): Promise<boolean> {
    const integration = this.integrations.get(integrationId)
    if (!integration) return false

    integration.status = 'disconnected'
    console.log(`🔌 Disconnected integration ${integrationId}`)
    return true
  }
}

// Create singleton instance
export const apiMarketplaceService = new APIMarketplaceService()

// React hook for API marketplace
export function useAPIMarketplace(userId?: string) {
  const [partners, setPartners] = useState<APIPartner[]>([])
  const [integrations, setIntegrations] = useState<APIIntegration[]>([])
  const [analytics, setAnalytics] = useState<MarketplaceAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadMarketplaceData = async () => {
      setLoading(true)
      
      const availablePartners = apiMarketplaceService.getPartners()
      setPartners(availablePartners)
      
      if (userId) {
        const userIntegrations = apiMarketplaceService.getUserIntegrations(userId)
        setIntegrations(userIntegrations)
      }
      
      const marketplaceAnalytics = apiMarketplaceService.getMarketplaceAnalytics()
      setAnalytics(marketplaceAnalytics)
      
      setLoading(false)
    }

    loadMarketplaceData()
  }, [userId])

  const connectPartner = async (partnerId: string, credentials: any) => {
    if (!userId) return null
    
    try {
      const integration = await apiMarketplaceService.connectPartner(partnerId, userId, credentials)
      setIntegrations(prev => [...prev, integration])
      return integration
    } catch (error) {
      console.error('Failed to connect partner:', error)
      throw error
    }
  }

  const disconnectPartner = async (integrationId: string) => {
    const success = await apiMarketplaceService.disconnectPartner(integrationId)
    if (success) {
      setIntegrations(prev => prev.filter(i => i.id !== integrationId))
    }
    return success
  }

  const makeAPICall = async (partnerId: string, endpointId: string, parameters: any) => {
    return await apiMarketplaceService.routeAPICall(partnerId, endpointId, parameters, userId)
  }

  return {
    partners,
    integrations,
    analytics,
    loading,
    connectPartner,
    disconnectPartner,
    makeAPICall,
    createSmartIntegration: (type: any) => userId ? apiMarketplaceService.createSmartIntegration(userId, type) : Promise.reject('No user ID')
  }
}

console.log('🌐 API Marketplace Service: ECOSYSTEM DOMINANCE PLATFORM ACTIVATED!')