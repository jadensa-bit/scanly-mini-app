#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

async function checkTables() {
  console.log('\n🔍 CHECKING ALL POSSIBLE SITE TABLES\n');
  
  const tables = ['sites', 'scanly_sites', 'site'];
  
  for (const table of tables) {
    console.log(`\n📋 Checking table: ${table}`);
    console.log('='.repeat(60));
    
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(10);
    
    if (error) {
      console.log(`❌ Error: ${error.message}`);
    } else {
      console.log(`✅ Found ${data?.length || 0} rows`);
      if (data && data.length > 0) {
        console.table(data.map(row => ({
          handle: row.handle,
          user_id: row.user_id?.slice(0, 12) || 'NULL',
          owner_email: row.owner_email || 'NULL',
          has_config: !!row.config
        })));
      }
    }
  }
}

checkTables().catch(console.error);
