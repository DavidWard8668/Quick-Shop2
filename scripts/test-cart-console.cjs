// 🔍 Test Cart Button with Console Monitoring
const { chromium } = require('playwright')

async function testCartWithConsole() {
  console.log('🔍 Testing Cart button with console monitoring...\n')
  
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()
  
  // Listen to console messages
  page.on('console', msg => {
    if (msg.text().includes('Cart')) {
      console.log('🛒 CONSOLE:', msg.text())
    }
  })
  
  try {
    await page.goto('http://localhost:5174')
    await page.waitForLoadState('networkidle')
    
    console.log('📱 CartPilot loaded. Testing Cart button...')
    
    // Find and click the Cart button
    const cartButton = page.locator('button:has-text("Cart")').first()
    
    console.log('🖱️ Clicking Cart button...')
    await cartButton.click()
    
    // Wait for any async operations
    await page.waitForTimeout(3000)
    
    // Check what's on screen after click
    const bodyText = await page.textContent('body')
    
    if (bodyText.includes('Smart Shopping List') || bodyText.includes('shopping list is empty')) {
      console.log('✅ SUCCESS: Cart content is visible!')
      console.log('   Found shopping list interface')
    } else {
      console.log('❌ PROBLEM: Cart content not visible')
      console.log('   Checking what is visible instead...')
      
      // Look for active tab indicators  
      const activeElements = await page.$$eval('[class*="bg-emerald"], [class*="emerald"]', elements => 
        elements.map(el => el.textContent?.trim()).filter(Boolean)
      )
      console.log('   Active elements:', activeElements)
      
      // Check all visible text
      const visibleText = bodyText.substring(0, 500)
      console.log('   Visible content starts with:', visibleText.replace(/\s+/g, ' '))
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message)
  }
  
  console.log('\n🔍 Browser left open - check manually if needed')
  console.log('Press Ctrl+C to close')
  
  // Keep open for manual inspection
  await new Promise(resolve => {
    process.on('SIGINT', () => {
      browser.close().then(resolve)
    })
  })
}

testCartWithConsole().catch(console.error)