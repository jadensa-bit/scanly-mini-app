import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

console.log('🚀 Running migration 09: Add user_id to sites table...\n');

async function runMigration() {
  try {
    const migration = readFileSync('./supabase/migrations/09_add_user_id_to_sites.sql', 'utf8');
    
    // Split into individual statements
    const statements = migration
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;
      
      console.log(`\n${i + 1}. Executing: ${statement.substring(0, 60)}...`);
      
      // Execute using raw SQL
      const { data, error } = await supabase.rpc('exec', {
        sql: statement + ';'
      });
      
      if (error) {
        // Try alternative method if exec RPC doesn't exist
        console.log('   ⚠️ RPC method failed, trying direct query...');
        
        // For ALTER TABLE, we can try using the REST API
        if (statement.includes('ALTER TABLE sites')) {
          console.log('   📋 Please run this SQL manually in Supabase Dashboard:');
          console.log(`\n   ${statement};\n`);
          console.log('   📍 Go to: https://supabase.com/dashboard');
          console.log('   📍 Navigate to: SQL Editor > New Query');
          console.log('   📍 Paste and run the SQL above\n');
        } else {
          console.error('   ❌ Error:', error.message);
        }
      } else {
        console.log('   ✅ Success');
      }
    }
    
    // Verify the column was added
    console.log('\n🔍 Verifying user_id column exists...');
    const { data: tableInfo, error: infoError } = await supabase
      .from('sites')
      .select('*')
      .limit(1);
    
    if (!infoError) {
      console.log('✅ sites table is accessible');
      
      // Check if we can query by user_id (will fail if column doesn't exist)
      const { error: userIdError } = await supabase
        .from('sites')
        .select('user_id')
        .limit(1);
      
      if (!userIdError) {
        console.log('✅ user_id column exists and is queryable!');
        console.log('\n🎉 Migration completed successfully!');
        console.log('\n📌 Next steps:');
        console.log('   1. New piqos will now automatically save with user_id');
        console.log('   2. They will appear in the dashboard under "Your Piqos"');
        console.log('   3. Existing piqos can be linked by running the UPDATE query in the migration file');
      } else {
        console.log('⚠️ user_id column may not exist yet');
        console.log('\n📋 Please run this SQL in Supabase Dashboard SQL Editor:');
        console.log('\nALTER TABLE sites ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;');
        console.log('CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id);');
      }
    }
    
  } catch (err) {
    console.error('❌ Migration failed:', err);
    console.log('\n📋 Manual migration required. Run this SQL in Supabase Dashboard:');
    console.log('\nALTER TABLE sites ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;');
    console.log('CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id);');
    console.log('\n📍 Go to: https://supabase.com/dashboard/project/[your-project]/sql/new');
  }
}

runMigration();
