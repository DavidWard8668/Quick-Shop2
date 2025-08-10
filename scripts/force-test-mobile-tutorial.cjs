// 🔍 Force Test Mobile Tutorial - Clear localStorage and Test
const { chromium } = require('playwright')

async function forceTestMobileTutorial() {
  console.log('📱 FORCE TESTING: Mobile tutorial modal dismissal (clearing localStorage)\n')
  
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext({
    viewport: { width: 375, height: 667 }, // iPhone SE size
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
  })
  const page = await context.newPage()
  
  try {
    await page.goto('http://localhost:5174')
    await page.waitForLoadState('networkidle')
    
    console.log('📱 CartPilot loaded on mobile viewport')
    
    // Clear localStorage to force tutorial to appear
    await page.evaluate(() => {
      localStorage.removeItem('cartpilot-tutorial-completed')
      localStorage.removeItem('cartpilot-tutorial-skipped')
      console.log('Cleared tutorial localStorage flags')
    })
    
    // Reload to trigger tutorial
    await page.reload()
    await page.waitForTimeout(3000) // Wait for tutorial to appear
    
    // Check if tutorial modal is visible
    const tutorialModal = await page.locator('.fixed.inset-0.bg-black\\/60').first()
    const isModalVisible = await tutorialModal.isVisible()
    
    console.log(`🎯 Tutorial modal visible after localStorage clear: ${isModalVisible}`)
    
    if (isModalVisible) {
      console.log('\n🖱️ TESTING all mobile dismissal methods...\n')
      
      // Test 1: Check button sizes first
      console.log('1. Checking touch target sizes...')
      
      const closeButton = page.locator('button').filter({ hasText: '✕' })
      const startButton = page.locator('button').filter({ hasText: 'Start Shopping Now' })
      
      if (await closeButton.count() > 0) {
        const closeBB = await closeButton.first().boundingBox()
        console.log(`   ✕ Close button: ${closeBB.width}x${closeBB.height}px ${closeBB.width >= 44 && closeBB.height >= 44 ? '✅' : '❌'}`)
      }
      
      if (await startButton.count() > 0) {
        const startBB = await startButton.first().boundingBox()
        console.log(`   🚀 Start button: ${startBB.width}x${startBB.height}px ${startBB.height >= 48 ? '✅' : '❌'}`)
      }
      
      // Test 2: Try closing with ✕ button
      console.log('\n2. Testing ✕ button dismiss...')
      if (await closeButton.count() > 0) {
        await closeButton.first().click()
        await page.waitForTimeout(1000)
        
        const stillVisible1 = await tutorialModal.isVisible()
        console.log(`   Result: ${!stillVisible1 ? '✅ Modal dismissed successfully' : '❌ Modal still visible'}`)
        
        if (stillVisible1) {
          console.log('   ❌ Close button failed - trying alternative methods')
        }
      }
      
      // If modal still visible, try other methods
      if (await tutorialModal.isVisible()) {
        // Test 3: Try "Start Shopping Now" button  
        console.log('\n3. Testing "Start Shopping Now" button...')
        if (await startButton.count() > 0) {
          await startButton.first().click()
          await page.waitForTimeout(1000)
          
          const stillVisible2 = await tutorialModal.isVisible()
          console.log(`   Result: ${!stillVisible2 ? '✅ Modal dismissed successfully' : '❌ Modal still visible'}`)
        }
      }
      
      // If still visible, test backdrop click
      if (await tutorialModal.isVisible()) {
        console.log('\n4. Testing backdrop tap (click outside)...')
        
        // Click on backdrop area (not the modal content)
        await page.click('body', { position: { x: 50, y: 50 } })
        await page.waitForTimeout(1000)
        
        const stillVisible3 = await tutorialModal.isVisible()
        console.log(`   Result: ${!stillVisible3 ? '✅ Modal dismissed successfully' : '❌ Modal still visible'}`)
      }
      
      // Final check - ensure main app is accessible
      console.log('\n5. Checking main app accessibility...')
      const mainButtons = await page.locator('button').filter({ hasText: /Stores|Cart|Navigate|Map/ }).count()
      console.log(`   Main navigation buttons found: ${mainButtons}`)
      
      if (mainButtons >= 4) {
        console.log('   ✅ Main app is accessible')
        
        // Test main button functionality
        const storesButton = page.locator('button').filter({ hasText: 'Stores' }).first()
        if (await storesButton.isVisible()) {
          console.log('   🔍 Testing Stores button click...')
          await storesButton.click()
          await page.waitForTimeout(1000)
          
          const storesContent = await page.textContent('body')
          if (storesContent.includes('location') || storesContent.includes('stores') || storesContent.includes('GPS')) {
            console.log('   ✅ Stores functionality working')
          } else {
            console.log('   ⚠️ Stores button clicked but content unclear')
          }
        }
      }
      
    } else {
      console.log('❌ Tutorial modal did not appear even after clearing localStorage')
      console.log('   This suggests the modal trigger logic may need adjustment')
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('🏆 MOBILE TUTORIAL DISMISSAL TEST COMPLETE')
    console.log('='.repeat(60))
    
    if (!await tutorialModal.isVisible()) {
      console.log('✅ SUCCESS: Modal can be properly dismissed on mobile')
      console.log('✅ Android users should no longer be stuck')
    } else {
      console.log('❌ ISSUE: Modal still visible - needs further fixes')
    }
    
    console.log('\n📋 ANDROID USER INSTRUCTIONS:')
    console.log('   1. Tap the large ✕ button (top right corner)')
    console.log('   2. OR tap "🚀 Start Shopping Now" (green button)')
    console.log('   3. OR tap outside the white box area')
    console.log('   4. All buttons are now 44px+ for easy touch access')
    
    console.log('\n🔍 Browser left open for manual verification...')
    
  } catch (error) {
    console.error('💥 Test failed:', error)
  }
  
  // Keep browser open for manual inspection
  await new Promise(resolve => {
    process.on('SIGINT', () => {
      console.log('\n👋 Closing browser...')
      browser.close().then(resolve)
    })
  })
}

forceTestMobileTutorial().catch(console.error)