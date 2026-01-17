import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

async function applyMigration() {
  console.log('📝 Applying migration: 06_add_order_columns.sql...\n');
  
  const migration = readFileSync('./supabase/migrations/06_add_order_columns.sql', 'utf8');
  
  const { data, error } = await supabase.rpc('exec_sql', { sql: migration });
  
  if (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('\n📋 Attempting direct SQL execution...\n');
    
    // Try executing the SQL directly
    const statements = migration.split(';').filter(s => s.trim());
    
    for (const statement of statements) {
      if (!statement.trim()) continue;
      
      console.log(`Executing: ${statement.trim().substring(0, 60)}...`);
      
      const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (stmtError) {
        console.error(`❌ Failed: ${stmtError.message}`);
      } else {
        console.log('✅ Success');
      }
    }
  } else {
    console.log('✅ Migration applied successfully!');
  }
}

applyMigration();
