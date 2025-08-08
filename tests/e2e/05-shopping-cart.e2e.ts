import { test, expect } from '@playwright/test';
import { mockGeolocation, takeScreenshotOnFailure, clearLocalStorage } from './utils/browser-utils';

test.describe('Shopping Cart Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorage(page);
    await mockGeolocation(page);
    await page.goto('/');
    
    // Skip tutorial
    const tutorialVisible = await page.locator('[data-testid="user-tutorial"]').isVisible({ timeout: 2000 }).catch(() => false);
    if (tutorialVisible) {
      await page.locator('button:has-text("Skip")').click();
    }
    
    // Navigate to cart
    await page.locator('button:has-text("🛒 Cart")').click();
  });

  test('should add items to shopping cart', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'cart-001' });
    
    try {
      // Add first item
      await page.locator('input[placeholder*="Add item"], input[placeholder*="shopping list"]').fill('Milk');
      await page.locator('button:has-text("➕ Add Item"), button:has-text("Add")').click();
      
      // Verify item appears in cart
      await expect(page.locator('text=Milk')).toBeVisible();
      
      // Add second item
      await page.locator('input[placeholder*="Add item"], input[placeholder*="shopping list"]').fill('Bread');
      await page.locator('button:has-text("➕ Add Item"), button:has-text("Add")').click();
      
      // Verify both items are in cart
      await expect(page.locator('text=Milk')).toBeVisible();
      await expect(page.locator('text=Bread')).toBeVisible();
      
      // Check cart count badge
      const cartBadge = page.locator('button:has-text("🛒 Cart") .badge, button:has-text("🛒 Cart") [class*="badge"]');
      if (await cartBadge.isVisible()) {
        await expect(cartBadge).toContainText('2');
      }
      
      console.log('✅ Items added to cart successfully');
      
    } catch (error) {
      await takeScreenshotOnFailure(page, 'cart-001', 'add-items');
      throw error;
    }
  });

  test('should remove items from shopping cart', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'cart-002' });
    
    try {
      // Add items first
      const items = ['Apples', 'Bananas', 'Oranges'];
      
      for (const item of items) {
        await page.locator('input[placeholder*="Add item"], input[placeholder*="shopping list"]').fill(item);
        await page.locator('button:has-text("➕ Add Item"), button:has-text("Add")').click();
      }
      
      // Verify all items are added
      for (const item of items) {
        await expect(page.locator(`text=${item}`)).toBeVisible();
      }
      
      // Remove middle item (Bananas)
      const bananasItem = page.locator('[data-testid="cart-item"], .cart-item').filter({ hasText: 'Bananas' });
      const removeButton = bananasItem.locator('button:has-text("×"), button[title*="remove"], button[aria-label*="remove"]');
      await removeButton.click();
      
      // Verify Bananas is removed
      await expect(page.locator('text=Bananas')).not.toBeVisible();
      
      // Verify other items still exist
      await expect(page.locator('text=Apples')).toBeVisible();
      await expect(page.locator('text=Oranges')).toBeVisible();
      
      console.log('✅ Item removal working correctly');
      
    } catch (error) {
      await takeScreenshotOnFailure(page, 'cart-002', 'remove-items');
      throw error;
    }
  });

  test('should mark items as completed/found', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'cart-003' });
    
    try {
      // Add test items
      await page.locator('input[placeholder*="Add item"], input[placeholder*="shopping list"]').fill('Eggs');
      await page.locator('button:has-text("➕ Add Item"), button:has-text("Add")').click();
      
      await page.locator('input[placeholder*="Add item"], input[placeholder*="shopping list"]').fill('Cheese');
      await page.locator('button:has-text("➕ Add Item"), button:has-text("Add")').click();
      
      // Find checkbox for first item
      const eggItem = page.locator('[data-testid="cart-item"], .cart-item').filter({ hasText: 'Eggs' });
      const checkbox = eggItem.locator('input[type="checkbox"]');
      
      // Mark as completed
      await checkbox.check();
      
      // Verify item appears completed (strikethrough, different styling)
      await expect(eggItem).toHaveClass(/completed/);
      // OR check for strikethrough text
      const strikethroughText = eggItem.locator('text=Eggs[class*="line-through"], .line-through:has-text("Eggs")');
      if (await strikethroughText.isVisible()) {
        console.log('✅ Item marked as completed with strikethrough');
      }
      
      // Verify completion message
      await expect(page.locator('text=Got it!, text=✓')).toBeVisible();
      
      // Test unchecking
      await checkbox.uncheck();
      await expect(eggItem).not.toHaveClass(/completed/);
      
      console.log('✅ Item completion toggle working');
      
    } catch (error) {
      await takeScreenshotOnFailure(page, 'cart-003', 'mark-completed');
      throw error;
    }
  });

  test('should display cart summary and progress', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'cart-004' });
    
    try {
      // Add multiple items
      const items = ['Item 1', 'Item 2', 'Item 3', 'Item 4'];
      
      for (const item of items) {
        await page.locator('input[placeholder*="Add item"], input[placeholder*="shopping list"]').fill(item);
        await page.locator('button:has-text("➕ Add Item"), button:has-text("Add")').click();
      }
      
      // Mark some as completed
      const firstItem = page.locator('[data-testid="cart-item"], .cart-item').first();
      const secondItem = page.locator('[data-testid="cart-item"], .cart-item').nth(1);
      
      await firstItem.locator('input[type="checkbox"]').check();
      await secondItem.locator('input[type="checkbox"]').check();
      
      // Check progress summary
      await expect(page.locator('text=2 of 4 items completed')).toBeVisible();
      
      console.log('✅ Cart progress summary displayed correctly');
      
    } catch (error) {
      await takeScreenshotOnFailure(page, 'cart-004', 'cart-summary');
      throw error;
    }
  });

  test('should clear completed items', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'cart-005' });
    
    try {
      // Add items
      const items = ['Clear Test 1', 'Clear Test 2', 'Clear Test 3'];
      
      for (const item of items) {
        await page.locator('input[placeholder*="Add item"], input[placeholder*="shopping list"]').fill(item);
        await page.locator('button:has-text("➕ Add Item"), button:has-text("Add")').click();
      }
      
      // Mark first two as completed
      const items_elements = page.locator('[data-testid="cart-item"], .cart-item');
      await items_elements.nth(0).locator('input[type="checkbox"]').check();
      await items_elements.nth(1).locator('input[type="checkbox"]').check();
      
      // Click clear completed button
      await page.locator('button:has-text("Clear Completed")').click();
      
      // Verify completed items are removed
      await expect(page.locator('text=Clear Test 1')).not.toBeVisible();
      await expect(page.locator('text=Clear Test 2')).not.toBeVisible();
      
      // Verify incomplete item remains
      await expect(page.locator('text=Clear Test 3')).toBeVisible();
      
      console.log('✅ Clear completed items working');
      
    } catch (error) {
      await takeScreenshotOnFailure(page, 'cart-005', 'clear-completed');
      throw error;
    }
  });

  test('should handle empty cart state', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'cart-006' });
    
    try {
      // Verify empty cart message
      await expect(page.locator('text=Your shopping list is empty, text=empty')).toBeVisible();
      
      // Verify empty cart icon/illustration
      await expect(page.locator('[data-testid="empty-cart-icon"], text=📝')).toBeVisible();
      
      console.log('✅ Empty cart state displayed correctly');
      
    } catch (error) {
      await takeScreenshotOnFailure(page, 'cart-006', 'empty-cart');
      throw error;
    }
  });

  test('should persist cart items across page reloads', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'cart-007' });
    
    try {
      // Add items to cart
      await page.locator('input[placeholder*="Add item"], input[placeholder*="shopping list"]').fill('Persistent Item 1');
      await page.locator('button:has-text("➕ Add Item"), button:has-text("Add")').click();
      
      await page.locator('input[placeholder*="Add item"], input[placeholder*="shopping list"]').fill('Persistent Item 2');
      await page.locator('button:has-text("➕ Add Item"), button:has-text("Add")').click();
      
      // Mark one as completed
      const firstItem = page.locator('[data-testid="cart-item"], .cart-item').first();
      await firstItem.locator('input[type="checkbox"]').check();
      
      // Reload page
      await page.reload();
      
      // Skip tutorial if it appears
      const tutorialVisible = await page.locator('[data-testid="user-tutorial"]').isVisible({ timeout: 2000 }).catch(() => false);
      if (tutorialVisible) {
        await page.locator('button:has-text("Skip")').click();
      }
      
      // Navigate back to cart
      await page.locator('button:has-text("🛒 Cart")').click();
      
      // Verify items are still there
      await expect(page.locator('text=Persistent Item 1')).toBeVisible();
      await expect(page.locator('text=Persistent Item 2')).toBeVisible();
      
      // Verify completion state is preserved
      const reloadedFirstItem = page.locator('[data-testid="cart-item"], .cart-item').filter({ hasText: 'Persistent Item 1' });
      const checkbox = reloadedFirstItem.locator('input[type="checkbox"]');
      await expect(checkbox).toBeChecked();
      
      console.log('✅ Cart persistence working across reloads');
      
    } catch (error) {
      await takeScreenshotOnFailure(page, 'cart-007', 'cart-persistence');
      throw error;
    }
  });

  test('should handle long item names gracefully', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'cart-008' });
    
    try {
      const longItemName = 'This is a very long product name that should test how the cart handles text wrapping and layout when items have extremely long names that might break the UI';
      
      await page.locator('input[placeholder*="Add item"], input[placeholder*="shopping list"]').fill(longItemName);
      await page.locator('button:has-text("➕ Add Item"), button:has-text("Add")').click();
      
      // Verify item is added and visible
      await expect(page.locator(`text=${longItemName.substring(0, 20)}`)).toBeVisible();
      
      // Check that layout is not broken
      const cartItem = page.locator('[data-testid="cart-item"], .cart-item').filter({ hasText: longItemName.substring(0, 20) });
      await expect(cartItem).toBeVisible();
      
      console.log('✅ Long item names handled gracefully');
      
    } catch (error) {
      await takeScreenshotOnFailure(page, 'cart-008', 'long-item-names');
      throw error;
    }
  });

  test('should handle special characters in item names', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'cart-009' });
    
    try {
      const specialItems = [
        'Café au Lait ☕',
        'Spicy Jalapeños 🌶️',
        'H&M T-Shirt',
        'Ben & Jerry\'s Ice Cream'
      ];
      
      for (const item of specialItems) {
        await page.locator('input[placeholder*="Add item"], input[placeholder*="shopping list"]').fill(item);
        await page.locator('button:has-text("➕ Add Item"), button:has-text("Add")').click();
        
        // Verify item appears correctly
        await expect(page.locator(`text=${item}`)).toBeVisible();
      }
      
      console.log('✅ Special characters in item names handled correctly');
      
    } catch (error) {
      await takeScreenshotOnFailure(page, 'cart-009', 'special-characters');
      throw error;
    }
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    test.info().annotations.push({ type: 'test-id', description: 'cart-010' });
    
    const viewports = [
      { width: 320, height: 568, name: 'Small Mobile' },
      { width: 375, height: 667, name: 'Medium Mobile' },
      { width: 414, height: 896, name: 'Large Mobile' },
      { width: 768, height: 1024, name: 'Tablet' }
    ];

    for (const viewport of viewports) {
      try {
        await page.setViewportSize(viewport);
        
        // Test adding item on this screen size
        await page.locator('input[placeholder*="Add item"], input[placeholder*="shopping list"]').fill(`Test Item ${viewport.name}`);
        await page.locator('button:has-text("➕ Add Item"), button:has-text("Add")').click();
        
        // Verify item appears and layout looks good
        await expect(page.locator(`text=Test Item ${viewport.name}`)).toBeVisible();
        
        // Verify cart controls are accessible
        const cartItem = page.locator('[data-testid="cart-item"], .cart-item').last();
        await expect(cartItem.locator('input[type="checkbox"]')).toBeVisible();
        await expect(cartItem.locator('button:has-text("×"), button[title*="remove"]')).toBeVisible();
        
        console.log(`✅ Cart responsive on ${viewport.name} (${viewport.width}x${viewport.height})`);
        
      } catch (error) {
        await takeScreenshotOnFailure(page, 'cart-010', `responsive-${viewport.name}`);
        throw new Error(`Cart not responsive on ${viewport.name}: ${error}`);
      }
    }
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'failed') {
      await takeScreenshotOnFailure(page, testInfo.title, 'final-state');
    }
  });
});