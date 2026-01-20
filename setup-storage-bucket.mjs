import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function setupUploads() {
  console.log('🚀 Setting up uploads storage bucket...\n');

  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError.message);
      console.log('\n📋 Please create the bucket manually in Supabase Dashboard');
      return;
    }

    const uploadsExists = buckets?.some(b => b.name === 'uploads');

    if (uploadsExists) {
      console.log('✅ Uploads bucket already exists!');
      
      // Verify it's public
      const uploadsBucket = buckets.find(b => b.name === 'uploads');
      if (!uploadsBucket.public) {
        console.log('⚠️  Warning: uploads bucket exists but is not public');
        console.log('   Please make it public in Supabase Dashboard → Storage → uploads → Settings');
      }
    } else {
      // Create the bucket
      console.log('📦 Creating uploads bucket...');
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('uploads', {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
      });

      if (createError) {
        console.error('❌ Failed to create bucket:', createError.message);
        console.log('\n📋 Please create it manually:');
        console.log('1. Go to Supabase Dashboard → Storage');
        console.log('2. Click "New bucket"');
        console.log('3. Name: uploads');
        console.log('4. Check "Public bucket"');
        console.log('5. Set file size limit: 5MB');
        console.log('6. Add allowed MIME types: image/jpeg, image/png, image/gif, image/webp, image/svg+xml');
        return;
      }

      console.log('✅ Uploads bucket created successfully!');
    }

    console.log('\n📸 Uploads bucket is configured for:');
    console.log('   • Brand logos');
    console.log('   • Product photos');  
    console.log('   • Profile pictures');
    console.log('   • Staff photos');

    console.log('\n⚙️  Storage policies:');
    console.log('   The bucket needs the following policies (set in Dashboard → Storage → uploads → Policies):');
    console.log('   1. SELECT: Allow public read access');
    console.log('   2. INSERT: Allow authenticated users to upload');
    console.log('   3. UPDATE: Allow authenticated users to update');
    console.log('   4. DELETE: Allow authenticated users to delete');
    
    console.log('\n💡 To set up policies:');
    console.log('   Go to Dashboard → Storage → uploads → Policies → New Policy');
    console.log('   Or run the SQL from: supabase/migrations/11_create_uploads_bucket.sql');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

setupUploads();
