"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight, ScanLine, Zap, CheckCircle2, Star, QrCode,
  Smartphone, CreditCard, ShoppingBag, Download, Scissors,
} from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

// ─── Utilities ────────────────────────────────────────────────────────────────
function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Live badge ───────────────────────────────────────────────────────────────
function LiveBadge() {
  const [count, setCount] = useState(143);
  useEffect(() => {
    const id = setInterval(() => setCount((c) => c + Math.floor(Math.random() * 3)), 4200);
    return () => clearInterval(id);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.85 }}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-green-500/30 bg-green-500/10 text-green-300 text-sm font-medium"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      {count} stores live today
    </motion.div>
  );
}

// ─── Interactive Phone Demo ───────────────────────────────────────────────────
type DemoMode = {
  id: string;
  label: string;
  avatar: string;
  name: string;
  handle: string;
  tagline: string;
  category: string;
  rating: number;
  reviews: number;
  bannerFrom: string;
  bannerTo: string;
  items: { name: string; price: string; badge?: string }[];
  actionLabel: string;
};

const DEMO_MODES: DemoMode[] = [
  {
    id: "barber",
    label: "Barber",
    avatar: "💈",
    name: "FreshCuts Studio",
    handle: "@freshcuts",
    tagline: "Premium fades & lineups · Brooklyn, NY",
    category: "Hair & Grooming",
    rating: 4.9,
    reviews: 128,
    bannerFrom: "#18181b",
    bannerTo: "#27272a",
    items: [
      { name: "Signature Fade + Lineup", price: "$45", badge: "🔥 Most popular" },
      { name: "Beard Trim + Hot Towel", price: "$35" },
      { name: "Express Cleanup", price: "$25", badge: "⚡ Quick" },
    ],
    actionLabel: "Book",
  },
  {
    id: "creator",
    label: "Creator",
    avatar: "🎨",
    name: "Maya Visual",
    handle: "@mayavisual",
    tagline: "Lightroom presets & photo packs",
    category: "Digital Products",
    rating: 4.8,
    reviews: 64,
    bannerFrom: "#1e1b4b",
    bannerTo: "#18181b",
    items: [
      { name: "Golden Hour Preset Pack", price: "$18", badge: "⭐ Best seller" },
      { name: "Urban Film Presets", price: "$14" },
      { name: "Full Bundle (3 packs)", price: "$35", badge: "💸 Save 35%" },
    ],
    actionLabel: "Buy",
  },
  {
    id: "food",
    label: "Food",
    avatar: "🍜",
    name: "Mama's Kitchen",
    handle: "@mamaskitchen",
    tagline: "Home cooked plates · pickup & delivery",
    category: "Food & Catering",
    rating: 5.0,
    reviews: 47,
    bannerFrom: "#431407",
    bannerTo: "#18181b",
    items: [
      { name: "Oxtail + Rice & Peas", price: "$22", badge: "🔥 Fan favorite" },
      { name: "Jerk Chicken Plate", price: "$18" },
      { name: "Family Tray (feeds 4)", price: "$65", badge: "👨‍👩‍👧 Family size" },
    ],
    actionLabel: "Order",
  },
  {
    id: "trainer",
    label: "Trainer",
    avatar: "💪",
    name: "Coach Dre Fit",
    handle: "@coachdrefit",
    tagline: "1-on-1 & online personal training",
    category: "Fitness",
    rating: 4.9,
    reviews: 89,
    bannerFrom: "#052e16",
    bannerTo: "#18181b",
    items: [
      { name: "60-Min Strength Session", price: "$75", badge: "🏆 #1 booked" },
      { name: "4-Week Cut Program", price: "$120" },
      { name: "Online Check-In (weekly)", price: "$40", badge: "📱 Remote" },
    ],
    actionLabel: "Book",
  },
];

function InteractivePhoneMock() {
  const [activeId, setActiveId] = useState("barber");
  const [notif, setNotif] = useState(false);

  const mode = DEMO_MODES.find((m) => m.id === activeId) ?? DEMO_MODES[0];

  useEffect(() => {
    setNotif(false);
    const t1 = setTimeout(() => setNotif(true), 1400);
    const t2 = setTimeout(() => setNotif(false), 4800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [activeId]);

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 rounded-full bg-white/5 border border-white/10">
        {DEMO_MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setActiveId(m.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
              activeId === m.id
                ? "bg-green-500 text-white shadow-[0_0_16px_rgba(34,197,94,0.5)]"
                : "text-white/50 hover:text-white/70"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Phone frame */}
      <div className="relative mx-auto w-[272px]">
        {/* glow */}
        <div className="absolute inset-0 rounded-[36px] bg-green-500/15 blur-2xl scale-110 pointer-events-none" />

        <div
          className="relative rounded-[36px] border border-white/15 bg-[#0d0d0d] shadow-2xl overflow-hidden"
          style={{ minHeight: 520 }}
        >
          {/* status bar */}
          <div className="flex items-center justify-between px-5 py-2">
            <span className="text-[10px] text-white/50 font-medium">9:41</span>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-1 rounded-full bg-white/30" />
              <div className="w-3.5 h-1 rounded-full bg-white/30" />
              <div className="w-5 h-2.5 rounded-sm border border-white/30 relative">
                <div className="absolute inset-0.5 right-1 bg-white/50 rounded-sm" />
                <div className="absolute right-[-3px] top-1/2 -translate-y-1/2 w-[2px] h-1 bg-white/30 rounded-sm" />
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
            >
              {/* Banner cover */}
              <div
                className="relative h-20 mx-3 rounded-2xl overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${mode.bannerFrom}, ${mode.bannerTo})`,
                }}
              >
                <div className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage: "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.08) 0%, transparent 50%)",
                  }}
                />
                {/* shimmer */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
                />
                {/* category pill */}
                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/50 border border-white/15">
                  <span className="text-[8px] text-white/70 font-semibold uppercase tracking-wide">{mode.category}</span>
                </div>
              </div>

              {/* Profile info */}
              <div className="px-4 pt-1 pb-2">
                {/* Avatar overlapping banner */}
                <div className="flex items-end justify-between -mt-5 mb-2">
                  <div className="w-11 h-11 rounded-full bg-[#1a1a1a] border-2 border-[#0d0d0d] flex items-center justify-center text-xl shadow-lg">
                    {mode.avatar}
                  </div>
                  <div className="flex items-center gap-1 bg-green-500/15 border border-green-500/30 rounded-full px-2 py-1">
                    <Star className="w-2.5 h-2.5 fill-green-400 text-green-400" />
                    <span className="text-[9px] text-green-300 font-bold">{mode.rating}</span>
                    <span className="text-[9px] text-white/35">({mode.reviews})</span>
                  </div>
                </div>
                <p className="text-white font-black text-sm leading-tight">{mode.name}</p>
                <p className="text-white/40 text-[9px] mb-0.5">{mode.handle}</p>
                <p className="text-white/55 text-[9px] leading-relaxed">{mode.tagline}</p>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/6 mx-3 mb-2" />

              {/* Items */}
              <div className="px-3 space-y-1.5 pb-1">
                {mode.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 rounded-xl bg-white/4 border border-white/6"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[10px] font-semibold leading-tight truncate">{item.name}</p>
                      {item.badge && (
                        <span className="text-[8px] text-white/40">{item.badge}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-green-400 font-black text-[11px]">{item.price}</span>
                      <button className="px-2.5 py-1 rounded-lg bg-green-500 text-white text-[8px] font-black leading-none">
                        {mode.actionLabel}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payment row */}
              <div className="mx-3 mt-2 mb-2 p-2 rounded-xl bg-white/4 border border-white/6 flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                <span className="text-[9px] text-white/40">Apple Pay · Google Pay · Card</span>
              </div>

              {/* Footer */}
              <div className="text-center pb-3 text-[9px] text-white/20 font-medium">
                Powered by piqo
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Notification overlay */}
          <AnimatePresence>
            {notif && (
              <motion.div
                initial={{ y: -52, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -52, opacity: 0 }}
                transition={{ type: "spring", bounce: 0.38 }}
                className="absolute top-10 left-3 right-3 z-30 bg-[#1a1a1a] border border-white/12 rounded-xl shadow-2xl px-3 py-2 flex items-center gap-2"
              >
                <div className="w-7 h-7 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center text-xs flex-shrink-0">
                  {mode.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-[10px] font-bold leading-tight">
                    New {mode.actionLabel.toLowerCase() === "book" ? "booking" : "order"} received!
                  </p>
                  <p className="text-white/40 text-[9px] truncate">{mode.items[0].name} · Just now</p>
                </div>
                <div className="px-1.5 py-0.5 rounded-full bg-green-500/20 border border-green-500/30">
                  <span className="text-[8px] text-green-400 font-black">LIVE</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen font-[var(--font-space)]">

      {/* ── HERO ── */}
      <section className="relative min-h-[100svh] flex flex-col items-center justify-center px-5 pt-24 pb-16 overflow-hidden text-center">
        {/* Orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 left-1/4 w-[480px] h-[480px] bg-green-600/12 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[380px] h-[380px] bg-green-500/8 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm text-white/60 font-medium mb-6"
          >
            <QrCode className="w-3.5 h-3.5 text-green-400" />
            QR-powered mini storefronts
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.04] tracking-tight mb-5"
          >
            Turn one QR code into{" "}
            <span className="text-green-400">
              your money page.
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.22 }}
            className="text-lg sm:text-xl text-white/55 leading-relaxed mb-8 max-w-lg mx-auto"
          >
            Sell products, take bookings, or get paid from your phone.
            <br className="hidden sm:block" /> No website. No app. No friction.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.36 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5"
          >
            <Link
              href="/signup"
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-green-500 hover:bg-green-400 text-white font-bold text-base sm:text-lg shadow-[0_0_40px_rgba(34,197,94,0.35)] hover:shadow-[0_0_56px_rgba(34,197,94,0.55)] transition-all active:scale-95 w-full sm:w-auto"
            >
              Start Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/u/demo-barber"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full border border-white/12 bg-white/4 text-white/80 font-semibold text-base hover:bg-white/8 hover:text-white transition-all active:scale-95 w-full sm:w-auto"
            >
              <ScanLine className="w-4 h-4 text-white/45" />
              See Demo
            </Link>
          </motion.div>

          {/* Trust line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-white/30 mb-6"
          >
            Free to start&nbsp;&nbsp;·&nbsp;&nbsp;No credit card&nbsp;&nbsp;·&nbsp;&nbsp;Live in minutes
          </motion.p>

          <LiveBadge />
        </div>

        {/* Hero phone */}
        <motion.div
          initial={{ opacity: 0, y: 44 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 mt-16 w-full flex justify-center"
        >
          <div className="relative mx-auto w-[272px]">
            <div className="absolute inset-0 rounded-[36px] bg-green-500/12 blur-2xl scale-110 pointer-events-none" />
            <div className="relative rounded-[36px] border border-white/12 bg-[#0d0d0d] shadow-2xl overflow-hidden py-3 px-3">
              {/* status */}
              <div className="flex items-center justify-between px-2 pb-2">
                <span className="text-[10px] text-white/45">9:41</span>
                <div className="flex gap-1">
                  <div className="w-3 h-1.5 rounded-sm bg-white/30" />
                  <div className="w-3 h-1.5 rounded-sm bg-white/30" />
                  <div className="w-4 h-1.5 rounded-sm bg-white/30" />
                </div>
              </div>
              {/* banner */}
              <div className="h-24 rounded-2xl overflow-hidden relative bg-gradient-to-br from-zinc-800 to-zinc-900 mb-1">
                <div className="absolute inset-0 flex flex-col justify-end p-3">
                  <p className="text-white font-black text-sm">FreshCuts Studio</p>
                  <p className="text-white/55 text-[10px]">@freshcuts · Brooklyn, NY</p>
                </div>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/6 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
                />
              </div>
              {/* items */}
              <div className="space-y-1.5 mt-2">
                {[
                  { n: "Signature Fade + Lineup", p: "$45", b: "🔥 Most popular" },
                  { n: "Beard Trim + Hot Towel", p: "$35" },
                  { n: "Express Cleanup", p: "$25" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-white/4 border border-white/6">
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-[10px] font-semibold truncate">{item.n}</p>
                      {item.b && <p className="text-[8px] text-white/35">{item.b}</p>}
                    </div>
                    <span className="text-green-400 font-black text-xs flex-shrink-0">{item.p}</span>
                    <button className="px-2 py-0.5 rounded-lg bg-green-500 text-white text-[8px] font-black flex-shrink-0">Book</button>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/4 border border-white/6">
                <CreditCard className="w-3 h-3 text-white/25" />
                <span className="text-[9px] text-white/35">Apple Pay · Google Pay · Card</span>
              </div>
              <p className="text-center text-[8px] text-white/20 mt-1.5">Powered by piqo</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative py-24 px-5 overflow-hidden">
        <div className="pointer-events-none absolute top-0 right-0 w-72 h-72 bg-green-600/8 rounded-full blur-3xl" />
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-14">
            <p className="text-sm font-semibold text-green-400 mb-3 uppercase tracking-widest">How it works</p>
            <h2 className="text-4xl sm:text-5xl font-black leading-tight">
              Up and running in{" "}
              <span className="text-green-400">3 steps.</span>
            </h2>
          </FadeIn>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                num: "01",
                icon: <Smartphone className="w-6 h-6" />,
                title: "Create your page",
                body: "Sign up, pick a handle, add your brand. Done in under 30 seconds.",
              },
              {
                num: "02",
                icon: <ShoppingBag className="w-6 h-6" />,
                title: "Add what you sell",
                body: "Services, products, bookings, or digital files. Set prices, add photos, publish.",
              },
              {
                num: "03",
                icon: <QrCode className="w-6 h-6" />,
                title: "Share your QR, get paid",
                body: "Download your QR code. Customers scan it, buy from you. Money hits your account.",
              },
            ].map((step, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="relative rounded-2xl border border-white/8 bg-white/[0.03] p-6 h-full hover:border-green-500/25 transition-colors group">
                  <div className="w-12 h-12 rounded-xl mb-5 bg-green-500/15 border border-green-500/25 flex items-center justify-center text-green-400 group-hover:bg-green-500/20 transition-colors">
                    {step.icon}
                  </div>
                  <div className="absolute top-4 right-5 text-5xl font-black text-white/[0.04] select-none">{step.num}</div>
                  <h3 className="text-base font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed">{step.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.3} className="text-center mt-10">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-green-500 hover:bg-green-400 text-white font-bold text-sm shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:shadow-[0_0_44px_rgba(34,197,94,0.5)] transition-all active:scale-95"
            >
              Get started — it&apos;s free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── WHO IT'S FOR ── */}
      <section className="relative py-24 px-5">
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-14">
            <p className="text-sm font-semibold text-green-400 mb-3 uppercase tracking-widest">Who it&apos;s for</p>
            <h2 className="text-4xl sm:text-5xl font-black leading-tight">
              If you sell from your phone,{" "}
              <span className="text-green-400">this is for you.</span>
            </h2>
          </FadeIn>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[
              {
                icon: <Scissors className="w-5 h-5" />,
                label: "Bookings",
                examples: "Barbers · Stylists · Nail techs · Trainers",
              },
              {
                icon: <ShoppingBag className="w-5 h-5" />,
                label: "Products",
                examples: "Merch · Pop-ups · Food · Small shops",
              },
              {
                icon: <Download className="w-5 h-5" />,
                label: "Digital",
                examples: "Guides · Presets · Files · Templates",
              },
              {
                icon: <Zap className="w-5 h-5" />,
                label: "Side Hustles",
                examples: "Anyone selling from their phone",
              },
            ].map((card, i) => (
              <FadeIn key={i} delay={i * 0.07}>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 sm:p-6 h-full hover:border-green-500/25 transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-green-500/12 border border-green-500/20 flex items-center justify-center text-green-400 mb-4 group-hover:bg-green-500/20 transition-colors">
                    {card.icon}
                  </div>
                  <h3 className="text-base font-bold text-white mb-1.5">{card.label}</h3>
                  <p className="text-xs text-white/40 leading-relaxed">{card.examples}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE PHONE DEMO ── */}
      <section className="relative py-24 px-5 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-green-500/6 rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute top-1/2 right-0 w-96 h-96 bg-green-500/6 rounded-full blur-3xl -translate-y-1/2" />
        </div>

        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <p className="text-sm font-semibold text-green-400 mb-3 uppercase tracking-widest">What customers see</p>
            <h2 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
              Exactly what your store
              <br />
              <span className="text-green-400">looks like to buyers.</span>
            </h2>
            <p className="text-white/45 max-w-sm mx-auto text-base">
              They scan your QR, this is what opens. Switch between seller types below.
            </p>
          </FadeIn>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Interactive phone */}
            <div className="flex justify-center order-2 lg:order-1">
              <InteractivePhoneMock />
            </div>

            {/* Feature list */}
            <div className="space-y-3 order-1 lg:order-2">
              {[
                {
                  icon: <ScanLine className="w-5 h-5" />,
                  title: "Works in any camera app",
                  body: "No app download. No typing URLs. Point, scan, done — even on the cheapest phones.",
                },
                {
                  icon: <Zap className="w-5 h-5" />,
                  title: "Checkout in under 10 seconds",
                  body: "Apple Pay, Google Pay, or card. They tap once, you get paid. Nothing faster.",
                },
                {
                  icon: <CreditCard className="w-5 h-5" />,
                  title: "Money goes straight to you",
                  body: "Powered by Stripe. Direct to your bank — no platform holding your cash.",
                },
                {
                  icon: <Smartphone className="w-5 h-5" />,
                  title: "Looks professional on every phone",
                  body: "Polished, fast, mobile-first — whether they scan at your chair, table, or door.",
                },
              ].map((f, i) => (
                <FadeIn key={i} delay={i * 0.08}>
                  <div className="flex gap-3.5 p-4 rounded-2xl border border-white/7 bg-white/[0.03] hover:border-green-500/20 transition-colors">
                    <div className="mt-0.5 flex-shrink-0 text-green-400">{f.icon}</div>
                    <div>
                      <h3 className="font-bold text-white text-sm mb-0.5">{f.title}</h3>
                      <p className="text-xs text-white/40 leading-relaxed">{f.body}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}

              <FadeIn delay={0.35}>
                <Link
                  href="/u/demo-barber"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/12 bg-white/4 text-white/70 text-sm font-semibold hover:text-white hover:bg-white/8 transition-all mt-1"
                >
                  <ScanLine className="w-4 h-4" />
                  Try a live demo
                </Link>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-16 px-5">
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-3 sm:gap-5">
          {[
            { value: "$0", label: "To start", sub: "free forever" },
            { value: "90s", label: "To go live", sub: "from signup" },
            { value: "8s", label: "Avg checkout", sub: "scan to paid" },
          ].map((s, i) => (
            <FadeIn key={i} delay={i * 0.07}>
              <div className="rounded-2xl border border-green-500/15 bg-green-500/5 p-4 sm:p-5 text-center">
                <div className="text-3xl sm:text-4xl font-black text-green-400 mb-0.5">{s.value}</div>
                <div className="text-white font-semibold text-sm">{s.label}</div>
                <div className="text-white/35 text-xs">{s.sub}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="relative py-24 px-5">
        <div className="pointer-events-none absolute bottom-0 left-1/4 w-80 h-80 bg-green-600/6 rounded-full blur-3xl" />
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-12">
            <p className="text-sm font-semibold text-green-400 mb-3 uppercase tracking-widest">Real sellers</p>
            <h2 className="text-4xl sm:text-5xl font-black leading-tight">
              They set it up.{" "}
              <span className="text-green-400">They got paid.</span>
            </h2>
          </FadeIn>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                avatar: "💈",
                name: "Marcus T.",
                role: "Barber · Miami",
                quote: "Made $450 in my first week from walk-ins scanning my table tent. No more 'I'll Venmo you later.'",
              },
              {
                avatar: "💅",
                name: "Jasmine L.",
                role: "Nail Tech · LA",
                quote: "Set up in 2 minutes, posted my QR on Instagram, and booked out 3 days ahead.",
              },
              {
                avatar: "👕",
                name: "Tyler K.",
                role: "Merch · NYC",
                quote: "QR on my merch table — people scan, instant checkout. Sold out in one night.",
              },
            ].map((t, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-white/8 flex items-center justify-center text-lg flex-shrink-0">
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm leading-tight">{t.name}</p>
                      <p className="text-xs text-white/40">{t.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/55 leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex gap-0.5 mt-3">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star key={j} className="w-3 h-3 fill-green-400 text-green-400" />
                    ))}
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative py-28 sm:py-36 px-5 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-green-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <FadeIn>
            <p className="text-sm font-semibold text-green-400 mb-4 uppercase tracking-widest">Your move</p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] mb-5">
              Stop losing sales because
              <br />
              <span className="text-green-400">people don&apos;t know where to buy.</span>
            </h2>
            <p className="text-white/45 text-base sm:text-lg mb-3 max-w-md mx-auto leading-relaxed">
              One QR code. Your page. Their money in your account.
            </p>
            <p className="text-white/25 text-sm mb-10">
              Free to start. No credit card. Live in 90 seconds.
            </p>

            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full bg-green-500 hover:bg-green-400 text-white font-bold text-lg shadow-[0_0_60px_rgba(34,197,94,0.4)] hover:shadow-[0_0_80px_rgba(34,197,94,0.6)] transition-all active:scale-95"
            >
              Create My Page
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>

            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6 text-sm text-white/30">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-500/60" />
                Free forever
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-500/60" />
                No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-500/60" />
                Live in 90 seconds
              </span>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/6 py-10 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/30">
          <div className="font-bold text-white/50 tracking-tight text-base">piqo</div>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="hover:text-white/60 transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-white/60 transition-colors">Login</Link>
            <Link href="/signup" className="hover:text-white/60 transition-colors">Sign Up</Link>
            <Link href="/dashboard" className="hover:text-white/60 transition-colors">Dashboard</Link>
          </div>
          <span className="text-white/18 text-xs">&copy; 2026 piqo</span>
        </div>
      </footer>
    </div>
  );
}
