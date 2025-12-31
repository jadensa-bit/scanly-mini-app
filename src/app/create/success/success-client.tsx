"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function SuccessClient() {
  const sp = useSearchParams();
  const router = useRouter();

  // ✅ keep your existing query param reads here
  // const handle = sp.get("handle") || "";

  return (
    <main className="min-h-screen bg-black text-white grid place-items-center p-6">
      <div className="max-w-md w-full rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-lg font-semibold">Success</div>
        <div className="mt-2 text-sm text-white/70">
          Your site is ready.
        </div>

        <button
          onClick={() => router.push("/create")}
          className="mt-4 w-full rounded-2xl bg-white text-black px-4 py-3 font-semibold hover:bg-white/90"
        >
          Back to builder
        </button>
      </div>
    </main>
  );
}
