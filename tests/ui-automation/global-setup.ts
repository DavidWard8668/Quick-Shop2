// 🌍 Global Test Setup for CartPilot UI Automation
import { FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting CartPilot UI Automation Suite...')
  
  // Setup test data
  await setupTestDatabase()
  await seedMockData()
  await configureTestEnvironment()
  
  console.log('✅ Global setup complete - CartPilot ready for testing!')
}

async function setupTestDatabase() {
  console.log('📊 Setting up test database...')
  
  // Initialize test database with clean state
  const testData = {
    users: [
      {
        id: 'test-user-1',
        name: 'E2E Test User',
        email: 'test@cartpilot.com',
        preferences: {
          socialSharing: true,
          aiPredictions: true,
          marketplaceIntegrations: true
        }
      }
    ],
    shoppingLists: [
      {
        id: 'test-list-1',
        userId: 'test-user-1',
        name: 'E2E Test List',
        items: [
          { id: '1', name: 'Test Item 1', category: 'groceries', completed: false },
          { id: '2', name: 'Test Item 2', category: 'household', completed: true }
        ]
      }
    ],
    familyGroups: [
      {
        id: 'test-family-1',
        name: 'E2E Test Family',
        ownerId: 'test-user-1',
        members: ['test-user-1'],
        sharedLists: ['test-list-1']
      }
    ],
    challenges: [
      {
        id: 'test-challenge-1',
        name: 'E2E Challenge',
        type: 'sustainability',
        participants: [],
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
  
  // In a real scenario, this would setup actual test database
  global.testData = testData
}

async function seedMockData() {
  console.log('🌱 Seeding mock data for API responses...')
  
  // Mock API responses for consistent testing
  global.mockApiResponses = {
    ai: {
      predictions: [
        {
          item: 'Organic Bananas',
          confidence: 0.92,
          reasoning: 'You buy bananas every Tuesday',
          category: 'fruits'
        },
        {
          item: 'Whole Milk',
          confidence: 0.87,
          reasoning: 'Running low based on consumption patterns',
          category: 'dairy'
        }
      ],
      voiceCommands: {
        'add milk to shopping list': {
          response: 'I\'ve added milk to your CartPilot shopping list!',
          action: 'item_added',
          success: true
        }
      }
    },
    social: {
      familyMembers: [
        { id: 'member-1', name: 'Test Parent', email: 'parent@test.com', status: 'active' },
        { id: 'member-2', name: 'Test Child', email: 'child@test.com', status: 'pending' }
      ],
      challengeLeaderboard: [
        { userId: 'test-user-1', score: 150, rank: 1 },
        { userId: 'other-user', score: 125, rank: 2 }
      ]
    },
    marketplace: {
      partners: [
        {
          id: 'uber_eats',
          name: 'Uber Eats',
          status: 'active',
          responseData: {
            restaurants: [
              { id: 'r1', name: 'Test Pizza', cuisine: 'Italian', eta: '30-45 min' },
              { id: 'r2', name: 'Test Burger', cuisine: 'American', eta: '20-35 min' }
            ]
          }
        }
      ]
    }
  }
}

async function configureTestEnvironment() {
  console.log('⚙️ Configuring test environment...')
  
  // Set environment variables for testing
  process.env.NODE_ENV = 'test'
  process.env.CARTPILOT_API_BASE = 'http://localhost:5173/api'
  process.env.ENABLE_TEST_MOCKS = 'true'
  process.env.DISABLE_ANALYTICS = 'true'
  process.env.TEST_USER_ID = 'test-user-1'
  
  // Configure test feature flags
  global.testFeatureFlags = {
    socialSharing: true,
    aiPredictions: true,
    marketplaceIntegrations: true,
    voiceCommands: true,
    realTimeSync: true,
    mobileOptimization: true
  }
  
  console.log('🔧 Test environment configured successfully')
}

export default globalSetup