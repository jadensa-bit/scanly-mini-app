import pg from 'pg';
import { readFileSync } from 'fs';

const { Client } = pg;

// Construct connection string from SUPABASE_URL
const supabaseUrl = process.env.SUPABASE_URL;
if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL not found in environment');
  process.exit(1);
}

// Extract project ref from URL (e.g., https://abc123.supabase.co -> abc123)
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

// Database connection string format: postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
const connectionString = process.env.DATABASE_URL || 
  `postgresql://postgres:${process.env.SUPABASE_DB_PASSWORD}@db.${projectRef}.supabase.co:5432/postgres`;

async function applyMigration() {
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('📝 Connecting to database...\n');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📝 Applying migration: 06_add_order_columns.sql...\n');
    
    const migration = readFileSync('./supabase/migrations/06_add_order_columns.sql', 'utf8');
    
    await client.query(migration);
    
    console.log('✅ Migration applied successfully!\n');
    
    // Verify the columns were added
    const { rows } = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'scanly_orders'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Current scanly_orders columns:');
    rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
