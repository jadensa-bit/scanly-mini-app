"use client";

import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Crown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabaseclient";

export default function PricingPage() {
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async (tier: 'pro' | 'enterprise') => {
    setIsUpgrading(true);
    try {
      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // User not logged in - redirect to signup
        window.location.href = '/signup';
        return;
      }

      // Create checkout session
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          tier,
          returnUrl: '/create',
        }),
      });

      const data = await res.json();

      if (res.ok && data.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        console.error('Failed to create checkout session:', data.error);
        alert('Failed to start checkout. Please try again.');
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      {/* Hero Section */}
      <section className="relative py-20 px-6 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-full mb-6"
          >
            <Sparkles className="w-4 h-4 text-green-400" />
            <span className="text-sm font-bold text-green-300">First store is FREE forever</span>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
          >
            Start free. Scale when ready.
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto"
          >
            Get your first QR storefront completely free. No credit card, no limits. Upgrade only when you need more.
          </motion.p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative py-12 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          
          {/* FREE TIER */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:border-cyan-500/30 transition-all h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">Starter</h3>
                  <p className="text-sm text-gray-400">Perfect to start</p>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">$0</span>
                  <span className="text-gray-400">/forever</span>
                </div>
                <p className="text-green-400 font-semibold mt-2">✨ No credit card required</p>
              </div>

              <div className="space-y-3 mb-8 flex-1">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">1 storefront</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Unlimited products/services</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">QR code generation</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Real-time analytics</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Stripe payments</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Mobile optimized</span>
                </div>
              </div>

              <Link
                href="/signup"
                className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold text-center hover:shadow-lg hover:shadow-cyan-500/50 transition-all group flex items-center justify-center gap-2"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

          {/* PRO TIER - Most Popular */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="relative"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full text-white text-sm font-bold">
              Most Popular
            </div>
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-3xl blur opacity-30"></div>
            <div className="relative bg-gradient-to-br from-gray-900 to-black backdrop-blur-sm border border-purple-500/30 rounded-3xl p-8 hover:border-purple-500/50 transition-all h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">Pro</h3>
                  <p className="text-sm text-gray-400">For growing businesses</p>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">$15</span>
                  <span className="text-gray-400">/month</span>
                </div>
                <p className="text-purple-400 font-semibold mt-2">Per additional store</p>
              </div>

              <div className="space-y-3 mb-8 flex-1">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Everything in Starter</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Unlimited storefronts</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Multi-location support</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Advanced analytics</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Priority support</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Custom branding options</span>
                </div>
              </div>

              <Link
                href="/signup"
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-center hover:shadow-lg hover:shadow-purple-500/50 transition-all group flex items-center justify-center gap-2"
              >
                Start Free, Upgrade Later
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <button
                onClick={() => handleUpgrade('pro')}
                disabled={isUpgrading}
                className="w-full mt-3 px-6 py-2 border border-purple-500/30 text-purple-400 rounded-xl font-semibold text-center hover:bg-purple-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpgrading ? 'Processing...' : 'Already have an account? Upgrade Now'}
              </button>
            </div>
          </motion.div>

          {/* ENTERPRISE TIER */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 rounded-3xl p-8 hover:border-yellow-500/30 transition-all h-full flex flex-col">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">Enterprise</h3>
                  <p className="text-sm text-gray-400">For agencies & teams</p>
                </div>
              </div>
              
              <div className="mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-white">Custom</span>
                </div>
                <p className="text-yellow-400 font-semibold mt-2">Let's talk</p>
              </div>

              <div className="space-y-3 mb-8 flex-1">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Everything in Pro</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">White-label options</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Dedicated account manager</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Custom integrations</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">SLA guarantee</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">Custom domain support</span>
                </div>
              </div>

              <a
                href="mailto:hello@myscanly.com"
                className="w-full px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black rounded-xl font-bold text-center hover:shadow-lg hover:shadow-yellow-500/50 transition-all group flex items-center justify-center gap-2"
              >
                Contact Sales
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black text-center mb-12 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Pricing FAQs
          </h2>
          
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-2">Is the first store really free forever?</h3>
              <p className="text-gray-400">Yes! Your first storefront is 100% free with no time limits. Create your QR code, add unlimited products, accept payments—all free. Forever.</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-2">When do I need to upgrade?</h3>
              <p className="text-gray-400">Only when you want to create a second store. If you have multiple locations, different product lines, or manage multiple brands, you'll love Pro ($15/month per additional store).</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-2">Are there any transaction fees?</h3>
              <p className="text-gray-400">MyScanly never charges transaction fees. You only pay standard Stripe processing fees (2.9% + 30¢ per transaction) which go directly to Stripe, not us.</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-2">Can I cancel anytime?</h3>
              <p className="text-gray-400">Absolutely. Cancel your Pro subscription anytime. Your first store will always stay free and active. No penalties, no questions asked.</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-2">What's included in Enterprise?</h3>
              <p className="text-gray-400">Enterprise is perfect for agencies managing multiple clients or large businesses. Get white-label options, dedicated support, custom integrations, and volume discounts. Contact us for custom pricing.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Ready to get started?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Create your first store in under 2 minutes. No credit card required.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-full font-bold text-xl hover:shadow-2xl hover:shadow-cyan-500/50 transition-all group"
          >
            Get Your Free QR Code
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
