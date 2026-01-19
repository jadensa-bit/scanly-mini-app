import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function getFirstUser() {
  const { data } = await supabase.from('scanly_sites').select('user_id').limit(1);
  if (data && data[0]) {
    console.log(data[0].user_id);
  } else {
    console.log('No users found');
  }
}

getFirstUser().catch(console.error);
