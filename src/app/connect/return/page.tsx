"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ConnectReturnPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const handle = sp.get("handle") || "";

  useEffect(() => {
    // send them back to builder on the same handle
    const dest = handle ? `/create?handle=${encodeURIComponent(handle)}&connected=1` : "/create?connected=1";
    router.replace(dest);
    router.refresh();
  }, [handle, router]);

  return (
    <main className="min-h-screen bg-black text-white grid place-items-center px-6">
      <div className="text-center">
        <div className="text-2xl font-semibold">Stripe connected ✅</div>
        <div className="mt-2 text-white/70">Taking you back to your builder…</div>
      </div>
    </main>
  );
}
