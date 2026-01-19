'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabaseclient';
import { useRouter, useSearchParams } from 'next/navigation';
import { createProfile } from '@/lib/createProfile';
import PiqoLogoFull from '@/components/PiqoLogoFull';
import Link from 'next/link';
import { Mail, Lock } from 'lucide-react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShowResend(false);
    setResendSuccess('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      
      // Email confirmation is disabled, so don't show resend button
      // if (error.message?.toLowerCase().includes('email') && 
      //     (error.message?.toLowerCase().includes('confirm') || 
      //      error.message?.toLowerCase().includes('verified'))) {
      //   setShowResend(true);
      // }
      
      return;
    }

    // After login, check if profile exists, create if missing
    const user = data?.user;
    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();
      if (!profile && !profileError) {
        // No profile exists, create one with name from user_metadata or email prefix
        const name = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
        await createProfile({ id: user.id, name });
      }
    }

    // Small delay to ensure cookies are set and session is stable
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Force a full page refresh to ensure middleware picks up the new session
    window.location.href = redirect;
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setResendLoading(true);
    setResendSuccess('');
    setError('');

    try {
      const response = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to resend confirmation email');
        setResendLoading(false);
        return;
      }

      setResendSuccess('✅ Confirmation email sent! Check your inbox.');
      setShowResend(false);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black p-3 sm:p-4 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      </div>
      
      <style>{`
        #email:-webkit-autofill,
        #password:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px #1a1a1a inset !important;
          -webkit-text-fill-color: #ffffff !important;
        }
        #email:-webkit-autofill:focus,
        #password:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px #1a1a1a inset !important;
          -webkit-text-fill-color: #ffffff !important;
        }
      `}</style>
      <div className="w-full max-w-md relative z-10">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-5 sm:space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl">
              <span className="text-white font-black text-2xl">piqo</span>
            </div>
          </div>
          
          <div className="text-center space-y-1.5 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Welcome back</h1>
            <p className="text-gray-400 text-xs sm:text-sm">Sign in to your piqo account and continue building</p>
          </div>

          {/* Success Message */}
          {resendSuccess && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 flex items-start gap-3">
              <div className="text-green-400 font-semibold text-sm flex-1">
                {resendSuccess}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
              <div className="text-red-400 font-semibold text-sm flex-1">
                {error}
              </div>
            </div>
          )}

          {/* Resend Confirmation Button */}
          {showResend && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-900 text-sm mb-3">
                Haven't received your confirmation email?
              </p>
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resendLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {resendLoading ? 'Sending...' : 'Resend Confirmation Email'}
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-white mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition placeholder:text-gray-600 text-white"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-bold text-white mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-500" />
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition placeholder:text-gray-600 text-white"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 sm:mt-6 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 active:scale-95 text-white font-bold py-3.5 sm:py-3 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-2xl hover:shadow-cyan-500/50 min-h-[52px] sm:min-h-0"
            >
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-black/40 text-gray-400">Don't have an account?</span>
            </div>
          </div>

          {/* Signup Link */}
          <Link
            href="/signup"
            className="w-full block text-center py-3.5 sm:py-3 border-2 border-white/20 rounded-xl text-white font-bold hover:bg-white/5 hover:border-white/30 active:scale-95 transition min-h-[52px] sm:min-h-0 flex items-center justify-center"
          >
            Create Account
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-gray-500">Loading...</div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
