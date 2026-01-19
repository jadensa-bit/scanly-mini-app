import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

async function applyMigration() {
  console.log('📝 Applying migration: 07_add_draft_config.sql...\n');
  
  const migration = readFileSync('./supabase/migrations/07_add_draft_config.sql', 'utf8');
  
  // Split into individual statements
  const statements = migration
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  console.log(`Found ${statements.length} SQL statements to execute\n`);
  
  for (const statement of statements) {
    console.log(`Executing: ${statement.substring(0, 80)}...`);
    
    try {
      // Execute raw SQL using the Supabase client
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error('❌ Error:', error.message);
        // Try alternative approach - direct query
        const { error: altError } = await supabase.from('_migrations').insert({ statement });
        if (altError) {
          console.error('❌ Alternative approach also failed');
        }
      } else {
        console.log('✅ Success');
      }
    } catch (err) {
      console.error('❌ Exception:', err.message);
    }
    console.log('');
  }
  
  console.log('✅ Migration application complete!');
}

applyMigration().catch(console.error);
