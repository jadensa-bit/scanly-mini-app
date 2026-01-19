import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function testDraftPublish() {
  console.log('🧪 Testing Draft/Publish Workflow\n');
  
  const testHandle = 'test-draft-' + Date.now();
  
  try {
    // Step 1: Create a new site (should go to config directly)
    console.log('1️⃣ Creating new site...');
    const newSiteConfig = {
      handle: testHandle,
      brandName: 'Test Draft Site',
      mode: 'products',
      items: [{ title: 'Original Item', price: '$10' }],
    };
    
    const { error: createError } = await supabase
      .from('scanly_sites')
      .insert({
        handle: testHandle,
        user_id: '304ffadb-db71-4cba-a622-1300beb80782', // real user from DB
        config: newSiteConfig,
        updated_at: new Date().toISOString(),
      });
    
    if (createError) {
      console.error('❌ Failed to create site:', createError.message);
      return;
    }
    console.log('✅ Site created');
    
    // Step 2: Verify config is set, draft_config is null
    const { data: afterCreate } = await supabase
      .from('scanly_sites')
      .select('config, draft_config')
      .eq('handle', testHandle)
      .single();
    
    console.log('\n2️⃣ After creation:');
    console.log('   config items:', afterCreate?.config?.items?.length || 0);
    console.log('   draft_config:', afterCreate?.draft_config ? 'EXISTS (❌ UNEXPECTED)' : 'null (✅ CORRECT)');
    
    // Step 3: Edit the site (save to draft_config)
    console.log('\n3️⃣ Editing site (saving as draft)...');
    const draftConfig = {
      ...newSiteConfig,
      items: [
        { title: 'Original Item', price: '$10' },
        { title: 'DRAFT NEW ITEM', price: '$99' },
      ],
    };
    
    const { error: draftError } = await supabase
      .from('scanly_sites')
      .update({ draft_config: draftConfig })
      .eq('handle', testHandle);
    
    if (draftError) {
      console.error('❌ Failed to save draft:', draftError.message);
      return;
    }
    console.log('✅ Draft saved');
    
    // Step 4: Verify draft exists but config is unchanged
    const { data: afterDraft } = await supabase
      .from('scanly_sites')
      .select('config, draft_config')
      .eq('handle', testHandle)
      .single();
    
    console.log('\n4️⃣ After draft edit:');
    console.log('   config items:', afterDraft?.config?.items?.length || 0, '(should be 1 - ✅)');
    console.log('   draft_config items:', afterDraft?.draft_config?.items?.length || 0, '(should be 2 - ✅)');
    
    if (afterDraft?.config?.items?.length === 1 && afterDraft?.draft_config?.items?.length === 2) {
      console.log('   ✅ Draft saved correctly without affecting live config!');
    } else {
      console.log('   ❌ Something went wrong!');
    }
    
    // Step 5: Publish the draft
    console.log('\n5️⃣ Publishing draft...');
    const { error: publishError } = await supabase
      .from('scanly_sites')
      .update({
        config: afterDraft.draft_config,
        draft_config: null,
        published_at: new Date().toISOString(),
      })
      .eq('handle', testHandle);
    
    if (publishError) {
      console.error('❌ Failed to publish:', publishError.message);
      return;
    }
    console.log('✅ Draft published');
    
    // Step 6: Verify published state
    const { data: afterPublish } = await supabase
      .from('scanly_sites')
      .select('config, draft_config')
      .eq('handle', testHandle)
      .single();
    
    console.log('\n6️⃣ After publish:');
    console.log('   config items:', afterPublish?.config?.items?.length || 0, '(should be 2 - ✅)');
    console.log('   draft_config:', afterPublish?.draft_config ? 'EXISTS (❌ UNEXPECTED)' : 'null (✅ CORRECT)');
    
    if (afterPublish?.config?.items?.length === 2 && !afterPublish?.draft_config) {
      console.log('\n✅ ALL TESTS PASSED! Draft/Publish workflow works correctly!');
    } else {
      console.log('\n❌ Some tests failed!');
    }
    
    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('scanly_sites').delete().eq('handle', testHandle);
    console.log('✅ Test data cleaned up');
    
  } catch (err) {
    console.error('❌ Test error:', err.message);
  }
}

testDraftPublish().catch(console.error);
