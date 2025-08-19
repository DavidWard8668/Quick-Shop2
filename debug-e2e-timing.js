// Debug E2E timing issue
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Listen to console messages
  page.on('console', msg => {
    console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`);
  });
  
  // Listen to errors
  page.on('pageerror', error => {
    console.log(`[ERROR] ${error.message}`);
  });
  
  console.log('🎯 Testing E2E timing behavior...');
  
  // Go to the app (same as E2E test)
  await page.goto('http://localhost:5173');
  
  // Wait for page load first
  await page.waitForSelector('h1:has-text("CARTPILOT")', { timeout: 10000 });
  console.log('✅ App loaded');
  
  // Check localStorage before clearing
  const beforeClear = await page.evaluate(() => ({
    completed: localStorage.getItem('cartpilot-tutorial-completed'),
    skipped: localStorage.getItem('cartpilot-tutorial-skipped')
  }));
  console.log('Before clear:', beforeClear);
  
  // Clear localStorage (exactly like E2E test)
  await page.evaluate(() => {
    localStorage.removeItem('cartpilot-tutorial-completed');
    localStorage.removeItem('cartpilot-tutorial-skipped');
  });
  
  // Check localStorage after clearing
  const afterClear = await page.evaluate(() => ({
    completed: localStorage.getItem('cartpilot-tutorial-completed'),
    skipped: localStorage.getItem('cartpilot-tutorial-skipped')
  }));
  console.log('After clear:', afterClear);
  
  // Reload (exactly like E2E test)
  await page.reload();
  
  // Wait for app to load again
  await page.waitForSelector('h1:has-text("CARTPILOT")', { timeout: 10000 });
  console.log('✅ App reloaded');
  
  // Check if tutorial appears within various timeframes
  console.log('⏰ Checking tutorial appearance with different timeouts...');
  
  for (let timeout of [1000, 2000, 3000, 5000, 10000]) {
    try {
      console.log(`  Testing ${timeout}ms timeout...`);
      await page.waitForSelector('[data-testid="user-tutorial"]', { timeout });
      console.log(`✅ Tutorial appeared after ${timeout}ms!`);
      
      // Take screenshot
      await page.screenshot({ path: `tutorial-debug-e2e-${timeout}ms.png` });
      console.log(`📸 Screenshot saved for ${timeout}ms test`);
      break;
      
    } catch (error) {
      console.log(`❌ No tutorial after ${timeout}ms`);
      if (timeout === 10000) {
        // Final attempt - take screenshot of failure
        await page.screenshot({ path: 'tutorial-debug-e2e-failed.png' });
        console.log('📸 Failed state screenshot saved');
      }
    }
  }
  
  // Check current state
  const showTutorialState = await page.evaluate(() => {
    // Try to access React state (this might not work, but worth a try)
    const cartPilotElement = document.querySelector('[data-react-root]');
    return {
      hasTestId: !!document.querySelector('[data-testid="user-tutorial"]'),
      hasTutorialModal: !!document.querySelector('[data-tutorial-modal]'),
      localStorage: {
        completed: localStorage.getItem('cartpilot-tutorial-completed'),
        skipped: localStorage.getItem('cartpilot-tutorial-skipped')
      }
    };
  });
  
  console.log('Final state:', showTutorialState);
  
  await browser.close();
})();