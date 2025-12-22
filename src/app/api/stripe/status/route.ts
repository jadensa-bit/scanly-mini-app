export const runtime = "nodejs";

import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function mustEnv(k: string) {
  const v = (process.env[k] ?? "").trim();
  if (!v) throw new Error(`${k} is missing`);
  return v;
}

const stripe = new Stripe(mustEnv("STRIPE_SECRET_KEY"), { apiVersion: "2024-06-20" });

const supabase = createClient(mustEnv("SUPABASE_URL"), mustEnv("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

function safeHandle(input: unknown) {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 32);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const handle = safeHandle(searchParams.get("handle"));
    if (!handle) return NextResponse.json({ ok: false, error: "Missing handle" }, { status: 400 });

    const { data: site, error } = await supabase
      .from("sites")
      .select("handle, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled")
      .eq("handle", handle)
      .maybeSingle();

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    if (!site?.stripe_account_id) {
      return NextResponse.json({ ok: true, connected: false, charges_enabled: false, payouts_enabled: false });
    }

    const acct = await stripe.accounts.retrieve(site.stripe_account_id);

    const charges_enabled = !!(acct as any).charges_enabled;
    const payouts_enabled = !!(acct as any).payouts_enabled;

    await supabase
      .from("sites")
      .update({ stripe_charges_enabled: charges_enabled, stripe_payouts_enabled: payouts_enabled })
      .eq("handle", handle);

    return NextResponse.json({
      ok: true,
      connected: true,
      charges_enabled,
      payouts_enabled,
      accountId: site.stripe_account_id,
    });
  } catch (e: any) {
    console.error("status route error:", e);
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}
