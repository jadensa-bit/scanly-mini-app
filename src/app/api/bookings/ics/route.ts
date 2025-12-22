export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { persistSession: false } });
}

function toICSDate(d: Date) {
  // YYYYMMDDTHHMMSSZ
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getUTCFullYear() +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    "T" +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    "Z"
  );
}

function esc(s: string) {
  return (s || "")
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

export async function GET(req: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const { searchParams } = new URL(req.url);

    const bookingId = (searchParams.get("booking_id") || "").trim();
    if (!bookingId) return NextResponse.json({ error: "Missing booking_id" }, { status: 400 });

    const { data: booking, error } = await supabase
      .from("bookings")
      .select("id, handle, start_time, end_time, item_title, customer_name, status")
      .eq("id", bookingId)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // You can decide whether to allow ICS for pending; I usually allow confirmed only:
    if (booking.status !== "confirmed") {
      return NextResponse.json({ error: "Booking not confirmed yet" }, { status: 409 });
    }

    const start = new Date(booking.start_time);
    const end = new Date(booking.end_time);

    const title = booking.item_title?.trim()
      ? booking.item_title.trim()
      : `Appointment — @${booking.handle}`;

    const description =
      `Booking confirmed via Scanly.\n` +
      `Handle: @${booking.handle}\n` +
      (booking.customer_name ? `Name: ${booking.customer_name}\n` : "");

    const ics =
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Scanly//Booking//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${esc(booking.id)}@scanly
DTSTAMP:${toICSDate(new Date())}
DTSTART:${toICSDate(start)}
DTEND:${toICSDate(end)}
SUMMARY:${esc(title)}
DESCRIPTION:${esc(description)}
END:VEVENT
END:VCALENDAR`;

    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="scanly-booking-${booking.id}.ics"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Server error" }, { status: 500 });
  }
}
