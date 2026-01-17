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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-purple-50 p-3 sm:p-4">
      <style>{`
        #email:-webkit-autofill,
        #password:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px white inset !important;
          -webkit-text-fill-color: #111827 !important;
        }
        #email:-webkit-autofill:focus,
        #password:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px white inset !important;
          -webkit-text-fill-color: #111827 !important;
        }
      `}</style>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-2xl p-5 sm:p-8 space-y-5 sm:space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <PiqoLogoFull />
          </div>
          
          <div className="text-center space-y-1.5 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">Welcome back</h1>
            <p className="text-gray-600 text-xs sm:text-sm">Sign in to your piqo account and continue building</p>
          </div>

          {/* Success Message */}
          {resendSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <div className="text-green-600 font-semibold text-sm flex-1">
                {resendSuccess}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <div className="text-red-600 font-semibold text-sm flex-1">
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
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition placeholder:text-gray-500"
                  style={{ color: '#111827' }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition placeholder:text-gray-500"
                  style={{ color: '#111827' }}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 sm:mt-6 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 active:scale-95 text-white font-semibold py-3 sm:py-2.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl min-h-[48px] sm:min-h-0"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
            </div>
          </div>

          {/* Signup Link */}
          <Link
            href="/signup"
            className="w-full block text-center py-3 sm:py-2.5 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 active:scale-95 transition min-h-[48px] sm:min-h-0 flex items-center justify-center"
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
