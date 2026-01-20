import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

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

async function verifyUploadSetup() {
  console.log('🔍 Verifying upload configuration...\n');

  let allChecksPassed = true;

  // Check 1: Bucket exists
  console.log('1️⃣  Checking if uploads bucket exists...');
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('   ❌ Failed to list buckets:', listError.message);
    allChecksPassed = false;
  } else {
    const uploadsBucket = buckets?.find(b => b.name === 'uploads');
    
    if (!uploadsBucket) {
      console.error('   ❌ Uploads bucket does NOT exist!');
      console.log('   Fix: Run `node setup-storage-bucket.mjs`');
      allChecksPassed = false;
    } else {
      console.log('   ✅ Uploads bucket exists');
      
      // Check 2: Bucket is public
      console.log('\n2️⃣  Checking if bucket is public...');
      if (!uploadsBucket.public) {
        console.error('   ❌ Bucket is NOT public!');
        console.log('   Fix: Dashboard → Storage → uploads → Settings → Make public');
        allChecksPassed = false;
      } else {
        console.log('   ✅ Bucket is public');
      }
      
      // Check 3: File size limit
      console.log('\n3️⃣  Checking file size limit...');
      const limitMB = uploadsBucket.file_size_limit ? (uploadsBucket.file_size_limit / 1024 / 1024) : 0;
      if (!uploadsBucket.file_size_limit || limitMB < 5) {
        console.warn('   ⚠️  File size limit:', limitMB ? `${limitMB}MB` : 'not set');
        console.log('   Recommended: 5MB');
      } else {
        console.log('   ✅ File size limit:', `${limitMB}MB`);
      }
    }
  }

  // Check 4: Test upload
  console.log('\n4️⃣  Testing upload functionality...');
  try {
    const testData = Buffer.from('test-image-data');
    const testFileName = `test-${Date.now()}.jpg`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(testFileName, testData, {
        contentType: 'image/jpeg',
        upsert: false
      });

    if (uploadError) {
      console.error('   ❌ Upload test failed:', uploadError.message);
      if (uploadError.message.includes('policies') || uploadError.message.includes('permission')) {
        console.log('   ⚠️  Storage policies may not be configured!');
        console.log('   Fix: Apply policies from supabase/migrations/11_create_uploads_bucket.sql');
      }
      allChecksPassed = false;
    } else {
      console.log('   ✅ Upload successful');
      
      // Check 5: Public URL access
      console.log('\n5️⃣  Testing public URL generation...');
      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(testFileName);

      if (!urlData.publicUrl) {
        console.error('   ❌ Failed to generate public URL');
        allChecksPassed = false;
      } else {
        console.log('   ✅ Public URL:', urlData.publicUrl);
        
        // Test if URL is accessible
        try {
          const response = await fetch(urlData.publicUrl);
          if (response.ok) {
            console.log('   ✅ Public URL is accessible');
          } else {
            console.error('   ❌ Public URL returned status:', response.status);
            allChecksPassed = false;
          }
        } catch (fetchErr) {
          console.error('   ❌ Could not access public URL:', fetchErr.message);
          allChecksPassed = false;
        }
      }
      
      // Cleanup test file
      await supabase.storage.from('uploads').remove([testFileName]);
      console.log('   🧹 Test file cleaned up');
    }
  } catch (err) {
    console.error('   ❌ Unexpected error during upload test:', err);
    allChecksPassed = false;
  }

  // Check 6: Environment variables
  console.log('\n6️⃣  Checking environment variables...');
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SUPABASE_URL'
  ];
  
  let missingVars = [];
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }
  
  if (missingVars.length > 0) {
    console.error('   ❌ Missing environment variables:', missingVars.join(', '));
    console.log('   Fix: Add these to .env.local');
    allChecksPassed = false;
  } else {
    console.log('   ✅ All required environment variables present');
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  if (allChecksPassed) {
    console.log('✅ All checks passed! Upload functionality is ready.');
    console.log('\n📸 Users can now upload:');
    console.log('   • Brand logos');
    console.log('   • Product photos');
    console.log('   • Profile pictures');
    console.log('   • Staff photos');
    console.log('   • Background images');
  } else {
    console.log('❌ Some checks failed. Please fix the issues above.');
    console.log('\n📋 Quick fix checklist:');
    console.log('   1. Run: node setup-storage-bucket.mjs');
    console.log('   2. Make bucket public in Supabase Dashboard');
    console.log('   3. Apply storage policies from supabase/migrations/11_create_uploads_bucket.sql');
    console.log('   4. Verify environment variables in .env.local');
  }
  console.log('='.repeat(60) + '\n');
}

verifyUploadSetup();
