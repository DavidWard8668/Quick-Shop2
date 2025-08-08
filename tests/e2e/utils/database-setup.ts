import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

// Create admin client for test setup
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create regular client for user operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface TestUser {
  email: string;
  password: string;
  profile?: {
    preferred_name?: string;
    dietary_restrictions?: string[];
    favorite_store_chains?: string[];
    avatar_url?: string;
  };
}

export async function setupTestDatabase() {
  console.log('Setting up test database...');
  
  // Create test data tables if they don't exist
  const testStores = [
    {
      id: 'test-store-1',
      name: 'Test Tesco Metro',
      chain: 'Tesco',
      address: '123 Test Street, Test City',
      postcode: 'TE1 1ST',
      lat: '51.5074',
      lng: '-0.1278',
      phone: '01234567890',
      opening_hours: JSON.stringify({
        monday: { open: '07:00', close: '22:00' },
        tuesday: { open: '07:00', close: '22:00' },
        wednesday: { open: '07:00', close: '22:00' },
        thursday: { open: '07:00', close: '22:00' },
        friday: { open: '07:00', close: '22:00' },
        saturday: { open: '08:00', close: '22:00' },
        sunday: { open: '10:00', close: '16:00' }
      })
    },
    {
      id: 'test-store-2',
      name: 'Test Sainsburys Local',
      chain: 'Sainsburys',
      address: '456 Test Avenue, Test City',
      postcode: 'TE2 2ST',
      lat: '51.5184',
      lng: '-0.1378',
      phone: '01234567891',
      opening_hours: JSON.stringify({
        monday: { open: '06:00', close: '23:00' },
        tuesday: { open: '06:00', close: '23:00' },
        wednesday: { open: '06:00', close: '23:00' },
        thursday: { open: '06:00', close: '23:00' },
        friday: { open: '06:00', close: '23:00' },
        saturday: { open: '07:00', close: '23:00' },
        sunday: { open: '10:00', close: '17:00' }
      })
    }
  ];

  // Insert test stores
  for (const store of testStores) {
    try {
      const { error } = await supabaseAdmin
        .from('stores')
        .upsert([store], { onConflict: 'id' });
      
      if (error) {
        console.warn(`Warning: Could not insert test store ${store.name}:`, error.message);
      }
    } catch (err) {
      console.warn(`Warning: Could not insert test store ${store.name}:`, err);
    }
  }

  // Create test product locations
  const testProductLocations = [
    {
      store_id: 'test-store-1',
      product_name: 'Milk',
      aisle: '3',
      section: 'Dairy',
      verified: true,
      verification_count: 5,
      price: 1.50,
      created_by: 'test-system'
    },
    {
      store_id: 'test-store-1',
      product_name: 'Bread',
      aisle: '1',
      section: 'Bakery',
      verified: true,
      verification_count: 8,
      price: 1.20,
      created_by: 'test-system'
    },
    {
      store_id: 'test-store-2',
      product_name: 'Bananas',
      aisle: '1',
      section: 'Produce',
      verified: true,
      verification_count: 12,
      price: 1.10,
      created_by: 'test-system'
    }
  ];

  // Insert test product locations
  for (const location of testProductLocations) {
    try {
      const { error } = await supabaseAdmin
        .from('product_locations')
        .upsert([location], { onConflict: 'store_id,product_name' });
      
      if (error) {
        console.warn(`Warning: Could not insert test product location:`, error.message);
      }
    } catch (err) {
      console.warn(`Warning: Could not insert test product location:`, err);
    }
  }
}

export async function createTestUser(userData: TestUser) {
  // Create the user account
  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log(`Test user ${userData.email} already exists`);
      return;
    }
    throw authError;
  }

  if (!authUser.user) {
    throw new Error('Failed to create test user');
  }

  // Create user profile if provided
  if (userData.profile) {
    const profileData = {
      id: authUser.user.id,
      email: userData.email,
      ...userData.profile,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert([profileData], { onConflict: 'id' });

    if (profileError) {
      console.warn(`Warning: Could not create profile for ${userData.email}:`, profileError.message);
    }
  }

  console.log(`✅ Created test user: ${userData.email}`);
}

export async function cleanupTestDatabase() {
  console.log('Cleaning up test database...');
  
  try {
    // Clean up test users
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    
    if (users?.users) {
      for (const user of users.users) {
        if (user.email?.includes('@cartpilot-e2e.com')) {
          await supabaseAdmin.auth.admin.deleteUser(user.id);
          console.log(`Deleted test user: ${user.email}`);
        }
      }
    }

    // Clean up test data from tables
    const tablesToClean = [
      'user_profiles',
      'favorite_stores',
      'product_locations',
      'store_mappings',
      'gamification_stats',
      'issue_reports'
    ];

    for (const table of tablesToClean) {
      try {
        // Delete records created by test users or with test prefixes
        const { error } = await supabaseAdmin
          .from(table)
          .delete()
          .or('created_by.like.%test%,email.like.%@cartpilot-e2e.com%');
        
        if (error && !error.message.includes('does not exist')) {
          console.warn(`Warning: Could not clean table ${table}:`, error.message);
        }
      } catch (err) {
        console.warn(`Warning: Could not clean table ${table}:`, err);
      }
    }

    // Remove test stores
    const { error: storesError } = await supabaseAdmin
      .from('stores')
      .delete()
      .in('id', ['test-store-1', 'test-store-2']);
    
    if (storesError && !storesError.message.includes('does not exist')) {
      console.warn('Warning: Could not clean test stores:', storesError.message);
    }

  } catch (error) {
    console.error('Error during database cleanup:', error);
  }
}