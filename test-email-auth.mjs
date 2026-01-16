#!/usr/bin/env node

/**
 * Test Email Authentication Setup
 * Run: node test-email-auth.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load .env.local manually
const envFile = readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length) {
    env[key.trim()] = values.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function testEmailAuth() {
  console.log('\n🧪 Testing Email Authentication Setup\n');
  
  // Test 1: Check SMTP Configuration
  console.log('1️⃣  Checking SMTP configuration...');
  try {
    const testEmail = `test+${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    });

    if (error) {
      if (error.message.includes('SMTP') || error.message.includes('email')) {
        console.log('❌ SMTP not configured properly');
        console.log('   Error:', error.message);
        console.log('\n📝 Next steps:');
        console.log('   1. Go to: https://supabase.com/dashboard/project/djghvdbpbjzyxahusnri/settings/auth');
        console.log('   2. Scroll to "SMTP Settings"');
        console.log('   3. Enable Custom SMTP with Resend or Gmail');
      } else {
        console.log('⚠️  Error creating test user:', error.message);
      }
    } else {
      console.log('✅ SMTP configured correctly');
      console.log('   Test user created:', data.user.email);
      console.log('   Email confirmation:', data.user.email_confirmed_at ? 'Already confirmed' : 'Pending (email sent)');
      
      // Cleanup test user
      if (data.user) {
        await supabase.auth.admin.deleteUser(data.user.id);
        console.log('   (Test user cleaned up)');
      }
    }
  } catch (err) {
    console.log('❌ Test failed:', err.message);
  }

  // Test 2: Check Email Templates
  console.log('\n2️⃣  Checking email template configuration...');
  console.log('   ℹ️  Verify in dashboard:');
  console.log('   https://supabase.com/dashboard/project/djghvdbpbjzyxahusnri/settings/auth');
  console.log('   - Confirm signup template is enabled');
  console.log('   - Site URL is set correctly');
  console.log('   - Redirect URLs include your domain');

  // Test 3: Check callback route
  console.log('\n3️⃣  Checking auth callback route...');
  const fs = await import('fs');
  const callbackPath = './src/app/auth/callback/route.ts';
  if (fs.existsSync(callbackPath)) {
    console.log('   ✅ Auth callback route exists:', callbackPath);
  } else {
    console.log('   ❌ Auth callback route missing!');
    console.log('   Create:', callbackPath);
  }

  console.log('\n✨ Test complete!\n');
  console.log('📧 To test signup:');
  console.log('   1. npm run dev');
  console.log('   2. Go to http://localhost:3000/signup');
  console.log('   3. Create account with real email');
  console.log('   4. Check inbox for confirmation email\n');
}

testEmailAuth().catch(console.error);
