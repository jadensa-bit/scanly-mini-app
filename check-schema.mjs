import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function check() {
  // Get a sample from each table
  const { data: sites } = await supabase.from('sites').select('*').limit(1);
  const { data: scanlySites } = await supabase.from('scanly_sites').select('*').limit(1);
  
  if (sites && sites[0]) {
    console.log('sites table columns:', Object.keys(sites[0]).sort());
  }
  
  if (scanlySites && scanlySites[0]) {
    console.log('scanly_sites table columns:', Object.keys(scanlySites[0]).sort());
  } else {
    // Try with explicit selection
    const { data } = await supabase.rpc('get_columns', { table_name: 'scanly_sites' }).catch(() => ({ data: null }));
    console.log('scanly_sites (via rpc):', data);
  }
}

check().catch(console.error);
