#!/usr/bin/env node
/**
 * Test script to diagnose Stripe Connect issues
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n🔍 Testing Stripe Connect Configuration...\n');

// Test 1: Environment Variables
console.log('1️⃣  Checking environment variables:');
console.log(`   STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY ? '✅ Set (' + STRIPE_SECRET_KEY.slice(0, 7) + '...)' : '❌ MISSING'}`);
console.log(`   SUPABASE_URL: ${SUPABASE_URL ? '✅ Set' : '❌ MISSING'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ MISSING'}`);

if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.log('\n❌ Missing required environment variables!');
  process.exit(1);
}

// Test 2: Stripe Initialization
console.log('\n2️⃣  Testing Stripe SDK:');
let stripe;
try {
  stripe = new Stripe(STRIPE_SECRET_KEY);
  console.log('   ✅ Stripe SDK initialized');
} catch (e) {
  console.log('   ❌ Failed to initialize Stripe:', e.message);
  process.exit(1);
}

// Test 3: Stripe Account Creation
console.log('\n3️⃣  Testing Stripe Express Account creation:');
try {
  const testAccount = await stripe.accounts.create({
    type: 'express',
    email: 'test@example.com',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    metadata: { handle: 'test-shop-' + Date.now() },
  });
  console.log('   ✅ Created test account:', testAccount.id);
  
  // Clean up
  await stripe.accounts.del(testAccount.id);
  console.log('   ✅ Cleaned up test account');
} catch (e) {
  console.log('   ❌ Failed to create account:', e.message);
  if (e.type === 'StripeInvalidRequestError') {
    console.log('   💡 This might be a Stripe API key issue. Check:');
    console.log('      - Is your key valid and not expired?');
    console.log('      - Does your Stripe account have Express Connect enabled?');
  }
  process.exit(1);
}

// Test 4: Supabase Connection
console.log('\n4️⃣  Testing Supabase connection:');
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
try {
  const { data, error } = await supabase.from('sites').select('handle').limit(1);
  if (error) throw error;
  console.log('   ✅ Supabase connection successful');
} catch (e) {
  console.log('   ❌ Supabase error:', e.message);
  process.exit(1);
}

// Test 5: Account Link Creation
console.log('\n5️⃣  Testing Account Link generation:');
try {
  const testAccount = await stripe.accounts.create({
    type: 'express',
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
  
  const link = await stripe.accountLinks.create({
    account: testAccount.id,
    refresh_url: 'https://example.com/refresh',
    return_url: 'https://example.com/return',
    type: 'account_onboarding',
  });
  
  console.log('   ✅ Account link created:', link.url.slice(0, 50) + '...');
  
  // Clean up
  await stripe.accounts.del(testAccount.id);
  console.log('   ✅ Cleaned up test account');
} catch (e) {
  console.log('   ❌ Failed to create account link:', e.message);
  process.exit(1);
}

console.log('\n✅ All tests passed! Stripe Connect is configured correctly.\n');
console.log('💡 If you still see errors in your app:');
console.log('   1. Make sure .env.local is loaded (restart dev server)');
console.log('   2. Check browser console for client-side errors');
console.log('   3. Check terminal logs when triggering Stripe Connect\n');
