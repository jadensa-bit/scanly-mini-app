import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function checkTable(tableName) {
  try {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    if (error) {
      console.log(`  ❌ "${tableName}": ${error.message}`);
    } else {
      console.log(`  ✅ "${tableName}": exists, ${data?.length || 0} rows`);
    }
  } catch (e) {
    console.log(`  ❌ "${tableName}": error`);
  }
}

console.log('Checking for sites tables...');
await Promise.all([
  checkTable('scanly_sites'),
  checkTable('sites'),
  checkTable('site')
]);

console.log('\nChecking bookings tables...');
await Promise.all([
  checkTable('bookings'),
  checkTable('scanly_bookings')
]);
