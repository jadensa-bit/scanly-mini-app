"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function RefreshClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const handle = sp.get("handle") || "";

  return (
    <main className="min-h-screen bg-black text-white grid place-items-center p-6">
      <div className="max-w-md w-full rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-lg font-semibold">Stripe onboarding</div>
        <div className="mt-2 text-sm text-white/70">
          Looks like the onboarding was interrupted. Tap below to continue.
        </div>

        <button
          onClick={async () => {
            const res = await fetch("/api/stripe/connect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ handle }),
            });
            const data = await res.json().catch(() => ({}));
            if (data?.url) window.location.href = data.url;
          }}
          className="mt-4 w-full rounded-2xl bg-white text-black px-4 py-3 font-semibold hover:bg-white/90"
        >
          Continue onboarding
        </button>

        <button
          onClick={() => router.push(`/create?handle=${encodeURIComponent(handle)}`)}
          className="mt-3 w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 font-semibold text-white/85 hover:bg-white/10"
        >
          Back to builder
        </button>
      </div>
    </main>
  );
}
