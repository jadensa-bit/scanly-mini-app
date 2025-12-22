"use client";

import { Check, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

type Tier = {
  id: "free" | "starter" | "pro" | "business";
  name: string;
  price: string;
  note: string;
  bullets: string[];
  cta: string;
};

export default function PricingStrip({
  variantLabel,
  onChoosePlan,
}: {
  variantLabel: string; // e.g., "Services", "Booking"
  onChoosePlan?: (tierId: Tier["id"]) => void;
}) {
  const tiers = useMemo<Tier[]>(
    () => [
      {
        id: "free",
        name: "Free",
        price: "$0",
        note: "Preview link + QR stays live",
        bullets: [
          "Looks clean + branded",
          "Great for testing",
          "Checkout disabled",
        ],
        cta: "Start free",
      },
      {
        id: "starter",
        name: "Starter",
        price: "$9/mo",
        note: "1 Active QR mini-app",
        bullets: [
          "Enable checkout",
          "Customer confirmations",
          "Basic analytics",
        ],
        cta: "Activate 1 QR",
      },
      {
        id: "pro",
        name: "Pro",
        price: "$19/mo",
        note: "5 Active QRs + add-ons",
        bullets: [
          "Multiple QRs (drops/locations)",
          "Advanced analytics",
          "Priority templates",
        ],
        cta: "Go Pro",
      },
      {
        id: "business",
        name: "Business",
        price: "$49/mo",
        note: "25 Active QRs + team",
        bullets: [
          "Team access",
          "Custom domain option",
          "Priority support",
        ],
        cta: "Scale up",
      },
    ],
    []
  );

  const [active, setActive] = useState<Tier["id"]>("starter");

  const selected = tiers.find((t) => t.id === active)!;

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">Pricing (built for QR reality)</div>
          <div className="mt-1 text-sm text-white/70">
            Your link can stay live on{" "}
            <span className="font-semibold text-white">Free</span>.{" "}
            Checkout becomes <span className="font-semibold text-white">Active</span>{" "}
            when you subscribe.
          </div>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-3 py-1 text-xs text-white/75">
          <Sparkles className="h-3.5 w-3.5" />
          {variantLabel} demo
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {tiers.map((t) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={[
                "rounded-3xl border p-4 text-left transition active:scale-[0.99]",
                selected
                  ? "border-white/30 bg-white/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10",
              ].join(" ")}
            >
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-sm font-semibold">{t.price}</div>
              </div>
              <div className="mt-1 text-xs text-white/60">{t.note}</div>
              <div className="mt-3 space-y-2">
                {t.bullets.slice(0, 3).map((b) => (
                  <div key={b} className="flex items-start gap-2 text-xs text-white/70">
                    <Check className="mt-0.5 h-3.5 w-3.5 opacity-80" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/35 p-4">
        <div className="text-sm font-semibold">
          Selected: {selected.name} • {selected.price}
        </div>
        <div className="mt-1 text-sm text-white/70">
          Best for:{" "}
          {selected.id === "free"
            ? "testing + sharing the QR everywhere without breaking links."
            : selected.id === "starter"
            ? "one business/location — turn checkout on."
            : selected.id === "pro"
            ? "multiple QRs (drops, locations, campaigns)."
            : "serious scaling with teams + domains."}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <a
            href="/create"
            className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 transition active:scale-[0.98]"
          >
            Build your QR mini-app
          </a>
          <button
            onClick={() => onChoosePlan?.(selected.id)}
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition active:scale-[0.98]"
          >
            {selected.cta}
          </button>
          <a
            href="/scanly-shop"
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 transition active:scale-[0.98]"
          >
            QR kits + templates
          </a>
        </div>

        <div className="mt-2 text-[10px] text-white/50">
          The catch (and why it’s premium): printed QRs don’t “break.” Your page stays clean. Payments toggle with Active status.
        </div>
      </div>
    </div>
  );
}
