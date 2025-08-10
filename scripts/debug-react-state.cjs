// 🔍 Debug React State Update Issue
const { chromium } = require('playwright')

async function debugReactState() {
  console.log('🔍 DEBUGGING: React state update for Cart tab\n')
  
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()
  
  // Capture all console messages
  page.on('console', msg => {
    console.log(`🖥️ BROWSER: ${msg.text()}`)
  })
  
  // Capture JavaScript errors
  page.on('pageerror', error => {
    console.log(`💥 PAGE ERROR: ${error.message}`)
  })
  
  try {
    await page.goto('http://localhost:5174')
    await page.waitForLoadState('networkidle')
    
    console.log('📱 CartPilot loaded, debugging React state...\n')
    
    // Wait for any tutorial to be dismissed
    await page.waitForTimeout(2000)
    
    // Check if tutorial modal exists and dismiss it
    const tutorialModal = page.locator('.fixed.inset-0.bg-black\\/60')
    if (await tutorialModal.isVisible()) {
      console.log('🎓 Dismissing tutorial modal...')
      const skipButton = page.locator('button').filter({ hasText: 'Start Shopping Now' })
      if (await skipButton.count() > 0) {
        await skipButton.first().click()
        await page.waitForTimeout(1000)
      }
    }
    
    // Add debugging functions to the page
    await page.addInitScript(() => {
      window.debugActiveTab = () => {
        // Find React Fiber node to access state
        const appDiv = document.querySelector('#root')
        if (appDiv && appDiv._reactInternalFiber) {
          const fiberNode = appDiv._reactInternalFiber
          // Walk the fiber tree to find CartPilot component state
          // This is a simplified approach
          console.log('React Fiber found:', fiberNode)
        }
        return 'Debug function ready'
      }
    })
    
    console.log('🔍 Step 1: Check current state before clicking...')
    
    // Get current visible content first
    const beforeContent = await page.textContent('body')
    const beforeHasCart = beforeContent.includes('Smart Shopping List')
    console.log(`   Before click - showing cart content: ${beforeHasCart}`)
    
    // Check if Cart button exists and is visible
    const cartButton = page.locator('button').filter({ hasText: '🛒 Cart' })
    const cartButtonCount = await cartButton.count()
    console.log(`   Found ${cartButtonCount} Cart buttons`)
    
    if (cartButtonCount > 0) {
      const isVisible = await cartButton.first().isVisible()
      const isEnabled = await cartButton.first().isEnabled()
      console.log(`   Cart button - visible: ${isVisible}, enabled: ${isEnabled}`)
      
      // Check button styling to see if it thinks it's active
      const buttonClasses = await cartButton.first().getAttribute('class')
      const isActive = buttonClasses.includes('bg-emerald-500')
      console.log(`   Cart button appears active: ${isActive}`)
      
      console.log('\n🔍 Step 2: Clicking Cart button...')
      
      // Click the Cart button and wait
      await cartButton.first().click()
      await page.waitForTimeout(2000) // Wait longer for state update
      
      console.log('\n🔍 Step 3: Checking state after click...')
      
      // Check content after click
      const afterContent = await page.textContent('body')
      const afterHasCart = afterContent.includes('Smart Shopping List')
      console.log(`   After click - showing cart content: ${afterHasCart}`)
      
      // Check button styling again
      const afterButtonClasses = await cartButton.first().getAttribute('class')
      const afterIsActive = afterButtonClasses.includes('bg-emerald-500')
      console.log(`   Cart button appears active after click: ${afterIsActive}`)
      
      // Compare content changes
      const contentChanged = beforeContent !== afterContent
      console.log(`   Page content changed: ${contentChanged}`)
      
      if (contentChanged) {
        const sizeDiff = Math.abs(afterContent.length - beforeContent.length)
        console.log(`   Content size difference: ${sizeDiff} characters`)
      }
      
      // Try to get React component state directly
      const reactState = await page.evaluate(() => {
        try {
          // Look for any element that might have React state
          const buttons = document.querySelectorAll('button')
          for (const button of buttons) {
            if (button.textContent && button.textContent.includes('Cart')) {
              // Try to access React fiber (this might not work in production)
              const fiber = button._reactInternalFiber || button._reactInternalInstance
              if (fiber) {
                return 'React fiber found on Cart button'
              }
            }
          }
          return 'No React fiber found'
        } catch (error) {
          return `Error accessing React state: ${error.message}`
        }
      })
      
      console.log(`   React state check: ${reactState}`)
      
      console.log('\n🎯 DIAGNOSIS:')
      if (afterHasCart) {
        console.log('   ✅ SUCCESS: Cart content is now visible')
      } else if (afterIsActive && !beforeHasCart && !afterHasCart) {
        console.log('   ⚠️ PARTIAL: Button shows active but content not switched')
        console.log('   → Likely React conditional rendering issue')
      } else if (!afterIsActive) {
        console.log('   ❌ FAILURE: Button doesn\'t show active - state not updated')
        console.log('   → React useState not updating')
      } else {
        console.log('   ❓ UNKNOWN: Need more investigation')
      }
    }
    
    console.log('\n🔍 Browser left open for manual inspection...')
    console.log('Press Ctrl+C when done')
    
    // Keep browser open
    await new Promise(resolve => {
      process.on('SIGINT', () => {
        console.log('\n👋 Closing browser...')
        browser.close().then(resolve)
      })
    })
    
  } catch (error) {
    console.error('💥 Debug failed:', error)
  }
}

debugReactState().catch(console.error)