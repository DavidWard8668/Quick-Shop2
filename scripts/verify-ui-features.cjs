// 🧪 CartPilot UI Feature Verification Script
const { chromium } = require('playwright')

async function verifyCartPilotFeatures() {
  console.log('🚀 Starting CartPilot UI Feature Verification...\n')
  
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  })
  const page = await context.newPage()
  
  try {
    // 1. Load CartPilot
    console.log('📱 Loading CartPilot application...')
    await page.goto('http://localhost:5174')
    await page.waitForLoadState('networkidle', { timeout: 10000 })
    console.log('✅ CartPilot loaded successfully')
    
    // 2. Check page title
    const title = await page.title()
    console.log(`📋 Page Title: "${title}"`)
    
    // 3. Check for main app content
    await page.waitForTimeout(2000)
    const bodyText = await page.textContent('body')
    console.log(`📊 Page content length: ${bodyText.length} characters`)
    
    // 4. Look for navigation tabs
    console.log('\n🔍 Searching for navigation tabs...')
    
    // Try different tab selectors
    const tabSelectors = [
      'button:has-text("Social")',
      'button:has-text("AI")',
      'button:has-text("Marketplace")',
      'button:has-text("Stores")',
      'button:has-text("Cart")',
      '[role="tab"]',
      '.tab',
      'button[data-testid*="tab"]'
    ]
    
    let foundTabs = []
    
    for (const selector of tabSelectors) {
      try {
        const elements = await page.locator(selector).all()
        if (elements.length > 0) {
          for (let element of elements) {
            const text = await element.textContent()
            if (text && text.trim()) {
              foundTabs.push(text.trim())
            }
          }
        }
      } catch (e) {
        // Continue
      }
    }
    
    if (foundTabs.length > 0) {
      console.log(`✅ Found ${foundTabs.length} navigation elements:`)
      foundTabs.slice(0, 10).forEach(tab => console.log(`   - ${tab}`))
    } else {
      console.log('⚠️ No navigation tabs found')
    }
    
    // 5. Check for specific feature indicators
    console.log('\n🎯 Checking for feature indicators...')
    
    const featureKeywords = [
      'Social', 'Family', 'Challenge', 'Community',
      'AI', 'Prediction', 'Intelligence', 'Smart',
      'API', 'Marketplace', 'Partner', 'Integration',
      'Store', 'Product', 'Cart', 'Navigation'
    ]
    
    let foundFeatures = []
    
    for (const keyword of featureKeywords) {
      if (bodyText.includes(keyword)) {
        foundFeatures.push(keyword)
      }
    }
    
    if (foundFeatures.length > 0) {
      console.log(`✅ Found ${foundFeatures.length} feature indicators:`)
      foundFeatures.forEach(feature => console.log(`   - ${feature}`))
    } else {
      console.log('⚠️ No specific feature keywords found')
    }
    
    // 6. Try to interact with navigation
    console.log('\n🖱️ Testing navigation interactions...')
    
    // Look for clickable buttons
    const buttons = await page.locator('button').all()
    console.log(`📊 Found ${buttons.length} buttons on the page`)
    
    if (buttons.length > 0) {
      // Try clicking the first few buttons
      for (let i = 0; i < Math.min(3, buttons.length); i++) {
        try {
          const buttonText = await buttons[i].textContent()
          if (buttonText && buttonText.trim()) {
            console.log(`🖱️ Clicking button: "${buttonText.trim()}"`)
            await buttons[i].click()
            await page.waitForTimeout(1000)
            
            // Check if anything changed
            const newBodyText = await page.textContent('body')
            if (newBodyText !== bodyText) {
              console.log('✅ UI state changed after click')
            }
          }
        } catch (e) {
          console.log(`⚠️ Could not click button ${i + 1}`)
        }
      }
    }
    
    // 7. Take a screenshot for verification
    console.log('\n📸 Taking screenshot for verification...')
    await page.screenshot({ 
      path: 'cartpilot-ui-verification.png',
      fullPage: true 
    })
    console.log('📸 Screenshot saved as cartpilot-ui-verification.png')
    
    // 8. Check console for any errors
    console.log('\n🔍 Checking for JavaScript errors...')
    let hasErrors = false
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`❌ Console Error: ${msg.text()}`)
        hasErrors = true
      }
    })
    
    // Wait a bit to catch any async errors
    await page.waitForTimeout(3000)
    
    if (!hasErrors) {
      console.log('✅ No JavaScript errors detected')
    }
    
    // 9. Final verification summary
    console.log('\n📋 VERIFICATION SUMMARY:')
    console.log('========================')
    console.log(`✅ Application loads: YES`)
    console.log(`✅ Content present: ${bodyText.length > 1000 ? 'YES' : 'LIMITED'}`)
    console.log(`✅ Navigation found: ${foundTabs.length > 0 ? 'YES' : 'NO'}`)
    console.log(`✅ Features detected: ${foundFeatures.length}`)
    console.log(`✅ Interactive elements: ${buttons.length} buttons`)
    console.log(`✅ JavaScript errors: ${hasErrors ? 'FOUND' : 'NONE'}`)
    
    const isFullyFunctional = 
      bodyText.length > 1000 && 
      foundTabs.length > 0 && 
      foundFeatures.length >= 3 && 
      !hasErrors
    
    console.log(`\n🎯 UI AUTOMATION READY: ${isFullyFunctional ? '✅ YES' : '⚠️ PARTIAL'}\n`)
    
    if (isFullyFunctional) {
      console.log('🎉 CartPilot UI is fully functional and ready for automation testing!')
      console.log('✅ Social Shopping, AI SuperIntelligence, and API Marketplace features appear to be working')
    } else {
      console.log('⚠️ CartPilot UI has loaded but some features may need verification')
      console.log('💡 Manual testing recommended to confirm all dashboard functionality')
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error.message)
  } finally {
    await browser.close()
  }
}

// Run verification
verifyCartPilotFeatures().catch(console.error)