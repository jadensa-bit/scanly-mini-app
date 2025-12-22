"use client";

import { ArrowRight, BadgeCheck, ShoppingBag } from "lucide-react";

export default function ScanlyUpsellBlock({
  headline,
  body,
  bullets,
}: {
  headline: string;
  body: string;
  bullets: string[];
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/40 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{headline}</div>
          <div className="mt-1 text-sm text-white/70">{body}</div>
        </div>

        <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-white/70">
          <BadgeCheck className="h-3.5 w-3.5" />
          Powered by Scanly
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {bullets.map((b) => (
          <div
            key={b}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
          >
            {b}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href="/create"
          className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 transition active:scale-[0.98]"
        >
          Build mine <ArrowRight className="ml-2 h-4 w-4" />
        </a>
        <a
          href="/scanly-shop"
          className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition active:scale-[0.98]"
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          Get QR kits + templates
        </a>
      </div>
    </div>
  );
}
