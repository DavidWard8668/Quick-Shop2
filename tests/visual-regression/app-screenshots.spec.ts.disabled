import { test, expect } from '@playwright/test';
import { mockGeolocation, clearLocalStorage } from '../e2e/utils/browser-utils';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorage(page);
    await mockGeolocation(page);
  });

  test('should match homepage screenshot', async ({ page }) => {
    await page.goto('/');
    
    // Skip tutorial for consistent screenshots
    const tutorialVisible = await page.locator('[data-testid="user-tutorial"]').isVisible({ timeout: 2000 }).catch(() => false);
    if (tutorialVisible) {
      await page.locator('button:has-text("Skip")').click();
    }
    
    // Wait for page to stabilize
    await page.waitForSelector('h1:has-text("CARTPILOT")');
    await page.waitForTimeout(2000); // Allow for animations to complete
    
    // Take screenshot
    await expect(page).toHaveScreenshot('homepage.png');
  });

  test('should match stores tab screenshot', async ({ page }) => {
    await page.goto('/');
    
    // Skip tutorial and navigate to stores
    const tutorialVisible = await page.locator('[data-testid="user-tutorial"]').isVisible({ timeout: 2000 }).catch(() => false);
    if (tutorialVisible) {
      await page.locator('button:has-text("Skip")').click();
    }
    
    await page.locator('button:has-text("📍 Stores")').click();
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('stores-tab.png');
  });

  test('should match cart tab screenshot', async ({ page }) => {
    await page.goto('/');
    
    const tutorialVisible = await page.locator('[data-testid="user-tutorial"]').isVisible({ timeout: 2000 }).catch(() => false);
    if (tutorialVisible) {
      await page.locator('button:has-text("Skip")').click();
    }
    
    // Navigate to cart and add some items
    await page.locator('button:has-text("🛒 Cart")').click();
    await page.waitForTimeout(500);
    
    // Add test items for visual consistency
    await page.locator('input[placeholder*="Add item"]').fill('Milk');
    await page.locator('button:has-text("➕ Add Item")').click();
    await page.locator('input[placeholder*="Add item"]').fill('Bread');
    await page.locator('button:has-text("➕ Add Item")').click();
    
    await page.waitForTimeout(500);
    await expect(page).toHaveScreenshot('cart-with-items.png');
  });

  test('should match mobile viewport screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    const tutorialVisible = await page.locator('[data-testid="user-tutorial"]').isVisible({ timeout: 2000 }).catch(() => false);
    if (tutorialVisible) {
      await page.locator('button:has-text("Skip")').click();
    }
    
    await page.waitForSelector('h1:has-text("CARTPILOT")');
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('mobile-homepage.png');
  });

  test('should match empty states', async ({ page }) => {
    await page.goto('/');
    
    const tutorialVisible = await page.locator('[data-testid="user-tutorial"]').isVisible({ timeout: 2000 }).catch(() => false);
    if (tutorialVisible) {
      await page.locator('button:has-text("Skip")').click();
    }
    
    // Empty cart state
    await page.locator('button:has-text("🛒 Cart")').click();
    await page.waitForTimeout(500);
    
    const emptyCartRegion = page.locator('[data-testid="empty-cart"], .empty-cart-container').first();
    if (await emptyCartRegion.isVisible()) {
      await expect(emptyCartRegion).toHaveScreenshot('empty-cart-state.png');
    } else {
      // Fallback to full page if empty cart container not found
      await expect(page).toHaveScreenshot('empty-cart-state.png');
    }
  });

  test('should match component screenshots', async ({ page }) => {
    await page.goto('/');
    
    const tutorialVisible = await page.locator('[data-testid="user-tutorial"]').isVisible({ timeout: 2000 }).catch(() => false);
    if (tutorialVisible) {
      await page.locator('button:has-text("Skip")').click();
    }
    
    // Header component
    const header = page.locator('header, .header, div:has(h1:text("CARTPILOT"))').first();
    if (await header.isVisible()) {
      await expect(header).toHaveScreenshot('header-component.png');
    }
    
    // Navigation tabs
    const navTabs = page.locator('div:has(button:has-text("📍 Stores"))').first();
    if (await navTabs.isVisible()) {
      await expect(navTabs).toHaveScreenshot('navigation-tabs.png');
    }
  });
});