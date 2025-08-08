import { chromium, FullConfig } from '@playwright/test';
import { setupTestDatabase, createTestUser } from './utils/database-setup';
import { clearBrowserCache } from './utils/browser-utils';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global E2E test setup...');

  // Setup test database
  try {
    await setupTestDatabase();
    console.log('✅ Test database setup complete');
  } catch (error) {
    console.error('❌ Test database setup failed:', error);
    throw error;
  }

  // Create test users for different scenarios
  try {
    await createTestUser({
      email: 'test-user-basic@cartpilot-e2e.com',
      password: 'TestPassword123!',
      profile: {
        preferred_name: 'Test User',
        dietary_restrictions: ['vegetarian'],
      }
    });

    await createTestUser({
      email: 'test-user-premium@cartpilot-e2e.com',
      password: 'TestPassword123!',
      profile: {
        preferred_name: 'Premium User',
        dietary_restrictions: ['gluten-free'],
        favorite_store_chains: ['Tesco', 'Sainsburys'],
      }
    });

    console.log('✅ Test users created successfully');
  } catch (error) {
    console.error('❌ Test user creation failed:', error);
    // Don't throw - tests can still run with manual auth
  }

  // Clear any existing browser data
  const browser = await chromium.launch();
  await clearBrowserCache(browser);
  await browser.close();

  console.log('✅ Global E2E test setup complete');
}

export default globalSetup;