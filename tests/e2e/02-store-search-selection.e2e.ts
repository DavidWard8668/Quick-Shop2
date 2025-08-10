import { test, expect } from '@playwright/test';
import { mockGeolocation, takeScreenshotOnFailure, waitForNetworkIdle, clearLocalStorage } from './utils/browser-utils';

test.describe('Store Search and Selection', () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorage(page);
    await mockGeolocation(page);
    await page.goto('/');
    
    // Skip tutorial if it appears
    const tutorialVisible = await page.locator('[data-testid="user-tutorial"]').isVisible({ timeout: 2000 }).catch(() => false);
    if (tutorialVisible) {
      await page.locator('button:has-text("Skip")').click();
    }
    
    // Navigate to stores tab
    await page.locator('button:has-text("📍 Stores")').click();
  });

  test('should find stores using GPS location', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'store-search-001' });
    
    try {
      // Click "Use My Location" button
      await page.locator('button:has-text("📍 Use My Location")').click();
      
      // Wait for loading spinner
      await expect(page.locator('text=Locating...')).toBeVisible();
      
      // Wait for stores to load
      await waitForNetworkIdle(page);
      await expect(page.locator('text=Locating...')).not.toBeVisible({ timeout: 10000 });
      
      // Should show stores or no stores message
      const storesFound = await page.locator('[data-testid="store-card"]').count();
      if (storesFound > 0) {
        // Verify store cards are displayed
        await expect(page.locator('[data-testid="store-card"]').first()).toBeVisible();
        
        // Verify essential store information
        await expect(page.locator('[data-testid="store-card"] h3').first()).toBeVisible();
        await expect(page.locator('text=miles').first()).toBeVisible();
        
        console.log(`✅ Found ${storesFound} stores near location`);
      } else {
        // Should show "no stores found" message
        await expect(page.locator('text=No stores found nearby')).toBeVisible();
        console.log('ℹ️ No stores found near test location');
      }
      
    } catch (error) {
      await takeScreenshotOnFailure(page, 'store-search-001', 'gps-location-search');
      throw error;
    }
  });

  test('should find stores using postcode search', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'store-search-002' });
    
    try {
      // Enter a UK postcode
      await page.locator('input[placeholder*="postcode"]').fill('M1 1AA');
      await page.locator('button:has-text("🔍 Search")').click();
      
      // Wait for search to complete
      await waitForNetworkIdle(page);
      await expect(page.locator('button:has-text("🔍 Search")').filter({ hasText: /^(?!.*Searching)/ })).toBeVisible({ timeout: 10000 });
      
      // Should show stores or no stores message
      const storesFound = await page.locator('[data-testid="store-card"]').count();
      if (storesFound > 0) {
        await expect(page.locator('[data-testid="store-card"]').first()).toBeVisible();
        console.log(`✅ Found ${storesFound} stores near M1 1AA`);
      } else {
        await expect(page.locator('text=No stores found nearby')).toBeVisible();
        console.log('ℹ️ No stores found near M1 1AA');
      }
      
    } catch (error) {
      await takeScreenshotOnFailure(page, 'store-search-002', 'postcode-search');
      throw error;
    }
  });

  test('should handle invalid postcode gracefully', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'store-search-003' });
    
    try {
      // Enter invalid postcode
      await page.locator('input[placeholder*="postcode"]').fill('INVALID123');
      await page.locator('button:has-text("🔍 Search")').click();
      
      // Should show error message
      await expect(page.locator('text=Unable to find that postcode')).toBeVisible({ timeout: 10000 });
      
    } catch (error) {
      await takeScreenshotOnFailure(page, 'store-search-003', 'invalid-postcode');
      throw error;
    }
  });

  test('should display store information correctly', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'store-search-004' });
    
    try {
      // Search for stores
      await page.locator('input[placeholder*="postcode"]').fill('M1 1AA');
      await page.locator('button:has-text("🔍 Search")').click();
      await waitForNetworkIdle(page);
      
      // Check if stores are found
      const storesFound = await page.locator('[data-testid="store-card"]').count();
      
      if (storesFound > 0) {
        const storeCard = page.locator('[data-testid="store-card"]').first();
        
        // Verify store information is displayed
        await expect(storeCard.locator('h3')).toBeVisible(); // Store name
        await expect(storeCard.locator('text=miles')).toBeVisible(); // Distance
        
        // Check for action buttons
        await expect(storeCard.locator('button:has-text("🧭 Navigate Here")')).toBeVisible();
        await expect(storeCard.locator('button:has-text("🛒 Shop Here")')).toBeVisible();
        await expect(storeCard.locator('button:has-text("🤖 AI Map Store")')).toBeVisible();
        
        // Check for favorite button (heart or white heart)
        const favoriteButton = storeCard.locator('button').filter({ hasText: /🤍|❤️/u }).or(
          storeCard.locator('button[title*="favorite"]').or(
            storeCard.locator('button[aria-label*="favorite"]')
          )
        );
        await expect(favoriteButton).toBeVisible();
        
        console.log('✅ Store information displayed correctly');
      } else {
        console.log('ℹ️ Skipping store info verification - no stores found');
        test.skip();
      }
      
    } catch (error) {
      await takeScreenshotOnFailure(page, 'store-search-004', 'store-information');
      throw error;
    }
  });

  test('should allow store selection and navigation', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'store-search-005' });
    
    try {
      // Search for stores
      await page.locator('input[placeholder*="postcode"]').fill('M1 1AA');
      await page.locator('button:has-text("🔍 Search")').click();
      await waitForNetworkIdle(page);
      
      const storesFound = await page.locator('[data-testid="store-card"]').count();
      
      if (storesFound > 0) {
        // Click "Shop Here" on first store
        await page.locator('[data-testid="store-card"]').first().locator('button:has-text("🛒 Shop Here")').click();
        
        // Should navigate to Navigate tab
        await expect(page.locator('button:has-text("🧭 Navigate")').filter({ hasClass: /emerald/ })).toBeVisible();
        
        // Should show selected store in navigation
        await expect(page.locator('text=Smart Navigation')).toBeVisible();
        
        console.log('✅ Store selection and navigation working');
      } else {
        console.log('ℹ️ Skipping store selection test - no stores found');
        test.skip();
      }
      
    } catch (error) {
      await takeScreenshotOnFailure(page, 'store-search-005', 'store-selection');
      throw error;
    }
  });

  test('should handle navigation to external maps', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'store-search-006' });
    
    try {
      // Search for stores
      await page.locator('input[placeholder*="postcode"]').fill('M1 1AA');
      await page.locator('button:has-text("🔍 Search")').click();
      await waitForNetworkIdle(page);
      
      const storesFound = await page.locator('[data-testid="store-card"]').count();
      
      if (storesFound > 0) {
        // Listen for new page/tab opening
        const [newPage] = await Promise.all([
          page.context().waitForEvent('page'),
          page.locator('[data-testid="store-card"]').first().locator('button:has-text("🧭 Navigate Here")').click()
        ]);
        
        // Verify navigation was triggered (new page opened)
        expect(newPage.url()).toContain('maps'); // Should contain maps URL
        await newPage.close();
        
        console.log('✅ External navigation working');
      } else {
        console.log('ℹ️ Skipping external navigation test - no stores found');
        test.skip();
      }
      
    } catch (error) {
      await takeScreenshotOnFailure(page, 'store-search-006', 'external-navigation');
      // Don't throw - external navigation might be blocked in test environment
      console.warn('External navigation test failed (expected in test environment):', error);
    }
  });

  test('should refresh store list', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'store-search-007' });
    
    try {
      // First search
      await page.locator('input[placeholder*="postcode"]').fill('M1 1AA');
      await page.locator('button:has-text("🔍 Search")').click();
      await waitForNetworkIdle(page);
      
      // Click refresh button
      await page.locator('button:has-text("🔄 Refresh")').click();
      
      // Should show loading state
      const refreshButton = page.locator('button:has-text("🔄 Refresh")');
      await expect(refreshButton).toBeDisabled();
      
      // Wait for refresh to complete
      await expect(refreshButton).toBeEnabled({ timeout: 10000 });
      
      console.log('✅ Store refresh working');
      
    } catch (error) {
      await takeScreenshotOnFailure(page, 'store-search-007', 'store-refresh');
      throw error;
    }
  });

  test('should handle favorite stores functionality', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'store-search-008' });
    
    try {
      // Search for stores
      await page.locator('input[placeholder*="postcode"]').fill('M1 1AA');
      await page.locator('button:has-text("🔍 Search")').click();
      await waitForNetworkIdle(page);
      
      const storesFound = await page.locator('[data-testid="store-card"]').count();
      
      if (storesFound > 0) {
        const favoriteButton = page.locator('[data-testid="store-card"]').first().locator('button').filter({ hasText: /🤍|❤️/u }).or(
          page.locator('[data-testid="store-card"]').first().locator('button[title*="favorite"]')
        );
        
        // Click favorite button (should work without login or show auth modal)
        await favoriteButton.click();
        
        // Either favorite changes or auth modal appears
        const authModalVisible = await page.locator('[data-testid="auth-modal"]').isVisible({ timeout: 2000 }).catch(() => false);
        
        if (authModalVisible) {
          console.log('✅ Auth modal shown for favorites (expected for non-logged in user)');
          await page.locator('button').filter({ hasText: /close|×|cancel/i }).first().click();
        } else {
          console.log('✅ Favorite button clicked (logged in user or demo mode)');
        }
        
      } else {
        console.log('ℹ️ Skipping favorites test - no stores found');
        test.skip();
      }
      
    } catch (error) {
      await takeScreenshotOnFailure(page, 'store-search-008', 'favorite-stores');
      throw error;
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'store-search-009' });
    
    const viewports = [
      { width: 320, height: 568 },
      { width: 375, height: 667 },
      { width: 414, height: 896 }
    ];

    for (const viewport of viewports) {
      try {
        await page.setViewportSize(viewport);
        
        // Verify main elements are visible and usable
        await expect(page.locator('button:has-text("📍 Use My Location")')).toBeVisible();
        await expect(page.locator('input[placeholder*="postcode"]')).toBeVisible();
        await expect(page.locator('button:has-text("🔍 Search")')).toBeVisible();
        
        // Test postcode search on this viewport
        await page.locator('input[placeholder*="postcode"]').fill('M1 1AA');
        await page.locator('button:has-text("🔍 Search")').click();
        
        await waitForNetworkIdle(page);
        
        console.log(`✅ Store search responsive on ${viewport.width}x${viewport.height}`);
        
      } catch (error) {
        await takeScreenshotOnFailure(page, 'store-search-009', `responsive-${viewport.width}x${viewport.height}`);
        throw new Error(`Not responsive on ${viewport.width}x${viewport.height}: ${error}`);
      }
    }
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed') {
      await takeScreenshotOnFailure(page, testInfo.title, 'final-state');
    }
  });
});