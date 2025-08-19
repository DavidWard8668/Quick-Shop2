// Test fuzzy search functionality
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🔍 Testing fuzzy search functionality...\n');
  
  // Go to local dev
  await page.goto('http://localhost:5173');
  
  // Wait for app to load
  await page.waitForSelector('h1:has-text("CARTPILOT")', { timeout: 10000 });
  console.log('✅ App loaded');
  
  // Go to Navigate tab
  await page.click('button:has-text("Navigate")');
  console.log('📍 Navigated to Navigate tab');
  
  // Select a store first (required for search)
  await page.click('button:has-text("Use My Location")');
  await page.waitForTimeout(2000); // Wait for location
  
  // Check if any stores are found
  const noStoresText = await page.$('text=No stores found nearby');
  if (noStoresText) {
    console.log('⚠️ No stores found, entering manual postcode');
    await page.fill('input[placeholder*="postcode"]', 'EH1 1AA');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(2000);
  }
  
  // Select first store if available
  const storeCard = await page.$('.border.rounded-lg.p-4');
  if (storeCard) {
    await storeCard.click();
    console.log('✅ Store selected');
  } else {
    console.log('❌ No stores available for testing');
    await browser.close();
    return;
  }
  
  // Test various fuzzy search patterns
  const testCases = [
    { input: 'Mi', expected: 'Milk' },
    { input: 'mi', expected: 'Milk' },
    { input: 'mil', expected: 'Milk' },
    { input: 'milk', expected: 'Milk' },
    { input: 'br', expected: 'Bread' },
    { input: 'brea', expected: 'Bread' },
    { input: 'chee', expected: 'Cheese' },
    { input: 'eg', expected: 'Eggs' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\nTesting: "${testCase.input}" → expecting "${testCase.expected}"`);
    
    // Clear input
    const input = await page.$('input[placeholder*="Start typing"]');
    await input.fill('');
    
    // Type the test query
    await input.type(testCase.input, { delay: 100 });
    
    // Wait for suggestions to appear
    await page.waitForTimeout(500);
    
    // Check if suggestions dropdown appears
    const suggestionsDropdown = await page.$('.absolute.z-10.w-full.mt-1');
    if (suggestionsDropdown) {
      // Get all suggestions
      const suggestions = await page.$$eval('.p-3.hover\\:bg-gray-50', elements => 
        elements.map(el => el.textContent)
      );
      
      if (suggestions.length > 0) {
        console.log(`  ✅ Found ${suggestions.length} suggestions:`);
        suggestions.slice(0, 3).forEach(s => console.log(`     - ${s}`));
        
        // Check if expected product is in suggestions
        const hasExpected = suggestions.some(s => s.includes(testCase.expected));
        if (hasExpected) {
          console.log(`  ✅ Expected product "${testCase.expected}" found!`);
        } else {
          console.log(`  ❌ Expected product "${testCase.expected}" NOT found`);
        }
      } else {
        console.log(`  ❌ No suggestions found for "${testCase.input}"`);
      }
    } else {
      console.log(`  ❌ No suggestions dropdown appeared for "${testCase.input}"`);
    }
  }
  
  // Take final screenshot
  await page.screenshot({ path: 'fuzzy-search-test.png' });
  console.log('\n📸 Screenshot saved: fuzzy-search-test.png');
  
  console.log('\n✨ Fuzzy search test complete!');
  console.log('Browser will stay open for manual testing. Close when done.');
  
})();