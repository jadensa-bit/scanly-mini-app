"use client";

import { motion } from "framer-motion";
import { Crown, Check, X, Sparkles, Zap, ArrowRight } from "lucide-react";
import Link from "next/link";

interface SubscriptionGateProps {
  feature: string;
  userTier: 'free' | 'pro' | 'enterprise';
  requiredTier: 'pro' | 'enterprise';
  children: React.ReactNode;
}

export function SubscriptionGate({ feature, userTier, requiredTier, children }: SubscriptionGateProps) {
  const hasAccess = 
    (requiredTier === 'pro' && (userTier === 'pro' || userTier === 'enterprise')) ||
    (requiredTier === 'enterprise' && userTier === 'enterprise');

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred/disabled content */}
      <div className="pointer-events-none opacity-40 blur-sm">
        {children}
      </div>
      
      {/* Upgrade overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-xl border border-yellow-400/30">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center p-6"
        >
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">{feature}</h3>
          <p className="text-sm text-gray-300 mb-4">
            Upgrade to {requiredTier === 'pro' ? 'Pro' : 'Enterprise'} to unlock this feature
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black rounded-lg font-bold hover:shadow-lg hover:shadow-yellow-500/50 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Upgrade Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

interface FeatureBadgeProps {
  tier: 'free' | 'pro' | 'enterprise';
  label?: string;
}

export function FeatureBadge({ tier, label }: FeatureBadgeProps) {
  const config = {
    free: {
      icon: Zap,
      color: 'from-cyan-500 to-blue-500',
      text: 'Free',
    },
    pro: {
      icon: Sparkles,
      color: 'from-purple-500 to-pink-500',
      text: 'Pro',
    },
    enterprise: {
      icon: Crown,
      color: 'from-yellow-400 to-orange-500',
      text: 'Enterprise',
    },
  };

  const { icon: Icon, color, text } = config[tier];

  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r ${color} rounded-full text-white text-xs font-bold`}>
      <Icon className="w-3.5 h-3.5" />
      {label || text}
    </div>
  );
}

interface PiqoLimitBannerProps {
  currentCount: number;
  limit: number;
  tier: 'free' | 'pro' | 'enterprise';
}

export function PiqoLimitBanner({ currentCount, limit, tier }: PiqoLimitBannerProps) {
  const percentage = (currentCount / limit) * 100;
  const isAtLimit = currentCount >= limit;
  const isNearLimit = percentage >= 80;

  if (tier !== 'free') {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/30 rounded-xl p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
            <Check className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-white">Unlimited Piqos</div>
            <div className="text-sm text-gray-300">Create as many storefronts as you need</div>
          </div>
          <FeatureBadge tier={tier} />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${
        isAtLimit
          ? 'bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-400/30'
          : isNearLimit
          ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-400/30'
          : 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-400/30'
      } border rounded-xl p-4`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-bold text-white">
            {currentCount} / {limit} Piqos
          </div>
          <div className="text-sm text-gray-300">
            {isAtLimit ? 'Limit reached' : `${limit - currentCount} remaining`}
          </div>
        </div>
        <FeatureBadge tier="free" />
      </div>
      
      {/* Progress bar */}
      <div className="relative w-full h-2 bg-black/30 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percentage, 100)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full ${
            isAtLimit
              ? 'bg-gradient-to-r from-red-500 to-orange-500'
              : isNearLimit
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
              : 'bg-gradient-to-r from-cyan-500 to-purple-500'
          }`}
        />
      </div>

      {isAtLimit && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-300">
            Upgrade to create unlimited piqos
          </div>
          <Link
            href="/pricing"
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-purple-500/50 transition-all text-sm"
          >
            Upgrade
          </Link>
        </div>
      )}
    </motion.div>
  );
}
