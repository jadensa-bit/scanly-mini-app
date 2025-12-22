// src/app/api/connect/route.ts
export const runtime = "nodejs";

import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function mustEnv(key: string) {
  const v = (process.env[key] ?? "").trim();
  if (!v) throw new Error(`${key} is missing.`);
  return v;
}

const STRIPE_SECRET_KEY = mustEnv("STRIPE_SECRET_KEY");
const SUPABASE_URL = mustEnv("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = mustEnv("SUPABASE_SERVICE_ROLE_KEY");

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

function getSupabase() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

// Prefer request headers so you never get redirected to some random/wrong domain.
function originFromReq(req: Request) {
  const h = req.headers;
  const proto = h.get("x-forwarded-proto") || "http";
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  return `${proto}://${host}`.replace(/\/+$/, "");
}

function normalizeHandle(h: unknown) {
  return String(h ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 32);
}

// Try both table names so you don’t get stuck on naming mismatch.
const TABLES = ["sites", "scanly_sites"] as const;

async function findSiteRow(supabase: any, handle: string) {
  for (const table of TABLES) {
    const { data, error } = await supabase
      .from(table)
      .select("handle, stripe_account_id")
      .eq("handle", handle)
      .maybeSingle();

    const msg = String(error?.message || "").toLowerCase();
    if (error && (msg.includes("does not exist") || msg.includes("relation") || msg.includes("schema cache"))) {
      continue;
    }
    if (error) return { table, data: null, error };
    if (data) return { table, data, error: null };
    // no error but no data -> keep trying next table, then we’ll create if needed
  }
  return { table: null, data: null, error: null };
}

async function ensureSiteRow(supabase: any, handle: string) {
  // If row exists in either table, return it.
  const found = await findSiteRow(supabase, handle);
  if (found.error) return found;
  if (found.data && found.table) return found;

  // If neither table had the row, create it in the first table that exists.
  for (const table of TABLES) {
    const { error: insErr } = await supabase.from(table).insert({
      handle,
      // keep it minimal: your other routes may store full config elsewhere
      config: { handle },
      updated_at: new Date().toISOString(),
    });

    const msg = String(insErr?.message || "").toLowerCase();

    // table missing -> try next table
    if (insErr && (msg.includes("does not exist") || msg.includes("relation") || msg.includes("schema cache"))) {
      continue;
    }

    if (insErr) return { table, data: null, error: insErr };

    // created successfully; fetch it
    const again = await supabase
      .from(table)
      .select("handle, stripe_account_id")
      .eq("handle", handle)
      .maybeSingle();

    if (again.error) return { table, data: null, error: again.error };
    return { table, data: again.data, error: null };
  }

  return {
    table: null,
    data: null,
    error: new Error(`Could not create a site row. Make sure you have either "sites" or "scanly_sites" table.`),
  };
}

export async function POST(req: Request) {
  try {
    const supabase = getSupabase();
    const body = await req.json().catch(() => ({}));

    const handle = normalizeHandle(body?.handle);
    const email = String(body?.email ?? "").trim() || undefined;

    if (!handle) {
      return NextResponse.json({ ok: false, error: "Missing handle" }, { status: 400 });
    }

    // 1) Ensure site row exists
    const ensured = await ensureSiteRow(supabase, handle);
    if (ensured.error) {
      console.error("Supabase ensureSiteRow error:", ensured.error);
      return NextResponse.json(
        { ok: false, error: "Failed to ensure site row", detail: String(ensured.error.message || ensured.error) },
        { status: 500 }
      );
    }

    const table = ensured.table!;
    const site = ensured.data;

    // 2) If already connected, just return status
    if (site?.stripe_account_id) {
      return NextResponse.json({
        ok: true,
        alreadyConnected: true,
        accountId: site.stripe_account_id,
        table,
      });
    }

    // 3) Create Stripe Express account
    const account = await stripe.accounts.create({
      type: "express",
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: { handle },
    });

    // 4) Save stripe_account_id
    const { error: updErr } = await supabase
      .from(table)
      .update({
        stripe_account_id: account.id,
        updated_at: new Date().toISOString(),
      })
      .eq("handle", handle);

    if (updErr) {
      console.error("Supabase update stripe_account_id error:", updErr);
      return NextResponse.json(
        { ok: false, error: "Failed to save stripe account", detail: updErr.message, table },
        { status: 500 }
      );
    }

    // 5) Create onboarding link (IMPORTANT: use request origin so redirects never go to wrong domain)
    const origin = originFromReq(req);

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${origin}/u/${handle}?connect=refresh`,
      return_url: `${origin}/u/${handle}?connect=return`,
      type: "account_onboarding",
    });

    return NextResponse.json({
      ok: true,
      url: accountLink.url,
      accountId: account.id,
      table,
      origin,
    });
  } catch (e: any) {
    console.error("Stripe connect route error:", e);
    return NextResponse.json(
      { ok: false, error: "Stripe connect failed", detail: e?.message || String(e) },
      { status: 500 }
    );
  }
}
