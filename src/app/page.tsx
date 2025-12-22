"use client";

import { motion } from "framer-motion";
import QRCode from "react-qr-code";
import {
  ArrowRight,
  QrCode,
  ScanLine,
  CalendarClock,
  Download,
  Store,
  Zap,
  Sparkles,
  CreditCard,
  ShieldCheck,
  BadgeCheck,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ModeId = "services" | "booking" | "digital" | "products";

const MODES: {
  id: ModeId;
  title: string;
  desc: string;
  icon: any;
  handle: string;
  exampleName: string;
  exampleLine1: string;
  exampleLine2: string;
  examplePrice1: string;
  examplePrice2: string;
}[] = [
  {
    id: "services",
    title: "Barber / Services",
    desc: "Cuts, sessions, installs.",
    icon: ScanLine,
    handle: "demo-barber",
    exampleName: "Studio Fade",
    exampleLine1: "Cut + Lineup",
    exampleLine2: "Cut + Beard",
    examplePrice1: "$35",
    examplePrice2: "$50",
  },
  {
    id: "booking",
    title: "Booking",
    desc: "Deposits + appointments.",
    icon: CalendarClock,
    handle: "demo-booking",
    exampleName: "Glow Aesthetics",
    exampleLine1: "Consult Deposit",
    exampleLine2: "Service Deposit",
    examplePrice1: "$15",
    examplePrice2: "$25",
  },
  {
    id: "digital",
    title: "Digital",
    desc: "Instant files & links.",
    icon: Download,
    handle: "demo-digital",
    exampleName: "FitDrop",
    exampleLine1: "4-Week Plan",
    exampleLine2: "Meal Prep Guide",
    examplePrice1: "$19",
    examplePrice2: "$12",
  },
  {
    id: "products",
    title: "Products",
    desc: "Quick product lists.",
    icon: Store,
    handle: "demo-products",
    exampleName: "Pop-Up Supply",
    exampleLine1: "Logo Tee",
    exampleLine2: "Sticker Pack",
    examplePrice1: "$25",
    examplePrice2: "$7",
  },
];

const USE_ANYWHERE = [
  "On a business card",
  "On a mirror / door sign",
  "In delivery bags",
  "Instagram bio",
  "Vendor table sign",
  "Flyers + posters",
];

function cn(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

function modeAccent(modeId: ModeId) {
  // Ultra subtle “vibe” only. No hard brand colors.
  switch (modeId) {
    case "services":
      return { glow: "rgba(0,255,255,0.22)", badge: "bg-cyan-400/15" };
    case "booking":
      return { glow: "rgba(180,120,255,0.20)", badge: "bg-violet-400/15" };
    case "digital":
      return { glow: "rgba(120,255,0,0.16)", badge: "bg-lime-400/15" };
    case "products":
      return { glow: "rgba(255,170,0,0.16)", badge: "bg-amber-400/15" };
  }
}

/** Animated “scan → app opens” phone preview (reacts to selected mode) */
function AnimatedPhonePreview({
  mode,
}: {
  mode: {
    id: ModeId;
    title: string;
    handle: string;
    exampleName: string;
    exampleLine1: string;
    exampleLine2: string;
    examplePrice1: string;
    examplePrice2: string;
  };
}) {
  const accent = modeAccent(mode.id);

  const topLabel =
    mode.id === "services"
      ? "tap to book & pay"
      : mode.id === "booking"
      ? "deposit to lock in"
      : mode.id === "digital"
      ? "instant download"
      : "quick checkout";

  const payLabel =
    mode.id === "digital"
      ? "Unlock download"
      : mode.id === "booking"
      ? "Pay deposit"
      : "Pay now";

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div
        className="pointer-events-none absolute -inset-6 rounded-[36px] blur-2xl opacity-40"
        style={{
          background: `radial-gradient(circle at 30% 20%, ${accent.glow}, transparent 55%),
                      radial-gradient(circle at 70% 90%, rgba(255,255,255,0.08), transparent 60%)`,
        }}
      />

      <div className="relative rounded-[34px] border border-white/12 bg-white/5 p-4 ring-soft">
        <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-white/10" />

        <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-black/45 p-4">
          <motion.div
            className="pointer-events-none absolute left-0 right-0 h-10"
            style={{
              background:
                "linear-gradient(to bottom, transparent, rgba(255,255,255,0.06), transparent)",
            }}
            animate={{ y: ["-15%", "110%"] }}
            transition={{ duration: 2.3, repeat: Infinity, ease: "easeInOut" }}
          />

          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-white/80">
              {mode.exampleName}
            </div>
            <div
              className={cn(
                "rounded-full border border-white/10 px-2 py-1 text-[10px] text-white/70",
                accent.badge
              )}
            >
              Live demo
            </div>
          </div>

          <motion.div
            key={mode.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] text-white/70"
          >
            <span className="font-semibold text-white/80">{mode.title}</span>
            <span className="text-white/50">•</span>
            <span>{topLabel}</span>
          </motion.div>

          <div className="mt-4 space-y-2">
            <motion.div
              key={`${mode.id}-1`}
              className="rounded-2xl border border-white/10 bg-white/5 p-3"
              animate={{ opacity: [0.35, 1, 1], y: [6, 0, 0] }}
              transition={{ duration: 2.3, repeat: Infinity, ease: "easeOut" }}
            >
              <div className="text-xs text-white/60">Option</div>
              <div className="mt-1 text-sm font-semibold text-white">
                {mode.exampleLine1}
              </div>
              <div className="mt-1 text-xs text-white/60">
                {mode.examplePrice1} • {topLabel}
              </div>
            </motion.div>

            <motion.div
              key={`${mode.id}-2`}
              className="rounded-2xl border border-white/10 bg-white/5 p-3"
              animate={{ opacity: [0.2, 0.85, 1], y: [10, 2, 0] }}
              transition={{
                duration: 2.3,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.15,
              }}
            >
              <div className="text-sm font-semibold text-white">
                {mode.exampleLine2}
              </div>
              <div className="mt-1 text-xs text-white/60">
                {mode.examplePrice2} • Apple Pay ready
              </div>
            </motion.div>

            <motion.div
              key={`${mode.id}-pay`}
              className="rounded-2xl border border-white/10 bg-white/10 p-3 text-center text-sm font-semibold"
              animate={{ opacity: [0.1, 0.8, 1], scale: [0.98, 1, 1] }}
              transition={{
                duration: 2.3,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.25,
              }}
            >
              {payLabel}
            </motion.div>
          </div>

          <div className="mt-3 text-center text-[10px] text-white/50">
            scan → open → choose → pay
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [activeId, setActiveId] = useState<ModeId>("services");
  const active = useMemo(
    () => MODES.find((m) => m.id === activeId)!,
    [activeId]
  );
  const accent = modeAccent(activeId);

  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const demoUrl = useMemo(() => {
    return origin ? `${origin}/${active.handle}` : "";
  }, [origin, active.handle]);

  // Demo modal state
  const [openDemo, setOpenDemo] = useState(false);

  // Centralized “show something” handler for all demo buttons
  const openDemoFor = (id?: ModeId) => {
    if (id) setActiveId(id);
    setOpenDemo(true);
  };

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl px-6 py-6">
        {/* Header */}
        <header className="sticky top-4 z-20">
          <div className="glass ring-soft flex items-center justify-between rounded-3xl px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-2xl border border-white/15 bg-white/10">
                <QrCode className="h-4 w-4 opacity-90" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold tracking-tight">
                  Scanly
                </div>
                <div className="text-xs text-white/60">QR mini-app builder</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openDemoFor()}
                className="rounded-2xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5 transition active:scale-[0.97]"
              >
                Try demo (10 sec)
              </button>

              <a
                href="/create"
                className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 transition active:scale-[0.97]"
              >
                Build yours
              </a>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="pt-16">
          <div className="grid gap-10 md:grid-cols-2 md:items-start">
            {/* Left */}
            <div className="md:pt-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
                <Sparkles className="h-3.5 w-3.5" />
                Tell us how you sell → we generate the mini-app + QR
              </div>

              <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-6xl">
                Make a QR code that
                <br />
                feels like an app.
              </h1>

              <p className="mt-4 max-w-xl text-base text-white/70">
                Not just a “QR shop.” Scanly creates a focused mini-app based on
                your use-case — so people scan and instantly know what to do.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="/create"
                  className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 transition active:scale-[0.97]"
                >
                  Generate my app{" "}
                  <ArrowRight className="ml-2 inline h-4 w-4" />
                </a>

                <button
                  onClick={() => openDemoFor()}
                  className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold hover:bg-white/5 transition active:scale-[0.97]"
                >
                  Open the live demo
                </button>

                <a
                  href="#story"
                  className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold hover:bg-white/5 transition active:scale-[0.97]"
                >
                  See how it works
                </a>
              </div>

              {/* Use anywhere chips */}
              <div className="mt-7">
                <div className="text-xs font-semibold text-white/60">
                  Use it anywhere
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {USE_ANYWHERE.map((t) => (
                    <div
                      key={t}
                      className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80"
                    >
                      {t}
                    </div>
                  ))}
                </div>
              </div>

              {/* Trust bar */}
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="glass ring-soft rounded-3xl p-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <div className="text-sm font-semibold">Made to convert</div>
                  </div>
                  <div className="mt-1 text-xs text-white/60">
                    Scan → choose → pay
                  </div>
                </div>
                <div className="glass ring-soft rounded-3xl p-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    <div className="text-sm font-semibold">Checkout-ready</div>
                  </div>
                  <div className="mt-1 text-xs text-white/60">
                    Stripe + Apple Pay
                  </div>
                </div>
                <div className="glass ring-soft rounded-3xl p-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    <div className="text-sm font-semibold">Printed QR safe</div>
                  </div>
                  <div className="mt-1 text-xs text-white/60">
                    Clean “inactive” state
                  </div>
                </div>
              </div>

              {/* Clarity block */}
              <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-semibold">If you don’t activate:</div>
                <ul className="mt-3 space-y-1 text-sm text-white/70">
                  <li>• Your QR still opens</li>
                  <li>• Payments pause</li>
                  <li>• Page stays clean + branded</li>
                </ul>
                <div className="mt-3 text-xs text-white/60">
                  Activate anytime to resume.
                </div>
              </div>
            </div>

            {/* Right: LIVE QR + Selector + Example */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="glass ring-soft rounded-3xl p-5"
            >
              <div className="rounded-3xl border border-white/10 bg-black/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">Scan the live demo</div>
                    <div className="mt-1 text-xs text-white/60">
                      This QR updates when you switch app types.
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/70">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Live
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr] sm:items-center">
                  <div className="relative mx-auto flex w-full justify-center">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="h-[210px] w-[210px] animate-pulse rounded-full blur-2xl"
                        style={{ background: accent.glow }}
                      />
                    </div>

                    <div className="relative mx-auto flex h-[170px] w-[170px] items-center justify-center rounded-2xl border border-white/10 bg-white">
                      <QRCode value={demoUrl || "https://example.com"} size={132} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-white/60">Currently selected</div>
                    <div className="mt-1 text-sm font-semibold">{active.title}</div>

                    <div className="mt-2 text-xs text-white/60">
                      {origin ? (
                        <>
                          Link:{" "}
                          <span className="font-semibold text-white/80">{`/${active.handle}`}</span>
                        </>
                      ) : (
                        <>Loading link…</>
                      )}
                    </div>

                    <div className="mt-3 text-sm font-semibold text-white animate-pulse">
                      Scan to experience the app — not a website
                    </div>

                    <button
                      onClick={() => openDemoFor()}
                      className="mt-4 inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 transition active:scale-[0.97]"
                    >
                      Open demo on this device{" "}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <div className="text-sm font-semibold">Pick a mini-app type</div>
                <div className="text-xs text-white/60">QR updates live</div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {MODES.map((m) => {
                  const Icon = m.icon;
                  const selected = m.id === activeId;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setActiveId(m.id)}
                      className={cn(
                        "rounded-2xl border p-4 text-left transition active:scale-[0.99]",
                        selected
                          ? "border-white/30 bg-white/10"
                          : "border-white/10 bg-white/5 hover:bg-white/8"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold">{m.title}</div>
                        <Icon className="h-4 w-4 opacity-80" />
                      </div>
                      <div className="mt-1 text-xs text-white/60">{m.desc}</div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{active.exampleName}</div>
                    <div className="mt-1 text-xs text-white/60">
                      This is exactly what customers see after scanning.
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/70">
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Demo
                  </div>
                </div>

                <div className="mt-4 grid gap-2">
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-sm font-semibold">{active.exampleLine1}</div>
                    <div className="text-sm font-semibold">{active.examplePrice1}</div>
                  </div>
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="text-sm font-semibold">{active.exampleLine2}</div>
                    <div className="text-sm font-semibold">{active.examplePrice2}</div>
                  </div>

                  <button
                    onClick={() => openDemoFor()}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 transition active:scale-[0.97]"
                    title="Opens the live demo preview"
                  >
                    Pay (demo)
                  </button>
                </div>

                <button
                  onClick={() => openDemoFor()}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 transition active:scale-[0.97]"
                >
                  Try it in under 10 seconds{" "}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* STORY STRIP */}
        <section id="story" className="mt-10">
          <div className="glass ring-soft rounded-3xl p-6">
            <div className="text-sm font-semibold">What happens after a scan</div>
            <div className="mt-1 text-sm text-white/70">
              This is the whole product: remove steps, remove friction, get paid
              faster.
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2 md:items-center">
              <AnimatedPhonePreview
                mode={{
                  id: active.id,
                  title: active.title,
                  handle: active.handle,
                  exampleName: active.exampleName,
                  exampleLine1: active.exampleLine1,
                  exampleLine2: active.exampleLine2,
                  examplePrice1: active.examplePrice1,
                  examplePrice2: active.examplePrice2,
                }}
              />

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-semibold">This is the “aha”</div>
                <div className="mt-2 text-sm text-white/70">
                  Your QR doesn’t open a random page. It opens a mini-app that’s
                  built for one thing:
                  <span className="font-semibold text-white"> conversion.</span>
                </div>

                <div className="mt-4 grid gap-2">
                  {[
                    "No menus. Just actions.",
                    "Customers instantly know what to tap.",
                    "Designed for real-world QR signs & cards.",
                    "Built for speed: scan → choose → pay.",
                  ].map((t) => (
                    <div
                      key={t}
                      className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm"
                    >
                      {t}
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={() => openDemoFor()}
                    className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 transition active:scale-[0.97]"
                  >
                    Try the demo now{" "}
                    <ArrowRight className="ml-2 inline h-4 w-4" />
                  </button>

                  <a
                    href="/create"
                    className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold hover:bg-white/5 transition active:scale-[0.97]"
                  >
                    Build your own
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-4">
              {[
                ["1) Scan", "Camera opens QR instantly."],
                ["2) Mini-app opens", "Clean page built for your use-case."],
                ["3) Choose", "Item / deposit / download / product."],
                ["4) Pay + Done", "Checkout → confirmation → access."],
              ].map(([t, d]) => (
                <div
                  key={t}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5"
                >
                  <div className="text-sm font-semibold">{t}</div>
                  <div className="mt-1 text-sm text-white/70">{d}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => openDemoFor()}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-white/90 transition active:scale-[0.97]"
              >
                Try a live demo now{" "}
                <ArrowRight className="ml-2 inline h-4 w-4" />
              </button>

              <a
                href="/create"
                className="rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold hover:bg-white/5 transition active:scale-[0.97]"
              >
                Build your own
              </a>
            </div>
          </div>
        </section>

        {/* BIG DEMO SECTION */}
        <section className="mt-10 pb-24">
          <div className="glass ring-soft rounded-3xl p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="text-sm font-semibold">Live demos</div>
                <div className="mt-1 text-sm text-white/70">
                  Click one — it should feel like a real business, not a template.
                </div>
              </div>

              <button
                onClick={() => openDemoFor()}
                className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 transition active:scale-[0.97]"
              >
                Open selected demo
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {MODES.map((d) => (
                <button
                  key={d.id}
                  onClick={() => openDemoFor(d.id)}
                  className={cn(
                    "group rounded-3xl border p-5 text-left transition-transform hover:-translate-y-0.5 active:scale-[0.99]",
                    d.id === activeId
                      ? "border-white/30 bg-white/10"
                      : "border-white/10 bg-white/5 hover:bg-white/8"
                  )}
                >
                  <div className="text-base font-semibold">{d.title}</div>
                  <div className="mt-2 text-sm text-white/70">{d.desc}</div>
                  <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                    Open demo{" "}
                    <ArrowRight className="h-4 w-4 opacity-70 group-hover:opacity-100" />
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold">
                QR codes shouldn’t open websites.
              </div>
              <div className="mt-1 text-sm text-white/70">They should open actions.</div>
            </div>
          </div>
        </section>

        {/* Sticky bottom CTA */}
        <div className="fixed bottom-4 left-0 right-0 z-30">
          <div className="mx-auto max-w-6xl px-6">
            <div className="glass ring-soft flex items-center justify-between rounded-3xl px-4 py-3">
              <div className="text-sm">
                <span className="font-semibold">Selected:</span>{" "}
                <span className="text-white/70">{active.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openDemoFor()}
                  className="rounded-2xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5 transition active:scale-[0.97]"
                >
                  Try demo
                </button>

                <a
                  href="/create"
                  className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 transition active:scale-[0.97]"
                >
                  Build yours
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DEMO MODAL — full “Scanly is the product” scrollable phone preview */}
      {openDemo && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <button
            aria-label="Close demo"
            onClick={() => setOpenDemo(false)}
            className="absolute inset-0 bg-black/60"
          />

          {/* Modal */}
          <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-3xl -translate-x-1/2 -translate-y-1/2">
            <motion.div
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.22 }}
              className="glass ring-soft rounded-3xl border border-white/10 p-5"
            >
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">
                    Interactive demo preview
                  </div>
                  <div className="mt-1 text-sm text-white/70">
                    Scroll the phone — it’s how Scanly feels after a scan.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`/${active.handle}`}
                    className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 transition active:scale-[0.97]"
                  >
                    Open full demo <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                  <button
                    onClick={() => setOpenDemo(false)}
                    className="rounded-2xl border border-white/15 px-3 py-2 text-sm font-semibold hover:bg-white/5 transition"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
                {/* LEFT: explanation + trust */}
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">Selected demo</div>
                      <div className="mt-1 text-sm text-white/70">
                        {active.exampleName} — {active.title}
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/70">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Live preview
                    </div>
                  </div>

                  <div className="mt-4 grid gap-2">
                    {[
                      ["Feels like an app", "No clutter. Just the next action."],
                      ["Built for real-world QR", "Cards, bags, signs, flyers."],
                      ["Designed to convert", "scan → choose → pay → done"],
                    ].map(([t, d]) => (
                      <div
                        key={t}
                        className="rounded-2xl border border-white/10 bg-black/25 p-4"
                      >
                        <div className="text-sm font-semibold">{t}</div>
                        <div className="mt-1 text-sm text-white/70">{d}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                    <div className="text-sm font-semibold">The point</div>
                    <div className="mt-1 text-sm text-white/70">
                      This preview is what your customers see after scanning your QR —
                      clean, fast, and obvious.
                    </div>
                  </div>

                  {/* QR + link */}
                  <div className="mt-4 grid gap-3 sm:grid-cols-[170px_1fr] sm:items-center">
                    <div className="relative mx-auto flex w-full justify-center">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className="h-[210px] w-[210px] animate-pulse rounded-full blur-2xl"
                          style={{ background: accent.glow }}
                        />
                      </div>
                      <div className="relative mx-auto flex h-[160px] w-[160px] items-center justify-center rounded-2xl border border-white/10 bg-white">
                        <QRCode value={demoUrl || "https://example.com"} size={120} />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div className="text-xs text-white/60">Scan link</div>
                      <div className="mt-1 text-sm font-semibold text-white/85">
                        {origin ? `/${active.handle}` : "Loading…"}
                      </div>
                      <div className="mt-2 text-xs text-white/60">
                        Tip: scan this on your phone while the modal is open.
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: the scrollable phone mini-app */}
                <div className="relative">
                  <div
                    className="pointer-events-none absolute -inset-6 rounded-[36px] blur-2xl opacity-40"
                    style={{
                      background: `radial-gradient(circle at 30% 20%, ${accent.glow}, transparent 55%),
                                  radial-gradient(circle at 70% 90%, rgba(255,255,255,0.08), transparent 60%)`,
                    }}
                  />

                  <div className="relative rounded-[34px] border border-white/12 bg-white/5 p-4 ring-soft">
                    <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-white/10" />

                    <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-black/55">
                      {/* sticky top bar */}
                      <div className="sticky top-0 z-10 border-b border-white/10 bg-black/60 px-4 py-3 backdrop-blur">
                        <div className="flex items-center justify-between">
                          <div className="text-xs font-semibold text-white/85">
                            {active.exampleName}
                          </div>
                          <div
                            className={cn(
                              "rounded-full border border-white/10 px-2 py-1 text-[10px] text-white/70",
                              accent.badge
                            )}
                          >
                            live
                          </div>
                        </div>
                        <div className="mt-1 text-[10px] text-white/55">
                          {active.title} • scanly mini-app preview
                        </div>
                      </div>

                      {/* scrollable content */}
                      <div className="h-[520px] overflow-y-auto px-4 pb-5 pt-4">
                        {/* ✅ Scroll cue (ONLY ADDITION) */}
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: [0, 1, 1, 0], y: [-6, 0, 0, -6] }}
                          transition={{ duration: 2.2, times: [0, 0.2, 0.8, 1] }}
                          className="mb-3 flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/70"
                        >
                          <span className="font-semibold text-white/80">
                            Swipe to explore
                          </span>
                          <span className="opacity-80">↓</span>
                        </motion.div>

                        {/* hero card */}
                        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                          <div className="text-xs text-white/60">Welcome</div>
                          <div className="mt-1 text-base font-semibold text-white">
                            One tap. One action. Get paid.
                          </div>
                          <div className="mt-2 text-sm text-white/70">
                            This is what a Scanly QR opens. Not a site — a focused mini-app built for the moment.
                          </div>

                          <div className="mt-3 flex gap-2">
                            <button
                              className="w-full rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 transition active:scale-[0.98]"
                              onClick={() => {}}
                              title="Demo only"
                            >
                              Start here
                            </button>
                            <button
                              className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15 transition active:scale-[0.98]"
                              onClick={() => {}}
                              title="Demo only"
                            >
                              View options
                            </button>
                          </div>
                        </div>

                        {/* offerings */}
                        <div className="mt-4">
                          <div className="text-xs font-semibold text-white/60">
                            Popular right now
                          </div>

                          <div className="mt-2 grid gap-2">
                            <button
                              className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/8 transition active:scale-[0.99]"
                              onClick={() => {}}
                              title="Demo only"
                            >
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-semibold text-white">
                                  {active.exampleLine1}
                                </div>
                                <div className="text-sm font-semibold text-white">
                                  {active.examplePrice1}
                                </div>
                              </div>
                              <div className="mt-1 text-xs text-white/60">
                                Tap → confirm → pay
                              </div>
                            </button>

                            <button
                              className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/8 transition active:scale-[0.99]"
                              onClick={() => {}}
                              title="Demo only"
                            >
                              <div className="flex items-center justify-between">
                                <div className="text-sm font-semibold text-white">
                                  {active.exampleLine2}
                                </div>
                                <div className="text-sm font-semibold text-white">
                                  {active.examplePrice2}
                                </div>
                              </div>
                              <div className="mt-1 text-xs text-white/60">
                                Apple Pay ready
                              </div>
                            </button>
                          </div>
                        </div>

                        {/* proof */}
                        <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4">
                          <div className="text-xs font-semibold text-white/60">
                            Social proof
                          </div>
                          <div className="mt-2 grid gap-2">
                            {[
                              "“This is perfect for QR cards. People don’t get confused.”",
                              "“I stopped doing cash-app screenshots. This just works.”",
                              "“Feels like a real app when you scan it.”",
                            ].map((q) => (
                              <div
                                key={q}
                                className="rounded-2xl border border-white/10 bg-black/35 p-3 text-sm text-white/75"
                              >
                                {q}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* mini checkout (fake) */}
                        <div className="mt-4 rounded-3xl border border-white/10 bg-white/5 p-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-semibold text-white">
                              Checkout (demo)
                            </div>
                            <div className="text-[10px] text-white/55">secure</div>
                          </div>

                          <div className="mt-3 rounded-2xl border border-white/10 bg-black/35 p-3">
                            <div className="text-xs text-white/60">Selected</div>
                            <div className="mt-1 text-sm font-semibold text-white">
                              {active.exampleLine1}
                            </div>
                            <div className="mt-1 text-xs text-white/60">
                              Pay with Apple Pay / Card
                            </div>
                          </div>

                          <button
                            className="mt-3 w-full rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 transition active:scale-[0.98]"
                            onClick={() => {}}
                            title="Demo only"
                          >
                            Pay now (demo)
                          </button>

                          <div className="mt-2 text-[10px] text-white/55">
                            This is where Stripe plugs in on the real build.
                          </div>
                        </div>

                        {/* bottom CTA */}
                        <div className="mt-4 rounded-3xl border border-white/10 bg-black/40 p-4">
                          <div className="text-sm font-semibold text-white">
                            Want yours to look like this?
                          </div>
                          <div className="mt-1 text-sm text-white/70">
                            Tell Scanly what you sell — we generate the mini-app + QR.
                          </div>

                          <a
                            href="/create"
                            className="mt-3 inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 transition active:scale-[0.98]"
                          >
                            Build your own <ArrowRight className="ml-2 h-4 w-4" />
                          </a>
                        </div>

                        <div className="mt-4 text-center text-[10px] text-white/45">
                          end of preview • scroll back up
                        </div>
                      </div>

                      {/* tiny bottom bar */}
                      <div className="border-t border-white/10 bg-black/60 px-4 py-3">
                        <div className="flex items-center justify-between text-[10px] text-white/55">
                          <span>scanly preview</span>
                          <span>tap • scroll • pay</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 text-center text-[11px] text-white/60">
                    Scroll the phone screen — this is the experience your customers get after scanning.
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </main>
  );
}
