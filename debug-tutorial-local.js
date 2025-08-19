// Debug tutorial locally to see what's happening
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🎯 Starting local debug of tutorial...');
  
  // Go to localhost
  await page.goto('http://localhost:5173');
  
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
  await page.waitForSelector('h1:has-text("CARTPILOT")', { timeout: 10000 });
  console.log('✅ Page loaded');
  
  // Wait for tutorial with longer timeout
  console.log('⏰ Waiting for tutorial to appear...');
  
  try {
    await page.waitForSelector('[data-testid="user-tutorial"]', { timeout: 15000 });
    console.log('✅ Tutorial appeared!');
    
    // Check what kind of tutorial
    const hasWelcome = await page.locator('text=Welcome to CartPilot!').isVisible();
    const hasQuickStart = await page.locator('text=Your guide to stress free shopping').isVisible();
    
    console.log('Tutorial type:', {
      hasWelcome,
      hasQuickStart
    });
    
    // Take screenshot
    await page.screenshot({ path: 'tutorial-debug-local.png' });
    console.log('📸 Screenshot saved');
    
  } catch (error) {
    console.log('❌ Tutorial did not appear:', error.message);
    
    // Check if there's any error in console
    page.on('console', msg => console.log('Browser console:', msg.text()));
    
    // Take screenshot of current state
    await page.screenshot({ path: 'tutorial-debug-failed.png' });
    console.log('📸 Failed state screenshot saved');
  }
  
  await browser.close();
})();