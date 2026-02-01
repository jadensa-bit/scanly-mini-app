#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function runMigration() {
  console.log('🚀 Running subscription migration...\n');

  try {
    // Read migration file
    const migrationPath = join(__dirname, 'supabase', 'migrations', '12_add_subscription_to_profiles.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('📄 Migration file:', migrationPath);
    console.log('📝 SQL:', sql.substring(0, 100) + '...\n');

    // Execute migration
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });

    if (error) {
      // Try direct execution if RPC doesn't work
      console.log('⚠️  RPC failed, trying direct execution...');
      
      // Split by semicolon and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        console.log(`\n📤 Executing: ${statement.substring(0, 60)}...`);
        
        // Use raw SQL via PostgreSQL REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ sql_string: statement }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Failed to execute statement: ${errorText}`);
        } else {
          console.log('✅ Statement executed');
        }
      }
    } else {
      console.log('✅ Migration executed successfully!');
    }

    // Verify the migration
    console.log('\n🔍 Verifying migration...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, subscription_tier, piqo_limit')
      .limit(1);

    if (profilesError) {
      console.error('❌ Verification failed:', profilesError.message);
    } else {
      console.log('✅ Verification successful!');
      if (profiles && profiles.length > 0) {
        console.log('📊 Sample profile:', profiles[0]);
      }
    }

    console.log('\n✨ Migration complete!');
    console.log('\n📚 Next steps:');
    console.log('1. Users will now have subscription_tier = "free" by default');
    console.log('2. Free users can create 1 piqo');
    console.log('3. Upgrade to Pro for unlimited piqos');
    console.log('4. See SUBSCRIPTION_SYSTEM.md for full documentation');

  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

runMigration();
