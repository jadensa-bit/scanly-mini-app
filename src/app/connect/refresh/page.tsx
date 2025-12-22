"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ConnectRefreshPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const handle = sp.get("handle") || "";

  useEffect(() => {
    // if they hit refresh, just restart connect from the builder
    const dest = handle ? `/create?handle=${encodeURIComponent(handle)}&reconnect=1` : "/create?reconnect=1";
    router.replace(dest);
    router.refresh();
  }, [handle, router]);

  return (
    <main className="min-h-screen bg-black text-white grid place-items-center px-6">
      <div className="text-center">
        <div className="text-2xl font-semibold">Let’s finish setup…</div>
        <div className="mt-2 text-white/70">Sending you back…</div>
      </div>
    </main>
  );
}
