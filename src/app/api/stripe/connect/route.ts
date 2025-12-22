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
  if (!v) throw new Error(`${k} is missing`);
  return v;
}

const STRIPE_SECRET_KEY = mustEnv("STRIPE_SECRET_KEY");
const SUPABASE_URL = mustEnv("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = mustEnv("SUPABASE_SERVICE_ROLE_KEY");

/* --------------------
   clients
-------------------- */
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

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

async function ensureSiteRow(handle: string) {
  // Load existing row
  const { data, error } = await supabase
    .from("sites")
    .select("handle, config, owner_email, stripe_account_id")
    .eq("handle", handle)
    .maybeSingle();

  if (error) throw new Error(`Supabase error loading site: ${error.message}`);

  // Create if missing
  if (!data) {
    const baseConfig = {
      handle,
      brandName: "My Scanly",
      tagline: "Scan → tap → done.",
      mode: "services",
      items: [],
      active: true,
      createdAt: Date.now(),
    };

    const { data: inserted, error: insErr } = await supabase
      .from("sites")
      .insert({
        handle,
        config: baseConfig,
        updated_at: new Date().toISOString(),
      })
      .select("handle, config, owner_email, stripe_account_id")
      .single();

    if (insErr) throw new Error(`Failed creating site row: ${insErr.message}`);
    return inserted;
  }

  // If row exists but config is null-ish (safety)
  if (!data.config) {
    const { data: updated, error: updErr } = await supabase
      .from("sites")
      .update({
        config: { handle },
        updated_at: new Date().toISOString(),
      })
      .eq("handle", handle)
      .select("handle, config, owner_email, stripe_account_id")
      .single();

    if (updErr) throw new Error(`Failed repairing site config: ${updErr.message}`);
    return updated;
  }

  return data;
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

    // 1) Make sure the site exists
    const site = await ensureSiteRow(handle);

    // Prefer explicit email, otherwise owner_email (if you store it), otherwise nothing
    const email = emailFromBody || String(site?.owner_email ?? "").trim() || undefined;

    // 2) Ensure Stripe connected account exists
    let accountId = (site?.stripe_account_id as string | null) || null;

    if (!accountId) {
      const acct = await stripe.accounts.create({
        type: "express",
        email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        metadata: { handle },
      });

      accountId = acct.id;

      const { error: updErr } = await supabase
        .from("sites")
        .update({
          stripe_account_id: accountId,
          updated_at: new Date().toISOString(),
        })
        .eq("handle", handle);

      if (updErr) return jsonError("Failed saving stripe_account_id", 500, { detail: updErr.message });
    }

    // 3) Create onboarding link
    const origin = originFromReq(req);

    // These pages can be simple routes that just redirect back to /create and show a toast.
    const refresh_url = `${origin}/connect/refresh?handle=${encodeURIComponent(handle)}`;
    const return_url = `${origin}/connect/return?handle=${encodeURIComponent(handle)}`;

    const link = await stripe.accountLinks.create({
      account: accountId,
      refresh_url,
      return_url,
      type: "account_onboarding",
    });

    return NextResponse.json({ ok: true, url: link.url, accountId });
  } catch (e: any) {
    console.error("stripe/connect route error:", e);
    return jsonError("Connect failed", 500, { detail: e?.message || String(e) });
  }
}
