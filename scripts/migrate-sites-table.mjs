#!/usr/bin/env node
/**
 * Migration Script: Migrate from `sites` table to `scanly_sites` table
 * 
 * This script migrates all data from the old `sites` table to the new
 * `scanly_sites` table which has proper data isolation via user_id.
 */

import { createClient } from "@supabase/supabase-js";
import * as readline from "readline";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  try {
    console.log("🔄 Migrating from 'sites' to 'scanly_sites' table\n");

    // Get all sites from old table
    const { data: oldSites } = await supabase.from("sites").select("*");

    if (!oldSites || oldSites.length === 0) {
      console.log("✅ No sites to migrate");
      process.exit(0);
    }

    console.log(`📋 Found ${oldSites.length} sites in 'sites' table:`);
    
    // Show summary
    const withoutUserId = oldSites.filter((s) => !s.user_id).length;
    const withUserId = oldSites.filter((s) => s.user_id).length;
    
    console.log(`   - ${withUserId} with user_id`);
    console.log(`   - ${withoutUserId} WITHOUT user_id (orphaned - will be deleted)\n`);

    const answer = await prompt(
      "❓ Proceed with migration? (yes/no): "
    );

    if (answer.toLowerCase() !== "yes") {
      console.log("❌ Migration cancelled");
      process.exit(0);
    }

    // Migrate sites with user_id
    const sitesToMigrate = oldSites.filter((s) => s.user_id);
    
    if (sitesToMigrate.length > 0) {
      console.log(`\n📦 Inserting ${sitesToMigrate.length} sites into scanly_sites...`);
      
      // Insert in batches to avoid large request
      for (let i = 0; i < sitesToMigrate.length; i += 10) {
        const batch = sitesToMigrate.slice(i, i + 10);
        const { error } = await supabase
          .from("scanly_sites")
          .insert(batch);

        if (error) {
          console.error(`❌ Error inserting batch ${i / 10 + 1}:`, error.message);
          process.exit(1);
        }
        console.log(`  ✅ Inserted batch ${Math.floor(i / 10) + 1}`);
      }
    }

    // Delete old sites without user_id
    const sitesToDelete = oldSites.filter((s) => !s.user_id);
    if (sitesToDelete.length > 0) {
      console.log(`\n🗑️  Deleting ${sitesToDelete.length} orphaned sites from old table...`);
      
      const handles = sitesToDelete.map((s) => s.handle);
      
      // Delete their bookings first
      const { error: bookingsError } = await supabase
        .from("bookings")
        .delete()
        .in("handle", handles);
      if (bookingsError) console.warn("⚠️  Warning deleting bookings:", bookingsError.message);
      else console.log(`  ✅ Deleted bookings for orphaned sites`);
      
      // Delete their orders
      const { error: ordersError } = await supabase
        .from("scanly_orders")
        .delete()
        .in("handle", handles);
      if (ordersError) console.warn("⚠️  Warning deleting orders:", ordersError.message);
      else console.log(`  ✅ Deleted orders for orphaned sites`);
      
      // Delete the orphaned sites
      for (const handle of handles) {
        const { error } = await supabase
          .from("sites")
          .delete()
          .eq("handle", handle);
        if (error) {
          console.error(`❌ Error deleting ${handle}:`, error.message);
        }
      }
      console.log(`  ✅ Deleted ${sitesToDelete.length} orphaned sites`);
    }

    // Drop old table (optional)
    console.log("\n💡 The old 'sites' table can be safely dropped after backup.");
    console.log("   Run this SQL when ready:");
    console.log("   DROP TABLE sites CASCADE;");

    console.log("\n✅ Migration complete!");
    console.log(`   - ${sitesToMigrate.length} sites migrated to scanly_sites`);
    console.log(`   - ${sitesToDelete.length} orphaned sites removed`);
  } catch (error) {
    console.error("❌ Unexpected error:", error.message);
    process.exit(1);
  }
}

main();
