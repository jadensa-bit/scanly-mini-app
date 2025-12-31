"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  MapPin,
  Mail,
  Phone,
  Sparkles,
  CalendarPlus,
  Download,
} from "lucide-react";

function safeHandle(input: unknown) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

async function getOrder(orderId: string) {
  const res = await fetch(`/api/public/order?order=${encodeURIComponent(orderId)}`, {
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

export default function ConfirmPage() {
  const params = useParams();
  const router = useRouter();
  const sp = useSearchParams();

  const handle = useMemo(() => safeHandle((params as any)?.handle), [params]);
  const orderId = sp.get("order") || "";
  const success = sp.get("success") === "1";

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setErr("Missing order id.");
      return;
    }

    let alive = true;
    setLoading(true);
    setErr(null);

    getOrder(orderId)
      .then((out) => {
        if (!alive) return;
        if (!out.res.ok) {
          setErr(out.data?.error || "Could not load confirmation.");
          setLoading(false);
          return;
        }
        setOrder(out.data?.order || null);
        setLoading(false);
      })
      .catch((e) => alive && (setErr(e?.message || "Could not load confirmation."), setLoading(false)));

    return () => {
      alive = false;
    };
  }, [orderId]);

  return (
    <main className="min-h-screen bg-black text-white">
      <div
        className="pointer-events-none fixed inset-0 opacity-55"
        style={{
          background:
            "radial-gradient(circle at 20% 10%, rgba(34,211,238,0.18), transparent 55%), radial-gradient(circle at 80% 90%, rgba(255,255,255,0.06), transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-md px-6 py-10">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => router.push(`/u/${handle}?t=${Date.now()}`)}
            className="rounded-2xl border border-white/12 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 transition"
          >
            <ArrowLeft className="inline h-4 w-4 mr-1" />
            Back
          </button>

          <a
            href={`/u/${handle}`}
            className="rounded-2xl border border-white/12 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 transition"
          >
            <Sparkles className="inline h-4 w-4 mr-1" />
            View app
          </a>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          {loading ? (
            <div className="animate-pulse h-24 rounded-2xl bg-white/10" />
          ) : err ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
              {err}
            </div>
          ) : !order ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
              Confirmation not found.
            </div>
          ) : (
            <>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-50">
                <CheckCircle2 className="h-4 w-4" />
                {success ? "Confirmed" : "Status update"}
              </div>

              <h1 className="mt-3 text-2xl font-semibold tracking-tight">
                {order.mode === "booking" ? "Booking confirmed" : "Payment confirmed"}
              </h1>

              <div className="mt-2 text-sm text-white/70">
                <span className="text-white/85 font-medium">{order.item_title}</span>
                {order.item_price ? <span className="text-white/40"> • </span> : null}
                {order.item_price ? <span>{order.item_price}</span> : null}
              </div>

              {order.mode === "booking" ? (
                <>
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="text-xs text-white/60">Appointment</div>
                      <div className="mt-2 flex items-center gap-2 text-sm">
                        <CalendarClock className="h-4 w-4 text-white/70" />
                        <span className="text-white/90">{order.booking_date}</span>
                        <span className="text-white/40">•</span>
                        <span className="text-white/90">{order.booking_time}</span>
                      </div>

                      {order.booking_location ? (
                        <div className="mt-2 flex items-center gap-2 text-sm text-white/80">
                          <MapPin className="h-4 w-4 text-white/70" />
                          <span className="text-white/85">{order.booking_location}</span>
                        </div>
                      ) : null}

                      {order.notes ? (
                        <div className="mt-3 text-sm text-white/70">{order.notes}</div>
                      ) : null}

                      {/* ✅ Add to Calendar */}
                      <div className="mt-4 grid gap-2">
                        <a
                          href={`/api/public/order-ics?order=${encodeURIComponent(order.id)}`}
                          className="w-full rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90 transition active:scale-[0.99] inline-flex items-center justify-center gap-2"
                        >
                          <CalendarPlus className="h-4 w-4" />
                          Add to Calendar
                          <span className="text-black/60 text-xs">(ICS)</span>
                        </a>

                        <a
                          href={`/api/public/order-ics?order=${encodeURIComponent(order.id)}`}
                          className="w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 text-sm font-semibold text-white hover:bg-white/10 transition active:scale-[0.99] inline-flex items-center justify-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download file
                        </a>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                      <div className="text-xs text-white/60">Customer</div>

                      {order.customer_name ? (
                        <div className="mt-2 text-sm text-white/90">{order.customer_name}</div>
                      ) : null}

                      <div className="mt-2 grid gap-2 text-sm">
                        {order.customer_email ? (
                          <div className="flex items-center gap-2 text-white/80">
                            <Mail className="h-4 w-4 text-white/60" />
                            <span>{order.customer_email}</span>
                          </div>
                        ) : null}

                        {order.customer_phone ? (
                          <div className="flex items-center gap-2 text-white/80">
                            <Phone className="h-4 w-4 text-white/60" />
                            <span>{order.customer_phone}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="text-xs text-white/55 flex items-center gap-2">
                      <BadgeCheck className="h-4 w-4" />
                      You’ll also receive a receipt from Stripe.
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-4 text-sm text-white/70">
                  Thanks — your payment went through. You’ll receive a receipt from Stripe.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
