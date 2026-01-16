import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function check() {
  console.log('=== sites table (old) ===');
  const { data: sites1 } = await supabase.from('sites').select('*');
  if (sites1) {
    for (const s of sites1) {
      console.log(`  ${s.handle}: user_id=${s.user_id ? s.user_id.slice(0, 8) + '...' : 'NULL'}, config=${Object.keys(s.config || {}).join(', ')}`);
    }
  }
  
  console.log('\n=== scanly_sites table (new) ===');
  const { data: sites2 } = await supabase.from('scanly_sites').select('*');
  if (sites2 && sites2.length > 0) {
    for (const s of sites2) {
      console.log(`  ${s.handle}: user_id=${s.user_id ? s.user_id.slice(0, 8) + '...' : 'NULL'}`);
    }
  } else {
    console.log('  (empty)');
  }
  
  console.log('\n=== bookings table ===');
  const { data: bookings } = await supabase.from('bookings').select('*');
  console.log(`  Total: ${bookings?.length || 0}`);
}

check().catch(console.error);
