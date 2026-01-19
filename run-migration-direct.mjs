import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Extract project ref from URL
const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

console.log('🔧 Adding draft_config column to sites table...\n');
console.log(`📍 Project: ${projectRef}`);
console.log(`🌐 URL: ${SUPABASE_URL}\n`);

const sql = `ALTER TABLE sites ADD COLUMN IF NOT EXISTS draft_config JSONB DEFAULT NULL;
COMMENT ON COLUMN sites.draft_config IS 'Stores draft changes that have not been published yet.';`;

// Use Supabase REST API with anon key to execute query
const url = `${SUPABASE_URL}/rest/v1/rpc/exec`;

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  },
  body: JSON.stringify({ query: sql })
})
.then(res => res.json())
.then(data => {
  console.log('Response:', data);
})
.catch(err => {
  console.error('❌ Error:', err);
  console.log('\n📋 Please manually run this SQL in Supabase SQL Editor:');
  console.log('\n' + sql);
  console.log('\n🔗 Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql/new');
});
