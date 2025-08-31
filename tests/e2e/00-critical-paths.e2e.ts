import { test, expect } from '@playwright/test';

/**
 * Critical path E2E tests for CartPilot
 * These tests must pass for deployment
 */

test.describe('@critical CartPilot Core Functionality', () => {
  test.setTimeout(20000); // 20 second timeout per test
  
  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    
    // Mock geolocation for consistent testing
    await page.context().setGeolocation({ 
      latitude: 51.5074, 
      longitude: -0.1278 
    });
    
    // Clear storage for clean state
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('@critical App loads successfully', async ({ page }) => {
    // Verify app loads
    await expect(page.locator('h1:has-text("CARTPILOT")')).toBeVisible({ timeout: 5000 });
    
    // Check main navigation exists
    await expect(page.locator('[data-testid="main-nav"], nav')).toBeVisible();
    
    // Verify no console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    expect(consoleErrors).toHaveLength(0);
  });

  test('@critical Store search functionality', async ({ page }) => {
    // Skip tutorial if present
    const skipButton = page.locator('button:has-text("Skip")');
    if (await skipButton.isVisible({ timeout: 3000 })) {
      await skipButton.click();
    }
    
    // Navigate to stores page
    await page.locator('a[href="/stores"], button:has-text("Stores")').first().click();
    await page.waitForLoadState('domcontentloaded');
    
    // Search for stores
    const searchInput = page.locator('input[placeholder*="search"], input[type="search"]').first();
    await searchInput.fill('Tesco');
    await searchInput.press('Enter');
    
    // Verify search results appear
    await expect(page.locator('text=/Tesco/i').first()).toBeVisible({ timeout: 10000 });
  });
});
