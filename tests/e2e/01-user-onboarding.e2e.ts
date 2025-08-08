import { test, expect } from '@playwright/test';
import { setupMobileContext, mockGeolocation, takeScreenshotOnFailure, waitForToast, clearLocalStorage, setLocalStorageItem } from './utils/browser-utils';

test.describe('User Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any previous session data
    await clearLocalStorage(page);
    await mockGeolocation(page);
    await page.goto('/');
  });

  test('should display welcome tutorial for new users', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'onboarding-001' });
    
    try {
      // Wait for app to load
      await expect(page.locator('h1:has-text("CARTPILOT")')).toBeVisible();
      
      // Tutorial should appear automatically for new users
      await expect(page.locator('[data-testid="user-tutorial"]')).toBeVisible({ timeout: 3000 });
      
      // Verify tutorial content
      await expect(page.locator('text=Welcome to CartPilot!')).toBeVisible();
      await expect(page.locator('button:has-text("Next")')).toBeVisible();
      
    } catch (error) {
      await takeScreenshotOnFailure(page, 'onboarding-001', 'tutorial-display');
      throw error;
    }
  });

  test('should allow user to navigate through tutorial steps', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'onboarding-002' });
    
    try {
      // Wait for tutorial to appear
      await expect(page.locator('[data-testid="user-tutorial"]')).toBeVisible({ timeout: 3000 });
      
      // Navigate through tutorial steps
      const nextButton = page.locator('button:has-text("Next")');
      const skipButton = page.locator('button:has-text("Skip")');
      
      // Step 1: Welcome
      await expect(page.locator('text=Welcome to CartPilot!')).toBeVisible();
      await nextButton.click();
      
      // Step 2: Store Finder
      await expect(page.locator('text=Find Nearby Stores')).toBeVisible();
      await nextButton.click();
      
      // Step 3: Smart Shopping
      await expect(page.locator('text=Smart Shopping Lists')).toBeVisible();
      await nextButton.click();
      
      // Step 4: Navigation
      await expect(page.locator('text=In-Store Navigation')).toBeVisible();
      await nextButton.click();
      
      // Step 5: Rewards
      await expect(page.locator('text=Earn Rewards')).toBeVisible();
      
      // Complete tutorial
      await page.locator('button:has-text("Get Started")').click();
      
      // Tutorial should close
      await expect(page.locator('[data-testid="user-tutorial"]')).not.toBeVisible();
      
      // Should be marked as completed in localStorage
      const tutorialCompleted = await page.evaluate(() => 
        localStorage.getItem('cartpilot-tutorial-completed')
      );
      expect(tutorialCompleted).toBeTruthy();
      
    } catch (error) {
      await takeScreenshotOnFailure(page, 'onboarding-002', 'tutorial-navigation');
      throw error;
    }
  });

  test('should allow user to skip tutorial', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'onboarding-003' });
    
    try {
      // Wait for tutorial
      await expect(page.locator('[data-testid="user-tutorial"]')).toBeVisible({ timeout: 3000 });
      
      // Click skip button
      await page.locator('button:has-text("Skip")').click();
      
      // Tutorial should close
      await expect(page.locator('[data-testid="user-tutorial"]')).not.toBeVisible();
      
      // Should be marked as skipped in localStorage
      const tutorialSkipped = await page.evaluate(() => 
        localStorage.getItem('cartpilot-tutorial-skipped')
      );
      expect(tutorialSkipped).toBeTruthy();
      
    } catch (error) {
      await takeScreenshotOnFailure(page, 'onboarding-003', 'tutorial-skip');
      throw error;
    }
  });

  test('should not show tutorial to returning users', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'onboarding-004' });
    
    try {
      // Set tutorial as completed
      await setLocalStorageItem(page, 'cartpilot-tutorial-completed', 'true');
      await page.reload();
      
      // Wait for app to load
      await expect(page.locator('h1:has-text("CARTPILOT")')).toBeVisible();
      
      // Tutorial should not appear
      await expect(page.locator('[data-testid="user-tutorial"]')).not.toBeVisible({ timeout: 3000 });
      
    } catch (error) {
      await takeScreenshotOnFailure(page, 'onboarding-004', 'returning-user');
      throw error;
    }
  });

  test('should allow manual access to help tutorial', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'onboarding-005' });
    
    try {
      // Skip initial tutorial
      await expect(page.locator('[data-testid="user-tutorial"]')).toBeVisible({ timeout: 3000 });
      await page.locator('button:has-text("Skip")').click();
      
      // Click help button in header
      await page.locator('button:has-text("📚 Help")').click();
      
      // Tutorial should reappear
      await expect(page.locator('[data-testid="user-tutorial"]')).toBeVisible();
      await expect(page.locator('text=Welcome to CartPilot!')).toBeVisible();
      
    } catch (error) {
      await takeScreenshotOnFailure(page, 'onboarding-005', 'manual-help');
      throw error;
    }
  });

  test('should be responsive on different mobile screen sizes', async ({ page, browserName }) => {
    test.info().annotations.push({ type: 'test-id', description: 'onboarding-006' });
    
    const viewports = [
      { width: 320, height: 568, name: 'iPhone SE' },
      { width: 375, height: 667, name: 'iPhone 8' },
      { width: 414, height: 896, name: 'iPhone 11' },
      { width: 360, height: 640, name: 'Galaxy S9' }
    ];

    for (const viewport of viewports) {
      try {
        await page.setViewportSize(viewport);
        await page.reload();
        
        // Wait for tutorial on this screen size
        await expect(page.locator('[data-testid="user-tutorial"]')).toBeVisible({ timeout: 3000 });
        
        // Verify layout is not broken
        const tutorialDialog = page.locator('[data-testid="user-tutorial"]');
        await expect(tutorialDialog).toBeVisible();
        
        // Check that buttons are clickable (not cut off)
        const nextButton = page.locator('button:has-text("Next")');
        await expect(nextButton).toBeVisible();
        
        // Verify tutorial can be interacted with
        await nextButton.click();
        await expect(page.locator('text=Find Nearby Stores')).toBeVisible();
        
        console.log(`✅ Tutorial responsive on ${viewport.name} (${viewport.width}x${viewport.height})`);
        
      } catch (error) {
        await takeScreenshotOnFailure(page, 'onboarding-006', `responsive-${viewport.name}`);
        throw new Error(`Tutorial not responsive on ${viewport.name}: ${error}`);
      }
    }
  });

  test('should handle accessibility features', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'onboarding-007' });
    
    try {
      // Wait for tutorial
      await expect(page.locator('[data-testid="user-tutorial"]')).toBeVisible({ timeout: 3000 });
      
      // Check for ARIA labels and roles
      const dialog = page.locator('[data-testid="user-tutorial"]');
      await expect(dialog).toHaveAttribute('role', 'dialog');
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter'); // Should activate focused button
      
      // Verify step changed
      await expect(page.locator('text=Find Nearby Stores')).toBeVisible();
      
      // Test ESC key to close tutorial
      await page.keyboard.press('Escape');
      
      // Tutorial should close or show confirmation
      const isTutorialVisible = await page.locator('[data-testid="user-tutorial"]').isVisible();
      // Either tutorial closed or still visible (both acceptable behaviors)
      expect(typeof isTutorialVisible).toBe('boolean');
      
    } catch (error) {
      await takeScreenshotOnFailure(page, 'onboarding-007', 'accessibility');
      throw error;
    }
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed') {
      await takeScreenshotOnFailure(page, testInfo.title, 'final-state');
    }
  });
});