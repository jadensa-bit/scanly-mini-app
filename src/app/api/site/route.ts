export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

function noStoreJson(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache",
    },
  });
}

function jsonError(message: string, status = 400, extra?: any) {
  return noStoreJson({ ok: false, error: message, ...(extra ?? {}) }, status);
}

function safeProjectRef(url: string) {
  try {
    const u = new URL(url);
    return u.hostname.split(".")[0] || "unknown";
  } catch {
    return "unknown";
  }
}

// ✅ MUST match your builder + stripe routes (allow dash + underscore)
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

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("Environment check - SUPABASE_URL:", url ? "present" : "MISSING");
  console.log("Environment check - SUPABASE_SERVICE_ROLE_KEY:", serviceKey ? "present" : "MISSING");

  if (!url) throw new Error("Missing SUPABASE_URL in .env.local");
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");

  // SAFE debug (no secrets)
  console.log("✅ /api/site using SUPABASE project ref:", safeProjectRef(url));

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

/**
 * Preferred: one table called "sites" with columns:
 * - handle (text, unique)
 * - config (jsonb)
 * - owner_email (text, nullable)   ✅ optional
 * - stripe_account_id (text, nullable) ✅ optional
 * - updated_at (timestamptz)
 */
const TABLE_CANDIDATES = ["sites", "scanly_sites", "site"];

async function findSiteByHandle(supabase: any, handle: string) {
  for (const table of TABLE_CANDIDATES) {
    const { data, error } = await supabase.from(table).select("*").eq("handle", handle).maybeSingle();

    const msg = String(error?.message || "").toLowerCase();

    // Table doesn't exist → try next
    if (error && (msg.includes("does not exist") || msg.includes("relation") || msg.includes("schema cache"))) {
      continue;
    }

    // Any other error is real
    if (error) return { table, data: null, error };

    if (data) return { table, data, error: null };
  }

  return { table: null, data: null, error: null };
}

function extractOwnerEmail(config: any) {
  // Your builder has both ownerEmail (legacy) and notifications.email (new)
  const a = String(config?.notifications?.email ?? "").trim();
  const b = String(config?.ownerEmail ?? "").trim();
  const c = String(config?.owner_email ?? "").trim();
  return a || b || c || null;
}

async function upsertSite(supabase: any, handle: string, config: any, userId?: string) {
  const owner_email = extractOwnerEmail(config);

  // store full config JSON under config column
  const payload = {
    handle,
    config,
    ...(owner_email ? { owner_email } : {}),
    ...(userId ? { user_id: userId } : {}),
    updated_at: new Date().toISOString(),
  };

  console.log("📝 upsertSite - payload user_id:", payload.user_id || "NOT SET", "handle:", handle);

  for (const table of TABLE_CANDIDATES) {
    console.log(`🔄 Trying table: ${table}`);
    // preserve existing stripe_account_id if present on the existing row
    try {
      const { data: existing, error: selErr } = await supabase.from(table).select("stripe_account_id").eq("handle", handle).maybeSingle();
      if (!selErr && existing && existing.stripe_account_id) {
        // attach existing stripe_account_id so upsert won't wipe it
        // @ts-ignore
        payload.stripe_account_id = existing.stripe_account_id;
        console.log(`✅ Preserved stripe_account_id from ${table}`);
      }
    } catch {}
    const { data, error } = await supabase
      .from(table)
      .upsert(payload, { onConflict: "handle" })
      .select("handle")
      .maybeSingle();

    const msg = String(error?.message || "").toLowerCase();
    console.log(`📊 Table ${table} response:`, { success: !error, error: error?.message, handle: data?.handle });

    // Table/column mismatch → try next
    if (
      error &&
      (msg.includes("does not exist") ||
        msg.includes("relation") ||
        msg.includes("schema cache") ||
        msg.includes("column") ||
        msg.includes("not found"))
    ) {
      console.log(`⏭️ Skipping ${table} - table doesn't exist or missing column`);
      continue;
    }

    if (error) {
      console.error(`❌ Error in ${table}:`, error);
      return { table, data: null, error };
    }
    if (data?.handle) {
      console.log(`✅ Successfully upserted to ${table} with user_id: ${userId}`);
      return { table, data, error: null };
    }
  }

  console.error(`❌ Could not upsert into any table: ${TABLE_CANDIDATES.join(", ")}`);
  return {
    table: null,
    data: null,
    error: new Error(`Could not upsert into any table: ${TABLE_CANDIDATES.join(", ")}`),
  };
}

// GET /api/site?handle=yourname
export async function GET(req: Request) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);

    const handleRaw = searchParams.get("handle");
    const handle = normalizeHandle(handleRaw);

    console.log("GET /api/site handle:", handle);

    if (!handle) return jsonError("Missing handle", 400);

    const out = await findSiteByHandle(supabase, handle);

    if (out.error) {
      console.error("GET /api/site supabase error:", out.error);
      return jsonError("Supabase error", 500, { detail: out.error.message, table: out.table });
    }

    if (!out.data) {
      return jsonError("Not found", 404, { handle, triedTables: TABLE_CANDIDATES });
    }

    // ✅ Return the config cleanly (but keep site row too for stripe fields etc.)
    return noStoreJson({
      ok: true,
      site: out.data,
      config: out.data.config ?? null,
      table: out.table,
    });
  } catch (e: any) {
    console.error("GET /api/site server error:", e);
    return jsonError("Server error", 500, { detail: e?.message || String(e) });
  }
}

// POST /api/site
export async function POST(req: NextRequest) {
  try {
    console.log("POST /api/site called");

    // Get user from session (first try cookies, then try Bearer token)
    let user = null;
    let userId: string | undefined;
    
    const supabaseAuth = await createServerClient();
    console.log("✅ Server client created");
    const { data: { user: cookieUser }, error } = await supabaseAuth.auth.getUser();
    console.log("👤 getUser from cookies result:", { user: cookieUser?.id || "null", error: error?.message });
    
    if (cookieUser) {
      user = cookieUser;
      userId = cookieUser.id;
    } else {
      // Try to extract user from Bearer token in Authorization header
      console.log("🔐 Checking Authorization header...");
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        console.log("📌 Bearer token found, verifying with Supabase...");
        
        const supabase = getSupabase();
        try {
          const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
          console.log("👤 getUser from token result:", { user: tokenUser?.id || "null", error: tokenError?.message });
          
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
      console.error("POST /api/site: User not authenticated");
      return jsonError("Unauthorized: Please log in first", 401);
    }

    console.log("✅ User authenticated:", userId);
    
    const supabase = getSupabase();
    console.log("Supabase client created successfully");

    const body = await req.json().catch((error) => {
      console.error("Failed to parse JSON body:", error);
      return null;
    });
    if (!body) {
      console.error("Invalid JSON body received");
      return jsonError("Invalid JSON body", 400);
    }

    console.log("Request body received:", { handle: body?.handle, brandName: body?.brandName });

    const handle = normalizeHandle(body?.handle);
    const brandName = String(body?.brandName || "").trim();

    if (!handle) {
      console.error("Handle is required but missing");
      return jsonError("handle is required", 400);
    }
    if (!brandName) {
      console.error("BrandName is required but missing");
      return jsonError("brandName is required", 400);
    }

    // ✅ Ensure stored config uses normalized handle + trimmed brandName
    const config = { ...(body || {}), handle, brandName };
    console.log("POST /api/site handle:", handle, "brandName:", brandName, "staffProfiles:", body?.staffProfiles?.length || 0, "config keys:", Object.keys(config));

    // ✅ Always pass userId since we verified authentication above
    const out = await upsertSite(supabase, handle, config, userId);

    if (out.error) {
      console.error("POST /api/site supabase error:", out.error);
      return jsonError("Supabase error", 500, {
        detail: String((out.error as any)?.message || out.error),
        triedTables: TABLE_CANDIDATES,
      });
    }

    // ✅ Save team members from staffProfiles
    if (body?.staffProfiles && Array.isArray(body.staffProfiles) && body.staffProfiles.length > 0) {
      try {
        console.log(`📋 Processing ${body.staffProfiles.length} staff profiles for ${handle}`);
        
        // First, delete old team members for this handle
        const { error: deleteError } = await supabase.from("team_members").delete().eq("creator_handle", handle);
        if (deleteError) {
          console.warn("⚠️ Failed to delete old team members:", deleteError.message);
        }

        // Then insert new ones
        const teamMembers = body.staffProfiles.map((staff: any, idx: number) => ({
          name: (staff.name || "Staff").trim(),
          creator_handle: handle,
          created_at: new Date().toISOString(),
        }));

        console.log(`📝 Inserting team members:`, teamMembers);

        const { data, error: teamError } = await supabase
          .from("team_members")
          .insert(teamMembers)
          .select();

        if (teamError) {
          console.error("❌ Failed to save team members:", teamError.message);
        } else {
          console.log(`✅ Saved ${data?.length || teamMembers.length} team members for ${handle}:`, data);
        }
      } catch (teamErr: any) {
        console.warn("⚠️ Team member save failed (non-critical):", teamErr.message);
      }
    }

    console.log("POST /api/site success for handle:", handle);
    return noStoreJson({ ok: true, handle: out.data.handle, table: out.table });
  } catch (e: any) {
    console.error("POST /api/site server error:", e);
    return jsonError("Server error", 500, { detail: e?.message || String(e) });
  }
}
