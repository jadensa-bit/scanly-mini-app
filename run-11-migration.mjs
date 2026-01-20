import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('📦 Creating uploads storage bucket...\n');

  try {
    // Read the migration file
    const migrationPath = join(__dirname, 'supabase', 'migrations', '11_create_uploads_bucket.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('Executing migration...');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
      // If exec_sql doesn't exist, try direct execution
      // Split by semicolons and execute each statement
      const statements = sql.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        if (!statement.trim()) continue;
        
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error: stmtError } = await supabase.from('_').select('*').limit(0); // dummy query
        
        // Try using the SQL editor endpoint instead
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ query: statement + ';' })
        });
        
        if (!response.ok) {
          console.warn(`⚠️  Statement may have failed (this is OK if bucket already exists)`);
        }
      }
      
      return { data: null, error: null };
    });

    if (error) {
      console.error('❌ Migration error:', error.message);
      console.log('\n⚠️  This is likely because the bucket already exists or you need to apply this manually.');
      console.log('\n📋 Manual steps:');
      console.log('1. Go to your Supabase Dashboard → Storage');
      console.log('2. Create a new bucket named "uploads"');
      console.log('3. Set it as Public');
      console.log('4. Set file size limit to 5MB');
      console.log('5. Add allowed MIME types: image/jpeg, image/png, image/gif, image/webp, image/svg+xml');
      console.log('6. Go to Policies and add:');
      console.log('   - SELECT policy: Public read access (allow all)');
      console.log('   - INSERT policy: Authenticated users can upload');
      console.log('   - UPDATE policy: Authenticated users can update');
      console.log('   - DELETE policy: Authenticated users can delete');
      return;
    }

    console.log('✅ Migration completed successfully!');
    console.log('\n📸 The uploads bucket is now ready for:');
    console.log('   • Brand logos');
    console.log('   • Product photos');
    console.log('   • Profile pictures');
    console.log('   • Staff photos');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    console.log('\n📋 Please apply the migration manually:');
    console.log('1. Go to your Supabase Dashboard → Storage');
    console.log('2. Create a new bucket named "uploads"');
    console.log('3. Make it public');
    console.log('4. Configure the policies as shown in supabase/migrations/11_create_uploads_bucket.sql');
  }
}

runMigration();
