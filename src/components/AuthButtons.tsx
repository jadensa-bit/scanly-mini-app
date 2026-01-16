"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseclient";
import { Store, ScanLine } from "lucide-react";

export default function AuthButtons() {
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);
  if (user) {
    return (
      <div className="flex flex-col sm:flex-row gap-6 justify-center">
        <a
          href="/dashboard"
          className="inline-flex items-center gap-3 px-8 py-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-full font-semibold text-lg transition-all hover:shadow-lg hover:shadow-cyan-500/25"
        >
          <Store className="w-6 h-6" />
          Go to Dashboard
        </a>
        <a
          href="/checkin"
          className="inline-flex items-center gap-3 px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-semibold text-lg transition-all hover:shadow-lg hover:shadow-purple-500/25"
        >
          <ScanLine className="w-6 h-6" />
          QR Check-in
        </a>
      </div>
    );
  }
  return (
    <div className="flex flex-col sm:flex-row gap-6 justify-center">
      <a
        href="/login"
        className="inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full font-semibold text-lg hover:bg-white/20 transition-all"
      >
        Login
      </a>
      <a
        href="/signup"
        className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-full font-semibold text-lg transition-all hover:shadow-lg hover:shadow-green-500/25"
      >
        Sign Up
      </a>
    </div>
  );
}
