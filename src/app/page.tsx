"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ScanLine, Zap, CheckCircle2, Star, QrCode, Smartphone, CreditCard, ShoppingBag, Download, Scissors, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import Link from "next/link";

// ─── Fade-in wrapper ──────────────────────────────────────────────────────────
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

// ─── Live counter badge ──────────────────────────────────────────────────────
function LiveBadge() {
  const [count, setCount] = useState(143);
  useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * 3));
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.9 }}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-sm font-medium"
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span>{count} stores created today</span>
    </motion.div>
  );
}

// ─── Phone mockup ─────────────────────────────────────────────────────────────
function PhoneMock() {
  const items = [
    { name: "Signature Fade + Lineup", price: "$45", emoji: "✂️", badge: "🔥 Most popular" },
    { name: "Beard Trim + Hot Towel", price: "$35", emoji: "🪒", badge: null },
    { name: "Express Cleanup", price: "$25", emoji: "⚡", badge: "Quick" },
  ];
  const [notif, setNotif] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setNotif(true), 1800);
    const t2 = setTimeout(() => setNotif(false), 5000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="relative mx-auto w-[270px]">
      {/* glow */}
      <div className="absolute inset-0 rounded-[36px] bg-gradient-to-br from-violet-500/30 via-cyan-500/20 to-pink-500/20 blur-2xl scale-110 pointer-events-none" />
      {/* frame */}
      <div className="relative rounded-[36px] border border-white/15 bg-[#0a0a0a] shadow-2xl overflow-hidden">
        {/* status bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1">
          <span className="text-[10px] text-white/60 font-medium">9:41</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-1.5 rounded-sm bg-white/40" />
            <div className="w-3 h-1.5 rounded-sm bg-white/40" />
            <div className="w-3 h-1.5 rounded-sm bg-white/40" />
          </div>
        </div>
        {/* hero banner */}
        <div className="relative h-28 bg-gradient-to-br from-cyan-500 via-violet-600 to-pink-500 overflow-hidden mx-3 rounded-2xl">
          <div className="absolute inset-0 flex flex-col justify-end p-3">
            <p className="text-white font-black text-base leading-tight">FreshCuts Studio</p>
            <p className="text-white/80 text-[10px]">Brooklyn, NY • Premium cuts ✨</p>
          </div>
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
          />
        </div>
        {/* notification */}
        <AnimatePresence>
          {notif && (
            <motion.div
              initial={{ y: -48, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -48, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.4 }}
              className="absolute top-[72px] left-4 right-4 z-20 bg-white rounded-xl shadow-xl px-3 py-2 flex items-center gap-2"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center text-[12px] flex-shrink-0">✂️</div>
              <div>
                <p className="text-black text-[10px] font-bold leading-tight">Someone just booked!</p>
                <p className="text-gray-500 text-[9px]">Signature Fade • Just now</p>
              </div>
              <div className="ml-auto px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[8px] font-black">LIVE</div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* items */}
        <div className="px-3 pt-3 pb-1 space-y-2">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="flex items-center gap-2 p-2 rounded-xl border border-white/8 bg-white/5"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-violet-500/20 flex items-center justify-center text-sm flex-shrink-0">
                {item.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[10px] font-semibold leading-tight truncate">{item.name}</p>
                {item.badge && (
                  <span className="text-[8px] text-cyan-400 font-medium">{item.badge}</span>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-cyan-400 font-black text-xs">{item.price}</span>
                <button className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 text-white text-[8px] font-black">
                  Book
                </button>
              </div>
            </motion.div>
          ))}
        </div>
        {/* pay bar */}
        <div className="mx-3 mb-3 mt-2 p-2 rounded-xl bg-white/5 border border-white/8 flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-white/40 flex-shrink-0" />
          <span className="text-[9px] text-white/50">Apple Pay • Google Pay • Card</span>
          <div className="ml-auto flex items-center gap-0.5">
            <div className="w-5 h-3 rounded-sm bg-white/20 text-[6px] flex items-center justify-center text-white/60 font-bold">AP</div>
            <div className="w-5 h-3 rounded-sm bg-white/20 text-[6px] flex items-center justify-center text-white/60 font-bold">GP</div>
          </div>
        </div>
        {/* powered by */}
        <div className="text-center pb-3 text-[9px] text-white/25 font-medium">
          Powered by piqo
        </div>
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  value,
  label,
  sub,
  color,
  delay,
}: {
  value: string;
  label: string;
  sub: string;
  color: string;
  delay?: number;
}) {
  return (
    <FadeIn delay={delay ?? 0}>
      <div className={`rounded-2xl border p-5 text-center ${color}`}>
        <div className="text-4xl font-black mb-1">{value}</div>
        <div className="text-white font-semibold text-sm">{label}</div>
        <div className="text-white/50 text-xs mt-0.5">{sub}</div>
      </div>
    </FadeIn>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="bg-black text-white min-h-screen font-[var(--font-space)]">

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-5 pt-24 pb-16 overflow-hidden text-center">
        {/* Background orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-pink-600/8 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto">
          {/* eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/12 bg-white/6 text-sm text-white/70 font-medium mb-6"
          >
            <QrCode className="w-3.5 h-3.5" />
            QR-powered mini storefronts
          </motion.div>

          {/* headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-5"
          >
            Your money page,{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
              one QR away.
            </span>
          </motion.h1>

          {/* subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-lg sm:text-xl text-white/60 leading-relaxed mb-8 max-w-lg mx-auto"
          >
            Sell, book, or get paid from your phone. No website. No app. No friction.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.38 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5"
          >
            <Link
              href="/signup"
              className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-bold text-base sm:text-lg shadow-[0_0_40px_rgba(139,92,246,0.4)] hover:shadow-[0_0_60px_rgba(139,92,246,0.6)] transition-all active:scale-95 w-full sm:w-auto overflow-hidden"
            >
              <span className="relative z-10">Start Free</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-0.5 transition-transform" />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
              />
            </Link>
            <Link
              href="/u/demo-barber"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full border border-white/15 bg-white/5 text-white font-semibold text-base hover:bg-white/10 transition-all active:scale-95 w-full sm:w-auto"
            >
              <ScanLine className="w-4 h-4 text-white/60" />
              See Demo
            </Link>
          </motion.div>

          {/* trust line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="text-sm text-white/35 mb-6"
          >
            Free to start&nbsp;&nbsp;·&nbsp;&nbsp;No credit card&nbsp;&nbsp;·&nbsp;&nbsp;Live in minutes
          </motion.p>

          <LiveBadge />
        </div>

        {/* Phone hero visual */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 mt-16 w-full flex justify-center"
        >
          <PhoneMock />
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative py-24 px-5 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 right-0 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-14">
            <p className="text-sm font-semibold text-violet-400 mb-3 uppercase tracking-widest">How it works</p>
            <h2 className="text-4xl sm:text-5xl font-black leading-tight">
              Live in{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                3 steps.
              </span>
            </h2>
          </FadeIn>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                num: "01",
                icon: <Smartphone className="w-6 h-6" />,
                title: "Create your page",
                body: "Sign up, pick a handle, add your brand — done in under 30 seconds.",
                color: "from-cyan-500 to-cyan-600",
              },
              {
                num: "02",
                icon: <ShoppingBag className="w-6 h-6" />,
                title: "Add what you sell",
                body: "Services, products, bookings, or digital files. Prices, photos, done.",
                color: "from-violet-500 to-violet-600",
              },
              {
                num: "03",
                icon: <QrCode className="w-6 h-6" />,
                title: "Share your QR, get paid",
                body: "Download or print your QR code. Customers scan and buy. Money hits your account.",
                color: "from-pink-500 to-pink-600",
              },
            ].map((step, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="relative rounded-2xl border border-white/8 bg-white/4 p-6 h-full hover:border-white/15 transition-colors">
                  <div
                    className={`w-12 h-12 rounded-xl mb-5 bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg`}
                  >
                    {step.icon}
                  </div>
                  <div className="absolute top-4 right-5 text-5xl font-black text-white/4 select-none">{step.num}</div>
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-white/50 leading-relaxed">{step.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={0.35} className="text-center mt-10">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-bold text-sm hover:shadow-[0_0_40px_rgba(139,92,246,0.4)] transition-all active:scale-95"
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
            <p className="text-sm font-semibold text-cyan-400 mb-3 uppercase tracking-widest">Who it&apos;s for</p>
            <h2 className="text-4xl sm:text-5xl font-black leading-tight">
              Built for people{" "}
              <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
                selling from their phone.
              </span>
            </h2>
          </FadeIn>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[
              {
                icon: <Scissors className="w-6 h-6" />,
                label: "Bookings",
                examples: "Barbers · Stylists · Nail techs · Trainers",
                gradient: "from-cyan-500/15 to-cyan-500/5",
                border: "border-cyan-500/20",
                iconBg: "from-cyan-500 to-cyan-600",
              },
              {
                icon: <ShoppingBag className="w-6 h-6" />,
                label: "Products",
                examples: "Merch · Pop-ups · Food · Small shops",
                gradient: "from-violet-500/15 to-violet-500/5",
                border: "border-violet-500/20",
                iconBg: "from-violet-500 to-violet-600",
              },
              {
                icon: <Download className="w-6 h-6" />,
                label: "Digital",
                examples: "Guides · Presets · Files · Templates",
                gradient: "from-pink-500/15 to-pink-500/5",
                border: "border-pink-500/20",
                iconBg: "from-pink-500 to-pink-600",
              },
              {
                icon: <Zap className="w-6 h-6" />,
                label: "Side hustles",
                examples: "Anyone selling from their phone",
                gradient: "from-amber-500/15 to-amber-500/5",
                border: "border-amber-500/20",
                iconBg: "from-amber-500 to-orange-500",
              },
            ].map((card, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div
                  className={`rounded-2xl border ${card.border} bg-gradient-to-br ${card.gradient} p-5 sm:p-6 h-full hover:brightness-110 transition-all`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.iconBg} flex items-center justify-center text-white shadow-lg mb-4`}
                  >
                    {card.icon}
                  </div>
                  <h3 className="text-base font-bold text-white mb-1.5">{card.label}</h3>
                  <p className="text-xs text-white/50 leading-relaxed">{card.examples}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── PHONE DEMO ── */}
      <section className="relative py-24 px-5 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2" />
          <div className="absolute top-1/2 right-0 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl -translate-y-1/2" />
        </div>
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-16">
            <p className="text-sm font-semibold text-pink-400 mb-3 uppercase tracking-widest">What customers see</p>
            <h2 className="text-4xl sm:text-5xl font-black leading-tight mb-4">
              Scan once.
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                Instant storefront.
              </span>
            </h2>
            <p className="text-white/50 max-w-md mx-auto text-base">
              No app download. No typing URLs. They scan — your page opens — they buy. Done in seconds.
            </p>
          </FadeIn>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Phone visual */}
            <div className="flex justify-center">
              <PhoneMock />
            </div>

            {/* Feature list */}
            <div className="space-y-4">
              {[
                {
                  icon: <ScanLine className="w-5 h-5" />,
                  title: "Opens in their camera app",
                  body: "No app store. No loading screens. One scan and they are on your page — even on old phones.",
                  color: "text-cyan-400",
                  border: "border-cyan-500/20",
                  bg: "bg-cyan-500/8",
                },
                {
                  icon: <Zap className="w-5 h-5" />,
                  title: "Checkout in under 10 seconds",
                  body: "Apple Pay, Google Pay, or card. Tap, confirm, done. Fastest checkout they have ever seen.",
                  color: "text-violet-400",
                  border: "border-violet-500/20",
                  bg: "bg-violet-500/8",
                },
                {
                  icon: <CreditCard className="w-5 h-5" />,
                  title: "Money goes straight to you",
                  body: "Powered by Stripe. Payments land in your bank account — no middleman holding your money.",
                  color: "text-pink-400",
                  border: "border-pink-500/20",
                  bg: "bg-pink-500/8",
                },
                {
                  icon: <Sparkles className="w-5 h-5" />,
                  title: "Looks premium on every phone",
                  body: "Your storefront looks polished and professional — whether they scan at your table, your door, or your story.",
                  color: "text-amber-400",
                  border: "border-amber-500/20",
                  bg: "bg-amber-500/8",
                },
              ].map((f, i) => (
                <FadeIn key={i} delay={i * 0.1}>
                  <div className={`flex gap-4 p-4 rounded-2xl border ${f.border} ${f.bg}`}>
                    <div className={`mt-0.5 flex-shrink-0 ${f.color}`}>{f.icon}</div>
                    <div>
                      <h3 className="font-bold text-white text-sm mb-1">{f.title}</h3>
                      <p className="text-xs text-white/45 leading-relaxed">{f.body}</p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>

          <FadeIn delay={0.3} className="text-center mt-12">
            <Link
              href="/u/demo-barber"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-white/15 bg-white/5 text-white font-semibold text-sm hover:bg-white/10 transition-all active:scale-95"
            >
              <ScanLine className="w-4 h-4 text-white/50" />
              Try a live demo
            </Link>
          </FadeIn>
        </div>
      </section>

      {/* ── WHY PIQO ── */}
      <section className="relative py-24 px-5 bg-gradient-to-b from-transparent via-violet-950/10 to-transparent">
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-14">
            <p className="text-sm font-semibold text-violet-400 mb-3 uppercase tracking-widest">Why piqo</p>
            <h2 className="text-4xl sm:text-5xl font-black leading-tight">
              Selling should be{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                this simple.
              </span>
            </h2>
          </FadeIn>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: <QrCode className="w-7 h-7" />,
                title: "One scan, instant page",
                body: "Your storefront loads the moment someone points their camera. No friction, no wait.",
                grad: "from-cyan-500 to-cyan-600",
              },
              {
                icon: <Zap className="w-7 h-7" />,
                title: "Fast checkout",
                body: "Apple Pay, Google Pay, and card built in. Customers pay before they lose interest.",
                grad: "from-violet-500 to-violet-600",
              },
              {
                icon: <Smartphone className="w-7 h-7" />,
                title: "Built for mobile selling",
                body: "Runs perfect on every phone. Create from mobile, sell to mobile. That is it.",
                grad: "from-pink-500 to-pink-600",
              },
            ].map((card, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="rounded-2xl border border-white/8 bg-white/4 p-6 text-center h-full hover:border-white/15 transition-colors group">
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${card.grad} flex items-center justify-center text-white mx-auto mb-5 shadow-lg group-hover:scale-105 transition-transform`}
                  >
                    {card.icon}
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{card.title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed">{card.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-20 px-5">
        <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            value="8s"
            label="Avg checkout"
            sub="scan to payment"
            color="border-cyan-500/20 bg-cyan-500/8 text-cyan-300"
            delay={0}
          />
          <StatCard
            value="$0"
            label="To start"
            sub="free forever"
            color="border-violet-500/20 bg-violet-500/8 text-violet-300"
            delay={0.08}
          />
          <StatCard
            value="90s"
            label="To go live"
            sub="first sale ready"
            color="border-pink-500/20 bg-pink-500/8 text-pink-300"
            delay={0.16}
          />
          <StatCard
            value="3.2x"
            label="More sales"
            sub="vs traditional"
            color="border-amber-500/20 bg-amber-500/8 text-amber-300"
            delay={0.24}
          />
        </div>
      </section>

      {/* ── SOCIAL PROOF ── */}
      <section className="relative py-24 px-5">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl" />
        </div>
        <div className="max-w-3xl mx-auto">
          <FadeIn className="text-center mb-14">
            <p className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-widest">Real people, real results</p>
            <h2 className="text-4xl sm:text-5xl font-black leading-tight">
              They scanned.{" "}
              <span className="bg-gradient-to-r from-amber-400 to-pink-400 bg-clip-text text-transparent">
                They got paid.
              </span>
            </h2>
          </FadeIn>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                avatar: "💈",
                name: "Marcus T.",
                role: "Barber · Miami",
                quote:
                  "Made $450 in my first week just from walk-ins scanning my table tent. No more 'I'll Venmo you later.' Total game changer.",
                stars: 5,
                grad: "from-cyan-500 to-blue-500",
              },
              {
                avatar: "💅",
                name: "Jasmine L.",
                role: "Nail Tech · LA",
                quote:
                  "Set up in 2 minutes. Posted my QR on Instagram and booked out 3 days ahead. Clients love how fast it is.",
                stars: 5,
                grad: "from-violet-500 to-pink-500",
              },
              {
                avatar: "👕",
                name: "Tyler K.",
                role: "Merch · NYC",
                quote:
                  "Sold 40 hoodies at my show. QR on the merch table — people scan — instant checkout. Easiest sales night I have had.",
                stars: 5,
                grad: "from-amber-500 to-orange-500",
              },
            ].map((t, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="rounded-2xl border border-white/8 bg-white/4 p-6 h-full hover:border-white/15 transition-colors flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.grad} flex items-center justify-center text-xl flex-shrink-0 shadow-lg`}
                    >
                      {t.avatar}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{t.name}</p>
                      <p className="text-xs text-white/45">{t.role}</p>
                    </div>
                  </div>
                  <p className="text-sm text-white/60 leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex gap-0.5 mt-4">
                    {Array.from({ length: t.stars }).map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
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
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-cyan-500/15 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <FadeIn>
            <p className="text-sm font-semibold text-violet-400 mb-4 uppercase tracking-widest">Stop losing sales</p>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-5">
              Every unscanned QR is{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">
                money you didn&apos;t make.
              </span>
            </h2>
            <p className="text-white/50 text-lg mb-2 max-w-lg mx-auto leading-relaxed">
              Your customers are ready to buy. Give them one tap to do it.
            </p>
            <p className="text-white/30 text-sm mb-10">
              Takes 90 seconds to set up. Free forever to start.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-5">
              <Link
                href="/signup"
                className="group relative inline-flex items-center justify-center gap-2 px-10 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-bold text-lg shadow-[0_0_60px_rgba(139,92,246,0.5)] hover:shadow-[0_0_80px_rgba(139,92,246,0.7)] transition-all active:scale-95 w-full sm:w-auto overflow-hidden"
              >
                <span className="relative z-10">Start Free</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-0.5 transition-transform" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
                />
              </Link>
            </div>

            <div className="flex items-center justify-center gap-5 text-sm text-white/30">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500/70" />
                Free forever
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500/70" />
                No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500/70" />
                Live in 90 seconds
              </span>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/8 py-10 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/35">
          <div className="font-bold text-white/60 tracking-tight">
            piqo
          </div>
          <div className="flex items-center gap-6">
            <Link href="/pricing" className="hover:text-white/70 transition-colors">Pricing</Link>
            <Link href="/login" className="hover:text-white/70 transition-colors">Login</Link>
            <Link href="/signup" className="hover:text-white/70 transition-colors">Sign Up</Link>
            <Link href="/dashboard" className="hover:text-white/70 transition-colors">Dashboard</Link>
          </div>
          <span className="text-white/20 text-xs">&copy; 2026 piqo</span>
        </div>
      </footer>
    </div>
  );
}
