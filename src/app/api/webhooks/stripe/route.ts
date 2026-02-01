export const runtime = "nodejs";

import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { sendReceipt, sendBookingConfirmation, formatPhoneNumber, isValidPhoneNumber } from "@/lib/sms";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function jsonError(message: string, status = 400, extra?: any) {
  return NextResponse.json({ ok: false, error: message, ...(extra ?? {}) }, { status });
}

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

function pickOwnerEmailFromSiteRow(row: any): string | null {
  const direct = (row?.owner_email || row?.ownerEmail || row?.notificationEmail || "").toString().trim();
  if (direct) return direct;

  const cfg = row?.config || row?.site?.config || row;
  const email = (cfg?.ownerEmail || cfg?.owner_email || cfg?.notificationEmail || "").toString().trim();
  return email || null;
}

const SITE_TABLES = ["sites", "scanly_sites", "site"];

async function fetchOwnerEmailByHandle(supabase: any, handle: string): Promise<string | null> {
  for (const table of SITE_TABLES) {
    try {
      const res = await supabase
        .from(table)
        .select("handle, config, owner_email, ownerEmail, notificationEmail")
        .eq("handle", handle)
        .maybeSingle();

      const msg = String(res.error?.message || "").toLowerCase();

      // table missing -> try next
      if (res.error && (msg.includes("does not exist") || msg.includes("relation") || msg.includes("schema cache"))) {
        continue;
      }

      // other error -> stop
      if (res.error) {
        console.error(`Owner email lookup error on table ${table}:`, res.error);
        return null;
      }

      if (res.data) {
        const email = pickOwnerEmailFromSiteRow(res.data);
        if (email) return email;
      }
    } catch {
      // ignore and try next
      continue;
    }
  }

  return null;
}

function money(cents: number | null | undefined, currency = "USD") {
  if (!cents || cents <= 0) return "";
  const cur = (currency || "USD").toString().toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: cur }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${cur}`;
  }
}

async function tryDedupeEvent(supabase: any, eventId: string) {
  // If webhook_events(id text primary key) exists, this prevents duplicates.
  // If not, we skip dedupe without failing payments.
  try {
    const { error } = await supabase.from("webhook_events").insert({ id: eventId });
    if (!error) return { deduped: false };

    const msg = String(error.message || "").toLowerCase();
    if (msg.includes("duplicate") || msg.includes("already exists")) return { deduped: true };

    // table missing -> skip
    if (msg.includes("does not exist") || msg.includes("relation") || msg.includes("schema cache")) {
      return { deduped: false, skipped: true };
    }

    return { deduped: false, warn: error.message };
  } catch {
    return { deduped: false };
  }
}

export async function POST(req: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return jsonError("Missing STRIPE_WEBHOOK_SECRET in env", 500);

  const sig = req.headers.get("stripe-signature");
  if (!sig) return jsonError("Missing stripe-signature header", 400);

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    return jsonError(`Webhook signature failed: ${err.message}`, 400);
  }

  const supabase = getSupabaseAdmin();

  // Dedupe (optional)
  const dedupe = await tryDedupeEvent(supabase, event.id);
  if (dedupe.deduped) return NextResponse.json({ ok: true, received: true, deduped: true });

  try {
    if (event.type !== "checkout.session.completed") {
      return NextResponse.json({ ok: true, received: true, type: event.type });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    const handle = (session.metadata?.handle || "").toString().trim();

    // supports orders, bookings, and tips:
    const orderId = (session.metadata?.order_id || session.metadata?.orderId || "").toString().trim();
    const bookingId = (session.metadata?.booking_id || session.metadata?.bookingId || "").toString().trim();
    const tipId = (session.metadata?.tip_id || "").toString().trim();

    const mode = (session.metadata?.mode || "").toString().trim();
    const itemTitle = (session.metadata?.item_title || "").toString().trim();

    const customerEmail =
      (session.customer_details?.email || session.customer_email || "").toString().trim() || null;
    const customerName = (session.customer_details?.name || "").toString().trim() || null;

    const amountTotal = typeof session.amount_total === "number" ? session.amount_total : null;
    const currency = (session.currency || "USD").toString().toUpperCase();

    // If handle missing, still acknowledge (but you’ll want metadata in checkout)
    if (!handle) {
      return NextResponse.json({ ok: true, received: true, warning: "Missing metadata.handle" });
    }

    /* -------------------------
       1) Update BOOKINGS if booking_id exists
    ------------------------- */
    let wroteBooking = false;
    let bookingWarn: string | null = null;

    if (bookingId) {
      // First fetch the booking to get the slot_id
      const { data: bookingData } = await supabase
        .from("bookings")
        .select("slot_id")
        .eq("id", bookingId)
        .single();
      
      const { error: updErr } = await supabase
        .from("bookings")
        .update({
          status: "confirmed",
          stripe_payment_intent: session.payment_intent?.toString() ?? null,
          stripe_session_id: session.id,
        })
        .eq("id", bookingId)
        .eq("handle", handle);

      if (updErr) {
        bookingWarn = updErr.message;
        console.error("Booking update failed:", updErr);
      } else {
        wroteBooking = true;
        
        // Mark the slot as booked if booking has a slot_id
        if (bookingData?.slot_id) {
          const { error: slotErr } = await supabase
            .from("slots")
            .update({ is_booked: true })
            .eq("id", bookingData.slot_id);
          
          if (slotErr) {
            console.warn("⚠️ Failed to mark slot as booked:", slotErr.message);
          } else {
            console.log(`✅ Slot ${bookingData.slot_id} marked as booked via webhook`);
          }
        }
      }
    }

    /* -------------------------
       2) Update ORDERS if order_id exists
          Your app uses scanly_orders (from your /api/checkout route)
    ------------------------- */
    let wroteOrder = false;
    let orderWarn: string | null = null;

    if (orderId) {
      const { error: updErr } = await supabase
        .from("scanly_orders")
        .update({
          status: "paid",
          paid: true,
          stripe_payment_intent: session.payment_intent?.toString() ?? null,
          stripe_session_id: session.id,
          paid_at: new Date().toISOString(),
        })
        .eq("id", orderId)
        .eq("handle", handle);

      if (updErr) {
        orderWarn = updErr.message;
        console.error("Order update failed:", updErr);
      } else {
        wroteOrder = true;
      }
    }

    /* -------------------------
       3) Initialize Resend for emails
    ------------------------- */
    const ownerEmail = await fetchOwnerEmailByHandle(supabase, handle);
    const resend = getResend();
    const from = process.env.RESEND_FROM_EMAIL;

    /* -------------------------
       4) Send digital files to customer if order contains digital items
    ------------------------- */
    if (orderId && customerEmail && mode === "digital") {
      try {
        // Fetch the order with all items
        const { data: orderData } = await supabase
          .from("scanly_orders")
          .select("order_items")
          .eq("id", orderId)
          .single();

        if (orderData?.order_items && Array.isArray(orderData.order_items)) {
          const digitalItems = orderData.order_items.filter((item: any) => item.digitalFile);
          
          if (digitalItems.length > 0 && resend && from) {
            const downloadLinks = digitalItems
              .map((item: any, idx: number) => 
                `<li style="margin-bottom: 12px;">
                  <b>${item.title}</b> ${item.price ? `— ${item.price}` : ''}
                  <br/>
                  <a href="${item.digitalFile}" 
                     style="display:inline-block;margin-top:6px;padding:8px 16px;background:#6366f1;color:white;text-decoration:none;border-radius:8px;font-size:14px;">
                    📥 Download ${item.digitalFileName || 'File'}
                  </a>
                </li>`
              )
              .join('');

            const customerHtml = `
              <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;">
                <h2 style="margin:0 0 8px;">Your Digital Files Are Ready! 🎉</h2>
                <p style="margin:0 0 16px;color:#444;">
                  Thank you for your purchase${customerName ? `, ${customerName}` : ''}! Your digital items are ready to download.
                </p>

                <div style="border:1px solid #eee;border-radius:12px;padding:16px;background:#f9fafb;">
                  <h3 style="margin:0 0 12px;font-size:16px;">Your Downloads:</h3>
                  <ul style="list-style:none;padding:0;margin:0;">
                    ${downloadLinks}
                  </ul>
                </div>

                <p style="margin:16px 0 0;color:#666;font-size:13px;">
                  💡 Tip: Download your files now. These links will remain active for your convenience.
                </p>
                
                <p style="margin:12px 0 0;color:#999;font-size:12px;">
                  From @${handle} • Powered by piqo
                </p>
              </div>
            `;

            await resend.emails.send({
              from,
              to: customerEmail,
              subject: `Your Digital Files from @${handle}`,
              html: customerHtml,
            });
            
            console.log(`✅ Sent digital files email to ${customerEmail} for order ${orderId}`);
          }
        }
      } catch (e: any) {
        console.error("Failed to send digital files email:", e?.message || e);
      }
    }

    /* -------------------------
       3) Update TIPS if tip_id exists
    ------------------------- */
    let wroteTip = false;
    let tipWarn: string | null = null;

    if (tipId) {
      const { error: updErr } = await supabase
        .from("tips")
        .update({
          status: "paid",
          stripe_payment_intent: session.payment_intent?.toString() ?? null,
          stripe_session_id: session.id,
          paid_at: new Date().toISOString(),
        })
        .eq("id", tipId)
        .eq("handle", handle);

      if (updErr) {
        tipWarn = updErr.message;
        console.error("Tip update failed:", updErr);
      } else {
        wroteTip = true;
        console.log(`💰 Tip ${tipId} marked as paid`);
      }
    }

    /* -------------------------
       5) Send SMS receipts to customers
    ------------------------- */
    const customerPhone = (session.metadata?.customer_phone || "").toString().trim() || null;
    
    // Send receipt SMS for orders
    if (orderId && wroteOrder && customerPhone && isValidPhoneNumber(customerPhone)) {
      try {
        const { data: orderData } = await supabase
          .from("scanly_orders")
          .select("order_items, amount_cents, created_at")
          .eq("id", orderId)
          .single();

        if (orderData) {
          const { data: siteData } = await supabase
            .from("scanly_sites")
            .select("config")
            .eq("handle", handle)
            .single();

          const storeName = siteData?.config?.brandName || handle;

          await sendReceipt({
            customerName: customerName || 'Valued Customer',
            customerPhone: formatPhoneNumber(customerPhone),
            items: (orderData.order_items || []).map((item: any) => ({
              name: item.item_title || item.name || 'Item',
              price: parseFloat(item.item_price || 0) / 100,
              quantity: parseInt(item.quantity || 1),
            })),
            total: (orderData.amount_cents || 0) / 100,
            storeName,
            storeHandle: handle,
            orderNumber: orderId.slice(-8).toUpperCase(),
            date: new Date(orderData.created_at),
          });

          console.log(`📱 SMS receipt sent for order ${orderId}`);
        }
      } catch (smsError: any) {
        console.error('SMS receipt failed:', smsError?.message);
      }
    }

    // Send booking confirmation SMS
    if (bookingId && wroteBooking && customerPhone && isValidPhoneNumber(customerPhone)) {
      try {
        const { data: bookingData } = await supabase
          .from("bookings")
          .select("service_name, service, slot_time")
          .eq("id", bookingId)
          .single();

        if (bookingData) {
          const { data: siteData } = await supabase
            .from("scanly_sites")
            .select("config")
            .eq("handle", handle)
            .single();

          const storeName = siteData?.config?.brandName || handle;

          await sendBookingConfirmation({
            customerPhone: formatPhoneNumber(customerPhone),
            customerName: customerName || 'Valued Customer',
            storeName,
            storeHandle: handle,
            service: bookingData.service_name || bookingData.service || itemTitle || 'Service',
            date: new Date(bookingData.slot_time),
            bookingId: bookingId.slice(-8).toUpperCase(),
          });

          console.log(`📱 SMS booking confirmation sent for ${bookingId}`);
        }
      } catch (smsError: any) {
        console.error('SMS booking confirmation failed:', smsError?.message);
      }
    }

    /* -------------------------
       6) Email notification to owner (optional)
    ------------------------- */

    if (ownerEmail && resend && from) {
      const subject =
        bookingId
          ? `New booking for @${handle}${itemTitle ? ` — ${itemTitle}` : ""}`
          : `New payment for @${handle}${itemTitle ? ` — ${itemTitle}` : ""}`;

      const html = `
        <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;">
          <h2 style="margin:0 0 8px;">${bookingId ? "Booking confirmed ✅" : "Payment confirmed ✅"}</h2>
          <p style="margin:0 0 16px;color:#444;">
            Someone just ${bookingId ? "booked and paid" : "paid"} through your Scanly mini-app.
          </p>

          <div style="border:1px solid #eee;border-radius:12px;padding:14px;">
            <div><b>Handle:</b> @${handle}</div>
            ${mode ? `<div><b>Mode:</b> ${mode}</div>` : ""}
            ${itemTitle ? `<div><b>Item:</b> ${itemTitle}</div>` : ""}
            ${customerEmail ? `<div><b>Customer email:</b> ${customerEmail}</div>` : ""}
            ${customerName ? `<div><b>Customer name:</b> ${customerName}</div>` : ""}
            ${amountTotal ? `<div><b>Paid:</b> ${money(amountTotal, currency)}</div>` : ""}
            <div><b>Stripe session:</b> ${session.id}</div>
          </div>

          <p style="margin:14px 0 0;color:#666;font-size:12px;">
            Tip: To stop these emails, remove the Notification Email in the builder.
          </p>
        </div>
      `;

      try {
        await resend.emails.send({ from, to: ownerEmail, subject, html });
      } catch (e: any) {
        console.error("Resend send failed:", e?.message || e);
      }
    }

    return NextResponse.json({
      ok: true,
      received: true,
      handle,
      emailed: !!ownerEmail,
      wroteBooking,
      wroteOrder,
      wroteTip,
      warnings: [dedupe.warn, bookingWarn, orderWarn, tipWarn].filter(Boolean),
    });
  } catch (e: any) {
    console.error("Webhook handler error:", e);
    return jsonError(e?.message ?? "Webhook handler error", 500);
  }
}
