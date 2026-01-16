// Real-time dashboard API endpoint
import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  let user = null;
  let userId: string | undefined;

  // Try to get user from cookies first
  const supabaseAuth = await createClient();
  const { data: { user: cookieUser }, error: cookieError } = await supabaseAuth.auth.getUser();
  console.log("🔐 Dashboard: Cookie auth result", { userId: cookieUser?.id || "null", error: cookieError?.message });
  
  if (cookieUser) {
    user = cookieUser;
    userId = cookieUser.id;
    console.log("✅ Dashboard: Using cookie auth, user:", userId);
  } else {
    console.log("❌ Dashboard: Cookie auth failed, trying Bearer token");
    // Try to get user from Bearer token
    const authHeader = req.headers.get("Authorization");
    console.log("🔐 Dashboard: Authorization header present?", !!authHeader);
    
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      try {
        const supabase = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
        console.log("🔐 Dashboard: Bearer token auth result", { userId: tokenUser?.id || "null", error: tokenError?.message });
        
        if (tokenUser) {
          user = tokenUser;
          userId = tokenUser.id;
          console.log("✅ Dashboard: Using Bearer token auth, user:", userId);
        }
      } catch (err) {
        console.error("❌ Dashboard: Token verification failed:", err);
      }
    } else {
      console.log("⚠️ Dashboard: No Bearer token in Authorization header");
    }
  }

  if (!user || !userId) {
    console.error("❌ Dashboard: User not authenticated");
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log("✅ Dashboard: User authenticated, fetching data for:", userId);
  
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Fetch user's sites - try all table candidates like the POST endpoint does
  const TABLE_CANDIDATES = ["sites", "scanly_sites", "site"];
  let sites: any[] = [];
  let sitesError: any = null;
  let successTable = null;

  for (const table of TABLE_CANDIDATES) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('user_id', userId);

    const msg = String(error?.message || "").toLowerCase();
    
    // Table doesn't exist → try next
    if (error && (msg.includes("does not exist") || msg.includes("relation") || msg.includes("schema cache"))) {
      console.log(`⏭️ Dashboard: Table ${table} doesn't exist, trying next`);
      continue;
    }

    if (error) {
      console.error(`❌ Dashboard: Error querying ${table}:`, error.message);
      sitesError = error;
    } else {
      sites = data || [];
      successTable = table;
      console.log(`✅ Dashboard: Found ${sites.length} sites in table '${table}'`);
      break; // Success, don't try other tables
    }
  }

  if (!successTable && sitesError) {
    console.error("❌ Dashboard: Could not fetch sites from any table");
    return NextResponse.json({ error: sitesError.message }, { status: 500 });
  }

  console.log("✅ Dashboard: Fetched", sites?.length || 0, "sites");

  // Get site handles for filtering bookings and orders
  const siteHandles = (sites || []).map((s: any) => s.handle);
  console.log("🔍 Dashboard: Site handles:", siteHandles);
  console.log("🔍 Dashboard: Sites details:", sites?.map((s: any) => ({ handle: s.handle, brandName: s.config?.brandName })));

  // Fetch bookings for the user's sites with team member info
  let bookings: any[] = [];
  let totalBookingsCount = 0;
  let bookingsError = null;
  try {
    // Fetch recent bookings for display (without join, since foreign key may not exist)
    let bookingQuery = supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    
    // Only filter by handle if user has sites
    if (siteHandles.length > 0) {
      console.log("📋 Dashboard: Filtering bookings for handles:", siteHandles);
      bookingQuery = bookingQuery.in('handle', siteHandles);
      console.log("📋 Dashboard: Query prepared, about to execute...");
    } else {
      console.log("⚠️ Dashboard: No sites found, will show 0 bookings");
    }
    
    const { data: bookingsData, error } = await bookingQuery;
    
    if (error) {
      console.error("❌ Dashboard: Bookings fetch error:", error.message, error);
      bookingsError = error;
      // Still try to return something - maybe the issue is with the filter
      if (siteHandles.length > 0) {
        console.log("⚠️ Dashboard: Trying without filter to debug...");
        const { data: allBookings } = await supabase
          .from('bookings')
          .select('*')
          .limit(5);
        console.log("📭 Dashboard: All bookings in system:", allBookings?.map((b: any) => ({ id: b.id, handle: b.handle })));
      }
    } else {
      console.log("✅ Dashboard: Fetched", bookingsData?.length || 0, "bookings from query");
      if (bookingsData && bookingsData.length > 0) {
        console.log("🔍 Dashboard: First 3 booking handles:", bookingsData.slice(0, 3).map((b: any) => ({ id: b.id, handle: b.handle, customer: b.customer_name })));
      } else if (siteHandles.length > 0) {
        console.log("⚠️ Dashboard: Query returned 0 bookings but count query returns 2 - checking all bookings...");
        // Debug: Check if ANY bookings exist in the system
        const { data: allBookings } = await supabase.from('bookings').select('id, handle');
        if (allBookings && allBookings.length > 0) {
          console.log("🔍 Dashboard: ALL bookings in system:", allBookings.map((b: any) => ({ id: b.id, handle: b.handle })));
          console.log("⚠️ Dashboard: Handles in sites:", siteHandles);
          console.log("⚠️ Dashboard: Handles in bookings:", [...new Set(allBookings.map((b: any) => b.handle))]);
        } else {
          console.log("📭 Dashboard: No bookings exist in system yet");
        }
      }
      
      // Fetch team member info for each booking if needed
      bookings = (bookingsData || []).map((b: any) => ({
        ...b,
        team_member_name: null, // Will be fetched separately if needed
      }));
      
      // Optionally fetch team member names for bookings that have team_member_id
      const bookingsWithTeam = bookings.filter((b: any) => b.team_member_id);
      if (bookingsWithTeam.length > 0) {
        try {
          const teamIds = bookingsWithTeam.map((b: any) => b.team_member_id);
          const { data: teamData } = await supabase
            .from('team_members')
            .select('id, name')
            .in('id', teamIds);
          
          if (teamData) {
            const teamMap = new Map(teamData.map((t: any) => [t.id, t.name]));
            bookings = bookings.map((b: any) => ({
              ...b,
              team_member_name: b.team_member_id ? teamMap.get(b.team_member_id) || null : null,
            }));
          }
        } catch (err) {
          console.warn("⚠️ Dashboard: Failed to fetch team member names:", err);
        }
      }
    }
    
    // Fetch total count of bookings
    let countQuery = supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });
    
    if (siteHandles.length > 0) {
      countQuery = countQuery.in('handle', siteHandles);
    }
    
    const { count: countData, error: countError } = await countQuery;
    
    if (countError) {
      console.error("❌ Dashboard: Count error:", countError.message);
    } else {
      totalBookingsCount = countData || 0;
      console.log("✅ Dashboard: Total bookings count:", totalBookingsCount);
    }
  } catch (err: any) {
    console.error("❌ Dashboard: Bookings fetch failed:", err.message);
    bookingsError = err;
  }

  // Fetch recent orders for the user's sites (by handle)
  let orders: any[] = [];
  let ordersError: any = null;
  if (siteHandles.length > 0) {
    try {
      const { data: ordersData, error: oErr } = await supabase
        .from('scanly_orders')
        .select('*')
        .in('handle', siteHandles)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (oErr) {
        ordersError = oErr;
        console.warn("⚠️ Dashboard: Orders table not available (optional):", oErr.message);
      } else {
        orders = ordersData || [];
      }
    } catch (err: any) {
      console.warn("⚠️ Dashboard: Orders fetch failed (optional):", err.message);
    }
  }

  if (ordersError) {
    console.error("❌ Dashboard: Orders fetch error:", ordersError.message);
    return NextResponse.json({ error: ordersError.message }, { status: 500 });
  }
  
  console.log("✅ Dashboard: Returning data - sites:", sites?.length || 0, "bookings:", bookings.length, "total count:", totalBookingsCount, "orders:", orders.length);
  
  // Debug info for testing
  const response: any = { bookings, totalBookingsCount, sites, orders };
  if (sites.length === 0) {
    response._debug = "No sites found for user - check if sites were created";
  } else if (bookings.length === 0 && siteHandles.length > 0) {
    response._debug = `Sites found (${sites.length}), but no bookings for handles: ${siteHandles.join(', ')}`;
  }
  
  return NextResponse.json(response);
}
