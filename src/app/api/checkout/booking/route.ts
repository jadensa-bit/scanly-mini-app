export const runtime = "nodejs";

import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripeSecret = process.env.STRIPE_SECRET_KEY;

if (!stripeSecret) {
  // Don’t throw at import time in production builds; handle in POST.
  console.warn("⚠️ Missing STRIPE_SECRET_KEY in env");
}

const stripe = new Stripe(stripeSecret || "sk_test_missing", {
  apiVersion: "2024-06-20",
});

function jsonError(message: string, status = 400, extra?: any) {
  return NextResponse.json({ ok: false, error: message, ...(extra ?? {}) }, { status });
}

function parsePriceToCents(input: unknown): number | null {
  if (input == null) return null;

  const raw = String(input).trim();
  if (!raw) return null;

  // Remove currency symbols/commas, keep digits + dot
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;

  // If user typed "35" or "35.00"
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num <= 0) return null;

  return Math.round(num * 100);
}

function safeOrigin(req: Request) {
  // Prefer explicit origin header; fallback to localhost
  return req.headers.get("origin") ?? "http://localhost:3000";
}

type Body = {
  handle?: string;
  mode?: "services" | "booking" | "digital" | "products";
  item?: { title?: string; price?: string; note?: string };
  successUrl?: string;
  cancelUrl?: string;
  label?: string;
  currency?: string; // default "usd"
};

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return jsonError("Missing STRIPE_SECRET_KEY in .env.local", 500);
    }

    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body) return jsonError("Invalid JSON body", 400);

    const handle = String(body.handle || "").trim();
    if (!handle) return jsonError("Missing handle", 400);

    const mode = (body.mode || "services") as Body["mode"];
    const currency = String(body.currency || "usd").toLowerCase();

    const itemTitle = String(body.item?.title || "").trim() || "Item";
    const itemNote = String(body.item?.note || "").trim();
    const priceStr = String(body.item?.price || "").trim();

    const amountCents = parsePriceToCents(priceStr);
    if (!amountCents) {
      return jsonError(
        "Invalid price. Use something like $35, 35, or 35.00 (must be > 0).",
        400,
        { got: priceStr }
      );
    }

    const origin = safeOrigin(req);

    // If caller didn’t pass explicit success/cancel, build good defaults.
    const successUrl =
      (body.successUrl && String(body.successUrl).trim()) ||
      `${origin}/u/${encodeURIComponent(handle)}?success=1&session_id={CHECKOUT_SESSION_ID}`;

    const cancelUrl =
      (body.cancelUrl && String(body.cancelUrl).trim()) ||
      `${origin}/u/${encodeURIComponent(handle)}?canceled=1`;

    const label =
      (body.label && String(body.label).trim()) || `Scanly — @${handle} — ${itemTitle}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amountCents,
            product_data: {
              name: label,
              description: itemNote
                ? itemNote
                : mode === "booking"
                ? "Booking / deposit"
                : mode === "digital"
                ? "Digital access"
                : "Purchase",
            },
          },
        },
      ],
      metadata: {
        handle,
        mode: String(mode || "services"),
        item_title: itemTitle,
        item_price: priceStr,
      },
    });

    if (!session.url) {
      return jsonError("Stripe session created but missing redirect URL", 500, {
        sessionId: session.id,
      });
    }

    return NextResponse.json({ ok: true, url: session.url });
  } catch (e: any) {
    console.error("POST /api/checkout error:", e);
    return jsonError("Server error", 500, { detail: e?.message || String(e) });
  }
}
