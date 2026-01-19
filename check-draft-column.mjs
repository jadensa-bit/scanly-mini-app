import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function addDraftColumn() {
  console.log('📝 Adding draft_config column to scanly_sites table...\n');
  
  try {
    // First check if column already exists by trying to select it
    const { data: testData, error: testError } = await supabase
      .from('scanly_sites')
      .select('draft_config')
      .limit(1);
    
    if (!testError) {
      console.log('✅ Column draft_config already exists!');
      return;
    }
    
    if (testError && !testError.message.includes('column') && !testError.message.includes('does not exist')) {
      console.error('❌ Unexpected error:', testError.message);
      return;
    }
    
    console.log('ℹ️ Column does not exist yet, attempting to add it...\n');
    
    // Since we can't execute raw SQL via client, we'll need to use Supabase Dashboard
    // or API to add the column. For now, let's just report the SQL to run.
    console.log('⚠️ Cannot execute DDL statements via Supabase JS client.');
    console.log('📋 Please run this SQL in your Supabase SQL Editor:\n');
    console.log('ALTER TABLE scanly_sites ADD COLUMN IF NOT EXISTS draft_config JSONB DEFAULT NULL;');
    console.log('\nOr use the Supabase Dashboard → SQL Editor to execute:');
    console.log('  /workspaces/scanly-mini-app/supabase/migrations/07_add_draft_config.sql');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

addDraftColumn().catch(console.error);
