export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function mustEnv(key: string) {
  const v = (process.env[key] ?? "").trim();
  if (!v) throw new Error(`${key} is missing.`);
  return v;
}

const supabase = createClient(mustEnv("SUPABASE_URL"), mustEnv("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false },
});

function escIcs(s: string) {
  return String(s || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

// Parses "YYYY-MM-DD" + "3:30 PM" into { y,m,d,hh,mm }.
// If parsing fails, returns null.
function parseBookingDateTime(dateStr?: string | null, timeStr?: string | null) {
  const d = String(dateStr || "").trim();
  const t = String(timeStr || "").trim();

  const m1 = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m1) return null;

  let hh = 12;
  let mm = 0;

  // Accept "3:30 PM" or "3 PM" or "15:30"
  const m2 =
    t.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i) ||
    t.match(/^(\d{1,2})\s*(am|pm)$/i);

  if (m2) {
    const rawH = Number(m2[1]);
    const rawM = m2[2] ? Number(m2[2]) : 0;
    const ampm = (m2[3] || m2[2] || "").toLowerCase(); // supports both match shapes

    hh = Number.isFinite(rawH) ? rawH : 12;
    mm = Number.isFinite(rawM) ? rawM : 0;

    if (ampm === "pm" && hh < 12) hh += 12;
    if (ampm === "am" && hh === 12) hh = 0;
  } else if (t) {
    // If time is some other format, we keep default noon.
  }

  const y = Number(m1[1]);
  const mo = Number(m1[2]);
  const da = Number(m1[3]);

  if (![y, mo, da, hh, mm].every((x) => Number.isFinite(x))) return null;

  return { y, mo, da, hh, mm };
}

function ymdhms(dt: { y: number; mo: number; da: number; hh: number; mm: number }, sec = 0) {
  return `${dt.y}${pad2(dt.mo)}${pad2(dt.da)}T${pad2(dt.hh)}${pad2(dt.mm)}${pad2(sec)}`;
}

function addMinutes(dt: { y: number; mo: number; da: number; hh: number; mm: number }, mins: number) {
  // Safe enough for same-day durations (we default to 60 minutes)
  const base = new Date(dt.y, dt.mo - 1, dt.da, dt.hh, dt.mm, 0);
  const next = new Date(base.getTime() + mins * 60 * 1000);
  return {
    y: next.getFullYear(),
    mo: next.getMonth() + 1,
    da: next.getDate(),
    hh: next.getHours(),
    mm: next.getMinutes(),
  };
}

// GET /api/public/order-ics?order=123
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("order");
    if (!orderId) return NextResponse.json({ ok: false, error: "Missing order id" }, { status: 400 });

    const { data, error } = await supabase
      .from("scanly_orders")
      .select(
        "id, handle, mode, item_title, customer_name, customer_email, customer_phone, booking_date, booking_time, booking_location, notes, created_at"
      )
      .eq("id", orderId)
      .maybeSingle();

    if (error) return NextResponse.json({ ok: false, error: "Supabase error", detail: error.message }, { status: 500 });
    if (!data) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const tz = (process.env.NEXT_PUBLIC_TIMEZONE || "America/New_York").trim();

    // If not booking, still create a generic event
    const parsed = parseBookingDateTime(data.booking_date, data.booking_time);

    // Default: today at noon, 60min
    const fallback = (() => {
      const now = new Date();
      return { y: now.getFullYear(), mo: now.getMonth() + 1, da: now.getDate(), hh: 12, mm: 0 };
    })();

    const start = parsed || fallback;
    const end = addMinutes(start, 60);

    const summary =
      data.mode === "booking"
        ? `${data.item_title || "Booking"}`
        : `Scanly purchase: ${data.item_title || "Order"}`;

    const descLines = [
      data.customer_name ? `Name: ${data.customer_name}` : null,
      data.customer_email ? `Email: ${data.customer_email}` : null,
      data.customer_phone ? `Phone: ${data.customer_phone}` : null,
      data.notes ? `Notes: ${data.notes}` : null,
      `Order: ${data.id}`,
      `Handle: ${data.handle}`,
    ].filter(Boolean);

    const uid = `scanly-${data.handle}-${data.id}@scanly`;
    const dtstamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Scanly//Booking//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${escIcs(uid)}`,
      `DTSTAMP:${dtstamp}`,
      `SUMMARY:${escIcs(summary)}`,
      `DTSTART;TZID=${escIcs(tz)}:${ymdhms(start)}`,
      `DTEND;TZID=${escIcs(tz)}:${ymdhms(end)}`,
      data.booking_location ? `LOCATION:${escIcs(data.booking_location)}` : "",
      `DESCRIPTION:${escIcs(descLines.join("\n"))}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .filter(Boolean)
      .join("\r\n");

    const filename = `scanly-${data.handle}-${data.id}.ics`;

    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
        Pragma: "no-cache",
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "Server error", detail: e?.message || String(e) }, { status: 500 });
  }
}
