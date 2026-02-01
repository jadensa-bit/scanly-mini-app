import pg from 'pg';
import { readFileSync } from 'fs';

const { Client } = pg;

// Parse DATABASE_URL from .env.local
const envContent = readFileSync('.env.local', 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL=["']?([^"'\n]+)["']?/);

if (!dbUrlMatch) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const connectionString = dbUrlMatch[1];
console.log('Connecting to database...');

const client = new Client({ connectionString });

try {
  await client.connect();
  console.log('✅ Connected to database');

  const migrationSQL = readFileSync('supabase/migrations/12_add_delivery_to_orders.sql', 'utf8');
  console.log('\nRunning migration...\n');
  console.log(migrationSQL);

  const result = await client.query(migrationSQL);
  console.log('\n✅ Migration completed successfully');
  console.log('Result:', result);

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  await client.end();
  console.log('Database connection closed');
}
