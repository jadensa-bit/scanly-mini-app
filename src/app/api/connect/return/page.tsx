"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function ConnectReturnPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const handle = sp.get("handle") || "";
  const [msg, setMsg] = useState("Checking Stripe connection…");

  useEffect(() => {
    if (!handle) {
      setMsg("Missing handle.");
      return;
    }

    (async () => {
      const res = await fetch(`/api/stripe/status?handle=${encodeURIComponent(handle)}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));

      if (data?.charges_enabled) {
        setMsg("✅ Stripe connected! You can accept payments now.");
        setTimeout(() => router.push(`/create?handle=${encodeURIComponent(handle)}`), 900);
        return;
      }

      setMsg("Almost done — Stripe still needs a bit more info. Tap Connect again in the builder.");
    })();
  }, [handle, router]);

  return (
    <main className="min-h-screen bg-black text-white grid place-items-center p-6">
      <div className="max-w-md w-full rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-lg font-semibold">Stripe onboarding</div>
        <div className="mt-2 text-sm text-white/70">{msg}</div>
      </div>
    </main>
  );
}
