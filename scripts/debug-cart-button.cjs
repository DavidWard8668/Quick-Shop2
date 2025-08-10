// 🔍 Debug Cart Button Issue
const { chromium } = require('playwright')

async function debugCartButton() {
  console.log('🔍 DEBUGGING: Why Cart button appears broken...\n')
  
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()
  
  try {
    await page.goto('http://localhost:5174')
    await page.waitForLoadState('networkidle')
    
    console.log('📱 CartPilot loaded, investigating Cart button...\n')
    
    // Find the Cart button
    const cartButtons = await page.locator('button:has-text("Cart")').all()
    console.log(`🔢 Found ${cartButtons.length} Cart buttons`)
    
    for (let i = 0; i < cartButtons.length; i++) {
      const button = cartButtons[i]
      const text = await button.textContent()
      const isVisible = await button.isVisible()
      const isEnabled = await button.isEnabled()
      
      console.log(`\n🔍 Cart Button ${i + 1}:`)
      console.log(`   Text: "${text}"`)
      console.log(`   Visible: ${isVisible}`)
      console.log(`   Enabled: ${isEnabled}`)
      
      if (isVisible && isEnabled) {
        console.log('   Testing click...')
        
        // Capture state before
        const beforeContent = await page.textContent('body')
        const beforeUrl = page.url()
        
        // Add click listener
        await page.evaluate(() => {
          window.clickDetected = false
          document.addEventListener('click', (e) => {
            if (e.target?.textContent?.includes('Cart')) {
              window.clickDetected = true
              console.log('Click detected on Cart button!')
            }
          })
        })
        
        // Click the button
        await button.click()
        
        // Check if click was detected
        const clickDetected = await page.evaluate(() => window.clickDetected)
        console.log(`   Click detected: ${clickDetected}`)
        
        // Wait and check changes
        await page.waitForTimeout(2000)
        
        const afterContent = await page.textContent('body')
        const afterUrl = page.url()
        
        console.log(`   URL changed: ${beforeUrl !== afterUrl}`)
        console.log(`   Content changed: ${beforeContent !== afterContent}`)
        
        if (beforeContent !== afterContent) {
          const diff = Math.abs(afterContent.length - beforeContent.length)
          console.log(`   Content difference: ${diff} characters`)
          
          // Check if we can see "Shopping Cart" or cart-related content
          if (afterContent.includes('Shopping Cart') || afterContent.includes('cart')) {
            console.log(`   ✅ Cart content visible!`)
          } else {
            console.log(`   ❌ No cart content found`)
          }
        } else {
          console.log(`   ❌ No content change detected`)
        }
        
        // Check current tab state
        const activeTab = await page.evaluate(() => {
          // Try to find any element that indicates active tab
          const activeElements = Array.from(document.querySelectorAll('[class*="bg-emerald"], [class*="active"]'))
          return activeElements.map(el => el.textContent).join(', ')
        })
        
        console.log(`   Active elements: ${activeTab}`)
      }
    }
    
    // Test Help button too
    console.log('\n📚 Testing Help button...')
    
    const helpButtons = await page.locator('button:has-text("Help")').all()
    if (helpButtons.length > 0) {
      const helpButton = helpButtons[0]
      const beforeModals = await page.locator('[role="dialog"], .modal').count()
      
      await helpButton.click()
      await page.waitForTimeout(1000)
      
      const afterModals = await page.locator('[role="dialog"], .modal').count()
      console.log(`   Modals before: ${beforeModals}, after: ${afterModals}`)
      
      // Check for tutorial or help content
      const helpContent = await page.textContent('body')
      if (helpContent.includes('tutorial') || helpContent.includes('help') || helpContent.includes('guide')) {
        console.log('   ✅ Help content appeared!')
      } else {
        console.log('   ❌ No help content detected')
      }
    }
    
    console.log('\n🎯 DIAGNOSIS COMPLETE')
    console.log('Browser left open for manual inspection...')
    
    // Keep browser open
    await new Promise(resolve => {
      process.on('SIGINT', () => {
        browser.close().then(resolve)
      })
    })
    
  } catch (error) {
    console.error('💥 Debug failed:', error)
  }
}

debugCartButton().catch(console.error)