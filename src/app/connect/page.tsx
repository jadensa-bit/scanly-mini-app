"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ConnectStripePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const handle = searchParams?.get("handle") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [setupUrl, setSetupUrl] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<any>(null);

  useEffect(() => {
    if (!handle) {
      setError("Missing handle parameter");
      setLoading(false);
      return;
    }

    async function checkStripeStatus() {
      try {
        // First check if Stripe is already connected
        const statusRes = await fetch(`/api/stripe/status?handle=${encodeURIComponent(handle)}`, {
          credentials: 'include'
        });
        const statusData = await statusRes.json();

        if (statusRes.ok && statusData.accountId) {
          setAccountStatus(statusData);
          setLoading(false);
          return;
        }

        // If not connected, initiate Stripe Connect flow
        const connectRes = await fetch("/api/stripe/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({ handle }),
        });

        const connectData = await connectRes.json();

        if (connectRes.ok && connectData.url) {
          // Redirect to Stripe onboarding
          window.location.href = connectData.url;
        } else {
          const errorMsg = connectData.userMessage || connectData.error || "Failed to start Stripe Connect";
          setError(errorMsg);
          if (connectData.setupUrl) {
            setSetupUrl(connectData.setupUrl);
          }
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Stripe Connect error:", err);
        setError(err.message || "Failed to connect to Stripe");
        setLoading(false);
      }
    }

    checkStripeStatus();
  }, [handle]);

  if (!handle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 text-center">
          <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Missing Handle</h1>
          <p className="text-white/70 mb-6">No piqo handle provided</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:scale-105 transition-transform"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 text-center">
          <Loader2 className="h-16 w-16 text-cyan-400 mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-bold text-white mb-2">Connecting to Stripe</h1>
          <p className="text-white/70">Setting up payments for <span className="text-cyan-400 font-semibold">{handle}</span></p>
          <p className="text-sm text-white/50 mt-4">This may take a moment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 text-center">
          <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Connection Failed</h1>
          <p className="text-red-300 mb-6">{error}</p>
          
          {setupUrl && (
            <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <p className="text-sm text-yellow-200 mb-3">
                💡 You need to complete Stripe platform setup first
              </p>
              <a
                href={setupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:scale-105 transition-transform"
              >
                Open Stripe Dashboard →
              </a>
              <p className="text-xs text-yellow-200/70 mt-2">
                After completing setup, come back and try again
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            <Link
              href={`/dashboard`}
              className="block w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:scale-105 transition-transform"
            >
              Back to Dashboard
            </Link>
            <button
              onClick={() => window.location.reload()}
              className="block w-full px-6 py-3 bg-white/10 text-white font-semibold rounded-xl hover:bg-white/20 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Already connected
  if (accountStatus) {
    const isFullyEnabled = accountStatus.chargesEnabled && accountStatus.payoutsEnabled && accountStatus.detailsSubmitted;

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 text-center">
          <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">
            {isFullyEnabled ? "Stripe Connected" : "Stripe Setup Incomplete"}
          </h1>
          <p className="text-white/70 mb-6">
            Account ID: <span className="text-cyan-400 font-mono text-sm">{accountStatus.accountId}</span>
          </p>

          <div className="bg-white/5 rounded-xl p-4 mb-6 text-left space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-white/70">Charges Enabled:</span>
              <span className={accountStatus.chargesEnabled ? "text-green-400" : "text-yellow-400"}>
                {accountStatus.chargesEnabled ? "✓ Yes" : "⚠ No"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70">Payouts Enabled:</span>
              <span className={accountStatus.payoutsEnabled ? "text-green-400" : "text-yellow-400"}>
                {accountStatus.payoutsEnabled ? "✓ Yes" : "⚠ No"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/70">Details Submitted:</span>
              <span className={accountStatus.detailsSubmitted ? "text-green-400" : "text-yellow-400"}>
                {accountStatus.detailsSubmitted ? "✓ Yes" : "⚠ No"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {!isFullyEnabled && (
              <button
                onClick={async () => {
                  setLoading(true);
                  try {
                    const res = await fetch("/api/stripe/connect", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: 'include',
                      body: JSON.stringify({ handle }),
                    });
                    const data = await res.json();
                    if (res.ok && data.url) {
                      window.location.href = data.url;
                    } else {
                      setError(data.error || "Failed to continue setup");
                      setLoading(false);
                    }
                  } catch (err: any) {
                    setError(err.message);
                    setLoading(false);
                  }
                }}
                className="block w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:scale-105 transition-transform"
              >
                Complete Setup
              </button>
            )}
            <Link
              href={`/dashboard`}
              className="block w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:scale-105 transition-transform"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
