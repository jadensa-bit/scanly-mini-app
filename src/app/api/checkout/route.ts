// src/app/api/checkout/route.ts
export const runtime = "nodejs";

import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* --------------------
   env helpers
-------------------- */
const getEnv = (key: string) => (process.env[key] ?? "").trim();
function mustEnv(key: string) {
  const v = getEnv(key);
  if (!v) throw new Error(`${key} is missing.`);
  return v;
}

/* --------------------
   required envs
-------------------- */
const STRIPE_SECRET_KEY = mustEnv("STRIPE_SECRET_KEY");
if (!STRIPE_SECRET_KEY.startsWith("sk_")) {
  throw new Error("STRIPE_SECRET_KEY must start with sk_ (sk_test_ or sk_live_).");
}

const SUPABASE_URL = mustEnv("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = mustEnv("SUPABASE_SERVICE_ROLE_KEY");

// IMPORTANT: If you ever saw redirects to a weird domain (like bedpage.com/404),
// it’s usually because NEXT_PUBLIC_APP_URL is set wrong.
// In dev, keep it "http://localhost:3000"
const APP_URL = (getEnv("NEXT_PUBLIC_APP_URL") || "http://localhost:3000").replace(/\/+$/, "");

// Optional platform fee (in basis points). Example: 500 = 5%
// If you’re not charging a fee yet, leave it empty or set to 0.
const PLATFORM_FEE_BPS = Number(getEnv("PLATFORM_FEE_BPS") || "0");

/* --------------------
   clients
-------------------- */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

/* --------------------
   helpers
-------------------- */
function normalizeHandle(h: unknown) {
  return String(h ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 32);
}

function toCents(price: unknown) {
  const n = Number(String(price ?? "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function calcFee(amountCents: number) {
  const bps = clamp(Number.isFinite(PLATFORM_FEE_BPS) ? PLATFORM_FEE_BPS : 0, 0, 2000); // cap at 20%
  const fee = Math.floor((amountCents * bps) / 10_000);
  // Stripe requires application_fee_amount <= amount_total
  return clamp(fee, 0, Math.max(0, amountCents - 1));
}

// Pull creator’s connected account id from Supabase using handle.
// Supports multiple shapes so you don’t get stuck:
async function fetchStripeAccountIdByHandle(handle: string): Promise<string | null> {
  // Try scanly_sites first (you mentioned you use it elsewhere)
  try {
    const a = await supabase
      .from("scanly_sites")
      .select("handle, stripe_account_id, config")
      .eq("handle", handle)
      .maybeSingle();

    if (!a.error && a.data) {
      const direct = String((a.data as any).stripe_account_id || "").trim();
      if (direct) return direct;

      const cfg = (a.data as any).config || {};
      const fromCfg = String(cfg.stripeAccountId || cfg.stripe_account_id || cfg.connectedAccountId || "").trim();
      if (fromCfg) return fromCfg;
    }
  } catch {}

  // Fallback: sites
  try {
    const b = await supabase
      .from("sites")
      .select("handle, stripe_account_id, owner_email, config, site")
      .eq("handle", handle)
      .maybeSingle();

    if (!b.error && b.data) {
      const direct = String((b.data as any).stripe_account_id || "").trim();
      if (direct) return direct;

      const cfg = (b.data as any).config || (b.data as any).site?.config || {};
      const fromCfg = String(cfg.stripeAccountId || cfg.stripe_account_id || cfg.connectedAccountId || "").trim();
      if (fromCfg) return fromCfg;
    }
  } catch {}

  return null;
}

/* --------------------
   handler
-------------------- */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const handle = normalizeHandle(body?.handle);
    const mode = String(body?.mode ?? "").trim();
    
    // Support both single item (legacy) and multiple items (cart)
    const items = body?.items || [];
    const singleItem = body?.item_title ? {
      item_title: String(body?.item_title ?? "").trim(),
      item_price: String(body?.item_price ?? "").trim(),
      quantity: 1,
      note: String(body?.note ?? "").trim(),
    } : null;

    // Use cart items if provided, otherwise fall back to single item
    const lineItems = items.length > 0 ? items : (singleItem ? [singleItem] : []);

    if (!handle) return NextResponse.json({ error: "Missing handle" }, { status: 400 });
    if (!mode) return NextResponse.json({ error: "Missing mode" }, { status: 400 });
    if (lineItems.length === 0) return NextResponse.json({ error: "No items to checkout" }, { status: 400 });

    // Calculate total amount from all items
    let totalAmount = 0;
    const stripeLineItems: any[] = [];

    for (const item of lineItems) {
      const itemTitle = String(item.item_title || "").trim();
      const itemPrice = String(item.item_price || "").trim();
      const quantity = Number(item.quantity) || 1;

      if (!itemTitle) continue;

      const amountPerItem = toCents(itemPrice);
      if (amountPerItem <= 0) continue;

      totalAmount += amountPerItem * quantity;

      stripeLineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: itemTitle },
          unit_amount: amountPerItem,
        },
        quantity: quantity,
      });
    }

    if (stripeLineItems.length === 0) {
      return NextResponse.json({ error: "No valid items to checkout" }, { status: 400 });
    }

    // Stripe Checkout requires a positive amount.
    const amountSafe = Math.max(50, totalAmount); // min $0.50

    // 0) Get creator’s connected Stripe account id
    const destinationAccountId = await fetchStripeAccountIdByHandle(handle);

    // If no Stripe account, create order as completed without payment
    if (!destinationAccountId) {
      console.log(`⚠️ No Stripe account for handle: ${handle} - creating order without payment`);
      
      const orderItemsForDb = lineItems.map((item: any) => ({
        title: item.item_title,
        price: item.item_price,
        quantity: item.quantity,
        note: item.note || '',
      }));

      const { data: order, error: insertError } = await supabase
        .from("scanly_orders")
        .insert({
          handle,
          mode,
          item_title: lineItems.length === 1 ? lineItems[0].item_title : `${lineItems.length} items`,
          item_price: lineItems.length === 1 ? lineItems[0].item_price : `$${(amountSafe / 100).toFixed(2)}`,
          status: "completed",
          paid: false,
          amount_cents: amountSafe,
          currency: "usd",
          customer_name: body?.customer_name || null,
          customer_email: body?.customer_email || null,
          order_items: orderItemsForDb,
        })
        .select()
        .single();

      if (insertError || !order) {
        console.error("Supabase insert error:", insertError);
        return NextResponse.json(
          { error: "Failed to create order", detail: insertError?.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        ok: true,
        noPayment: true,
        orderId: order.id,
        message: "Order created successfully! Payment processing is not yet enabled for this store.",
      });
    }

    if (!destinationAccountId.startsWith("acct_")) {
      return NextResponse.json(
        { error: "Invalid connected account id", detail: destinationAccountId, handle },
        { status: 400 }
      );
    }

    // Optional: Check for duplicate pending orders to prevent spam/retry conflicts
    // For multi-item orders, we'll create a composite key
    const orderSignature = lineItems.map((li: any) => `${li.item_title}:${li.quantity}`).sort().join('|');
    const { data: existingOrder } = await supabase
      .from("scanly_orders")
      .select("id, stripe_session_id")
      .eq("handle", handle)
      .eq("status", "pending")
      .eq("amount_cents", amountSafe)
      .maybeSingle();

    if (existingOrder?.stripe_session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(existingOrder.stripe_session_id);
        if (session.url) {
          return NextResponse.json({
            ok: true,
            url: session.url,
            orderId: existingOrder.id,
            connectedAccountId: destinationAccountId,
            platformFeeCents: calcFee(amountSafe),
          });
        }
      } catch (e) {
        // Session might be expired, continue to create new one
      }
    }

    // Optional platform fee (0 by default)
    const applicationFee = calcFee(amountSafe);

    // 1) Create pending order in Supabase - store items as JSON
    const orderItemsForDb = lineItems.map((item: any) => ({
      title: item.item_title,
      price: item.item_price,
      quantity: item.quantity,
      note: item.note || '',
    }));

    const { data: order, error: insertError } = await supabase
      .from("scanly_orders")
      .insert({
        handle,
        mode,
        item_title: lineItems.length === 1 ? lineItems[0].item_title : `${lineItems.length} items`,
        item_price: lineItems.length === 1 ? lineItems[0].item_price : `$${(amountSafe / 100).toFixed(2)}`,
        status: "pending",
        paid: false,
        amount_cents: amountSafe,
        currency: "usd",
        stripe_connected_account_id: destinationAccountId,
        platform_fee_cents: applicationFee,
        customer_name: body?.customer_name || null,
        customer_email: body?.customer_email || null,
        order_items: orderItemsForDb, // Store multiple items as JSON
      })
      .select()
      .single();

    if (insertError || !order) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to create order", detail: insertError?.message },
        { status: 500 }
      );
    }

    // 2) Create Stripe Checkout Session (DESTINATION CHARGE) with multiple line items
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: stripeLineItems,
      payment_intent_data: {
        application_fee_amount: applicationFee > 0 ? applicationFee : undefined,
        transfer_data: {
          destination: destinationAccountId,
        },
      },
      success_url: `${APP_URL}/u/${handle}?success=1&order=${order.id}`,
      cancel_url: `${APP_URL}/u/${handle}?canceled=1&order=${order.id}`,
      metadata: {
        order_id: String(order.id),
        handle,
        mode,
        item_count: String(lineItems.length),
        amount_cents: String(amountSafe),
        connected_account_id: destinationAccountId,
        platform_fee_cents: String(applicationFee),
      },
    });

    // 3) Save session id on the order
    const { error: updateErr } = await supabase
      .from("scanly_orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    if (updateErr) console.error("Supabase update order error:", updateErr);

    return NextResponse.json({
      ok: true,
      url: session.url,
      orderId: order.id,
      connectedAccountId: destinationAccountId,
      platformFeeCents: applicationFee,
    });
  } catch (e: any) {
    console.error("Checkout error:", e);
    return NextResponse.json(
      { error: "Checkout failed", detail: e?.message || String(e) },
      { status: 500 }
    );
  }
}
