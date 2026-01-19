import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    const sql = `
      -- Add draft_config column to sites table
      ALTER TABLE sites 
      ADD COLUMN IF NOT EXISTS draft_config JSONB DEFAULT NULL;

      -- Add comment
      COMMENT ON COLUMN sites.draft_config IS 'Stores draft changes that have not been published yet. When null, no draft exists and config is the current state.';
    `;

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    }

    console.log('✅ Migration successful - draft_config column added to sites table');
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

runMigration();
