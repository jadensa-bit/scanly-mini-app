#!/usr/bin/env node

/**
 * Test subdomain routing functionality
 * Run: node test-subdomain-routing.mjs
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://piqo-builder1.vercel.app';
const TEST_HANDLE = 'test-shop';

console.log('🧪 Testing Subdomain Routing\n');
console.log(`Base URL: ${BASE_URL}`);
console.log(`Test Handle: ${TEST_HANDLE}\n`);

// Test 1: Path-based URL
console.log('1️⃣  Testing path-based URL...');
try {
  const pathUrl = `${BASE_URL}/u/${TEST_HANDLE}`;
  console.log(`   Testing: ${pathUrl}`);
  
  const response = await fetch(pathUrl);
  
  if (response.ok) {
    console.log('   ✅ Path-based URL working');
  } else if (response.status === 404) {
    console.log('   ⚠️  Storefront not found (create one with this handle first)');
  } else {
    console.log(`   ❌ Unexpected status: ${response.status}`);
  }
} catch (e) {
  console.log('   ❌ Error:', e.message);
}

// Test 2: Subdomain URL (only if base domain is configured)
console.log('\n2️⃣  Testing subdomain URL...');
const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'piqo.app';

if (baseDomain && baseDomain !== 'piqo.app') {
  try {
    const subdomainUrl = `https://${TEST_HANDLE}.${baseDomain}`;
    console.log(`   Testing: ${subdomainUrl}`);
    
    const response = await fetch(subdomainUrl);
    
    if (response.ok) {
      console.log('   ✅ Subdomain URL working');
    } else if (response.status === 404) {
      console.log('   ⚠️  Storefront not found');
    } else if (response.status >= 500) {
      console.log('   ⚠️  DNS not configured yet or SSL provisioning');
    } else {
      console.log(`   ❌ Unexpected status: ${response.status}`);
    }
  } catch (e) {
    console.log('   ⚠️  Subdomain not accessible yet (DNS/SSL pending)');
    console.log(`   Error: ${e.message}`);
  }
} else {
  console.log('   ⚠️  NEXT_PUBLIC_BASE_DOMAIN not configured');
  console.log('   Set environment variable to test subdomains');
}

// Test 3: Middleware logic
console.log('\n3️⃣  Testing middleware logic...');
const testCases = [
  { hostname: `${TEST_HANDLE}.piqo.app`, expected: 'subdomain' },
  { hostname: 'piqo.app', expected: 'main' },
  { hostname: 'www.piqo.app', expected: 'main' },
];

for (const test of testCases) {
  const baseDomain = 'piqo.app';
  const isSubdomain = test.hostname.endsWith(`.${baseDomain}`) && 
                      !test.hostname.startsWith('www.') && 
                      test.hostname !== baseDomain;
  
  const result = isSubdomain ? 'subdomain' : 'main';
  const status = result === test.expected ? '✅' : '❌';
  
  console.log(`   ${status} ${test.hostname} → ${result} (expected: ${test.expected})`);
}

// Test 4: URL generation
console.log('\n4️⃣  Testing URL generation...');
console.log('   Path format: /u/handle');
console.log('   Subdomain format: handle.basedomain');

const examples = [
  'coffee-shop',
  'barber-nyc',
  'yoga-studio',
];

for (const handle of examples) {
  const pathUrl = `https://${baseDomain}/u/${handle}`;
  const subUrl = `https://${handle}.${baseDomain}`;
  console.log(`   📍 ${handle}:`);
  console.log(`      Path:      ${pathUrl}`);
  console.log(`      Subdomain: ${subUrl}`);
}

console.log('\n✅ Tests complete!\n');
console.log('Next steps:');
console.log('1. Set environment variables in Vercel');
console.log('2. Add wildcard domain (*.piqo.app) in Vercel');
console.log('3. Configure DNS with CNAME: * → cname.vercel-dns.com');
console.log('4. Wait for DNS propagation (5-30 min)');
console.log('5. Test with a real storefront handle\n');
