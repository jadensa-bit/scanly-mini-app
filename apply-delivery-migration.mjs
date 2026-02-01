import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const migrationPath = join(__dirname, 'supabase/migrations/12_add_delivery_to_orders.sql');
const migrationSQL = readFileSync(migrationPath, 'utf8');

console.log('Running migration: 12_add_delivery_to_orders.sql');
console.log('SQL:', migrationSQL);

const { data, error } = await supabase.rpc('exec_sql', { sql_string: migrationSQL });

if (error) {
  console.error('Migration failed:', error);
  process.exit(1);
}

console.log('✅ Migration completed successfully');
console.log('Result:', data);
