"use client";

import {
  ArrowLeft,
  BadgeCheck,
  Box,
  CreditCard,
  Download,
  Sparkles,
  Sticker,
  Zap,
} from "lucide-react";

const PRODUCTS = [
  {
    title: "QR Card Kit (Premium)",
    price: "$19",
    tag: "physical",
    desc: "A clean set of QR business cards + mini sign layout (designed for conversion).",
    bullets: ["Gloss + matte options", "Designed for Scanly flow", "Ships fast"],
  },
  {
    title: "QR Sticker Pack",
    price: "$12",
    tag: "physical",
    desc: "Stickers for mirrors, doors, vendor tables, delivery bags — anywhere scans happen.",
    bullets: ["Strong adhesive", "Weather-resistant", "Looks premium"],
  },
  {
    title: "Premium Template Pack",
    price: "$15",
    tag: "digital",
    desc: "High-converting layouts for services, booking, digital, or products.",
    bullets: ["Swipeable sections", "Trust + proof blocks", "Modern UI"],
  },
  {
    title: "Add-On: Extra Active QR",
    price: "$3/mo",
    tag: "addon",
    desc: "Perfect for multiple drops, locations, campaigns, or different niches.",
    bullets: ["Keep links separate", "Track per QR", "Easy upsell"],
  },
  {
    title: "Add-On: Custom Domain",
    price: "$5/mo",
    tag: "addon",
    desc: "Make your QR open your branded domain for trust and higher conversion.",
    bullets: ["Looks legit", "Better recall", "Premium feel"],
  },
  {
    title: "Add-On: SMS Reminders",
    price: "$7/mo",
    tag: "addon",
    desc: "Best for booking: reminders reduce no-shows and keep clients locked in.",
    bullets: ["Auto reminders", "No-show reduction", "Higher revenue"],
  },
];

function pill(tag: string) {
  if (tag === "physical") return "bg-white/10 border-white/15";
  if (tag === "digital") return "bg-white/10 border-white/15";
  return "bg-white/10 border-white/15";
}

export default function ScanlyShop() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-6 py-6">
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-3 py-2 text-sm font-semibold hover:bg-white/10 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </a>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
            <BadgeCheck className="h-3.5 w-3.5" />
            Scanly Store • upgrades that boost conversion
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">
            Sell better with the right QR setup
          </h1>
          <p className="mt-2 max-w-2xl text-white/70">
            This is where Scanly makes money beyond subscriptions: physical QR kits,
            premium templates, and conversion add-ons that turn scans into sales.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              { icon: <Zap className="h-4 w-4" />, t: "Built to convert", d: "Not pretty… profitable." },
              { icon: <CreditCard className="h-4 w-4" />, t: "Checkout-ready", d: "Matches Scanly flows." },
              { icon: <Sparkles className="h-4 w-4" />, t: "Premium feel", d: "Better trust on scan." },
            ].map((x) => (
              <div key={x.t} className="rounded-3xl border border-white/10 bg-black/30 p-5">
                <div className="flex items-center gap-2">
                  {x.icon}
                  <div className="text-sm font-semibold">{x.t}</div>
                </div>
                <div className="mt-1 text-sm text-white/70">{x.d}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-3 md:grid-cols-2">
          {PRODUCTS.map((p) => (
            <div key={p.title} className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">{p.title}</div>
                  <div className="mt-1 text-sm text-white/70">{p.desc}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">{p.price}</div>
                  <div className={`mt-2 inline-flex rounded-full border px-2 py-1 text-[10px] ${pill(p.tag)}`}>
                    {p.tag.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                {p.bullets.map((b) => (
                  <div key={b} className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80">
                    {b}
                  </div>
                ))}
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  className="w-full rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 transition active:scale-[0.98]"
                  onClick={() => alert("Demo: connect this to Stripe checkout later")}
                >
                  Buy (demo)
                </button>
                <a
                  href="/create"
                  className="w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition active:scale-[0.98] text-center"
                >
                  Build your QR
                </a>
              </div>

              <div className="mt-2 text-[10px] text-white/50">
                Later: wire “Buy” to Stripe products + fulfillment logic.
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 pb-16 rounded-3xl border border-white/10 bg-black/40 p-6">
          <div className="text-sm font-semibold">How Scanly sells (simple + premium)</div>
          <div className="mt-2 text-sm text-white/70">
            • Subscriptions activate checkout (Active QRs).<br />
            • Add-ons increase ARPU: extra QRs, custom domain, SMS reminders, analytics.<br />
            • Store adds cashflow: QR kits + template packs.
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <Sticker className="h-3.5 w-3.5" /> Physical kits
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <Download className="h-3.5 w-3.5" /> Templates
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
              <Box className="h-3.5 w-3.5" /> Add-ons
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
