// Test store navigation improvements
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--use-fake-device-for-media-stream']
  });
  const context = await browser.newContext({
    permissions: ['geolocation'],
    geolocation: { latitude: 51.5074, longitude: -0.1278 }, // London
  });
  const page = await context.newPage();
  
  console.log('🗺️ Testing store navigation improvements...\n');
  
  // Go to local dev
  await page.goto('http://localhost:5173');
  
  // Wait for app to load
  await page.waitForSelector('h1:has-text("CARTPILOT")', { timeout: 10000 });
  console.log('✅ App loaded');
  
  // Clear any existing stores selections
  await page.evaluate(() => {
    localStorage.removeItem('selectedStore');
  });
  
  // Click on Stores tab
  await page.click('button:has-text("Stores")');
  console.log('📍 Navigated to Stores tab');
  
  // Test different locations
  const testLocations = [
    { postcode: 'EH1 1AA', name: 'Edinburgh City Centre' },
    { postcode: 'G1 1AA', name: 'Glasgow City Centre' },
    { postcode: 'M1 1AA', name: 'Manchester City Centre' },
    { postcode: 'SW1A 1AA', name: 'London Westminster' },
    { postcode: 'TD9 8EA', name: 'Hawick (Scottish Borders)' }
  ];
  
  for (const location of testLocations) {
    console.log(`\n🔍 Testing ${location.name} (${location.postcode})...`);
    
    // Enter postcode
    await page.fill('input[placeholder*="postcode"]', location.postcode);
    await page.click('button:has-text("Search")');
    
    // Wait for results
    await page.waitForTimeout(3000);
    
    // Check for stores
    const storeCards = await page.$$('.border.rounded-lg.p-4');
    console.log(`  Found ${storeCards.length} stores`);
    
    if (storeCards.length > 0) {
      // Get store details
      const stores = await page.$$eval('.border.rounded-lg.p-4', cards => 
        cards.slice(0, 5).map(card => {
          const name = card.querySelector('h3')?.textContent || '';
          const distance = card.querySelector('.text-gray-600')?.textContent || '';
          return { name, distance };
        })
      );
      
      console.log('  Top stores:');
      stores.forEach(store => {
        console.log(`    - ${store.name}: ${store.distance}`);
      });
      
      // Check for distance gaps
      const distances = await page.$$eval('.text-gray-600', elements => 
        elements.map(el => {
          const match = el.textContent?.match(/(\d+\.?\d*)\s*mi/);
          return match ? parseFloat(match[1]) : null;
        }).filter(d => d !== null)
      );
      
      if (distances.length > 1) {
        const gaps = [];
        for (let i = 1; i < distances.length; i++) {
          const gap = distances[i] - distances[i-1];
          if (gap > 3) {
            gaps.push(`${distances[i-1].toFixed(1)}mi → ${distances[i].toFixed(1)}mi (gap: ${gap.toFixed(1)}mi)`);
          }
        }
        
        if (gaps.length > 0) {
          console.log('  ⚠️ Distance gaps found:');
          gaps.forEach(gap => console.log(`    ${gap}`));
        } else {
          console.log('  ✅ Good distance coverage (no large gaps)');
        }
      }
    } else {
      console.log('  ❌ No stores found');
    }
    
    // Take screenshot
    await page.screenshot({ path: `stores-${location.postcode.replace(' ', '-')}.png` });
  }
  
  console.log('\n✨ Store navigation test complete!');
  console.log('Browser will stay open for manual testing. Close when done.');
  
})();