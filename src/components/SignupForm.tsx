'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseclient';
import PiqoLogoFull from './PiqoLogoFull';
import Link from 'next/link';
import { Mail, Lock, User, Check, X, Loader2 } from 'lucide-react';

interface FieldValidation {
  isValid: boolean;
  message: string;
  showCheck?: boolean;
}

export default function SignupForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [touched, setTouched] = useState({
    name: false,
    email: false,
    password: false,
  });
  const [validations, setValidations] = useState<{
    name: FieldValidation;
    email: FieldValidation;
    password: FieldValidation;
  }>({
    name: { isValid: false, message: '' },
    email: { isValid: false, message: '' },
    password: { isValid: false, message: '' },
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOptimistic, setIsOptimistic] = useState(false);

  // Inline validation logic
  useEffect(() => {
    const validateName = () => {
      if (!touched.name) return { isValid: false, message: '' };
      if (!formData.name.trim()) {
        return { isValid: false, message: 'Name is required' };
      }
      if (formData.name.trim().length < 2) {
        return { isValid: false, message: 'Name must be at least 2 characters' };
      }
      return { isValid: true, message: '', showCheck: true };
    };

    const validateEmail = () => {
      if (!touched.email) return { isValid: false, message: '' };
      if (!formData.email) {
        return { isValid: false, message: 'Email is required' };
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        return { isValid: false, message: 'Enter a valid email address' };
      }
      return { isValid: true, message: '', showCheck: true };
    };

    const validatePassword = () => {
      if (!touched.password) return { isValid: false, message: '' };
      if (!formData.password) {
        return { isValid: false, message: 'Password is required' };
      }
      if (formData.password.length < 6) {
        return { isValid: false, message: 'Password must be at least 6 characters' };
      }
      if (formData.password.length < 8) {
        return { isValid: true, message: '8+ characters recommended', showCheck: true };
      }
      return { isValid: true, message: 'Strong password', showCheck: true };
    };

    setValidations({
      name: validateName(),
      email: validateEmail(),
      password: validatePassword(),
    });
  }, [formData, touched]);

  const isFormValid = validations.name.isValid && validations.email.isValid && validations.password.isValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Mark all fields as touched
    setTouched({ name: true, email: true, password: true });

    // Don't submit if form is invalid
    if (!isFormValid) {
      return;
    }

    setLoading(true);
    setIsOptimistic(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Signup failed');
        setLoading(false);
        setIsOptimistic(false);
        return;
      }

      // Sign in the user immediately with their credentials
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        // Still redirect even if sign in fails - session might be created
      }

      // Wait a moment for auth to fully settle
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Redirect to dashboard immediately
      router.push('/dashboard');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
      setIsOptimistic(false);
    }
  };

  return (
    <div className="w-full max-w-md px-4 sm:px-0">
      <style>{`
        #name:-webkit-autofill,
        #email:-webkit-autofill,
        #password:-webkit-autofill {
          -webkit-box-shadow: 0 0 0 1000px white inset !important;
          -webkit-text-fill-color: #111827 !important;
        }
        #name:-webkit-autofill:focus,
        #email:-webkit-autofill:focus,
        #password:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 1000px white inset !important;
          -webkit-text-fill-color: #111827 !important;
        }
      `}</style>
      
      {/* Optimistic Success State */}
      {isOptimistic && (
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full flex items-center justify-center animate-pulse">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome to piqo!</h2>
            <p className="text-gray-600 text-center">Setting up your account...</p>
          </div>
        </div>
      )}

      {/* Signup Form */}
      {!isOptimistic && (
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 space-y-5 sm:space-y-6">
          {/* Logo */}
          <div className="flex justify-center mb-2 sm:mb-4">
            <PiqoLogoFull />
          </div>
          
          <div className="text-center space-y-1 sm:space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-cyan-600 to-purple-600 bg-clip-text text-transparent">Create your piqo</h1>
            <p className="text-gray-600 text-xs sm:text-sm">Build your free storefront, bookings, or digital shop in minutes</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-start gap-3">
              <X className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-red-600 font-semibold text-xs sm:text-sm flex-1">
                {error}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 sm:top-3.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  required
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onBlur={() => setTouched({ ...touched, name: true })}
                  className={`w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 transition placeholder:text-gray-400 ${
                    touched.name && !validations.name.isValid
                      ? 'border-red-300 focus:ring-red-500 focus:border-transparent'
                      : validations.name.isValid
                      ? 'border-green-300 focus:ring-cyan-500 focus:border-transparent'
                      : 'border-gray-300 focus:ring-cyan-500 focus:border-transparent'
                  }`}
                  style={{ color: '#111827' }}
                />
                {/* Validation Icon */}
                {touched.name && (
                  <div className="absolute right-3 top-3 sm:top-3.5">
                    {validations.name.isValid ? (
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                    )}
                  </div>
                )}
              </div>
              {/* Validation Message */}
              {touched.name && validations.name.message && (
                <p className={`text-xs mt-1 ${validations.name.isValid ? 'text-gray-500' : 'text-red-600'}`}>
                  {validations.name.message}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 sm:top-3.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onBlur={() => setTouched({ ...touched, email: true })}
                  className={`w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 transition placeholder:text-gray-400 ${
                    touched.email && !validations.email.isValid
                      ? 'border-red-300 focus:ring-red-500 focus:border-transparent'
                      : validations.email.isValid
                      ? 'border-green-300 focus:ring-cyan-500 focus:border-transparent'
                      : 'border-gray-300 focus:ring-cyan-500 focus:border-transparent'
                  }`}
                  style={{ color: '#111827' }}
                />
                {/* Validation Icon */}
                {touched.email && (
                  <div className="absolute right-3 top-3 sm:top-3.5">
                    {validations.email.isValid ? (
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                    )}
                  </div>
                )}
              </div>
              {/* Validation Message */}
              {touched.email && validations.email.message && (
                <p className={`text-xs mt-1 ${validations.email.isValid ? 'text-gray-500' : 'text-red-600'}`}>
                  {validations.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5 sm:mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 sm:top-3.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  onBlur={() => setTouched({ ...touched, password: true })}
                  className={`w-full pl-9 sm:pl-10 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 transition placeholder:text-gray-400 ${
                    touched.password && !validations.password.isValid
                      ? 'border-red-300 focus:ring-red-500 focus:border-transparent'
                      : validations.password.isValid
                      ? 'border-green-300 focus:ring-cyan-500 focus:border-transparent'
                      : 'border-gray-300 focus:ring-cyan-500 focus:border-transparent'
                  }`}
                  style={{ color: '#111827' }}
                />
                {/* Validation Icon */}
                {touched.password && (
                  <div className="absolute right-3 top-3 sm:top-3.5">
                    {validations.password.isValid ? (
                      <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                    )}
                  </div>
                )}
              </div>
              {/* Validation Message */}
              {touched.password && validations.password.message && (
                <p className={`text-xs mt-1 ${validations.password.isValid ? 'text-green-600' : 'text-red-600'}`}>
                  {validations.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !isFormValid}
              className="w-full mt-4 sm:mt-6 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white font-semibold py-3 sm:py-3.5 text-sm sm:text-base rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  <span>Creating your account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login Link - Simplified */}
          <div className="text-center pt-2">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-cyan-600 hover:text-cyan-700 transition"
              >
                Log In
              </Link>
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-500 pt-2">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      )}
    </div>
  );
}

