import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function checkAndAddDraftColumn() {
  console.log('📝 Checking draft_config column on sites table...\n');
  
  try {
    // Test if column exists by trying to select it
    const { data: testData, error: testError } = await supabase
      .from('sites')
      .select('draft_config')
      .limit(1);
    
    if (!testError) {
      console.log('✅ Column draft_config already exists on sites table!');
      console.log('Sample data:', testData);
      return;
    }
    
    if (testError) {
      console.log('❌ Error checking column:', testError.message);
      console.log('\n📋 The sites table needs the draft_config column.');
      console.log('\n🔧 To fix this, run this SQL in your Supabase SQL Editor:');
      console.log('\nALTER TABLE sites ADD COLUMN IF NOT EXISTS draft_config JSONB DEFAULT NULL;');
      console.log('COMMENT ON COLUMN sites.draft_config IS \'Stores draft changes that have not been published yet.\';');
      console.log('\nOr use Supabase CLI:');
      console.log('  supabase db push');
      return;
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

checkAndAddDraftColumn();
