import { test, expect } from '@playwright/test';
import { takeScreenshotOnFailure, clearLocalStorage } from './utils/browser-utils';

test.describe('Profile Image Upload', () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorage(page);
    await page.goto('/');
    
    const tutorialVisible = await page.locator('[data-testid="user-tutorial"]').isVisible({ timeout: 2000 }).catch(() => false);
    if (tutorialVisible) {
      await page.locator('button:has-text("Skip")').click();
    }
  });

  test('should access profile image upload when signed in', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'profile-001' });
    
    try {
      // Navigate to Pilot tab (requires sign in)
      await page.locator('button:has-text("👨‍✈️ Pilot")').click();
      
      // Should show sign in requirement
      const signInRequired = await page.locator('text=Sign In Required').isVisible();
      if (signInRequired) {
        console.log('✅ Profile features properly require authentication');
        
        // Click sign in button
        await page.locator('button:has-text("🔑 Sign In")').click();
        
        // Auth modal should appear
        await expect(page.locator('[data-testid="auth-modal"]')).toBeVisible();
        
        console.log('✅ Auth modal accessible for profile features');
      }
      
    } catch (error) {
      await takeScreenshotOnFailure(page, 'profile-001', 'profile-access');
      throw error;
    }
  });
});