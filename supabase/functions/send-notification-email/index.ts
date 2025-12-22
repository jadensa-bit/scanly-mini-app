import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload?.record;

    if (!record) {
      return new Response("No record", { status: 400 });
    }

    const ownerEmail = String(record.owner_email ?? "").trim();
    if (!ownerEmail) {
      console.log("No owner email — skipping email.");
      return new Response(JSON.stringify({ ok: true, skipped: true }));
    }

    const title = record.title ?? "New booking 🎉";
    const body = record.body ?? "You have a new booking on Scanly.";

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL");

    if (!RESEND_API_KEY || !FROM_EMAIL) {
      console.error("Missing email env vars");
      return new Response("Missing email env", { status: 500 });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: ownerEmail,
        subject: title,
        text: body,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Email failed:", err);
      return new Response(err, { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }));
  } catch (e) {
    console.error("Function error:", e);
    return new Response("Error", { status: 500 });
  }
});
