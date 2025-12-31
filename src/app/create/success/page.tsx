import { Suspense } from "react";
import SuccessClient from "./success-client";

export const dynamic = "force-dynamic";

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-black text-white grid place-items-center p-6">
          <div className="max-w-md w-full rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="text-lg font-semibold">Loading…</div>
            <div className="mt-2 text-sm text-white/70">One sec.</div>
          </div>
        </main>
      }
    >
      <SuccessClient />
    </Suspense>
  );
}
