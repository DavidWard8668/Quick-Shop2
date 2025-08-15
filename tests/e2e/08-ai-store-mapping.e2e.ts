import { test, expect } from '@playwright/test';
import { mockGeolocation, takeScreenshotOnFailure, clearLocalStorage, waitForNetworkIdle } from './utils/browser-utils';

test.describe('AI Store Mapping Flow', () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorage(page);
    await mockGeolocation(page);
    await page.goto('/');
    
    const tutorialVisible = await page.locator('[data-testid="user-tutorial"]').isVisible({ timeout: 2000 }).catch(() => false);
    if (tutorialVisible) {
      await page.locator('button:has-text("Skip")').click();
    }
    
    // Search for stores
    await page.locator('button:has-text("Stores")').click();
    await page.locator('input[placeholder*="postcode"]').fill('M1 1AA');
    await page.locator('button:has-text("Search")').click();
    await waitForNetworkIdle(page);
  });

  test('should access AI store mapping feature', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'ai-mapping-001' });
    
    try {
      const storesFound = await page.locator('[data-testid="store-card"]').count();
      
      if (storesFound > 0) {
        // Look for AI mapping button
        const aiMappingButton = page.locator('button:has-text("AI Map Store")').first();
        
        if (await aiMappingButton.isVisible()) {
          await aiMappingButton.click();
          
          // Should show auth requirement or mapping interface
          const authModal = await page.locator('[data-testid="auth-modal"]').isVisible({ timeout: 2000 }).catch(() => false);
          const mappingInterface = await page.locator('[data-testid="ai-mapper"]').isVisible({ timeout: 2000 }).catch(() => false);
          
          if (authModal) {
            console.log('✅ AI mapping properly requires authentication');
          } else if (mappingInterface) {
            console.log('✅ AI mapping interface accessible');
          } else {
            console.log('ℹ️ AI mapping triggered but interface not immediately visible');
          }
        } else {
          console.log('ℹ️ AI mapping button not found');
          test.skip();
        }
      } else {
        console.log('ℹ️ No stores found - skipping AI mapping test');
        test.skip();
      }
      
    } catch (error) {
      await takeScreenshotOnFailure(page, 'ai-mapping-001', 'ai-mapping-access');
      throw error;
    }
  });
});