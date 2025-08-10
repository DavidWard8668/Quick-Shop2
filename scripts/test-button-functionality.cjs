// 🕵️ CartPilot Button Functionality Detective
const { chromium } = require('playwright')

async function testButtonFunctionality() {
  console.log('🔍 TESTING: Do CartPilot buttons actually work or just look pretty?\n')
  
  const browser = await chromium.launch({ headless: false })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  })
  const page = await context.newPage()
  
  try {
    await page.goto('http://localhost:5174')
    await page.waitForLoadState('networkidle')
    
    console.log('📱 CartPilot loaded, now testing every button...\n')
    
    // Get all buttons
    const buttons = await page.locator('button').all()
    console.log(`🔢 Found ${buttons.length} buttons to test\n`)
    
    let workingButtons = 0
    let brokenButtons = 0
    let buttonResults = []
    
    for (let i = 0; i < buttons.length; i++) {
      try {
        const button = buttons[i]
        const buttonText = await button.textContent() || `Button ${i + 1}`
        const isVisible = await button.isVisible()
        const isEnabled = await button.isEnabled()
        
        if (!isVisible || !isEnabled) {
          console.log(`⏭️ Skipping: "${buttonText}" (not visible/enabled)`)
          continue
        }
        
        console.log(`🖱️ Testing: "${buttonText}"`)
        
        // Capture state before click
        const beforeUrl = page.url()
        const beforeText = await page.textContent('body')
        
        // Click the button
        await button.click()
        await page.waitForTimeout(1500) // Give time for any async operations
        
        // Check what changed
        const afterUrl = page.url()
        const afterText = await page.textContent('body')
        
        let hasEffect = false
        let effectDescription = []
        
        // URL changed?
        if (afterUrl !== beforeUrl) {
          hasEffect = true
          effectDescription.push(`URL changed: ${beforeUrl} → ${afterUrl}`)
        }
        
        // Content changed?
        if (afterText !== beforeText) {
          hasEffect = true
          const textDiff = Math.abs(afterText.length - beforeText.length)
          effectDescription.push(`Content changed (${textDiff} character difference)`)
        }
        
        // Look for new elements that appeared
        const modals = await page.locator('.modal, [role="dialog"], .overlay').count()
        const notifications = await page.locator('.toast, .notification, .alert').count()
        
        if (modals > 0) {
          hasEffect = true
          effectDescription.push(`${modals} modal(s) appeared`)
        }
        
        if (notifications > 0) {
          hasEffect = true
          effectDescription.push(`${notifications} notification(s) shown`)
        }
        
        // Check for loading states
        const loaders = await page.locator('.loading, .spinner, [data-loading]').count()
        if (loaders > 0) {
          hasEffect = true
          effectDescription.push(`Loading indicators appeared`)
        }
        
        if (hasEffect) {
          console.log(`   ✅ WORKS: ${effectDescription.join(', ')}`)
          workingButtons++
          buttonResults.push({ text: buttonText, status: 'working', effects: effectDescription })
        } else {
          console.log(`   ❌ BROKEN: No visible effect`)
          brokenButtons++
          buttonResults.push({ text: buttonText, status: 'broken', effects: [] })
        }
        
        // Close any modals that opened
        const closeButtons = await page.locator('button:has-text("Close"), button:has-text("Cancel"), button:has-text("×"), [aria-label="Close"]').all()
        for (const closeBtn of closeButtons) {
          try {
            if (await closeBtn.isVisible()) {
              await closeBtn.click()
              await page.waitForTimeout(500)
            }
          } catch (e) {
            // Ignore close button errors
          }
        }
        
      } catch (error) {
        console.log(`   💥 ERROR: ${error.message}`)
        brokenButtons++
        buttonResults.push({ text: buttonText || `Button ${i + 1}`, status: 'error', effects: [] })
      }
    }
    
    // Test navigation tabs specifically
    console.log('\n🎯 Testing Navigation Tabs Specifically...\n')
    
    const tabNames = ['Social', 'AI', 'Marketplace', 'Stores', 'Cart', 'Navigate', 'Map', 'Pilot']
    
    for (const tabName of tabNames) {
      try {
        const tabButton = page.locator(`button:has-text("${tabName}")`).first()
        
        if (await tabButton.count() > 0) {
          console.log(`🔍 Testing ${tabName} tab...`)
          
          const beforeContent = await page.textContent('body')
          await tabButton.click()
          await page.waitForTimeout(2000)
          const afterContent = await page.textContent('body')
          
          if (afterContent !== beforeContent) {
            console.log(`   ✅ ${tabName} tab works - content changed`)
            
            // Look for specific content that should appear
            const tabContent = afterContent.toLowerCase()
            if (tabName === 'Social' && (tabContent.includes('family') || tabContent.includes('challenge'))) {
              console.log(`   🎯 Social features detected`)
            } else if (tabName === 'AI' && (tabContent.includes('prediction') || tabContent.includes('smart'))) {
              console.log(`   🤖 AI features detected`)
            } else if (tabName === 'Marketplace' && (tabContent.includes('partner') || tabContent.includes('api'))) {
              console.log(`   🌐 Marketplace features detected`)
            }
          } else {
            console.log(`   ❌ ${tabName} tab appears broken - no content change`)
          }
        }
      } catch (e) {
        console.log(`   💥 ${tabName} tab error: ${e.message}`)
      }
    }
    
    // Final Results
    console.log('\n' + '='.repeat(60))
    console.log('🏆 BUTTON FUNCTIONALITY TEST RESULTS')
    console.log('='.repeat(60))
    console.log(`Total Buttons Tested: ${workingButtons + brokenButtons}`)
    console.log(`✅ Working Buttons: ${workingButtons}`)
    console.log(`❌ Broken Buttons: ${brokenButtons}`)
    console.log(`📊 Success Rate: ${Math.round((workingButtons / (workingButtons + brokenButtons)) * 100)}%\n`)
    
    if (brokenButtons > 0) {
      console.log('💔 BROKEN BUTTONS:')
      buttonResults
        .filter(r => r.status === 'broken' || r.status === 'error')
        .forEach(r => console.log(`   - "${r.text}"`))
    }
    
    if (workingButtons > 0) {
      console.log('\n💚 WORKING BUTTONS:')
      buttonResults
        .filter(r => r.status === 'working')
        .forEach(r => console.log(`   - "${r.text}": ${r.effects.join(', ')}`))
    }
    
    const finalVerdict = workingButtons > brokenButtons ? '✅ MOSTLY FUNCTIONAL' : '❌ NEEDS WORK'
    console.log(`\n🎯 FINAL VERDICT: ${finalVerdict}`)
    
    if (brokenButtons > workingButtons) {
      console.log('\n🚨 WARNING: More buttons are broken than working!')
      console.log('💡 Recommendation: Fix button event handlers and component state management')
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error)
  } finally {
    // Keep browser open for manual inspection
    console.log('\n🔍 Browser left open for manual inspection...')
    console.log('Press Ctrl+C to close when done reviewing')
    
    // Wait for manual close
    await new Promise(resolve => {
      process.on('SIGINT', () => {
        console.log('\n👋 Closing browser...')
        browser.close().then(resolve)
      })
    })
  }
}

testButtonFunctionality().catch(console.error)