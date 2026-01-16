import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function check() {
  const { data: bookingsSite } = await supabase
    .from('sites')
    .select('handle, user_id')
    .eq('handle', 'bookings');
  
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, handle, customer_name');
  
  console.log('Site "bookings" owner:');
  if (bookingsSite && bookingsSite[0]) {
    const userId = bookingsSite[0].user_id;
    console.log(`  user_id: ${userId}`);
    
    console.log('\nBookings for this site:');
    if (bookings) {
      for (const b of bookings) {
        if (b.handle === 'bookings') {
          console.log(`  ${b.id}: ${b.customer_name}`);
        }
      }
    }
    
    console.log(`\nAll sites owned by user ${userId?.slice(0, 8)}...:`);
    const { data: userSites } = await supabase
      .from('sites')
      .select('handle')
      .eq('user_id', userId);
    
    if (userSites) {
      for (const s of userSites) {
        console.log(`  ${s.handle}`);
      }
    }
  }
}

check().catch(console.error);
