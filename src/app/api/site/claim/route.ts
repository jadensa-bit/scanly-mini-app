import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url) throw new Error("Missing SUPABASE_URL in .env.local");
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

const TABLE_CANDIDATES = ["sites", "scanly_sites", "site"];

async function findAndClaimSite(supabase: any, handle: string, userId: string) {
  for (const table of TABLE_CANDIDATES) {
    // First, find the site
    const { data: existing, error: findErr } = await supabase
      .from(table)
      .select("*")
      .eq("handle", handle)
      .maybeSingle();

    const msg = String(findErr?.message || "").toLowerCase();
    if (findErr && (msg.includes("does not exist") || msg.includes("relation"))) {
      continue;
    }
    if (findErr) return { table, data: null, error: findErr };
    if (!existing) continue;

    // Check if already claimed
    if (existing.user_id) {
      return {
        table,
        data: null,
        error: new Error(`Site already claimed by another user`),
      };
    }

    // Claim it by setting user_id
    const { data: updated, error: updateErr } = await supabase
      .from(table)
      .update({ user_id: userId, updated_at: new Date().toISOString() })
      .eq("handle", handle)
      .select("handle")
      .maybeSingle();

    if (updateErr) return { table, data: null, error: updateErr };
    if (updated) return { table, data: updated, error: null };
  }

  return {
    table: null,
    data: null,
    error: new Error(`Site not found: ${handle}`),
  };
}

// POST /api/site/claim
export async function POST(req: NextRequest) {
  try {
    // Get user from session
    const supabaseAuth = await createServerClient();
    const { data: { user } } = await supabaseAuth.auth.getUser();

    if (!user || !user.id) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized: Please log in first" },
        { status: 401 }
      );
    }

    const supabase = getSupabase();
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { ok: false, error: "Invalid request body" },
        { status: 400 }
      );
    }

    const handle = String(body.handle || "").trim().toLowerCase();
    if (!handle) {
      return NextResponse.json(
        { ok: false, error: "Handle is required" },
        { status: 400 }
      );
    }

    const result = await findAndClaimSite(supabase, handle, user.id);

    if (result.error) {
      return NextResponse.json(
        { ok: false, error: result.error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      handle: result.data.handle,
      message: `Successfully claimed piqo: ${handle}`,
    });
  } catch (e: any) {
    console.error("POST /api/site/claim error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
