// 🎯 Component-Level UI Tests for CartPilot Features
import { test, expect } from '@playwright/test'

test.describe('🔬 Individual Component Tests', () => {
  
  test.describe('Social Shopping Components', () => {
    test('FamilyGroupCard renders correctly', async ({ page }) => {
      await page.goto('http://localhost:5173')
      await page.click('button[data-testid="tab-social"]')
      
      // Test family group card elements
      const familyCard = page.locator('.family-group-card').first()
      await expect(familyCard.locator('.group-name')).toBeVisible()
      await expect(familyCard.locator('.member-count')).toBeVisible()
      await expect(familyCard.locator('.group-actions')).toBeVisible()
    })

    test('ChallengeCard interactive elements work', async ({ page }) => {
      await page.goto('http://localhost:5173')
      await page.click('button[data-testid="tab-social"]')
      
      const challengeCard = page.locator('.challenge-card').first()
      
      // Test progress indicator
      await expect(challengeCard.locator('.progress-bar')).toBeVisible()
      
      // Test join/leave button functionality
      const actionButton = challengeCard.locator('.challenge-action-button')
      const initialText = await actionButton.textContent()
      await actionButton.click()
      
      // Verify button state changed
      const newText = await actionButton.textContent()
      expect(newText).not.toBe(initialText)
    })

    test('Real-time sync indicator functions', async ({ page }) => {
      await page.goto('http://localhost:5173')
      await page.click('button[data-testid="tab-social"]')
      
      // Enable sync
      await page.click('button:has-text("Enable Real-time Sync")')
      
      // Check sync status indicator
      const syncIndicator = page.locator('.sync-status-indicator')
      await expect(syncIndicator).toHaveClass(/connected/)
      
      // Test sync animation
      await expect(page.locator('.sync-pulse')).toBeVisible()
    })
  })

  test.describe('AI SuperIntelligence Components', () => {
    test('PredictionCard displays confidence scores', async ({ page }) => {
      await page.goto('http://localhost:5173')
      await page.click('button[data-testid="tab-ai"]')
      await page.click('button:has-text("Generate Predictions")')
      
      const predictionCard = page.locator('.prediction-card').first()
      
      // Verify core elements
      await expect(predictionCard.locator('.predicted-item')).toBeVisible()
      await expect(predictionCard.locator('.confidence-score')).toBeVisible()
      await expect(predictionCard.locator('.prediction-reasoning')).toBeVisible()
      
      // Test confidence score format
      const confidenceText = await predictionCard.locator('.confidence-score').textContent()
      expect(confidenceText).toMatch(/\d{1,3}%/)
    })

    test('VoiceCommandInterface responds correctly', async ({ page }) => {
      await page.goto('http://localhost:5173')
      await page.click('button[data-testid="tab-ai"]')
      
      // Activate voice interface
      await page.click('button[data-testid="voice-activate"]')
      
      // Verify microphone indicator
      await expect(page.locator('.microphone-indicator')).toHaveClass(/active/)
      
      // Test voice input simulation
      await page.fill('input[data-testid="voice-input-mock"]', 'Add apples to my list')
      await page.click('button:has-text("Process")')
      
      // Verify response
      await expect(page.locator('.voice-response')).toContainText('added')
    })

    test('RouteOptimization displays map and directions', async ({ page }) => {
      await page.goto('http://localhost:5173')
      await page.click('button[data-testid="tab-ai"]')
      
      await page.click('button:has-text("Optimize Route")')
      
      // Verify map component loaded
      await expect(page.locator('.route-map-container')).toBeVisible()
      
      // Check route details
      await expect(page.locator('.route-stops')).toBeVisible()
      await expect(page.locator('.estimated-time')).toBeVisible()
      await expect(page.locator('.distance-total')).toBeVisible()
    })

    test('PatternAnalysis charts render', async ({ page }) => {
      await page.goto('http://localhost:5173')
      await page.click('button[data-testid="tab-ai"]')
      
      await page.click('button:has-text("Analyze Patterns")')
      
      // Verify chart components
      await expect(page.locator('.shopping-pattern-chart')).toBeVisible()
      await expect(page.locator('.trend-indicators')).toBeVisible()
      await expect(page.locator('.pattern-insights')).toHaveCountGreaterThan(0)
    })
  })

  test.describe('API Marketplace Components', () => {
    test('PartnerCard shows connection status', async ({ page }) => {
      await page.goto('http://localhost:5173')
      await page.click('button[data-testid="tab-marketplace"]')
      
      const partnerCard = page.locator('.partner-card').first()
      
      // Verify partner info
      await expect(partnerCard.locator('.partner-name')).toBeVisible()
      await expect(partnerCard.locator('.partner-type')).toBeVisible()
      await expect(partnerCard.locator('.integration-level')).toBeVisible()
      
      // Check connection indicator
      const connectionStatus = partnerCard.locator('.connection-status')
      await expect(connectionStatus).toBeVisible()
      
      // Test connection toggle
      const connectButton = partnerCard.locator('button:has-text("Connect")')
      if (await connectButton.isVisible()) {
        await connectButton.click()
        await expect(page.locator('.connection-modal')).toBeVisible()
      }
    })

    test('AnalyticsDashboard displays metrics', async ({ page }) => {
      await page.goto('http://localhost:5173')
      await page.click('button[data-testid="tab-marketplace"]')
      await page.click('button[data-testid="analytics-tab"]')
      
      // Verify metric cards
      const metricCards = page.locator('.metric-card')
      await expect(metricCards).toHaveCountGreaterThan(3)
      
      // Check specific metrics
      await expect(page.locator('.partners-count')).toBeVisible()
      await expect(page.locator('.api-calls-count')).toBeVisible()
      await expect(page.locator('.revenue-amount')).toBeVisible()
      
      // Verify charts loaded
      await expect(page.locator('.growth-chart')).toBeVisible()
    })

    test('SmartIntegrationFlow activates correctly', async ({ page }) => {
      await page.goto('http://localhost:5173')
      await page.click('button[data-testid="tab-marketplace"]')
      await page.click('button[data-testid="smart-flows-tab"]')
      
      const smartFlowCard = page.locator('.smart-flow-card').first()
      
      // Verify flow details
      await expect(smartFlowCard.locator('.flow-title')).toBeVisible()
      await expect(smartFlowCard.locator('.flow-description')).toBeVisible()
      
      // Test activation
      await smartFlowCard.locator('button:has-text("Activate")').click()
      
      // Verify activation feedback
      await expect(page.locator('.activation-success')).toBeVisible()
    })

    test('DeveloperTools documentation renders', async ({ page }) => {
      await page.goto('http://localhost:5173')
      await page.click('button[data-testid="tab-marketplace"]')
      await page.click('button[data-testid="developer-tab"]')
      
      // Verify documentation sections
      await expect(page.locator('.api-documentation')).toBeVisible()
      await expect(page.locator('.code-samples')).toBeVisible()
      await expect(page.locator('.endpoint-reference')).toBeVisible()
      
      // Check code highlighting
      await expect(page.locator('pre code')).toBeVisible()
    })
  })

  test.describe('Cross-Component Integration', () => {
    test('Tab navigation preserves state', async ({ page }) => {
      await page.goto('http://localhost:5173')
      
      // Set state in social tab
      await page.click('button[data-testid="tab-social"]')
      await page.fill('input[placeholder*="group name"]', 'State Test Group')
      
      // Switch to AI tab
      await page.click('button[data-testid="tab-ai"]')
      await page.click('button:has-text("Generate Predictions")')
      
      // Switch back to social tab
      await page.click('button[data-testid="tab-social"]')
      
      // Verify state preserved
      const groupInput = page.locator('input[placeholder*="group name"]')
      await expect(groupInput).toHaveValue('State Test Group')
    })

    test('Data synchronization across components', async ({ page }) => {
      await page.goto('http://localhost:5173')
      
      // Add item in main cart
      await page.click('button[data-testid="tab-cart"]')
      await page.fill('input[placeholder*="add item"]', 'Sync Test Item')
      await page.press('input[placeholder*="add item"]', 'Enter')
      
      // Check item appears in AI context
      await page.click('button[data-testid="tab-ai"]')
      await page.click('button:has-text("Generate Predictions")')
      await expect(page.locator('.prediction-context')).toContainText('Sync Test Item')
      
      // Check item in social sharing
      await page.click('button[data-testid="tab-social"]')
      await expect(page.locator('.shared-items-list')).toContainText('Sync Test Item')
    })
  })

  test.describe('Error Handling & Edge Cases', () => {
    test('Handles network failures gracefully', async ({ page }) => {
      await page.goto('http://localhost:5173')
      
      // Simulate network failure
      await page.route('**/api/**', route => route.abort())
      
      await page.click('button[data-testid="tab-ai"]')
      await page.click('button:has-text("Generate Predictions")')
      
      // Verify error state displayed
      await expect(page.locator('.error-message')).toBeVisible()
      await expect(page.locator('.retry-button')).toBeVisible()
    })

    test('Handles empty states correctly', async ({ page }) => {
      await page.goto('http://localhost:5173')
      await page.click('button[data-testid="tab-social"]')
      
      // Clear any existing family groups (simulate empty state)
      await page.evaluate(() => {
        window.clearTestData?.('familyGroups')
      })
      
      await page.reload()
      await page.click('button[data-testid="tab-social"]')
      
      // Verify empty state UI
      await expect(page.locator('.empty-state-message')).toBeVisible()
      await expect(page.locator('.create-first-group-button')).toBeVisible()
    })

    test('Form validation works correctly', async ({ page }) => {
      await page.goto('http://localhost:5173')
      await page.click('button[data-testid="tab-social"]')
      
      // Try to create family group without name
      await page.click('button:has-text("Create Family Group")')
      await page.click('button:has-text("Create Group")')
      
      // Verify validation message
      await expect(page.locator('.validation-error')).toBeVisible()
      await expect(page.locator('.validation-error')).toContainText('required')
    })
  })
})