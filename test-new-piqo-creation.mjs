import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

console.log('🧪 Testing new piqo creation flow...\n');

async function testNewPiqoCreation() {
  try {
    // Get a test user
    const { data: users } = await supabase.auth.admin.listUsers();
    const testUser = users?.users?.[0];
    
    if (!testUser) {
      console.error('❌ No users found in database');
      return;
    }
    
    console.log(`✅ Using test user: ${testUser.email} (${testUser.id})\n`);
    
    const testHandle = `test-piqo-${Date.now()}`;
    const testConfig = {
      handle: testHandle,
      brandName: 'Test Piqo',
      mode: 'products',
      items: [{ title: 'Test Item', price: '$10' }],
      active: true,
      createdAt: Date.now()
    };
    
    // Simulate what the API does
    console.log('1️⃣ Creating new piqo via UPSERT...');
    const { data: newSite, error: createError } = await supabase
      .from('sites')
      .upsert({
        handle: testHandle,
        config: testConfig,
        user_id: testUser.id,
        owner_email: testUser.email,
        updated_at: new Date().toISOString()
      }, { onConflict: 'handle' })
      .select('handle, user_id')
      .single();
    
    if (createError) {
      console.error('❌ Failed to create piqo:', createError.message);
      return;
    }
    
    console.log('✅ Piqo created:', { handle: newSite.handle, user_id: newSite.user_id });
    
    // Verify it's queryable by user_id
    console.log('\n2️⃣ Querying sites by user_id (what dashboard does)...');
    const { data: userSites, error: queryError } = await supabase
      .from('sites')
      .select('handle, user_id, config')
      .eq('user_id', testUser.id);
    
    if (queryError) {
      console.error('❌ Failed to query sites:', queryError.message);
      return;
    }
    
    console.log(`✅ Found ${userSites.length} sites for user ${testUser.email}`);
    const foundTestSite = userSites.find(s => s.handle === testHandle);
    
    if (foundTestSite) {
      console.log('✅ Test piqo appears in user\'s sites!');
      console.log(`   Handle: ${foundTestSite.handle}`);
      console.log(`   User ID: ${foundTestSite.user_id}`);
      console.log(`   Brand: ${foundTestSite.config?.brandName}`);
    } else {
      console.error('❌ Test piqo NOT found in user\'s sites!');
      console.log('   Found handles:', userSites.map(s => s.handle).join(', '));
    }
    
    // Clean up
    console.log('\n3️⃣ Cleaning up test piqo...');
    await supabase.from('sites').delete().eq('handle', testHandle);
    console.log('✅ Cleanup complete\n');
    
    if (foundTestSite) {
      console.log('🎉 TEST PASSED: New piqos will appear in dashboard!');
    } else {
      console.log('❌ TEST FAILED: New piqos will NOT appear in dashboard');
      console.log('\n🔍 Debugging info:');
      console.log('   - Check if user_id is being set correctly in /api/site POST');
      console.log('   - Check if dashboard is querying the correct table');
      console.log('   - Check browser console for errors');
    }
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
  }
}

testNewPiqoCreation();
