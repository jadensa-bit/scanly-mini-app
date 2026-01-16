export const runtime = "nodejs";

import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";


function mustEnv(k: string) {
  const v = (process.env[k] ?? "").trim();
  if (!v) {
    console.error(`[stripe-status] ENV MISSING: ${k}`);
    throw new Error(`${k} is missing`);
  }
  return v;
}


let stripe: Stripe;
try {
  const key = mustEnv("STRIPE_SECRET_KEY");
  console.log(`[stripe-status] Using STRIPE_SECRET_KEY: ${key ? key.slice(0, 6) + '...' : 'MISSING'}`);
  stripe = new Stripe(key);
} catch (e) {
  console.error("[stripe-status] Failed to initialize Stripe:", e);
  throw e;
}

const supabase = createClient(mustEnv("SUPABASE_URL"), mustEnv("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

function safeHandle(input: unknown) {
  // ✅ match your builder: allow dash + underscore
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 32);
}

async function tryRetrieveAccount(accountId: string) {
  try {
    const acct = await stripe.accounts.retrieve(accountId);
    return { ok: true as const, acct };
  } catch (e: any) {
    return { ok: false as const, error: e?.message || "Stripe account not found" };
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const handle = safeHandle(searchParams.get("handle"));
    console.log(`[stripe-status] Incoming handle:`, handle);
    if (!handle) return NextResponse.json({ ok: false, error: "Missing handle" }, { status: 400 });


    const { data: site, error } = await supabase
      .from("sites")
      .select("handle, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled")
      .eq("handle", handle)
      .maybeSingle();
    console.log(`[stripe-status] Site lookup result:`, { site, error });

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    // No account yet

    if (!site?.stripe_account_id) {
      console.log(`[stripe-status] No stripe_account_id for handle:`, handle);
      return NextResponse.json({
        ok: true,
        connected: false,
        requires_action: false,
        details_submitted: false,
        charges_enabled: false,
        payouts_enabled: false,
        account_id: null,
        dashboard_url: null,
      });
    }

    const accountId = String(site.stripe_account_id);

    // ✅ If account is stale/deleted, gracefully mark unconnected and clear stored id

    const got = await tryRetrieveAccount(accountId);
    if (!got.ok) {
      console.warn(`[stripe-status] Stripe account retrieval failed:`, got.error);
      await supabase.from("sites").update({ stripe_account_id: null }).eq("handle", handle);

      return NextResponse.json({
        ok: true,
        connected: false,
        requires_action: false,
        details_submitted: false,
        charges_enabled: false,
        payouts_enabled: false,
        account_id: null,
        dashboard_url: null,
        message: "Stripe account was invalid and has been reset. Please reconnect.",
      });
    }

    const acct: any = got.acct;

    const charges_enabled = !!acct.charges_enabled;
    const payouts_enabled = !!acct.payouts_enabled;
    const details_submitted = !!acct.details_submitted;

    // “Action needed” if not fully enabled yet
    const requires_action = !(charges_enabled && payouts_enabled) || !details_submitted;

    // Express dashboard link (only if available)
    let dashboard_url: string | null = null;

    try {
      const login = await stripe.accounts.createLoginLink(accountId);
      dashboard_url = login?.url || null;
    } catch (e) {
      console.warn(`[stripe-status] Failed to create login link:`, e);
      dashboard_url = null;
    }

    // Keep DB in sync (best-effort)

    await supabase
      .from("sites")
      .update({
        stripe_charges_enabled: charges_enabled,
        stripe_payouts_enabled: payouts_enabled,
      })
      .eq("handle", handle);
    console.log(`[stripe-status] Final response:`, {
      ok: true,
      connected: true,
      requires_action,
      details_submitted,
      charges_enabled,
      payouts_enabled,
      account_id: accountId,
      dashboard_url,
    });

    return NextResponse.json({
      ok: true,
      connected: true, // has account id
      requires_action,
      details_submitted,
      charges_enabled,
      payouts_enabled,
      account_id: accountId,
      dashboard_url,
    });
  } catch (e: any) {
    console.error("status route error:", e);
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
