"use client";

import { motion } from "framer-motion";
import { Check, Zap, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabaseclient";

export default function PricingPage() {
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/signup";
        return;
      }
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ tier: "pro", returnUrl: "/create" }),
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        alert("Failed to start checkout. Please try again.");
      }
    } catch {
      alert("An error occurred. Please try again.");
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#08090c] text-white font-[var(--font-space)]">

      {/* ── HERO ── */}
      <section className="relative pt-24 pb-16 px-5 text-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[440px] h-[440px] bg-blue-600/12 rounded-full blur-3xl" />
          <div className="absolute top-0 right-1/4 w-[360px] h-[360px] bg-blue-500/8 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/25 bg-blue-500/10 text-blue-300 text-sm font-semibold mb-6"
          >
            <Zap className="w-3.5 h-3.5" />
            No credit card required
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-5xl sm:text-6xl font-black leading-[1.05] tracking-tight mb-5"
          >
            Start free. Upgrade when{" "}
            <span className="text-blue-400">you start making money.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="text-lg text-white/50 max-w-md mx-auto leading-relaxed"
          >
            Your first store is free forever. List what you sell, share your QR, get paid.
            Only upgrade when you need more.
          </motion.p>
        </div>
      </section>

      {/* ── PRICING CARDS ── */}
      <section className="relative py-10 px-5">
        <div className="max-w-2xl mx-auto grid sm:grid-cols-2 gap-5">

          {/* FREE */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Blue ring — this is the featured plan */}
            <div className="absolute -inset-px rounded-3xl bg-blue-500/40 blur-sm pointer-events-none" />
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-blue-500 rounded-full text-white text-xs font-black shadow-[0_0_16px_rgba(59,130,246,0.5)]">
              Start here
            </div>

            <div className="relative rounded-3xl border border-blue-500/35 bg-[#0d1220] p-7 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-blue-500/15 border border-blue-500/25 flex items-center justify-center text-blue-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Free</h3>
                  <p className="text-xs text-white/40">Use it today, keep it forever</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-5xl font-black text-white">$0</span>
                  <span className="text-white/35 text-sm">/ forever</span>
                </div>
                <p className="text-blue-400 text-sm font-semibold mt-1.5">No credit card. No trial. Just free.</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "1 storefront",
                  "Unlimited products & services",
                  "Your own QR code",
                  "Accept payments (Apple Pay, Google Pay, card)",
                  "Basic customization",
                  "Mobile-optimized page",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white/65">
                    <Check className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="group w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-black text-base shadow-[0_0_32px_rgba(59,130,246,0.4)] hover:shadow-[0_0_48px_rgba(59,130,246,0.6)] transition-all active:scale-[0.97]"
              >
                Start Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* PRO */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 h-full flex flex-col hover:border-white/18 transition-colors">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-white/6 border border-white/10 flex items-center justify-center text-white/60">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Pro</h3>
                  <p className="text-xs text-white/40">When you&apos;re ready to grow</p>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-5xl font-black text-white">$15</span>
                  <span className="text-white/35 text-sm">/ month</span>
                </div>
                <p className="text-white/40 text-sm mt-1.5">Upgrade anytime. Cancel anytime.</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {[
                  "Everything in Free",
                  "Unlimited storefronts",
                  "Custom branding & colors",
                  "Remove piqo branding",
                  "Sales and view stats",
                  "Early access to new features",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white/65">
                    <Check className="w-4 h-4 text-white/35 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={handleUpgrade}
                disabled={isUpgrading}
                className="group w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl border border-white/15 bg-white/5 text-white font-bold text-base hover:bg-white/10 hover:border-white/25 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpgrading ? "Loading…" : "Upgrade to Pro"}
                {!isUpgrading && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
              </button>

              <p className="text-center text-xs text-white/25 mt-3">
                Already free? Upgrade straight from your dashboard.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Trust line */}
        <p className="text-center text-sm text-white/25 mt-7">
          No credit card required &nbsp;·&nbsp; Cancel anytime &nbsp;·&nbsp; Your free store stays free forever
        </p>
      </section>

      {/* ── FAQ ── */}
      <section className="relative py-24 px-5 bg-[#0c0f17]">
        <div className="max-w-2xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-black text-center mb-10"
          >
            Quick answers
          </motion.h2>

          <div className="space-y-3">
            {[
              {
                q: "Is the free plan actually free?",
                a: "Yes. No credit card, no trial period, no catch. Your first store is free as long as you use it.",
              },
              {
                q: "When would I need Pro?",
                a: "If you want to run more than one storefront — like a second location, a different brand, or a separate product line — that's when Pro makes sense.",
              },
              {
                q: "Are there transaction fees?",
                a: "We don't take a cut of your sales. You pay Stripe's standard processing fee (2.9% + 30¢) and that's it. Everything else goes to you.",
              },
              {
                q: "Can I cancel Pro anytime?",
                a: "Yes. Cancel whenever you want. Your free store stays live no matter what.",
              },
              {
                q: "What if I just want to try it?",
                a: "Sign up free. No card needed. You can have a live storefront in under 2 minutes.",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 hover:border-white/14 transition-colors"
              >
                <h3 className="font-bold text-white text-sm mb-1.5">{item.q}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{item.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="relative py-28 px-5 overflow-hidden text-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-sm font-semibold text-blue-400 uppercase tracking-widest mb-4">No reason not to try</p>
            <h2 className="text-4xl sm:text-5xl font-black leading-[1.08] mb-5">
              You could have a store{" "}
              <span className="text-blue-400">live in 2 minutes.</span>
            </h2>
            <p className="text-white/40 text-base mb-10">
              Free. No card. No setup fee. Try it now, upgrade only if you need to.
            </p>

            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 px-10 py-4 rounded-full bg-blue-500 hover:bg-blue-400 text-white font-black text-lg shadow-[0_0_56px_rgba(59,130,246,0.45)] hover:shadow-[0_0_80px_rgba(59,130,246,0.65)] transition-all active:scale-[0.97]"
            >
              Create My Free Page
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <div className="flex items-center justify-center gap-5 mt-6 text-sm text-white/28">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400/60" />
                Free forever
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400/60" />
                No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400/60" />
                Live in minutes
              </span>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
