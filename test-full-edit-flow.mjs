import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testFullEditFlow() {
  console.log("🧪 Testing full edit → save → publish flow\n");
  
  // 1. Check current state
  const handle = 'capssss-y';
  const { data: before } = await supabase
    .from('scanly_sites')
    .select('config, draft_config')
    .eq('handle', handle)
    .single();
  
  console.log('📋 BEFORE state:');
  console.log(`  Has config: ${!!before.config}`);
  console.log(`  Has draft_config: ${!!before.draft_config}`);
  console.log(`  Config brandName: ${before.config?.brandName}`);
  console.log(`  Draft brandName: ${before.draft_config?.brandName}`);
  console.log('');
  
  // 2. Simulate publishing (what the "Go live" button should do)
  console.log('🚀 Simulating publish...');
  const publishPayload = before.draft_config 
    ? { config: before.draft_config, draft_config: null, published_at: new Date().toISOString() }
    : { published_at: new Date().toISOString() };
  
  const { error: publishError } = await supabase
    .from('scanly_sites')
    .update(publishPayload)
    .eq('handle', handle);
  
  if (publishError) {
    console.error('❌ Publish failed:', publishError);
    return;
  }
  
  console.log('✅ Published successfully\n');
  
  // 3. Check result
  const { data: after } = await supabase
    .from('scanly_sites')
    .select('config, draft_config')
    .eq('handle', handle)
    .single();
  
  console.log('📋 AFTER state:');
  console.log(`  Has config: ${!!after.config}`);
  console.log(`  Has draft_config: ${!!after.draft_config}`);
  console.log(`  Config brandName: ${after.config?.brandName}`);
  console.log(`  Draft brandName: ${after.draft_config?.brandName || 'N/A'}`);
  console.log('');
  
  if (before.draft_config && after.config.brandName === before.draft_config.brandName) {
    console.log('✅ SUCCESS: Draft changes were published to config!');
  } else {
    console.log('❌ FAIL: Draft changes were NOT published');
  }
}

testFullEditFlow();
