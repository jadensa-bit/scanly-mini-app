import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function testUpload() {
  console.log('🧪 Testing uploads bucket...\n');

  try {
    // Test 1: Check bucket exists and is public
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError.message);
      return;
    }

    const uploadsBucket = buckets?.find(b => b.name === 'uploads');
    
    if (!uploadsBucket) {
      console.error('❌ Uploads bucket does not exist!');
      console.log('Run: node setup-storage-bucket.mjs');
      return;
    }

    console.log('✅ Bucket exists');
    console.log(`   Public: ${uploadsBucket.public ? '✅' : '❌'}`);
    console.log(`   File size limit: ${uploadsBucket.file_size_limit ? (uploadsBucket.file_size_limit / 1024 / 1024) + 'MB' : 'not set'}`);
    
    if (!uploadsBucket.public) {
      console.log('\n⚠️  WARNING: Bucket is NOT public!');
      console.log('   Users will not be able to view uploaded images.');
      console.log('   Fix: Dashboard → Storage → uploads → Settings → Make bucket public');
    }

    // Test 2: Try to upload a test file
    console.log('\n🔧 Testing upload...');
    const testData = Buffer.from('test-image-data');
    const testFileName = `test-${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(testFileName, testData, {
        contentType: 'text/plain',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError.message);
      if (uploadError.message.includes('policies')) {
        console.log('\n⚠️  Storage policies are not configured!');
        console.log('   Run this SQL in your Supabase SQL Editor:\n');
        console.log('   -- Allow public read');
        console.log('   CREATE POLICY "Public read" ON storage.objects');
        console.log('   FOR SELECT USING (bucket_id = \'uploads\');\n');
        console.log('   -- Allow service role to manage');
        console.log('   CREATE POLICY "Service role manage" ON storage.objects');
        console.log('   FOR ALL USING (bucket_id = \'uploads\');');
      }
      return;
    }

    console.log('✅ Upload successful!');

    // Test 3: Try to get public URL
    const { data: urlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(testFileName);

    console.log('✅ Public URL generated:', urlData.publicUrl);

    // Test 4: Clean up test file
    const { error: deleteError } = await supabase.storage
      .from('uploads')
      .remove([testFileName]);

    if (!deleteError) {
      console.log('✅ Test file cleaned up');
    }

    console.log('\n✨ All tests passed! Upload functionality is working.');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testUpload();
