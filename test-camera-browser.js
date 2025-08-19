// Test camera functionality in browser
import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    args: [
      '--use-fake-device-for-media-stream',
      '--use-fake-ui-for-media-stream'
    ]
  });
  const context = await browser.newContext({
    permissions: ['camera']
  });
  const page = await context.newPage();
  
  console.log('🎥 Testing camera functionality...\n');
  
  // Go to local dev
  await page.goto('http://localhost:5173');
  
  // Wait for app to load
  await page.waitForSelector('h1:has-text("CARTPILOT")', { timeout: 10000 });
  console.log('✅ App loaded');
  
  // Go to Cart tab
  await page.click('button:has-text("Cart")');
  console.log('📍 Navigated to Cart tab');
  
  // Click Add Product Location button
  await page.click('button:has-text("Add Product Location")');
  console.log('🎯 Opened Add Product Location modal');
  
  // Wait for camera_start screen
  await page.waitForSelector('text=Ready to Record Shop Shelves?', { timeout: 5000 });
  console.log('✅ Modal opened with camera start screen');
  
  // Click Start Camera button
  await page.click('button:has-text("📷 Start Camera")');
  console.log('📸 Clicked Start Camera button');
  
  // Wait to see if camera preview appears or error
  try {
    await page.waitForSelector('video', { timeout: 10000 });
    console.log('✅ Camera preview appeared!');
    
    // Check if video is playing
    const isPlaying = await page.evaluate(() => {
      const video = document.querySelector('video');
      return video && !video.paused && video.readyState > 2;
    });
    
    console.log(`📹 Video playing: ${isPlaying}`);
    
    // Take screenshot
    await page.screenshot({ path: 'camera-test-success.png' });
    console.log('📸 Screenshot saved: camera-test-success.png');
    
  } catch (error) {
    console.log('❌ Camera preview did not appear');
    
    // Check for error message
    const errorText = await page.textContent('.text-red-600');
    if (errorText) {
      console.log(`⚠️ Error message: ${errorText}`);
    }
    
    // Take screenshot of error state
    await page.screenshot({ path: 'camera-test-error.png' });
    console.log('📸 Screenshot saved: camera-test-error.png');
  }
  
  // Test barcode scanner camera
  console.log('\n🔍 Testing barcode scanner...');
  
  // Close modal if open
  const closeButton = await page.$('button[aria-label="Close"]');
  if (closeButton) {
    await closeButton.click();
    await page.waitForTimeout(500);
  }
  
  // Go to Navigate tab
  await page.click('button:has-text("Navigate")');
  console.log('📍 Navigated to Navigate tab');
  
  // Click scan barcode button
  const scanButton = await page.$('button:has-text("Scan Barcode")');
  if (scanButton) {
    await scanButton.click();
    console.log('🎯 Clicked Scan Barcode button');
    
    // Wait for scanner to appear
    try {
      await page.waitForSelector('video', { timeout: 10000 });
      console.log('✅ Barcode scanner camera started!');
      
      // Take screenshot
      await page.screenshot({ path: 'barcode-scanner-test.png' });
      console.log('📸 Screenshot saved: barcode-scanner-test.png');
      
    } catch (error) {
      console.log('❌ Barcode scanner camera did not start');
      
      // Check for error message
      const errorText = await page.textContent('.text-red-500');
      if (errorText) {
        console.log(`⚠️ Error message: ${errorText}`);
      }
    }
  } else {
    console.log('⚠️ Scan Barcode button not found');
  }
  
  console.log('\n✨ Camera test complete!');
  
  // Keep browser open for manual testing
  console.log('Browser will stay open for manual testing. Close when done.');
  
})();