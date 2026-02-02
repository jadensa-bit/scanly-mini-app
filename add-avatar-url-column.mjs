import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

console.log('🚀 Adding avatar_url column to profiles table...\n');

async function addAvatarUrlColumn() {
  try {
    // Check if column exists first
    const { data: existingProfiles, error: checkError } = await supabase
      .from('profiles')
      .select('id, avatar_url')
      .limit(1);

    if (!checkError) {
      console.log('✅ avatar_url column already exists!');
      console.log('   Test query successful\n');
      return;
    }

    // If error contains "column...does not exist", add the column
    if (checkError.message.includes('avatar_url') && checkError.message.includes('does not exist')) {
      console.log('📝 Column does not exist. Adding avatar_url column...\n');
      
      // Use raw SQL via postgrest
      const { error: alterError } = await supabase.rpc('exec', {
        sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;'
      });

      if (alterError) {
        console.error('⚠️  RPC method failed, trying direct SQL execution...\n');
        console.log('📋 Please run this SQL manually in Supabase Dashboard:\n');
        console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;\n');
        console.log('🔗 Go to: https://supabase.com/dashboard → SQL Editor → New Query\n');
        return;
      }

      console.log('✅ avatar_url column added successfully!\n');
      
      // Verify the column was added
      const { data: verifyData, error: verifyError } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .limit(1);

      if (!verifyError) {
        console.log('✅ Verification successful - column is queryable\n');
      }
    } else {
      console.error('❌ Unexpected error:', checkError.message);
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n📋 Please run this SQL manually in Supabase Dashboard:\n');
    console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;\n');
  }
}

addAvatarUrlColumn();
