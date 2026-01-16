#!/usr/bin/env npx ts-node
/**
 * Data Isolation Verification Script
 * 
 * This script verifies that each user's sites are properly isolated
 * and that bookings/orders are correctly scoped to the user's sites.
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  try {
    console.log("🔍 Verifying data isolation in scanly...\n");

    // 1. Check sites and users
    console.log("📋 Checking sites table...");
    const { data: sites, error: sitesError } = await supabase
      .from("scanly_sites")
      .select("id, handle, user_id");

    if (sitesError) {
      console.error("❌ Error fetching sites:", sitesError.message);
      process.exit(1);
    }

    if (!sites || sites.length === 0) {
      console.log("✅ No sites in database yet");
    } else {
      console.log(`✅ Found ${sites.length} sites:`);
      
      // Group by user_id
      const byUser = new Map<string | null, any[]>();
      for (const site of sites) {
        const userId = site.user_id || "NULL";
        if (!byUser.has(userId)) byUser.set(userId, []);
        byUser.get(userId)!.push(site);
      }

      for (const [userId, userSites] of byUser.entries()) {
        const userDisplay = userId === "NULL" ? "❌ NULL" : (userId as string).slice(0, 8) + "...";
        console.log(`   User ${userDisplay}: ${userSites.length} sites`);
        for (const site of userSites) {
          console.log(`     - ${site.handle}`);
        }
      }

      // Check for sites without user_id (data isolation risk!)
      const sitesWithoutUser = sites.filter((s) => !s.user_id);
      if (sitesWithoutUser.length > 0) {
        console.log(`\n⚠️  WARNING: ${sitesWithoutUser.length} sites have NO user_id!`);
        console.log("   These sites will appear in all users' dashboards!");
        console.log("   Handles:", sitesWithoutUser.map((s) => s.handle).join(", "));
      }
    }

    // 2. Check bookings
    console.log("\n📅 Checking bookings table...");
    const { data: bookings, error: bookingsError } = await supabase
      .from("bookings")
      .select("id, handle");

    if (bookingsError) {
      console.error("❌ Error fetching bookings:", bookingsError.message);
    } else if (!bookings || bookings.length === 0) {
      console.log("✅ No bookings in database yet");
    } else {
      const handles = new Set(bookings.map((b) => b.handle));
      console.log(`✅ Found ${bookings.length} bookings for ${handles.size} different sites`);
      
      // Check if all bookings belong to sites with user_id
      const { data: sitesForBookings } = await supabase
        .from("scanly_sites")
        .select("handle, user_id")
        .in("handle", Array.from(handles));

      const sitesWithUser = new Set(
        (sitesForBookings || []).filter((s) => s.user_id).map((s) => s.handle)
      );
      const sitesWithoutUser = new Set(
        (sitesForBookings || []).filter((s) => !s.user_id).map((s) => s.handle)
      );

      if (sitesWithoutUser.size > 0) {
        console.log(
          `\n⚠️  WARNING: Bookings exist for ${sitesWithoutUser.size} sites with NO user_id!`
        );
        console.log("   These bookings will appear in all users' dashboards!");
        console.log("   Affected sites:", Array.from(sitesWithoutUser).join(", "));
      } else {
        console.log("✅ All bookings belong to sites with proper user_id");
      }
    }

    // 3. Check orders
    console.log("\n🛒 Checking orders table...");
    const { data: orders, error: ordersError } = await supabase
      .from("scanly_orders")
      .select("id, handle");

    if (ordersError) {
      console.error("⚠️  Orders table unavailable:", ordersError.message);
    } else if (!orders || orders.length === 0) {
      console.log("✅ No orders in database yet");
    } else {
      const handles = new Set(orders.map((o) => o.handle));
      console.log(`✅ Found ${orders.length} orders for ${handles.size} different sites`);
      
      const { data: sitesForOrders } = await supabase
        .from("scanly_sites")
        .select("handle, user_id")
        .in("handle", Array.from(handles));

      const sitesWithoutUser = new Set(
        (sitesForOrders || []).filter((s) => !s.user_id).map((s) => s.handle)
      );

      if (sitesWithoutUser.size > 0) {
        console.log(
          `\n⚠️  WARNING: Orders exist for ${sitesWithoutUser.size} sites with NO user_id!`
        );
        console.log("   These orders will appear in all users' dashboards!");
        console.log("   Affected sites:", Array.from(sitesWithoutUser).join(", "));
      } else {
        console.log("✅ All orders belong to sites with proper user_id");
      }
    }

    console.log("\n✅ Data isolation verification complete!");
  } catch (error: any) {
    console.error("❌ Unexpected error:", error.message);
    process.exit(1);
  }
}

main();
