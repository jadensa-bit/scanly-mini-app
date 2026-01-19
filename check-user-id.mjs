import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

console.log('🔍 Checking sites table for user_id population...\n');

async function checkSites() {
  try {
    // Check sites table
    const { data: sites, error } = await supabase
      .from('sites')
      .select('handle, user_id, owner_email, updated_at')
      .order('updated_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Error querying sites:', error.message);
      return;
    }
    
    console.log(`📊 Found ${sites.length} sites (showing last 10):\n`);
    
    const withUserId = sites.filter(s => s.user_id);
    const withoutUserId = sites.filter(s => !s.user_id);
    
    console.log(`✅ Sites WITH user_id: ${withUserId.length}`);
    console.log(`⚠️  Sites WITHOUT user_id: ${withoutUserId.length}\n`);
    
    if (withoutUserId.length > 0) {
      console.log('⚠️  Sites missing user_id:');
      withoutUserId.forEach(s => {
        console.log(`   - ${s.handle} (email: ${s.owner_email || 'none'})`);
      });
      
      console.log('\n💡 To fix existing sites, run this SQL in Supabase Dashboard:');
      console.log('\nUPDATE sites');
      console.log('SET user_id = (SELECT id FROM auth.users WHERE email = sites.owner_email)');
      console.log('WHERE user_id IS NULL AND owner_email IS NOT NULL;');
      console.log('\n📍 Go to: https://supabase.com/dashboard > SQL Editor\n');
    }
    
    if (withUserId.length > 0) {
      console.log('\n✅ Sites with user_id (will show in dashboard):');
      withUserId.forEach(s => {
        console.log(`   - ${s.handle} (user: ${s.user_id.substring(0, 8)}...)`);
      });
    }
    
    // Check scanly_sites table too
    const { data: scanlySites } = await supabase
      .from('scanly_sites')
      .select('handle, user_id, owner_email')
      .limit(5);
    
    if (scanlySites && scanlySites.length > 0) {
      console.log(`\n📊 scanly_sites table has ${scanlySites.length} sites`);
      const scWithUserId = scanlySites.filter(s => s.user_id);
      console.log(`   ✅ ${scWithUserId.length} with user_id`);
      console.log(`   ⚠️  ${scanlySites.length - scWithUserId.length} without user_id`);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkSites();
