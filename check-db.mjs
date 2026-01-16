import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function check() {
  const { data: sites } = await supabase.from('scanly_sites').select('*');
  const { data: bookings } = await supabase.from('bookings').select('id, handle, customer_name');
  
  console.log('\n=== SITES ===');
  console.log(`Total: ${sites?.length || 0}`);
  if (sites && sites.length > 0) {
    for (const s of sites) {
      console.log(`  ${s.handle}: user_id=${s.user_id ? s.user_id.slice(0, 8) + '...' : 'NULL'}`);
    }
  }
  
  console.log('\n=== BOOKINGS ===');
  console.log(`Total: ${bookings?.length || 0}`);
  if (bookings && bookings.length > 0) {
    for (const b of bookings) {
      console.log(`  ${b.id}: handle=${b.handle}, customer=${b.customer_name || 'unnamed'}`);
    }
  }
}

check().catch(console.error);
