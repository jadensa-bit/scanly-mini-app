// src/app/api/stripe/connect/route.ts
export const runtime = "nodejs";

import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* --------------------
   env helpers
-------------------- */
function mustEnv(k: string) {
  const v = (process.env[k] ?? "").trim();
  if (!v) {
    console.error(`[stripe-connect] ENV MISSING: ${k}`);
    throw new Error(`${k} is missing`);
  }
  return v;
}


const STRIPE_SECRET_KEY = mustEnv("STRIPE_SECRET_KEY");
const SUPABASE_URL = mustEnv("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = mustEnv("SUPABASE_SERVICE_ROLE_KEY");
console.log(`[stripe-connect] Using STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY ? STRIPE_SECRET_KEY.slice(0, 6) + '...' : 'MISSING'}`);
console.log(`[stripe-connect] Using SUPABASE_URL: ${SUPABASE_URL}`);

/* --------------------
   clients
-------------------- */
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-12-15.clover" });

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/* --------------------
   utils
-------------------- */
function jsonError(message: string, status = 400, extra?: any) {
  return NextResponse.json({ ok: false, error: message, ...(extra ?? {}) }, { status });
}

function safeHandle(input: unknown) {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 32);
}

function originFromReq(req: Request) {
  const h = req.headers;
  const proto = h.get("x-forwarded-proto") || "http";
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  return `${proto}://${host}`.replace(/\/+$/, "");
}

type SiteRow = {
  handle: string;
  config: any;
  owner_email: string | null;
  stripe_account_id: string | null;
};

// Helper to trim config (removes large base64 images from items)
function trimConfig(config: any) {
  // Adding explicit type annotation to the config parameter
  // to fix TypeScript error
  // The type of config is set to any for now
  if (!config || typeof config !== 'object') return config;
  const trimmed = { ...config };
  if (Array.isArray(trimmed.items)) {
    trimmed.items = trimmed.items.map(item => {
      const i = { ...item };
      if (i.image && typeof i.image === 'string' && i.image.length > 500) {
        // Remove or replace large base64 images
        i.image = undefined;
      }
      return i;
    });
  }
  return trimmed;
}

async function ensureSiteRow(handle: string, ownerEmail?: string) {
  // Try to fetch the latest config for this handle
  let latestConfig = null;
  try {
    const { data: existing, error: selErr } = await supabase
      .from("sites")
      .select("config")
      .eq("handle", handle)
      .maybeSingle();
    if (!selErr && existing && existing.config) {
      latestConfig = trimConfig(existing.config);
    }
  } catch {}

  // If no config exists, use a default
  if (!latestConfig) {
    latestConfig = {
      handle,
      brandName: "My Scanly",
      tagline: "Scan → tap → done.",
      mode: "services",
      items: [],
      active: true,
      createdAt: Date.now(),
    };
  }

  // Upsert with the latest config and owner email (only update 'sites' table)
  const { data, error } = await supabase
    .from("sites")
    .upsert(
      {
        handle,
        config: latestConfig,
        ...(ownerEmail ? { owner_email: ownerEmail } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "handle" }
    )
    .select("handle, config, owner_email, stripe_account_id")
    .single();
  console.log(`[stripe-connect] ensureSiteRow upsert result:`, { data, error });
  if (error) throw new Error(`Supabase error ensuring site row: ${error.message}`);

  // Safety: if config is missing, repair it
  if (!data?.config) {
    const { data: repaired, error: updErr } = await supabase
      .from("sites")
      .update({ config: { handle }, updated_at: new Date().toISOString() })
      .eq("handle", handle)
      .select("handle, config, owner_email, stripe_account_id")
      .single();

    if (updErr) throw new Error(`Failed repairing site config: ${updErr.message}`);
    return repaired as SiteRow;
  }

  return data as SiteRow;
}

async function verifyStripeAccount(accountId: string) {
  try {
    const acct = await stripe.accounts.retrieve(accountId);
    // if Stripe returns an object with an id, we consider it valid
    return !!(acct && typeof acct === "object" && "id" in acct && (acct as any).id);
  } catch {
    return false;
  }
}

/* --------------------
   handler
-------------------- */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const handle = safeHandle(body?.handle);
    const emailFromBody = String(body?.email ?? "").trim();
    if (!handle) return jsonError("Missing handle", 400);

    // 1) Ensure the site exists (and optionally store owner_email)
    const site = await ensureSiteRow(handle, emailFromBody || undefined);

    // prefer explicit email, otherwise owner_email, otherwise undefined
    const email = emailFromBody || String(site?.owner_email ?? "").trim() || undefined;

    // 2) Ensure Stripe connected account exists + is valid
    let accountId = (site?.stripe_account_id as string | null) || null;

    if (accountId) {
      const ok = await verifyStripeAccount(accountId);
      if (!ok) {
        // saved ID is stale/broken; recreate
        accountId = null;
      }
    }

    if (!accountId) {
      const acct = await stripe.accounts.create(
        {
          type: "express",
          email,
          capabilities: {
            card_payments: { requested: true },
            transfers: { requested: true },
          },
          metadata: { handle },
        },
        // ✅ prevents duplicates on retries
        { idempotencyKey: `scanly_acct_${handle}` }
      );

      accountId = acct.id;

      // Only update the 'sites' table for stripe_account_id
      try {
        const { error: updErr } = await supabase
          .from("sites")
          .update({
            stripe_account_id: accountId,
            ...(emailFromBody ? { owner_email: emailFromBody } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq("handle", handle);
        console.log(`[stripe-connect] Update table 'sites' result:`, { updErr });
        if (updErr) {
          return jsonError("Failed saving stripe_account_id", 500, { detail: updErr.message });
        }
      } catch (e) {
        console.warn(`[stripe-connect] Exception updating table 'sites':`, e);
      }
    }

    // 3) Create onboarding link
    const origin = originFromReq(req);

    const refresh_url = `${origin}/connect/refresh?handle=${encodeURIComponent(handle)}`;
    const return_url = `${origin}/connect/return?handle=${encodeURIComponent(handle)}`;

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url,
      return_url,
      type: "account_onboarding",
    });
    console.log(`[stripe-connect] Created onboarding link:`, link);
    return NextResponse.json({ ok: true, url: link.url, accountId });
  } catch (e: any) {
    console.error("[stripe-connect] route error:", e);
    return jsonError("Connect failed", 500, { detail: e?.message || String(e) });
  }
}
