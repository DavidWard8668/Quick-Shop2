// 🎯 CartPilot End-to-End UI Automation Tests
// Comprehensive testing of Social Shopping, AI SuperIntelligence, and API Marketplace features

import { test, expect, type Page } from '@playwright/test'

test.describe('CartPilot Complete UI Automation Suite', () => {
  let page: Page
  
  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    await page.goto('http://localhost:5173')
    
    // Wait for app to load
    await page.waitForSelector('[data-testid="cartpilot-app"]', { timeout: 10000 })
  })

  test.describe('🌟 Social Shopping Features', () => {
    test('should create family sharing group and invite members', async () => {
      // Navigate to Social tab
      await page.click('button[data-testid="tab-social"]')
      await expect(page.locator('h1')).toContainText('Social Shopping')
      
      // Create new family group
      await page.click('button:has-text("Create Family Group")')
      await page.fill('input[placeholder*="family name"]', 'Test Family Group')
      await page.fill('textarea[placeholder*="description"]', 'E2E test family group')
      await page.click('button:has-text("Create Group")')
      
      // Verify family group created
      await expect(page.locator('.family-group-card')).toContainText('Test Family Group')
      
      // Invite family member
      await page.click('button:has-text("Invite Member")')
      await page.fill('input[placeholder*="email"]', 'test@example.com')
      await page.click('button:has-text("Send Invitation")')
      
      // Verify invitation sent
      await expect(page.locator('.toast, .notification')).toContainText('Invitation sent')
    })

    test('should participate in social challenges', async () => {
      await page.click('button[data-testid="tab-social"]')
      
      // Join a challenge
      const challengeCard = page.locator('.challenge-card').first()
      await challengeCard.click()
      
      await page.click('button:has-text("Join Challenge")')
      await expect(page.locator('.participant-status')).toContainText('Participating')
      
      // Complete challenge action
      await page.click('button:has-text("Mark Complete")')
      await expect(page.locator('.challenge-progress')).toBeVisible()
    })

    test('should share shopping list with community', async () => {
      await page.click('button[data-testid="tab-social"]')
      
      // Create shareable list
      await page.click('button:has-text("Share List")')
      await page.fill('input[placeholder*="list name"]', 'E2E Test Shared List')
      await page.check('input[type="checkbox"]:has-text("Public")')
      await page.click('button:has-text("Share with Community")')
      
      // Verify list shared
      await expect(page.locator('.shared-list-card')).toContainText('E2E Test Shared List')
    })

    test('should receive real-time collaboration updates', async () => {
      await page.click('button[data-testid="tab-social"]')
      
      // Enable real-time sync
      await page.click('button:has-text("Enable Real-time Sync")')
      
      // Verify WebSocket connection established
      await expect(page.locator('.sync-status')).toContainText('Connected')
      
      // Add item to shared list
      await page.fill('input[placeholder*="add item"]', 'Test Real-time Item')
      await page.press('input[placeholder*="add item"]', 'Enter')
      
      // Verify real-time update indicator
      await expect(page.locator('.real-time-indicator')).toBeVisible()
    })
  })

  test.describe('🤖 AI SuperIntelligence Features', () => {
    test('should generate predictive shopping suggestions', async () => {
      await page.click('button[data-testid="tab-ai"]')
      await expect(page.locator('h1')).toContainText('AI SuperIntelligence')
      
      // Generate predictions
      await page.click('button:has-text("Generate Predictions")')
      
      // Wait for AI processing
      await page.waitForSelector('.prediction-card', { timeout: 15000 })
      
      // Verify predictions generated
      const predictions = page.locator('.prediction-card')
      await expect(predictions).toHaveCountGreaterThan(0)
      
      // Verify confidence scores
      await expect(page.locator('.confidence-score')).toBeVisible()
      const confidenceText = await page.locator('.confidence-score').first().textContent()
      expect(confidenceText).toMatch(/\d+%/)
    })

    test('should process voice commands', async () => {
      await page.click('button[data-testid="tab-ai"]')
      
      // Activate voice command mode
      await page.click('button:has-text("Voice Command")')
      
      // Simulate voice input (mock implementation)
      await page.fill('input[data-testid="voice-input-mock"]', 'Add organic bananas to my shopping list')
      await page.click('button:has-text("Process Command")')
      
      // Verify command processed
      await expect(page.locator('.voice-response')).toContainText('added to your shopping list')
    })

    test('should provide smart route optimization', async () => {
      await page.click('button[data-testid="tab-ai"]')
      
      // Request route optimization
      await page.click('button:has-text("Optimize Route")')
      
      // Wait for AI processing
      await page.waitForSelector('.optimized-route', { timeout: 10000 })
      
      // Verify route displayed
      await expect(page.locator('.route-map')).toBeVisible()
      await expect(page.locator('.estimated-time')).toContainText('min')
    })

    test('should analyze shopping patterns', async () => {
      await page.click('button[data-testid="tab-ai"]')
      
      // View pattern analysis
      await page.click('button:has-text("Analyze Patterns")')
      
      // Verify insights displayed
      await expect(page.locator('.pattern-insight')).toHaveCountGreaterThan(0)
      await expect(page.locator('.behavioral-trend')).toBeVisible()
    })

    test('should provide computer vision product recognition', async () => {
      await page.click('button[data-testid="tab-ai"]')
      
      // Activate camera mode (mock)
      await page.click('button:has-text("Scan Product")')
      
      // Simulate product recognition
      await page.setInputFiles('input[type="file"]', './test-fixtures/test-product.jpg')
      
      // Verify product recognized
      await expect(page.locator('.recognized-product')).toBeVisible()
      await expect(page.locator('.product-confidence')).toContainText('%')
    })
  })

  test.describe('🌐 API Marketplace Features', () => {
    test('should browse and connect to partners', async () => {
      await page.click('button[data-testid="tab-marketplace"]')
      await expect(page.locator('h1')).toContainText('API Marketplace')
      
      // Verify partners loaded
      await expect(page.locator('.partner-card')).toHaveCountGreaterThan(0)
      
      // Connect to a partner
      const partnerCard = page.locator('.partner-card').first()
      await partnerCard.locator('button:has-text("Connect")').click()
      
      // Handle connection modal
      await page.click('button:has-text("Connect with API Key")')
      
      // Verify connection established
      await expect(partnerCard.locator('.connection-status')).toContainText('Connected')
    })

    test('should display marketplace analytics', async () => {
      await page.click('button[data-testid="tab-marketplace"]')
      await page.click('button[data-testid="analytics-tab"]')
      
      // Verify analytics data
      await expect(page.locator('.metric-card')).toHaveCountGreaterThan(3)
      await expect(page.locator('.growth-chart')).toBeVisible()
      await expect(page.locator('.top-partners-list')).toBeVisible()
    })

    test('should test API endpoints', async () => {
      await page.click('button[data-testid="tab-marketplace"]')
      
      // Find a connected partner and test endpoint
      const testButton = page.locator('button:has-text("Test")').first()
      await testButton.click()
      
      // Verify API call result
      await expect(page.locator('.api-call-result')).toBeVisible()
      await expect(page.locator('.response-status')).toContainText('success')
    })

    test('should create smart integrations', async () => {
      await page.click('button[data-testid="tab-marketplace"]')
      await page.click('button[data-testid="smart-flows-tab"]')
      
      // Activate smart flow
      await page.click('button:has-text("Activate"):has(text("Meal-to-Delivery"))')
      
      // Verify integration activated
      await expect(page.locator('.toast, .notification')).toContainText('Smart integration created')
    })

    test('should manage developer settings', async () => {
      await page.click('button[data-testid="tab-marketplace"]')
      await page.click('button[data-testid="developer-tab"]')
      
      // Verify developer documentation
      await expect(page.locator('.api-documentation')).toBeVisible()
      await expect(page.locator('.endpoint-count')).toContainText('endpoint')
      await expect(page.locator('code')).toBeVisible()
    })
  })

  test.describe('🔄 Cross-Feature Integration', () => {
    test('should integrate AI suggestions with social sharing', async () => {
      // Get AI prediction
      await page.click('button[data-testid="tab-ai"]')
      await page.click('button:has-text("Generate Predictions")')
      await page.waitForSelector('.prediction-card')
      
      // Share prediction with family
      await page.locator('.prediction-card').first().locator('button:has-text("Share")').click()
      
      // Verify shared to social feed
      await page.click('button[data-testid="tab-social"]')
      await expect(page.locator('.social-feed')).toContainText('prediction')
    })

    test('should use marketplace APIs for enhanced features', async () => {
      // Connect to delivery service
      await page.click('button[data-testid="tab-marketplace"]')
      const deliveryPartner = page.locator('.partner-card:has-text("Uber Eats")').first()
      await deliveryPartner.locator('button:has-text("Connect")').click()
      await page.click('button:has-text("Connect with API Key")')
      
      // Use in shopping flow
      await page.click('button[data-testid="tab-stores"]')
      await page.click('button:has-text("Order for Delivery")')
      
      // Verify delivery options available
      await expect(page.locator('.delivery-options')).toContainText('Uber Eats')
    })

    test('should sync data across all features', async () => {
      // Add item in stores
      await page.click('button[data-testid="tab-stores"]')
      await page.fill('input[placeholder*="search"]', 'Test Sync Item')
      await page.click('button:has-text("Add to Cart")')
      
      // Verify in AI predictions
      await page.click('button[data-testid="tab-ai"]')
      await page.click('button:has-text("Generate Predictions")')
      await expect(page.locator('.prediction-context')).toContainText('Test Sync Item')
      
      // Verify in social sharing
      await page.click('button[data-testid="tab-social"]')
      await expect(page.locator('.shared-list-items')).toContainText('Test Sync Item')
    })
  })

  test.describe('📱 Mobile Responsiveness', () => {
    test('should work on mobile viewport', async ({ browser }) => {
      const mobileContext = await browser.newContext({
        viewport: { width: 375, height: 667 }
      })
      const mobilePage = await mobileContext.newPage()
      await mobilePage.goto('http://localhost:5173')
      
      // Test mobile navigation
      await mobilePage.click('button[data-testid="mobile-menu"]')
      await expect(mobilePage.locator('.mobile-nav')).toBeVisible()
      
      // Test mobile features
      await mobilePage.click('button[data-testid="tab-social"]')
      await expect(mobilePage.locator('.mobile-social-view')).toBeVisible()
      
      await mobileContext.close()
    })
  })

  test.describe('⚡ Performance Tests', () => {
    test('should load within performance budget', async () => {
      const startTime = Date.now()
      await page.goto('http://localhost:5173')
      await page.waitForSelector('[data-testid="cartpilot-app"]')
      const loadTime = Date.now() - startTime
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)
    })

    test('should handle large data sets efficiently', async () => {
      await page.click('button[data-testid="tab-ai"]')
      
      // Generate large prediction set
      await page.click('button[data-testid="generate-bulk-predictions"]')
      
      // Verify virtual scrolling works
      const predictionsList = page.locator('.predictions-list')
      await expect(predictionsList).toBeVisible()
      
      // Test scrolling performance
      await predictionsList.scrollIntoView({ block: 'end' })
      await expect(page.locator('.virtual-scroll-end')).toBeVisible()
    })
  })

  test.describe('🔐 Security & Privacy', () => {
    test('should protect sensitive user data', async () => {
      await page.click('button[data-testid="tab-marketplace"]')
      
      // Attempt to access raw credentials (should be hidden)
      const credentialsText = await page.textContent('body')
      expect(credentialsText).not.toContain('Bearer ')
      expect(credentialsText).not.toContain('access_token')
    })

    test('should handle authentication errors gracefully', async () => {
      await page.click('button[data-testid="tab-marketplace"]')
      
      // Simulate auth failure
      await page.route('**/api/partners/*/auth', (route) => {
        route.fulfill({ status: 401, body: 'Unauthorized' })
      })
      
      const partnerCard = page.locator('.partner-card').first()
      await partnerCard.locator('button:has-text("Connect")').click()
      await page.click('button:has-text("Connect with API Key")')
      
      // Verify error handling
      await expect(page.locator('.auth-error')).toBeVisible()
    })
  })
})

// 🛠️ Test Utilities
export class CartPilotTestUtils {
  static async waitForAIProcessing(page: Page) {
    await page.waitForSelector('.ai-processing-complete', { timeout: 30000 })
  }
  
  static async mockVoiceInput(page: Page, command: string) {
    await page.evaluate((cmd) => {
      window.mockVoiceCommand?.(cmd)
    }, command)
  }
  
  static async generateTestData(page: Page) {
    await page.evaluate(() => {
      window.generateTestShoppingData?.()
    })
  }
  
  static async validateSyncStatus(page: Page) {
    const syncStatus = await page.locator('.sync-status').textContent()
    return syncStatus?.includes('Connected')
  }
}