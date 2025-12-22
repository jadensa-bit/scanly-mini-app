"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  CreditCard,
  Lock,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

type ModeId = "services" | "booking" | "digital" | "products";

type BuildItem = {
  title: string;
  price: string;
  note?: string;
};

type Site = {
  handle: string;
  mode: ModeId;
  brand_name: string;
  tagline: string | null;
  items: BuildItem[];
  stripe_account_id?: string | null;
};

function cn(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

function toCents(price: string) {
  const n = Number(String(price).replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100);
}

function money(price: string) {
  const cents = toCents(price);
  if (!cents) return price || "$0";
  return `$${(cents / 100).toFixed(2)}`;
}

async function fetchSite(handle: string): Promise<Site> {
  const res = await fetch(`/api/public/site?handle=${encodeURIComponent(handle)}`, {
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error || "Failed to load site");
  return data.site as Site;
}

async function startCheckout(payload: any) {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || data?.error || "Checkout failed");
  return data as { ok: true; url: string; orderId: string | number };
}

export default function CheckoutPage() {
  const params = useParams<{ handle: string }>();
  const router = useRouter();
  const sp = useSearchParams();

  const handle = String(params?.handle || "").trim().toLowerCase();
  const presetTitle = sp.get("item") || "";

  const [site, setSite] = useState<Site | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [selectedTitle, setSelectedTitle] = useState(presetTitle);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // mode-specific fields
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [address, setAddress] = useState("");
  const [sizeVariant, setSizeVariant] = useState("Standard");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);

    fetchSite(handle)
      .then((s) => {
        if (!alive) return;
        setSite(s);
        // default select first item
        const first = s.items?.[0]?.title || "";
        setSelectedTitle((prev) => prev || first);
      })
      .catch((e) => alive && setErr(e?.message || "Failed to load"))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [handle]);

  const selectedItem = useMemo(() => {
    if (!site?.items?.length) return null;
    return site.items.find((it) => it.title === selectedTitle) || site.items[0];
  }, [site, selectedTitle]);

  const mode = site?.mode;

  const priceLabel = selectedItem?.price ? money(selectedItem.price) : "$0";

  const modeBlurb = useMemo(() => {
    if (!mode) return "";
    if (mode === "booking") return "Pick a time, add details, and pay to confirm.";
    if (mode === "services") return "Share what you need so the provider can follow up fast.";
    if (mode === "digital") return "Pay once and get instant access after checkout.";
    if (mode === "products") return "Enter shipping details and any preferences.";
    return "";
  }, [mode]);

  async function onPay() {
    if (!site || !selectedItem) return;

    // baseline required
    if (!name.trim()) return setErr("Please enter your name.");
    if (!email.trim()) return setErr("Please enter your email.");

    // mode guards
    if (mode === "booking") {
      if (!date || !time) return setErr("Please pick a date and time.");
    }
    if (mode === "products") {
      if (!address.trim()) return setErr("Please enter a shipping address.");
    }

    setErr(null);
    setSubmitting(true);

    try {
      const customFields: Record<string, any> = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
      };

      if (mode === "booking") {
        customFields.date = date;
        customFields.time = time;
        customFields.location = location.trim() || null;
        customFields.notes = notes.trim() || null;
      } else if (mode === "services") {
        customFields.notes = notes.trim() || null;
        customFields.location = location.trim() || null;
      } else if (mode === "digital") {
        customFields.notes = notes.trim() || null;
      } else if (mode === "products") {
        customFields.address = address.trim();
        customFields.variant = sizeVariant;
        customFields.notes = notes.trim() || null;
      }

      const payload = {
        handle: site.handle,
        mode: site.mode,
        item_title: selectedItem.title,
        item_price: selectedItem.price,
        customFields,
      };

      const out = await startCheckout(payload);
      window.location.href = out.url;
    } catch (e: any) {
      setErr(e?.message || "Checkout failed");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <div className="animate-pulse rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="h-6 w-40 rounded bg-white/10" />
            <div className="mt-4 h-10 w-72 rounded bg-white/10" />
            <div className="mt-6 h-40 rounded bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  if (!site) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center gap-2 text-white/80">
              <ShieldCheck className="h-5 w-5" />
              <div className="font-medium">This link isn’t set up yet.</div>
            </div>
            <div className="mt-2 text-sm text-white/60">
              {err || "Site not found for this handle."}
            </div>

            <div className="mt-6">
              <a
                href="/create"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 font-medium text-black"
              >
                <Sparkles className="h-4 w-4" />
                Build yours
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push(`/u/${site.handle}`)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {site.brand_name}
          </button>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
            <Lock className="h-3.5 w-3.5" />
            Secure checkout
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-5">
          {/* Left: Form */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-3 rounded-3xl border border-white/10 bg-white/5 p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm text-white/60">Checkout</div>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                  {site.brand_name}
                </h1>
                {site.tagline ? (
                  <div className="mt-1 text-sm text-white/60">{site.tagline}</div>
                ) : null}
              </div>

              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white/70">
                <BadgeCheck className="h-4 w-4" />
                Powered by Stripe
              </div>
            </div>

            <div className="mt-4 text-sm text-white/60">{modeBlurb}</div>

            {/* Item picker */}
            <div className="mt-6">
              <div className="text-sm font-medium">What are you buying?</div>
              <div className="mt-3 grid gap-2">
                {site.items?.map((it) => {
                  const active = it.title === selectedTitle;
                  return (
                    <button
                      key={it.title}
                      onClick={() => setSelectedTitle(it.title)}
                      className={cn(
                        "flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
                        active
                          ? "border-white/25 bg-white/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      )}
                    >
                      <div>
                        <div className="font-medium">{it.title}</div>
                        {it.note ? (
                          <div className="mt-0.5 text-xs text-white/55">{it.note}</div>
                        ) : null}
                      </div>
                      <div className="text-sm font-semibold">{money(it.price)}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Customer */}
            <div className="mt-8 grid gap-3">
              <div className="text-sm font-medium">Your details</div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  icon={<User className="h-4 w-4" />}
                  placeholder="Full name"
                  value={name}
                  onChange={setName}
                />
                <Field
                  icon={<Phone className="h-4 w-4" />}
                  placeholder="Phone (optional)"
                  value={phone}
                  onChange={setPhone}
                />
              </div>

              <Field
                icon={<CreditCard className="h-4 w-4" />}
                placeholder="Email"
                value={email}
                onChange={setEmail}
              />

              {/* Mode-specific */}
              {mode === "booking" ? (
                <div className="mt-2 grid gap-3">
                  <div className="text-sm font-medium">Appointment</div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field
                      icon={<CalendarClock className="h-4 w-4" />}
                      placeholder="Date (YYYY-MM-DD)"
                      value={date}
                      onChange={setDate}
                    />
                    <Field
                      icon={<CalendarClock className="h-4 w-4" />}
                      placeholder="Time (ex: 3:30 PM)"
                      value={time}
                      onChange={setTime}
                    />
                  </div>

                  <Field
                    icon={<MapPin className="h-4 w-4" />}
                    placeholder="Location / address (optional)"
                    value={location}
                    onChange={setLocation}
                  />

                  <TextArea
                    placeholder="Anything they should know before your appointment?"
                    value={notes}
                    onChange={setNotes}
                  />
                </div>
              ) : null}

              {mode === "services" ? (
                <div className="mt-2 grid gap-3">
                  <div className="text-sm font-medium">Service details</div>
                  <Field
                    icon={<MapPin className="h-4 w-4" />}
                    placeholder="Where is this needed? (optional)"
                    value={location}
                    onChange={setLocation}
                  />
                  <TextArea
                    placeholder="Describe what you need (the more detail, the faster the response)."
                    value={notes}
                    onChange={setNotes}
                  />
                </div>
              ) : null}

              {mode === "digital" ? (
                <div className="mt-2 grid gap-3">
                  <div className="text-sm font-medium">Optional note</div>
                  <TextArea
                    placeholder="Any preferences or notes before delivery?"
                    value={notes}
                    onChange={setNotes}
                  />
                </div>
              ) : null}

              {mode === "products" ? (
                <div className="mt-2 grid gap-3">
                  <div className="text-sm font-medium">Shipping</div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select
                      label="Variant"
                      value={sizeVariant}
                      onChange={setSizeVariant}
                      options={["Standard", "Small", "Medium", "Large"]}
                    />
                    <Field
                      icon={<MapPin className="h-4 w-4" />}
                      placeholder="Shipping address"
                      value={address}
                      onChange={setAddress}
                    />
                  </div>

                  <TextArea
                    placeholder="Delivery notes / color / size notes (optional)"
                    value={notes}
                    onChange={setNotes}
                  />
                </div>
              ) : null}

              {err ? (
                <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {err}
                </div>
              ) : null}

              <button
                onClick={onPay}
                disabled={submitting}
                className={cn(
                  "mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 font-semibold text-black transition",
                  submitting ? "opacity-70" : "hover:opacity-95"
                )}
              >
                <Lock className="h-4 w-4" />
                {submitting ? "Starting checkout..." : `Pay ${priceLabel}`}
              </button>

              <div className="mt-3 text-center text-xs text-white/45">
                Your payment is processed securely by Stripe.
              </div>
            </div>
          </motion.div>

          {/* Right: Summary */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 rounded-3xl border border-white/10 bg-white/5 p-6"
          >
            <div className="text-sm text-white/60">Order summary</div>

            <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="text-xs text-white/60">Selected</div>
              <div className="mt-1 text-lg font-semibold">{selectedItem?.title}</div>
              {selectedItem?.note ? (
                <div className="mt-1 text-sm text-white/60">{selectedItem.note}</div>
              ) : null}

              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-white/60">Total</div>
                <div className="text-xl font-semibold">{priceLabel}</div>
              </div>
            </div>

            <div className="mt-5 space-y-3 text-sm text-white/70">
              <div className="flex items-start gap-2">
                <ShieldCheck className="mt-0.5 h-4 w-4" />
                <div>
                  <div className="font-medium text-white">Protected checkout</div>
                  <div className="text-white/55">
                    Card details never touch this app.
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <BadgeCheck className="mt-0.5 h-4 w-4" />
                <div>
                  <div className="font-medium text-white">Fast confirmation</div>
                  <div className="text-white/55">
                    You’ll get a receipt + confirmation via email.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon,
  placeholder,
  value,
  onChange,
}: {
  icon?: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
      <div className="text-white/60">{icon}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none placeholder:text-white/35"
      />
    </div>
  );
}

function TextArea({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={4}
      className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-sm outline-none placeholder:text-white/35"
    />
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-xs text-white/55">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-transparent text-sm outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-black">
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}
