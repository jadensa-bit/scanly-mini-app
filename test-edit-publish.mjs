import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function testEditAndPublish() {
  console.log('🧪 Testing Edit and Publish Flow\n');
  
  // Use an existing site from the database
  const { data: sites } = await supabase
    .from('scanly_sites')
    .select('handle, user_id')
    .limit(1);
  
  if (!sites || sites.length === 0) {
    console.log('❌ No sites found in database. Create one first.');
    return;
  }
  
  const testHandle = sites[0].handle;
  const userId = sites[0].user_id;
  
  console.log(`📋 Using existing site: ${testHandle}\n`);
  
  try {
    // Step 1: Get current state
    const { data: before } = await supabase
      .from('scanly_sites')
      .select('config, draft_config')
      .eq('handle', testHandle)
      .single();
    
    console.log('1️⃣ Current state:');
    console.log('   config brandName:', before?.config?.brandName);
    console.log('   draft_config:', before?.draft_config ? 'EXISTS' : 'null');
    
    // Step 2: Simulate an edit (save to draft_config)
    console.log('\n2️⃣ Simulating edit (updating draft_config)...');
    const editedConfig = {
      ...before.config,
      brandName: 'EDITED ' + (before.config?.brandName || 'Brand'),
      items: [
        ...(before.config?.items || []),
        { title: 'DRAFT TEST ITEM', price: '$999' }
      ]
    };
    
    const { error: editError } = await supabase
      .from('scanly_sites')
      .update({ draft_config: editedConfig })
      .eq('handle', testHandle);
    
    if (editError) {
      console.error('❌ Failed to save draft:', editError.message);
      return;
    }
    console.log('✅ Draft saved');
    
    // Step 3: Verify draft saved but config unchanged
    const { data: afterEdit } = await supabase
      .from('scanly_sites')
      .select('config, draft_config')
      .eq('handle', testHandle)
      .single();
    
    console.log('\n3️⃣ After edit:');
    console.log('   config brandName:', afterEdit?.config?.brandName, '(should be unchanged)');
    console.log('   draft_config brandName:', afterEdit?.draft_config?.brandName, '(should have EDITED)');
    console.log('   config items:', afterEdit?.config?.items?.length || 0);
    console.log('   draft_config items:', afterEdit?.draft_config?.items?.length || 0);
    
    // Step 4: Call the publish API
    console.log('\n4️⃣ Publishing via API...');
    const publishRes = await fetch(`http://localhost:3000/api/site/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle: testHandle })
    });
    
    const publishData = await publishRes.json();
    
    if (!publishRes.ok) {
      console.error('❌ Publish failed:', publishData.error);
      return;
    }
    console.log('✅ Published successfully');
    
    // Step 5: Verify draft was copied to config
    const { data: afterPublish } = await supabase
      .from('scanly_sites')
      .select('config, draft_config')
      .eq('handle', testHandle)
      .single();
    
    console.log('\n5️⃣ After publish:');
    console.log('   config brandName:', afterPublish?.config?.brandName, '(should have EDITED)');
    console.log('   draft_config:', afterPublish?.draft_config ? 'EXISTS (❌)' : 'null (✅)');
    console.log('   config items:', afterPublish?.config?.items?.length || 0, '(should match draft count)');
    
    if (afterPublish?.config?.brandName?.includes('EDITED') && !afterPublish?.draft_config) {
      console.log('\n✅ TEST PASSED! Edits published correctly to live site!');
    } else {
      console.log('\n❌ TEST FAILED!');
    }
    
    // Step 6: Restore original state
    console.log('\n6️⃣ Restoring original state...');
    await supabase
      .from('scanly_sites')
      .update({ 
        config: before.config,
        draft_config: null
      })
      .eq('handle', testHandle);
    console.log('✅ Restored');
    
  } catch (err) {
    console.error('❌ Test error:', err.message);
  }
}

testEditAndPublish().catch(console.error);
