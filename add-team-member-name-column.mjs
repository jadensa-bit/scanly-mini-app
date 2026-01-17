import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read .env.local manually
const envPath = join(__dirname, '.env.local');
const envContent = readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    env[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables!');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addColumn() {
  console.log('🔍 Checking if team_member_name column exists...');
  
  // Try to select the column to see if it exists
  const { data, error } = await supabase
    .from('bookings')
    .select('team_member_name')
    .limit(1);
  
  if (error && error.message.includes('column "team_member_name" does not exist')) {
    console.log('❌ Column does not exist.');
    console.log('\n📝 Please run this SQL command in your Supabase SQL Editor:');
    console.log('\n' + '='.repeat(60));
    console.log('ALTER TABLE bookings ADD COLUMN team_member_name TEXT;');
    console.log('='.repeat(60) + '\n');
    console.log('📍 Go to: https://supabase.com/dashboard/project/[your-project]/sql/new');
    process.exit(1);
  } else if (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  } else {
    console.log('✅ Column team_member_name already exists!');
    
    // Check if any bookings have team_member_name set
    const { data: bookingsWithNames, error: countError } = await supabase
      .from('bookings')
      .select('id, team_member_name')
      .not('team_member_name', 'is', null);
    
    if (!countError) {
      console.log(`📊 Bookings with team_member_name: ${bookingsWithNames?.length || 0}`);
      if (bookingsWithNames && bookingsWithNames.length > 0) {
        console.log('Sample:', bookingsWithNames.slice(0, 3));
      }
    }
  }
}

addColumn();
