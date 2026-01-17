#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

// Read the migration file
const migration = readFileSync('./supabase/migrations/06_add_order_columns.sql', 'utf8');

console.log('📝 Applying migration to scanly_orders table...\n');
console.log('SQL to execute:');
console.log('---');
console.log(migration);
console.log('---\n');

async function runSQL() {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: migration })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    console.log('✅ Migration executed via REST API');
    
  } catch (error) {
    console.log(`⚠️ REST API approach failed: ${error.message}`);
    console.log('\n📋 Please run this SQL manually in Supabase Dashboard > SQL Editor:\n');
    console.log(migration);
    console.log('\nOr connect via psql and run the migration file.');
  }
}

runSQL();
