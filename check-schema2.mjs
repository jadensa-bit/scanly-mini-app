import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function check() {
  // Try selecting with wildcard
  const { data, error } = await supabase.from('scanly_sites').select('*');
  
  if (error) {
    console.log('Error:', error.message);
  } else if (data && data.length > 0) {
    console.log('scanly_sites columns:', Object.keys(data[0]).sort());
  } else {
    console.log('scanly_sites is empty. Trying to describe table...');
    
    // Try getting schema info via information_schema
    const { data: info, error: infoError } = await supabase.rpc('get_column_names', {
      table_name: 'scanly_sites'
    });
    
    if (infoError) {
      console.log('Could not get column info:', infoError.message);
      // Just insert a dummy row to see columns
      const { data: result, error: insertError } = await supabase
        .from('scanly_sites')
        .insert({
          handle: 'dummy-test-' + Date.now(),
          user_id: '00000000-0000-0000-0000-000000000000',
          config: {}
        })
        .select();
      
      if (insertError) {
        console.log('Insert error:', insertError.message);
      } else {
        console.log('scanly_sites columns:', Object.keys(result?.[0] || {}).sort());
        // Delete test row
        await supabase.from('scanly_sites').delete().eq('handle', 'dummy-test-' + Date.now());
      }
    } else {
      console.log('Columns:', info);
    }
  }
}

check().catch(console.error);
