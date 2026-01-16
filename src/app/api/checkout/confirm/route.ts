// src/app/api/checkout/confirm/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const STRIPE_SECRET_KEY = (process.env.STRIPE_SECRET_KEY ?? "").trim();
const SUPABASE_URL = (process.env.SUPABASE_URL ?? "").trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is missing.");
if (!SUPABASE_URL) throw new Error("SUPABASE_URL is missing.");
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing.");

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-12-18.acacia" });
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function safeParseJson(s: string | null | undefined) {
  try {
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

// GET /api/checkout/confirm?session_id=cs_test_...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = String(searchParams.get("session_id") || "").trim();

    if (!sessionId) {
      return NextResponse.json({ ok: false, error: "Missing session_id" }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent"],
    });

    const paid = session.payment_status === "paid";

    // pull metadata
    const md = (session.metadata || {}) as Record<string, string>;
    const orderId = md.order_id || session.client_reference_id || "";

    // Try to load the order from Supabase (nice for displaying stored data later)
    let order: any = null;
    if (orderId) {
      const { data } = await supabase
        .from("scanly_orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();
      order = data ?? null;
    } else {
      const { data } = await supabase
        .from("scanly_orders")
        .select("*")
        .eq("stripe_session_id", sessionId)
        .maybeSingle();
      order = data ?? null;
    }

    // Prefer order.custom_fields if you later add it, otherwise use metadata JSON
    const customFieldsFromOrder = (order as any)?.custom_fields ?? null;
    const customFieldsFromMd = safeParseJson(md.custom_fields_json) ?? null;
    const customFields = customFieldsFromOrder ?? customFieldsFromMd ?? null;

    const item_title = md.item_title || (order as any)?.item_title || "";
    const mode = md.mode || (order as any)?.mode || "";
    const amount_cents =
      Number(md.amount_cents || "") ||
      Number((order as any)?.amount_cents || "") ||
      Number(session.amount_total || 0);

    const customer = {
      name: session.customer_details?.name || (customFields as any)?.name || null,
      email: session.customer_details?.email || (customFields as any)?.email || null,
      phone: session.customer_details?.phone || (customFields as any)?.phone || null,
    };

    return NextResponse.json({
      ok: true,
      paid,
      session_id: session.id,
      order_id: orderId || (order as any)?.id || null,
      mode,
      item_title,
      amount_cents,
      currency: session.currency || "usd",
      customer,
      customFields,
    });
  } catch (e: any) {
    console.error("confirm error:", e);
    return NextResponse.json(
      { ok: false, error: "Could not verify session", detail: e?.message || String(e) },
      { status: 500 }
    );
  }
}
