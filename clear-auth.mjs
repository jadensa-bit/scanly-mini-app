#!/usr/bin/env node
/**
 * Clear stale Supabase auth cookies
 * Run this if you get "Invalid Refresh Token" errors
 */

console.log('\n🧹 Clearing Supabase auth cookies...\n');

console.log('To clear browser cookies:');
console.log('1. Open DevTools (F12)');
console.log('2. Go to Application tab → Cookies');
console.log('3. Delete all cookies starting with "sb-"');
console.log('4. Refresh the page');

console.log('\n💡 Or clear all localhost cookies:');
console.log('   - Chrome: Settings → Privacy → Cookies → See all cookies → localhost → Remove all');

console.log('\n🔄 Alternative: Use incognito/private window for fresh session\n');

console.log('✅ After clearing cookies, try logging in again.\n');
