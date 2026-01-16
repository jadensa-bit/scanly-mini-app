#!/usr/bin/env node
/**
 * Comprehensive platform test for piqo
 */

const BASE_URL = 'http://localhost:3000';

console.log('\n🧪 Testing piqo Platform\n');
console.log('=' .repeat(60));

// Test 1: Check server is running
console.log('\n1️⃣  Checking server availability...');
try {
  const response = await fetch(BASE_URL);
  if (response.ok) {
    console.log('   ✅ Server is running on', BASE_URL);
  } else {
    console.log('   ❌ Server responded with status:', response.status);
    process.exit(1);
  }
} catch (e) {
  console.log('   ❌ Server is not running. Start with: npm run dev');
  process.exit(1);
}

// Test 2: Test signup API
console.log('\n2️⃣  Testing signup API...');
const testEmail = `test${Date.now()}@example.com`;
const testPassword = 'testpass123';
const testName = 'Test User';

try {
  const response = await fetch(`${BASE_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: testPassword,
      name: testName,
    }),
  });
  
  const data = await response.json();
  
  if (response.ok && data.success) {
    console.log('   ✅ Signup successful');
    console.log(`   📧 Test account: ${testEmail}`);
    console.log(`   🔑 Password: ${testPassword}`);
  } else {
    console.log('   ❌ Signup failed:', data.error || 'Unknown error');
  }
} catch (e) {
  console.log('   ❌ Signup API error:', e.message);
}

// Test 3: Test Stripe status API
console.log('\n3️⃣  Testing Stripe status API...');
const testHandle = 'test-shop-' + Date.now();

try {
  const response = await fetch(`${BASE_URL}/api/stripe/status?handle=${testHandle}`);
  const data = await response.json();
  
  if (response.ok && data.ok !== undefined) {
    console.log('   ✅ Stripe status API working');
    console.log(`   Connected: ${data.connected ? 'Yes' : 'No'}`);
  } else {
    console.log('   ❌ Stripe status failed:', data.error || 'Unknown error');
  }
} catch (e) {
  console.log('   ❌ Stripe status API error:', e.message);
}

// Test 4: Test site creation API
console.log('\n4️⃣  Testing site API...');
try {
  const testConfig = {
    handle: testHandle,
    brandName: 'Test Shop',
    mode: 'services',
    tagline: 'Test tagline',
    items: [
      { title: 'Test Service', price: '$50', note: 'Test', badge: 'none' }
    ],
    active: true,
    createdAt: Date.now(),
  };
  
  const response = await fetch(`${BASE_URL}/api/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testConfig),
  });
  
  const data = await response.json();
  
  if (response.ok && data.ok) {
    console.log('   ✅ Site publish API working');
    console.log(`   Handle: ${testHandle}`);
    console.log(`   URL: ${BASE_URL}/u/${testHandle}`);
  } else {
    console.log('   ⚠️  Site publish:', data.error || data.message || 'May need authentication');
  }
} catch (e) {
  console.log('   ❌ Site API error:', e.message);
}

// Test 5: Test public storefront
console.log('\n5️⃣  Testing public storefront access...');
try {
  const response = await fetch(`${BASE_URL}/u/${testHandle}`);
  
  if (response.ok) {
    console.log('   ✅ Public storefront accessible');
  } else if (response.status === 404) {
    console.log('   ⚠️  Storefront not found (expected if not published)');
  } else {
    console.log('   ❌ Storefront error:', response.status);
  }
} catch (e) {
  console.log('   ❌ Storefront access error:', e.message);
}

// Test 6: Test dashboard API
console.log('\n6️⃣  Testing dashboard/bookings API...');
try {
  const response = await fetch(`${BASE_URL}/api/dashboard`);
  const data = await response.json();
  
  if (response.ok || response.status === 401) {
    console.log('   ✅ Dashboard API responding');
    if (response.status === 401) {
      console.log('   ℹ️  Authentication required (expected)');
    }
  } else {
    console.log('   ❌ Dashboard API error:', response.status);
  }
} catch (e) {
  console.log('   ❌ Dashboard API error:', e.message);
}

// Test 7: Test items API
console.log('\n7️⃣  Testing items API...');
try {
  const response = await fetch(`${BASE_URL}/api/items?handle=${testHandle}`);
  const data = await response.json();
  
  if (response.ok && Array.isArray(data)) {
    console.log('   ✅ Items API working');
    console.log(`   Items found: ${data.length}`);
  } else {
    console.log('   ⚠️  Items API:', data.error || 'May need published site');
  }
} catch (e) {
  console.log('   ❌ Items API error:', e.message);
}

// Test 8: Check critical pages
console.log('\n8️⃣  Testing critical pages...');
const pages = [
  '/signup',
  '/login',
  '/create',
  '/dashboard',
];

for (const page of pages) {
  try {
    const response = await fetch(`${BASE_URL}${page}`);
    const status = response.ok ? '✅' : '⚠️ ';
    console.log(`   ${status} ${page} - ${response.status}`);
  } catch (e) {
    console.log(`   ❌ ${page} - ${e.message}`);
  }
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('\n📊 Test Summary:\n');
console.log('Core Features:');
console.log('  • Server: ✅ Running');
console.log('  • Auth: Check signup results above');
console.log('  • Stripe: Check status results above');
console.log('  • Storefront: Check publish results above');
console.log('  • APIs: Check individual test results above');

console.log('\n💡 Next Steps:');
console.log('  1. Open http://localhost:3000 in browser');
console.log('  2. Try manual signup/login');
console.log('  3. Create a storefront at /create');
console.log('  4. Connect Stripe (test mode recommended)');
console.log('  5. Publish and test checkout flow');

console.log('\n📧 Email Configuration:');
console.log('  • Supabase SMTP must be configured for emails');
console.log('  • Go to: https://supabase.com/dashboard/project/djghvdbpbjzyxahusnri');
console.log('  • Navigate to: Authentication → Email Templates');
console.log('  • Configure SMTP provider (Resend recommended)');

console.log('\n🔧 Troubleshooting:');
console.log('  • If Stripe fails: Check STRIPE_SECRET_KEY in .env.local');
console.log('  • If email fails: Configure SMTP in Supabase');
console.log('  • If DB fails: Check Supabase connection & RLS policies');
console.log('  • Logs: Check terminal running "npm run dev"');

console.log('\n');
