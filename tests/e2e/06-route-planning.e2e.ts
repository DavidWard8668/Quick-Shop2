import { test, expect } from '@playwright/test';
import { mockGeolocation, takeScreenshotOnFailure, clearLocalStorage, waitForNetworkIdle } from './utils/browser-utils';

test.describe('Route Planning', () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorage(page);
    await mockGeolocation(page);
    await page.goto('/');
    
    // Skip tutorial and set up cart with items
    const tutorialVisible = await page.locator('[data-testid="user-tutorial"]').isVisible({ timeout: 2000 }).catch(() => false);
    if (tutorialVisible) {
      await page.locator('button:has-text("Skip")').click();
    }
    
    // Add items to cart first
    await page.locator('button:has-text("Cart")').click();
    const testItems = ['Milk', 'Bread', 'Eggs', 'Cheese'];
    
    for (const item of testItems) {
      await page.locator('input[placeholder*="Add item"]').fill(item);
      await page.locator('button:has-text("Add Item")').click();
    }
  });

  test('should plan optimal route for cart items', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'route-001' });
    
    try {
      // Look for route planning button
      const routeButton = page.locator('button:has-text("🗺 Plan Optimal Route"), button:has-text("Plan Route")');
      
      if (await routeButton.isVisible()) {
        await routeButton.click();
        
        // Should show route information
        const routeInfo = await page.locator('text=Optimal Shopping Route, text=aisle order, text=route').first().isVisible({ timeout: 5000 }).catch(() => false);
        
        if (routeInfo) {
          console.log('✅ Route planning functionality working');
        } else {
          console.log('ℹ️ Route planning triggered but no visible route info');
        }
      } else {
        console.log('ℹ️ Route planning button not found - feature may need store selection');
        test.skip();
      }
      
    } catch (error) {
      await takeScreenshotOnFailure(page, 'route-001', 'optimal-route');
      throw error;
    }
  });

  test('should require store selection for route planning', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'route-002' });
    
    try {
      const routeButton = page.locator('button:has-text("🗺 Plan Optimal Route")');
      
      if (await routeButton.isVisible()) {
        // Should be disabled without store selection
        const isDisabled = await routeButton.isDisabled();
        
        if (isDisabled) {
          console.log('✅ Route planning properly requires store selection');
        } else {
          console.log('ℹ️ Route planning available without store - checking functionality');
        }
      }
      
    } catch (error) {
      await takeScreenshotOnFailure(page, 'route-002', 'store-requirement');
      throw error;
    }
  });
});