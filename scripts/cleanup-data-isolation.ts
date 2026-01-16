#!/usr/bin/env npx ts-node
/**
 * Data Isolation Cleanup Script
 * 
 * This script removes sites that don't have a user_id, along with their
 * associated bookings and orders. This ensures clean data isolation.
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

function prompt(question: string): Promise<string> {
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
    console.log("🧹 Data Isolation Cleanup Script\n");

    // Find sites without user_id
    const { data: sitesWithoutUser } = await supabase
      .from("scanly_sites")
      .select("handle")
      .is("user_id", null);

    if (!sitesWithoutUser || sitesWithoutUser.length === 0) {
      console.log("✅ All sites have proper user_id. No cleanup needed.");
      process.exit(0);
    }

    console.log(`⚠️  Found ${sitesWithoutUser.length} sites without user_id:`);
    for (const site of sitesWithoutUser) {
      console.log(`   - ${site.handle}`);
    }

    const answer = await prompt(
      "\n❓ Delete these sites and their bookings/orders? (yes/no): "
    );

    if (answer.toLowerCase() !== "yes") {
      console.log("❌ Cancelled cleanup.");
      process.exit(0);
    }

    const handles = sitesWithoutUser.map((s) => s.handle);

    // Delete bookings for these sites
    const { error: bookingsError } = await supabase
      .from("bookings")
      .delete()
      .in("handle", handles);

    if (bookingsError) {
      console.error("⚠️  Error deleting bookings:", bookingsError.message);
    } else {
      console.log("✅ Deleted bookings for orphaned sites");
    }

    // Delete orders for these sites
    const { error: ordersError } = await supabase
      .from("scanly_orders")
      .delete()
      .in("handle", handles);

    if (ordersError) {
      console.error("⚠️  Error deleting orders:", ordersError.message);
    } else {
      console.log("✅ Deleted orders for orphaned sites");
    }

    // Delete the sites themselves
    const { error: sitesError } = await supabase
      .from("scanly_sites")
      .delete()
      .in("handle", handles);

    if (sitesError) {
      console.error("❌ Error deleting sites:", sitesError.message);
      process.exit(1);
    }

    console.log("✅ Deleted orphaned sites");
    console.log("\n✅ Cleanup complete! Data isolation restored.");
  } catch (error: any) {
    console.error("❌ Unexpected error:", error.message);
    process.exit(1);
  }
}

main();
