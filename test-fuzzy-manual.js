// Simple manual test for fuzzy search
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🔍 Opening browser for manual fuzzy search test...\n');
  
  // Go to local dev
  await page.goto('http://localhost:5173');
  
  // Wait for app to load
  await page.waitForSelector('h1:has-text("CARTPILOT")', { timeout: 10000 });
  console.log('✅ App loaded');
  
  console.log('\nMANUAL TEST INSTRUCTIONS:');
  console.log('1. Select a store from the Stores tab');
  console.log('2. Go to Navigate tab');
  console.log('3. Try typing these in the search box:');
  console.log('   - "Mi" (should show Milk products)');
  console.log('   - "mi" (lowercase, should also work)');
  console.log('   - "br" (should show Bread products)');
  console.log('   - "eg" (should show Eggs)');
  console.log('\n4. Check if suggestions appear with partial matches');
  console.log('\nBrowser will stay open for manual testing. Close when done.');
  
})();