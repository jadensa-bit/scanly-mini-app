import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDraftStatus() {
  const { data, error } = await supabase
    .from('scanly_sites')
    .select('user_id, handle, config, draft_config, created_at, updated_at')
    .limit(5);
  
  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data.length} sites\n`);
  
  for (const site of data) {
    console.log(`Handle: ${site.handle}`);
    console.log(`  Has config: ${!!site.config}`);
    console.log(`  Has draft_config: ${!!site.draft_config}`);
    console.log(`  Created: ${new Date(site.created_at).toISOString()}`);
    console.log(`  Updated: ${new Date(site.updated_at).toISOString()}`);
    console.log('');
  }
}

checkDraftStatus();
