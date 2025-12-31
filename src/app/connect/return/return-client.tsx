"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function ReturnClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const handle = sp.get("handle") || "";

  useEffect(() => {
    // if you want, auto-send them back to builder after returning
    // router.replace(`/create?handle=${encodeURIComponent(handle)}`);
  }, [handle, router]);

  return (
    <main className="min-h-screen bg-black text-white grid place-items-center p-6">
      <div className="max-w-md w-full rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-lg font-semibold">Stripe connected</div>
        <div className="mt-2 text-sm text-white/70">
          You can go back to the builder and refresh status.
        </div>

        <button
          onClick={() => router.push(`/create?handle=${encodeURIComponent(handle)}`)}
          className="mt-4 w-full rounded-2xl bg-white text-black px-4 py-3 font-semibold hover:bg-white/90"
        >
          Back to builder
        </button>
      </div>
    </main>
  );
}
