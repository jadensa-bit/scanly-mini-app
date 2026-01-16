import { NextResponse, NextRequest } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

function jsonError(message: string, status = 400, extra?: any) {
  return NextResponse.json({ ok: false, error: message, ...(extra ?? {}) }, { status });
}

function normalizeHandle(input: unknown) {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

export async function DELETE(req: NextRequest) {
  try {
    console.log("DELETE /api/site/delete called");

    // Get user from session (first try cookies, then try Bearer token)
    let user = null;
    let userId: string | undefined;
    
    const supabaseAuth = await createServerClient();
    const { data: { user: cookieUser }, error } = await supabaseAuth.auth.getUser();
    
    if (cookieUser) {
      user = cookieUser;
      userId = cookieUser.id;
    } else {
      // Try to extract user from Bearer token in Authorization header
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        const supabase = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        try {
          const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
          if (tokenUser) {
            user = tokenUser;
            userId = tokenUser.id;
          }
        } catch (tokenErr) {
          console.error("❌ Token verification failed:", tokenErr);
        }
      }
    }

    // ✅ CRITICAL: Verify user is authenticated before proceeding
    if (!user || !userId) {
      console.error("DELETE /api/site/delete: User not authenticated");
      return jsonError("Unauthorized: Please log in first", 401);
    }

    const body = await req.json().catch(() => null);
    if (!body?.handle) {
      return jsonError("Missing handle", 400);
    }

    const handle = normalizeHandle(body.handle);
    if (!handle) {
      return jsonError("Invalid handle", 400);
    }

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // Try multiple table candidates (like dashboard does)
    const TABLE_CANDIDATES = ["sites", "scanly_sites", "site"];
    let site: any = null;
    let targetTable = null;

    for (const table of TABLE_CANDIDATES) {
      const { data: foundSite, error } = await supabase
        .from(table)
        .select("user_id")
        .eq("handle", handle)
        .maybeSingle();

      const msg = String(error?.message || "").toLowerCase();
      
      // Table doesn't exist → try next
      if (error && (msg.includes("does not exist") || msg.includes("relation") || msg.includes("schema cache"))) {
        console.log(`⏭️ Delete: Table ${table} doesn't exist, trying next`);
        continue;
      }

      if (error) {
        console.error(`❌ Delete: Error querying ${table}:`, error.message);
        continue;
      }

      if (foundSite) {
        site = foundSite;
        targetTable = table;
        console.log(`✅ Delete: Found site in table '${table}'`);
        break;
      }
    }

    if (!site) {
      return jsonError("Site not found", 404);
    }

    if (site.user_id !== userId) {
      return jsonError("Unauthorized: You don't own this site", 403);
    }

    // Delete from the table where we found it
    const { error: deleteError } = await supabase
      .from(targetTable!)
      .delete()
      .eq("handle", handle);

    if (deleteError) {
      console.error("DELETE error:", deleteError);
      return jsonError("Failed to delete site", 500, { detail: deleteError.message });
    }

    console.log("✅ Site deleted:", handle);
    return NextResponse.json({ ok: true, message: "Site deleted successfully" });
  } catch (e: any) {
    console.error("❌ Error in DELETE /api/site/delete:", e);
    return jsonError("Server error", 500, { detail: e?.message });
  }
}
