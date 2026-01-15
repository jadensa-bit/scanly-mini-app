"use client";


import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function RefreshClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const handle = sp.get("handle") || "";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleOnboard = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.url) {
        window.location.href = data.url;
      } else {
        let detail = data?.detail ? `\nDetails: ${data.detail}` : "";
        setError((data?.error || "Failed to connect to Stripe. Please try again.") + detail);
      }
    } catch (e) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white grid place-items-center p-6">
      <div className="max-w-md w-full rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-lg font-semibold">Stripe onboarding</div>
        <div className="mt-2 text-sm text-white/70">
          Looks like the onboarding was interrupted. Tap below to continue.
        </div>
        {error && (
          <div className="mt-3 text-sm text-red-400 font-semibold">{error}</div>
        )}
        <button
          onClick={handleOnboard}
          className="mt-4 w-full rounded-2xl bg-white text-black px-4 py-3 font-semibold hover:bg-white/90 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Connecting…" : "Continue onboarding"}
        </button>
        <button
          onClick={() => router.push(`/create?handle=${encodeURIComponent(handle)}`)}
          className="mt-3 w-full rounded-2xl border border-white/12 bg-white/5 px-4 py-3 font-semibold text-white/85 hover:bg-white/10"
          disabled={loading}
        >
          Back to builder
        </button>
      </div>
    </main>
  );
}
