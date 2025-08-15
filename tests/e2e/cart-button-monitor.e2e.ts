import { test, expect } from '@playwright/test'

test('Monitor Cart button click behavior with detailed logging', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5175')
  
  // Wait for the app to load - look for the navigation buttons
  await page.waitForSelector('button:has-text("Stores")', { timeout: 10000 })
  
  // Add console listener to capture React state changes
  page.on('console', msg => {
    if (msg.text().includes('activeTab')) {
      console.log('PAGE LOG:', msg.text())
    }
  })

  // Monitor for any errors
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message)
  })

  // Check initial state
  const initialActiveButton = await page.locator('button:has-text("Stores")').getAttribute('class')
  console.log('Initial Stores button classes:', initialActiveButton)
  
  const initialCartButton = await page.locator('button:has-text("Cart")').getAttribute('class')
  console.log('Initial Cart button classes:', initialCartButton)

  // Click the Cart button and monitor what happens
  console.log('\n=== CLICKING CART BUTTON ===')
  await page.locator('button:has-text("Cart")').click()
  
  // Wait a moment to see if state changes
  await page.waitForTimeout(1000)
  
  // Check if Cart tab is active
  const cartButtonAfterClick = await page.locator('button:has-text("Cart")').getAttribute('class')
  console.log('Cart button classes after click:', cartButtonAfterClick)
  
  const storesButtonAfterClick = await page.locator('button:has-text("Stores")').getAttribute('class')
  console.log('Stores button classes after click:', storesButtonAfterClick)

  // Check if Cart content is visible
  const cartContentVisible = await page.locator('text=Add items to your shopping cart').isVisible()
  console.log('Cart content visible:', cartContentVisible)
  
  const storesContentVisible = await page.locator('text=Find stores near you').isVisible()
  console.log('Stores content visible:', storesContentVisible)

  // Wait longer to see if anything changes
  console.log('\n=== WAITING TO SEE IF STATE REVERTS ===')
  await page.waitForTimeout(3000)
  
  // Check final state
  const finalCartButton = await page.locator('button:has-text("Cart")').getAttribute('class')
  console.log('Final Cart button classes:', finalCartButton)
  
  const finalStoresButton = await page.locator('button:has-text("Stores")').getAttribute('class')
  console.log('Final Stores button classes:', finalStoresButton)

  const finalCartContentVisible = await page.locator('text=Add items to your shopping cart').isVisible()
  console.log('Final cart content visible:', finalCartContentVisible)
  
  const finalStoresContentVisible = await page.locator('text=Find stores near you').isVisible()
  console.log('Final stores content visible:', finalStoresContentVisible)

  // Test assertion - Cart should be active
  expect(cartContentVisible || finalCartContentVisible).toBe(true)
})