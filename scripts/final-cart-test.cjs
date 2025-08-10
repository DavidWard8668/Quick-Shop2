// 🎯 Final Cart Button Test - Comprehensive verification
const { chromium } = require('playwright')

async function finalCartTest() {
  console.log('🎯 FINAL TEST: Cart button functionality after WebSocket fixes\n')
  
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()
  
  // Monitor console for errors
  const consoleMessages = []
  const errors = []
  
  page.on('console', msg => {
    consoleMessages.push(msg.text())
    if (msg.text().includes('Cart') || msg.text().includes('activeTab')) {
      console.log(`🖥️ CONSOLE: ${msg.text()}`)
    }
  })
  
  page.on('pageerror', error => {
    errors.push(error.message)
    console.log(`💥 ERROR: ${error.message}`)
  })
  
  try {
    await page.goto('http://localhost:5174')
    await page.waitForLoadState('networkidle')
    
    console.log('📱 CartPilot loaded successfully\n')
    
    // Wait for any initialization and dismiss tutorial if needed
    await page.waitForTimeout(3000)
    
    // Dismiss tutorial if present
    const tutorialModal = page.locator('.fixed.inset-0.bg-black\\/60')
    if (await tutorialModal.isVisible()) {
      console.log('🎓 Dismissing tutorial...')
      const skipButton = page.locator('button').filter({ hasText: 'Start Shopping Now' })
      if (await skipButton.count() > 0) {
        await skipButton.first().click()
        await page.waitForTimeout(1000)
      }
    }
    
    console.log('🔍 Step 1: Initial state verification')
    
    // Check if we're initially on stores tab
    const beforeContent = await page.textContent('body')
    const showingStores = beforeContent.includes('Find CartPilot Partner Stores')
    const showingCart = beforeContent.includes('Smart Shopping List')
    
    console.log(`   Initially showing Stores content: ${showingStores}`)
    console.log(`   Initially showing Cart content: ${showingCart}`)
    
    // Find Cart button
    const cartButton = page.locator('button').filter({ hasText: '🛒 Cart' })
    const cartButtonExists = await cartButton.count() > 0
    
    console.log(`   Cart button found: ${cartButtonExists}`)
    
    if (!cartButtonExists) {
      console.log('❌ CRITICAL: Cart button not found!')
      await browser.close()
      return
    }
    
    // Check if button is clickable
    const isVisible = await cartButton.first().isVisible()
    const isEnabled = await cartButton.first().isEnabled()
    
    console.log(`   Cart button visible: ${isVisible}, enabled: ${isEnabled}`)
    
    console.log('\n🔍 Step 2: Click Cart button')
    
    // Click the button
    await cartButton.first().click()
    
    // Wait for React state update
    await page.waitForTimeout(2000)
    
    console.log('\n🔍 Step 3: Verify content changed to Cart')
    
    // Check content after click
    const afterContent = await page.textContent('body')
    const nowShowingStores = afterContent.includes('Find CartPilot Partner Stores')
    const nowShowingCart = afterContent.includes('Smart Shopping List')
    
    console.log(`   Now showing Stores content: ${nowShowingStores}`)
    console.log(`   Now showing Cart content: ${nowShowingCart}`)
    
    // Check button styling
    const buttonClasses = await cartButton.first().getAttribute('class')
    const buttonIsActive = buttonClasses.includes('bg-emerald-500')
    
    console.log(`   Cart button appears active (green): ${buttonIsActive}`)
    
    // Content change verification
    const contentChanged = beforeContent !== afterContent
    console.log(`   Page content changed: ${contentChanged}`)
    
    if (contentChanged) {
      const sizeDiff = Math.abs(afterContent.length - beforeContent.length)
      console.log(`   Content size difference: ${sizeDiff} characters`)
    }
    
    console.log('\n🔍 Step 4: Test other buttons for comparison')
    
    // Test Stores button to see if switching works
    const storesButton = page.locator('button').filter({ hasText: '📍 Stores' })
    if (await storesButton.count() > 0) {
      console.log('   Testing Stores button...')
      await storesButton.first().click()
      await page.waitForTimeout(1000)
      
      const backToStores = await page.textContent('body')
      const backToStoresContent = backToStores.includes('Find CartPilot Partner Stores')
      console.log(`   Switching back to Stores works: ${backToStoresContent}`)
    }
    
    console.log('\n🎯 FINAL RESULTS:')
    console.log('=' .repeat(50))
    
    if (nowShowingCart && buttonIsActive && !nowShowingStores) {
      console.log('✅ SUCCESS: Cart button is working perfectly!')
      console.log('   ✓ Button click detected')
      console.log('   ✓ Content switched to Cart')
      console.log('   ✓ Button shows active state')
      console.log('   ✓ Previous content (Stores) hidden')
    } else if (nowShowingCart && !buttonIsActive) {
      console.log('⚠️ PARTIAL: Cart content shows but button styling issue')
    } else if (buttonIsActive && !nowShowingCart) {
      console.log('⚠️ PARTIAL: Button active but content not switched')
    } else if (contentChanged) {
      console.log('⚠️ PARTIAL: Some content changed but not as expected')
    } else {
      console.log('❌ FAILED: Cart button is not working')
      console.log('   - Content not switched')
      console.log('   - Button not active')
    }
    
    if (errors.length > 0) {
      console.log('\n🚨 JavaScript Errors Found:')
      errors.forEach(error => console.log(`   💥 ${error}`))
    } else {
      console.log('\n✅ No JavaScript errors detected')
    }
    
    console.log(`\n📊 Console messages captured: ${consoleMessages.length}`)
    console.log('📱 Page reloads during test:', consoleMessages.filter(msg => 
      msg.includes('connecting...') || msg.includes('server connection lost')
    ).length)
    
    console.log('\n🔍 Browser left open for manual verification')
    console.log('Press Ctrl+C when done')
    
    // Keep browser open for manual inspection
    await new Promise(resolve => {
      process.on('SIGINT', () => {
        console.log('\n👋 Closing browser...')
        browser.close().then(resolve)
      })
    })
    
  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

finalCartTest().catch(console.error)