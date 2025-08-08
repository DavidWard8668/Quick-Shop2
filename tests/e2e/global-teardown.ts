import { FullConfig } from '@playwright/test';
import { cleanupTestDatabase } from './utils/database-setup';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global E2E test teardown...');

  try {
    await cleanupTestDatabase();
    console.log('✅ Test database cleanup complete');
  } catch (error) {
    console.error('❌ Test database cleanup failed:', error);
    // Don't throw - this shouldn't fail the tests
  }

  console.log('✅ Global E2E test teardown complete');
}

export default globalTeardown;