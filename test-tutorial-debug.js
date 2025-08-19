// Quick tutorial debug test
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🎯 Testing tutorial logic...');
  
  // Go to the app
  await page.goto('https://cartpilot-sigma.vercel.app');
  
  // Clear localStorage
  await page.evaluate(() => {
    console.log('Before clear:', {
      completed: localStorage.getItem('cartpilot-tutorial-completed'),
      skipped: localStorage.getItem('cartpilot-tutorial-skipped')
    });
    
    localStorage.removeItem('cartpilot-tutorial-completed');
    localStorage.removeItem('cartpilot-tutorial-skipped');
    
    console.log('After clear:', {
      completed: localStorage.getItem('cartpilot-tutorial-completed'),
      skipped: localStorage.getItem('cartpilot-tutorial-skipped')
    });
  });
  
  // Reload
  await page.reload();
  
  // Wait for page load
  await page.waitForSelector('h1:has-text("CARTPILOT")');
  
  // Wait for tutorial or timeout
  console.log('⏰ Waiting for tutorial to appear...');
  
  try {
    await page.waitForSelector('[data-testid="user-tutorial"]', { timeout: 10000 });
    console.log('✅ Tutorial appeared!');
  } catch (error) {
    console.log('❌ Tutorial did not appear');
    
    // Check if Help button exists and click it
    const helpButton = await page.$('button:has-text("📚 Help")');
    if (helpButton) {
      console.log('🔧 Manually clicking Help button...');
      await helpButton.click();
      
      try {
        await page.waitForSelector('[data-testid="user-tutorial"]', { timeout: 3000 });
        console.log('✅ Tutorial appeared after manual trigger!');
      } catch {
        console.log('❌ Tutorial still not working even with manual trigger');
      }
    }
  }
  
  // Take screenshot
  await page.screenshot({ path: 'tutorial-debug.png' });
  console.log('📸 Screenshot saved as tutorial-debug.png');
  
  await browser.close();
})();