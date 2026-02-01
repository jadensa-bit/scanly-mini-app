"use client";

import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";
import Image from "next/image";
import {
  ArrowRight,
  ScanLine,
  CalendarClock,
  Download,
  Store,
  Sparkles,
  CreditCard,
  ShieldCheck,
  BadgeCheck,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseclient";
import AuthButtons from "@/components/AuthButtons";

// Install Banner Component
function InstallBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone;
    
    if (isStandalone) {
      return; // Don't show banner if already installed
    }

    // Listen for install prompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Show banner after 2 seconds for Safari/other browsers
    const timer = setTimeout(() => {
      if (!deferredPrompt) {
        setShowBanner(true);
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, [deferredPrompt]);

  const handleInstall = () => {
    // Immediate UI feedback
    setIsInstalling(true);
    
    // Defer heavy async work
    setTimeout(() => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === 'accepted') {
            setShowBanner(false);
          }
          setIsInstalling(false);
        });
      } else {
        // For Safari - show instructions
        alert('To install:\niOS: Tap Share → Add to Home Screen\nAndroid: Tap Menu (⋮) → Install app');
        setIsInstalling(false);
      }
    }, 0);
  };

  if (!showBanner) return null;

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-20 left-0 right-0 z-40 mx-4 max-w-2xl lg:left-1/2 lg:-translate-x-1/2"
    >
      <div className="bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl shadow-2xl border border-white/20 p-4 sm:p-5">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
            <Download className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base sm:text-lg">Get the MyScanly App</p>
            <p className="text-white/90 text-sm">Install for faster access & offline use</p>
          </div>
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="flex-shrink-0 px-4 sm:px-6 py-2.5 bg-white text-purple-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isInstalling ? 'Installing...' : 'Download'}
          </button>
          <button
            onClick={() => setShowBanner(false)}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

type ModeId = "services" | "products" | "digital";

const MODES: {
  id: ModeId;
  title: string;
  desc: string;
  icon: any;
  handle: string;
  exampleName: string;
  exampleLine1: string;
  exampleLine2: string;
  examplePrice1: string;
  examplePrice2: string;
  brandColor: string;
  brandColorLight: string;
  tagline: string;
  location: string;
}[] = [
  {
    id: "services",
    title: "Sell Services",
    desc: "Barbers, salons, trainers.",
    icon: ScanLine,
    handle: "demo-barber",
    exampleName: "FreshCuts Studio",
    exampleLine1: "Signature Fade + Lineup",
    exampleLine2: "Beard Trim + Hot Towel",
    examplePrice1: "$45",
    examplePrice2: "$35",
    brandColor: "#06b6d4",
    brandColorLight: "#22d3ee",
    tagline: "Premium cuts, no wait ✨",
    location: "Brooklyn, NY",
  },
  {
    id: "products",
    title: "Sell Products",
    desc: "Pop-ups, merch, markets.",
    icon: Store,
    handle: "demo-products",
    exampleName: "VibeCo",
    exampleLine1: "Signature Tee (Black)",
    exampleLine2: "Holographic Sticker Pack",
    examplePrice1: "$28",
    examplePrice2: "$8",
    brandColor: "#f97316",
    brandColorLight: "#fb923c",
    tagline: "Limited drops, no restock 🔥",
    location: "Pop-up • Downtown LA",
  },
  {
    id: "digital",
    title: "Sell Digital",
    desc: "Courses, templates, files.",
    icon: Download,
    handle: "demo-digital",
    exampleName: "FitFlow",
    exampleLine1: "8-Week Shred Program",
    exampleLine2: "Macro Calculator + Guide",
    examplePrice1: "$29",
    examplePrice2: "$15",
    brandColor: "#d946ef",
    brandColorLight: "#e879f9",
    tagline: "Get fit, stay consistent 💪",
    location: "Instant download",
  },
];

const USE_ANYWHERE = [
  "On a business card",
  "On a mirror / door sign",
  "In delivery bags",
  "Instagram bio",
  "Vendor table sign",
  "Flyers + posters",
];

function cn(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(" ");
}
function AnimatedPhonePreview({
  mode,
}: {
  mode: {
    id: ModeId;
    title: string;
    handle: string;
    exampleName: string;
    exampleLine1: string;
    exampleLine2: string;
    examplePrice1: string;
    examplePrice2: string;
    brandColor: string;
    brandColorLight: string;
    tagline: string;
    location: string;
  };
}) {
  // State to control notification visibility
  const [showNotification, setShowNotification] = useState(false);

  // Show notification after 2 seconds, then hide after 5 seconds
  useEffect(() => {
    const showTimer = setTimeout(() => setShowNotification(true), 2000);
    const hideTimer = setTimeout(() => setShowNotification(false), 7000);
    
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  // Generate brand logo SVG with gradient effects
  const BrandLogo = () => {
    if (mode.id === "services") {
      return (
        <svg
          className="w-20 h-20"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="servicesGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={mode.brandColor} />
              <stop offset="100%" stopColor={mode.brandColorLight} />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="45" fill="url(#servicesGrad)" />
          <circle cx="50" cy="50" r="38" fill="white" fillOpacity="0.15" />
          <path
            d="M35 45 L40 30 L45 45 M55 45 L60 30 L65 45 M30 60 Q50 75 70 60"
            stroke="white"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      );
    } else if (mode.id === "products") {
      return (
        <svg
          className="w-20 h-20"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="productsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={mode.brandColor} />
              <stop offset="100%" stopColor={mode.brandColorLight} />
            </linearGradient>
          </defs>
          <rect
            x="10"
            y="10"
            width="80"
            height="80"
            rx="18"
            fill="url(#productsGrad)"
          />
          <path
            d="M30 40 L50 25 L70 40 L70 75 L30 75 Z"
            fill="white"
            fillOpacity="0.95"
          />
          <circle cx="50" cy="55" r="10" fill={mode.brandColor} />
          <circle cx="50" cy="55" r="5" fill="white" />
        </svg>
      );
    } else {
      return (
        <svg
          className="w-20 h-20"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="digitalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={mode.brandColor} />
              <stop offset="100%" stopColor={mode.brandColorLight} />
            </linearGradient>
          </defs>
          <circle cx="50" cy="50" r="45" fill="url(#digitalGrad)" />
          <circle cx="50" cy="50" r="38" fill="white" fillOpacity="0.2" />
          <path
            d="M35 50 L45 60 L68 33"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }
  };

  // Additional items per mode
  const additionalItems = mode.id === "services" 
    ? [
        { name: "Express Cleanup", desc: "20 min • Quick & fresh", price: "$25", badge: "🔥 Trending" },
        { name: "VIP Treatment", desc: "120 min • Ultimate luxury", price: "$120", badge: null },
        { name: "Student Special", desc: "40 min • Valid w/ ID", price: "$30", badge: "🎓 Save 30%" }
      ]
    : mode.id === "products"
    ? [
        { name: "Embroidered Cap", desc: "Adjustable • 6 colors", price: "$35", badge: "⭐ Best Seller" },
        { name: "Enamel Pin Set", desc: "Pack of 3 • Collectible", price: "$12", badge: null },
        { name: "Tote Bag", desc: "Canvas • Limited run", price: "$22", badge: "🔥 Only 5 left" }
      ]
    : [
        { name: "30-Day Challenge", desc: "Daily workouts + nutrition", price: "$39", badge: "💪 Popular" },
        { name: "Recipe Collection", desc: "50+ high-protein meals", price: "$19", badge: null },
        { name: "1-on-1 Coaching", desc: "4 weekly calls + support", price: "$199", badge: "⭐ Premium" }
      ];

  return (
    <div className="relative mx-auto w-full max-w-sm">
      {/* Outer container with glass effect - matching create page */}
      <div className="rounded-[28px] border border-white/12 bg-black/45 p-3">
        <div className="relative overflow-hidden rounded-[28px] border border-white/12 bg-black">
          {/* Header bar - matching create page */}
          <div className="flex items-center justify-between px-4 py-2 text-[11px] text-white/80 border-b border-white/10 bg-black/70">
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Demo preview • {mode.exampleName}</span>
              <span className="sm:hidden">Demo • {mode.exampleName}</span>
            </span>
            <span className="flex items-center gap-2">
              <a
                href="/login"
                className="px-3 py-1 rounded-full text-xs font-semibold border border-cyan-200 text-cyan-700 bg-white hover:bg-cyan-50 transition"
              >
                Login
              </a>
              <a
                href="/create"
                className="px-3 py-1 rounded-full text-xs font-semibold border border-purple-200 text-purple-700 bg-white hover:bg-purple-50 transition"
              >
                Create
              </a>
            </span>
          </div>

          {/* Screen */}
          <div className="relative overflow-hidden bg-white">
          
          {/* Floating notification - "Someone just purchased" */}
          <AnimatePresence>
            {showNotification && (
              <motion.div
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                transition={{ duration: 0.5, type: "spring", bounce: 0.4 }}
                className="absolute top-2 left-2 right-2 z-20 backdrop-blur-xl rounded-2xl p-2.5 shadow-2xl border border-white/30"
                style={{
                  background: `linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.85))`,
                }}
              >
                <div className="flex items-center gap-2">
                  <motion.div 
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold relative overflow-hidden shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${mode.brandColor}, ${mode.brandColorLight})`,
                    }}
                    animate={{
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                    <span className="relative z-10">{mode.id === "services" ? "✂️" : mode.id === "products" ? "🛍️" : "⚡"}</span>
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-black text-gray-900">🎉 Someone just {mode.id === "services" ? "booked" : "purchased"}!</div>
                    <div className="text-[9px] font-semibold text-gray-600">
                      {mode.id === "services" ? mode.exampleLine1 : mode.id === "products" ? mode.exampleLine1 : mode.exampleLine1} • Just now
                    </div>
                  </div>
                  <motion.div 
                    className="px-2 py-1 rounded-full text-[8px] font-black text-white shadow-md"
                    style={{
                      background: `linear-gradient(135deg, #10b981, #34d399)`,
                    }}
                    animate={{
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                    }}
                  >
                    LIVE
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Scrollable content */}
          <div className="h-[560px] overflow-y-scroll scrollbar-hide">{/* Hero section with brand color and glassmorphism */}
            <motion.div
              key={`hero-${mode.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="relative h-48 overflow-hidden"
              style={{
                background: mode.id === "services" 
                  ? `linear-gradient(135deg, #06b6d4 0%, #8b5cf6 50%, #ec4899 100%)`
                  : mode.id === "products"
                  ? `linear-gradient(135deg, #f97316 0%, #ec4899 50%, #f59e0b 100%)`
                  : `linear-gradient(135deg, #d946ef 0%, #8b5cf6 50%, #06b6d4 100%)`,
              }}
            >
              {/* Animated shimmer overlay */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)`,
                }}
                animate={{
                  x: ["-100%", "200%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                  repeatDelay: 1,
                }}
              />

              {/* Limited time banner with gradient */}
              <motion.div
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="absolute top-3 left-3 right-3 backdrop-blur-md border border-white/40 rounded-xl px-2 py-1.5 shadow-lg"
                style={{
                  background: `linear-gradient(90deg, rgba(255,255,255,0.25), rgba(255,255,255,0.15))`,
                }}
              >
                <div className="flex items-center justify-between text-white text-[9px]">
                  <span className="font-black">✨ {mode.id === "services" ? "Same-day slots • Book now" : mode.id === "products" ? "Free shipping • Orders $50+" : "Launch sale • 40% OFF"}</span>
                  <span className="bg-white/30 px-2 py-0.5 rounded-full font-black backdrop-blur-sm">{mode.id === "digital" ? "TODAY" : "LIMITED"}</span>
                </div>
              </motion.div>
              
              {/* Floating colorful orbs */}
              <motion.div
                className="absolute top-10 right-10 w-20 h-20 rounded-full blur-2xl"
                style={{ background: "rgba(255,255,255,0.3)" }}
                animate={{
                  y: [0, -20, 0],
                  x: [0, 10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute bottom-10 left-10 w-24 h-24 rounded-full blur-2xl"
                style={{ background: "rgba(255,255,255,0.25)" }}
                animate={{
                  y: [0, 15, 0],
                  x: [0, -10, 0],
                  scale: [1, 0.9, 1],
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              />

              {/* Sparkle particles */}
              <div className="absolute inset-0">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full"
                    style={{
                      left: `${20 + i * 15}%`,
                      top: `${30 + (i % 2) * 30}%`,
                    }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.3,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>

              {/* Brand logo with subtle animation */}
              <motion.div
                className="absolute top-5 left-5"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <BrandLogo />
              </motion.div>

              {/* Business name & tagline with better typography */}
              <div className="absolute bottom-5 left-5 right-5">
                <motion.h2
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-white mb-1.5 tracking-tight"
                >
                  {mode.exampleName}
                </motion.h2>
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-white/95 text-sm font-medium"
                >
                  {mode.tagline}
                </motion.p>
              </div>
            </motion.div>

            {/* Location & stats badge */}
            <motion.div
              key={`location-${mode.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="px-4 py-3 bg-gradient-to-br from-white to-gray-50 border-b border-gray-100"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs text-gray-700">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  <span className="font-medium">{mode.location}</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" style={{ color: mode.brandColor }}>
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="font-bold text-gray-900">4.9</span>
                  <span className="text-gray-500">(284)</span>
                </div>
              </div>
              
              {/* Social proof indicators */}
              <div className="flex items-center gap-3 text-[10px]">
                <div className="flex items-center gap-1 text-gray-600">
                  <div className="flex -space-x-1">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border border-white"></div>
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 border border-white"></div>
                    <div className="w-4 h-4 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 border border-white"></div>
                  </div>
                  <span className="font-medium">47 people viewing</span>
                </div>
                <div className="text-gray-400">•</div>
                <div className="font-medium text-gray-600">
                  {mode.id === "services" ? "Next slot: 2:30 PM" : mode.id === "products" ? "In stock • Ships today" : "Instant access"}
                </div>
              </div>
            </motion.div>

            {/* Services/Products list with modern card design */}
            <div className="px-4 pb-6 space-y-3 bg-gradient-to-b from-gray-50 to-white">
              <motion.div
                key={`list-${mode.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center justify-between pt-4 pb-3">
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    {mode.id === "services"
                      ? "⚡ Popular Services"
                      : mode.id === "products"
                        ? "🔥 Featured Items"
                        : "💎 Best Sellers"}
                  </h3>
                  <span className="text-[10px] text-gray-500 font-medium">6 items</span>
                </div>

                {/* Item 1 - Enhanced with image placeholder */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="mb-3 rounded-2xl overflow-hidden border-2 shadow-lg hover:shadow-2xl transition-all group relative"
                  style={{
                    borderColor: `${mode.brandColor}40`,
                    background: `linear-gradient(135deg, white 0%, ${mode.brandColor}05 100%)`,
                  }}
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  {/* Animated border gradient */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: `linear-gradient(135deg, ${mode.brandColor}20, ${mode.brandColorLight}20)`,
                    }}
                  />
                  
                  <div className="flex gap-3 p-3 relative z-10">
                    {/* Image placeholder with holographic gradient */}
                    <motion.div
                      className="w-20 h-20 rounded-xl flex-shrink-0 relative overflow-hidden shadow-md"
                      style={{
                        background: `linear-gradient(135deg, ${mode.brandColor}, ${mode.brandColorLight})`,
                      }}
                      whileHover={{ rotate: [0, -5, 5, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      {/* Holographic shimmer */}
                      <motion.div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)`,
                        }}
                        animate={{
                          x: ["-100%", "200%"],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                      <div className="w-full h-full flex items-center justify-center text-3xl relative z-10 drop-shadow-lg">
                        {mode.id === "services" ? "✂️" : mode.id === "products" ? "👕" : "📱"}
                      </div>
                    </motion.div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-bold text-gray-900 text-sm leading-tight">
                          {mode.exampleLine1}
                        </h4>
                        <span
                          className="font-bold text-base ml-2 flex-shrink-0"
                          style={{ color: mode.brandColor }}
                        >
                          {mode.examplePrice1}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-600 mb-2 leading-relaxed font-semibold">
                        {mode.id === "services"
                          ? "⏱️ 45 min • ⭐ Most popular"
                          : mode.id === "products"
                            ? "👕 100% cotton • 🔥 Limited edition"
                            : "📥 Download • ♾️ Lifetime access"}
                      </p>
                      <motion.button
                        className="w-full py-2 rounded-xl text-xs font-black text-white shadow-lg relative overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${mode.brandColor}, ${mode.brandColorLight})`,
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.div
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
                          }}
                          animate={{
                            x: ["-100%", "200%"],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                        <span className="relative z-10">
                          {mode.id === "services"
                            ? "📅 Book Now →"
                            : mode.id === "products"
                              ? "🛍️ Add to Cart"
                              : "⚡ Buy Now →"}
                        </span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>

                {/* Item 2 */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.75 }}
                  className="mb-3 rounded-2xl overflow-hidden border-2 shadow-lg hover:shadow-2xl transition-all group relative"
                  style={{
                    borderColor: `${mode.brandColorLight}40`,
                    background: `linear-gradient(135deg, white 0%, ${mode.brandColorLight}08 100%)`,
                  }}
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  <div className="flex gap-3 p-3">
                    <motion.div
                      className="w-20 h-20 rounded-xl flex-shrink-0 relative overflow-hidden shadow-md"
                      style={{
                        background: `linear-gradient(45deg, ${mode.brandColorLight}, ${mode.brandColor})`,
                      }}
                      whileHover={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 0.5 }}
                    >
                      {/* Rainbow shimmer effect */}
                      <motion.div
                        className="absolute inset-0 opacity-50"
                        style={{
                          background: `linear-gradient(135deg, rgba(255,0,255,0.3), rgba(0,255,255,0.3))`,
                        }}
                        animate={{
                          opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                      />
                      <div className="w-full h-full flex items-center justify-center text-3xl relative z-10 drop-shadow-lg">
                        {mode.id === "services" ? "🪒" : mode.id === "products" ? "📦" : "📊"}
                      </div>
                    </motion.div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className="font-bold text-gray-900 text-sm leading-tight">
                          {mode.exampleLine2}
                        </h4>
                        <span
                          className="font-bold text-base ml-2 flex-shrink-0"
                          style={{ color: mode.brandColor }}
                        >
                          {mode.examplePrice2}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-600 mb-2 leading-relaxed font-semibold">
                        {mode.id === "services"
                          ? "⏱️ 30 min • 💫 Premium add-on"
                          : mode.id === "products"
                            ? "📦 Pack of 5 • 💧 Waterproof"
                            : "📄 PDF + 🎥 Video guide"}
                      </p>
                      <motion.button
                        className="w-full py-2 rounded-xl text-xs font-black text-white shadow-lg relative overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${mode.brandColor}, ${mode.brandColorLight})`,
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <motion.div
                          className="absolute inset-0"
                          style={{
                            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
                          }}
                          animate={{
                            x: ["-100%", "200%"],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "linear",
                            delay: 0.5,
                          }}
                        />
                        <span className="relative z-10">
                          {mode.id === "services"
                            ? "📅 Book Now →"
                            : mode.id === "products"
                              ? "🛍️ Add to Cart"
                              : "⚡ Buy Now →"}
                        </span>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>

                {/* Remaining items - compact style */}
                {additionalItems.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + idx * 0.05 }}
                    className="p-3 rounded-xl border-2 shadow-md hover:shadow-xl transition-all relative overflow-hidden group"
                    style={{
                      borderColor: `${mode.brandColor}30`,
                      background: `linear-gradient(135deg, white, ${mode.brandColor}05)`,
                    }}
                    whileHover={{ scale: 1.02 }}
                  >
                    {/* Animated background gradient on hover */}
                    <motion.div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: `linear-gradient(45deg, ${mode.brandColor}08, ${mode.brandColorLight}08)`,
                      }}
                    />
                    
                    <div className="flex items-center justify-between mb-2 relative z-10">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-black text-gray-900 text-sm">
                            {item.name}
                          </h4>
                          {item.badge && (
                            <motion.span
                              className="text-[9px] px-2 py-0.5 rounded-full font-black text-white shadow-sm"
                              style={{
                                background: `linear-gradient(135deg, ${mode.brandColor}, ${mode.brandColorLight})`,
                              }}
                              animate={{
                                scale: [1, 1.05, 1],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: idx * 0.2,
                              }}
                            >
                              {item.badge}
                            </motion.span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-600 font-semibold">{item.desc}</p>
                      </div>
                      <span
                        className="font-black text-base ml-3 flex-shrink-0"
                        style={{ color: mode.brandColor }}
                      >
                        {item.price}
                      </span>
                    </div>
                    <motion.button
                      className="w-full py-1.5 rounded-lg text-xs font-black text-white relative overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${mode.brandColor}, ${mode.brandColorLight})`,
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)`,
                        }}
                        animate={{
                          x: ["-100%", "200%"],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "linear",
                          delay: idx * 0.3,
                        }}
                      />
                      <span className="relative z-10">
                        {mode.id === "services" ? "📅 Book" : mode.id === "products" ? "🛍️ Add" : "⚡ Buy"}
                      </span>
                    </motion.button>
                  </motion.div>
                ))}
              </motion.div>

              {/* Trust badges with modern design */}
              <motion.div
                key={`trust-${mode.id}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="pt-4 pb-3"
              >
                <div className="grid grid-cols-3 gap-2">
                  <motion.div
                    className="p-3 rounded-xl text-center relative overflow-hidden shadow-md border-2"
                    style={{ 
                      background: `linear-gradient(135deg, ${mode.brandColor}15, ${mode.brandColor}05)`,
                      borderColor: `${mode.brandColor}30`,
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
                  >
                    <motion.div
                      className="flex justify-center mb-1"
                      animate={{
                        rotate: [0, 5, -5, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                      }}
                    >
                      <BadgeCheck className="w-5 h-5" style={{ color: mode.brandColor }} />
                    </motion.div>
                    <div className="text-[9px] font-black text-gray-900">Secure</div>
                    <div className="text-[8px] text-gray-600 font-semibold">SSL encrypted</div>
                  </motion.div>
                  <motion.div
                    className="p-3 rounded-xl text-center relative overflow-hidden shadow-md border-2"
                    style={{ 
                      background: `linear-gradient(135deg, ${mode.brandColorLight}15, ${mode.brandColorLight}05)`,
                      borderColor: `${mode.brandColorLight}30`,
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
                  >
                    <motion.div
                      className="flex justify-center mb-1"
                      animate={{
                        y: [0, -3, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: 0.3,
                      }}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        style={{ color: mode.brandColorLight }}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </motion.div>
                    <div className="text-[9px] font-black text-gray-900">Instant</div>
                    <div className="text-[8px] text-gray-600 font-semibold">No wait time</div>
                  </motion.div>
                  <motion.div
                    className="p-3 rounded-xl text-center relative overflow-hidden shadow-md border-2"
                    style={{ 
                      background: `linear-gradient(135deg, ${mode.brandColor}10, ${mode.brandColorLight}10)`,
                      borderColor: `${mode.brandColor}25`,
                    }}
                    whileHover={{ scale: 1.05, y: -2 }}
                  >
                    <motion.div
                      className="flex justify-center mb-1"
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        delay: 0.6,
                      }}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        style={{ color: mode.brandColor }}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </motion.div>
                    <div className="text-[9px] font-black text-gray-900">Rated 4.9</div>
                    <div className="text-[8px] text-gray-600 font-semibold">284 reviews</div>
                  </motion.div>
                </div>
              </motion.div>
              
              {/* Payment methods accepted */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="pb-4 pt-2"
              >
                <div className="text-[9px] text-gray-500 text-center mb-2 font-medium">Accepted payment methods</div>
                <div className="flex items-center justify-center gap-2">
                  <div className="px-2 py-1 bg-white border border-gray-200 rounded text-[8px] font-bold text-gray-700">
                    Apple Pay
                  </div>
                  <div className="px-2 py-1 bg-white border border-gray-200 rounded text-[8px] font-bold text-gray-700">
                    Google Pay
                  </div>
                  <div className="px-2 py-1 bg-white border border-gray-200 rounded text-[8px] font-bold text-gray-700">
                    💳 Card
                  </div>
                </div>
                <div className="text-[8px] text-gray-400 text-center mt-2">
                  Powered by Stripe • 100% secure checkout
                </div>
              </motion.div>
              
              {/* Customer testimonial */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="mx-4 mb-4 p-3 rounded-xl border border-gray-200 bg-gradient-to-br from-white to-gray-50"
              >
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {mode.id === "services" ? "JM" : mode.id === "products" ? "SK" : "AL"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 mb-0.5">
                      {[1,2,3,4,5].map((star) => (
                        <svg key={star} className="w-2.5 h-2.5" fill="currentColor" style={{ color: mode.brandColor }} viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <div className="text-[9px] text-gray-900 font-medium mb-1">
                      "{mode.id === "services" ? "Best fade in the city! Worth every penny." : mode.id === "products" ? "Quality is insane. Shipping was super fast!" : "This program changed my life. Highly recommend!"}"
                    </div>
                    <div className="text-[8px] text-gray-500">
                      {mode.id === "services" ? "James M." : mode.id === "products" ? "Sarah K." : "Alex L."} • Verified customer • {mode.id === "services" ? "2 days ago" : mode.id === "products" ? "1 week ago" : "3 days ago"}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
            
            {/* Sticky bottom CTA bar */}
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.3 }}
              className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 p-3 shadow-2xl"
            >
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <div className="text-[9px] text-gray-600 mb-0.5">Starting from</div>
                  <div className="text-base font-bold" style={{ color: mode.brandColor }}>
                    {mode.id === "services" ? "$25" : mode.id === "products" ? "$8" : "$15"}
                  </div>
                </div>
                <button
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg"
                  style={{
                    background: `linear-gradient(135deg, ${mode.brandColor}, ${mode.brandColorLight})`,
                  }}
                >
                  {mode.id === "services" ? "Book Now →" : mode.id === "products" ? "Shop Now →" : "Get Started →"}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
        </div>
      </div>

      {/* Note below preview - matching create page */}
      <div className="mt-3 text-center text-[11px] text-white/70">
        Real-time preview • <span className="text-white/90">{mode.exampleName}</span> storefront
      </div>
    </div>
  );
}

export default function Home() {
  const router = useRouter();
  const [activeId, setActiveId] = useState<ModeId>("services");
  const active = useMemo(
    () => MODES.find((m) => m.id === activeId)!,
    [activeId]
  );

  const [origin, setOrigin] = useState("");
  
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const demoUrl = useMemo(() => {
    return `${origin}/u/${active.handle}`;
  }, [origin, active.handle]);

  return (
    <>
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 pb-20 pt-20 overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 -left-4 w-72 h-72 sm:w-96 sm:h-96 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 sm:w-96 sm:h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 sm:w-96 sm:h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black mb-4 sm:mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight px-4"
          >
            Scan. Shop. Pay. Done.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 sm:mb-10 max-w-3xl mx-auto font-medium leading-relaxed px-4"
          >
            Turn any business into a QR-powered store in 60 seconds. No website builders. No apps. No friction.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col items-center px-4"
          >
            <a
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-full font-bold text-lg sm:text-xl md:text-2xl hover:shadow-2xl hover:shadow-cyan-500/50 transition-all group active:scale-95 w-full sm:w-auto max-w-md"
            >
              <span className="hidden sm:inline">Get Your First Store — Free Forever</span>
              <span className="sm:hidden">Start Free</span>
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
            </a>
            <p className="text-xs sm:text-sm text-gray-400 mt-3">No credit card required • Get live in under 120 seconds</p>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-full"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm font-medium text-green-300">🔥 127 QR codes created today</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How It Works - 3 Steps */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-black via-purple-950/10 to-black overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <motion.h3
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-center mb-3 sm:mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent px-2"
          >
            Get live in 3 steps (takes 90 seconds) ⏱️
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-gray-400 mb-12 sm:mb-16 text-base sm:text-lg px-2"
          >
            Seriously, you'll be selling before you finish your coffee.
          </motion.p>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg">
                1
              </div>
              <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 pt-12 hover:border-cyan-500/30 transition-all">
                <h4 className="text-2xl font-black text-white mb-3">Sign up (20 sec)</h4>
                <p className="text-gray-400 leading-relaxed">Email, password, done. No lengthy forms, no verification wait. Just get in.</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="relative"
            >
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg">
                2
              </div>
              <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 pt-12 hover:border-purple-500/30 transition-all">
                <h4 className="text-2xl font-black text-white mb-3">Add your stuff (40 sec)</h4>
                <p className="text-gray-400 leading-relaxed">Type your service/product name and price. Upload a pic if you want. That's it.</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-br from-pink-500 to-pink-600 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg">
                3
              </div>
              <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-8 pt-12 hover:border-pink-500/30 transition-all">
                <h4 className="text-2xl font-black text-white mb-3">Get your QR (30 sec)</h4>
                <p className="text-gray-400 leading-relaxed">Download, print, or share. You're live. Start making sales now.</p>
              </div>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-center mt-10 sm:mt-14"
          >
            <a
              href="/signup"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-full font-bold text-base sm:text-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all group active:scale-95"
            >
              <span>Start Now → Be Live in 90 Seconds</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Social Proof Quotes */}
      <section className="relative py-16 sm:py-20 px-4 sm:px-6 overflow-hidden bg-gradient-to-b from-gray-950 to-black">
        <div className="max-w-5xl mx-auto">
          <motion.h3
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-2xl sm:text-3xl md:text-4xl font-black text-center mb-10 sm:mb-12 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent px-2"
          >
            People are going live right now 🚀
          </motion.h3>
          <div className="grid md:grid-cols-3 gap-4 sm:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-cyan-500/10 to-purple-500/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-cyan-500/30 transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-2xl">💈</div>
                <div>
                  <div className="font-bold text-white">Marcus T.</div>
                  <div className="text-sm text-gray-400">Barber, Miami</div>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">"Made $450 in my first week just from walk-ins scanning my table tent. No more cash, no more 'I'll Venmo you later.' Game changer."</p>
              <div className="mt-4 text-yellow-400 text-sm">⭐⭐⭐⭐⭐</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl">💅</div>
                <div>
                  <div className="font-bold text-white">Jasmine L.</div>
                  <div className="text-sm text-gray-400">Nail Tech, LA</div>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">"Set up in literally 2 min. Posted my QR on Instagram and booked out 3 days ahead. Clients love how fast it is. I love getting paid instantly."</p>
              <div className="mt-4 text-yellow-400 text-sm">⭐⭐⭐⭐⭐</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:border-orange-500/30 transition-all"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-full flex items-center justify-center text-2xl">👕</div>
                <div>
                  <div className="font-bold text-white">Tyler K.</div>
                  <div className="text-sm text-gray-400">Merch, NYC</div>
                </div>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">"Sold 40 hoodies at my show last night. QR code on the merch table → people scan → instant checkout. Easiest sales night ever. Zero hassle."</p>
              <div className="mt-4 text-yellow-400 text-sm">⭐⭐⭐⭐⭐</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Use Case Section */}
      <section className="relative py-20 sm:py-28 px-4 sm:px-6 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-gray-950/50 to-black">
        {/* Subtle animated background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-pink-500 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="max-w-3xl mx-auto text-center relative z-10 w-full">
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-black mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent px-2">
            Built for hustlers like you 💪
          </h3>
          <p className="text-base sm:text-lg text-gray-400 mb-10 sm:mb-12 max-w-2xl mx-auto px-2 font-medium">Join creators already making bank with their QR codes</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <div className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg sm:rounded-2xl hover:bg-white/10 hover:border-cyan-500/30 transition-all group">
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-white/10">
                <img 
                  src="https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&h=500&fit=crop&q=90" 
                  alt="Barber" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <span className="text-sm sm:text-base md:text-lg font-semibold text-white/90">Barbers</span>
            </div>
            <div className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg sm:rounded-2xl hover:bg-white/10 hover:border-cyan-500/30 transition-all group">
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center border border-white/10">
                <img 
                  src="https://images.unsplash.com/photo-1604654894610-df63bc536371?w=500&h=500&fit=crop&q=90" 
                  alt="Nail tech" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <span className="text-sm sm:text-base md:text-lg font-semibold text-white/90">Nail techs</span>
            </div>
            <div className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg sm:rounded-2xl hover:bg-white/10 hover:border-cyan-500/30 transition-all group">
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center border border-white/10">
                <img 
                  src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=500&h=500&fit=crop&q=90" 
                  alt="Merch seller" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <span className="text-sm sm:text-base md:text-lg font-semibold text-white/90">Merch sellers</span>
            </div>
            <div className="flex flex-col items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg sm:rounded-2xl hover:bg-white/10 hover:border-cyan-500/30 transition-all group">
              <div className="w-full aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center border border-white/10">
                <img 
                  src="https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=500&h=500&fit=crop&q=90" 
                  alt="Digital creator" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <span className="text-sm sm:text-base md:text-lg font-semibold text-white/90">Digital creators</span>
            </div>
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="relative py-24 sm:py-32 px-4 sm:px-6 overflow-hidden bg-gradient-to-b from-black via-gray-900 to-black">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute top-1/4 left-10 w-72 h-72 bg-cyan-500 rounded-full filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute bottom-1/4 right-10 w-72 h-72 bg-purple-500 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl md:text-6xl font-black text-center mb-4 sm:mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent px-2"
          >
            Why MyScanly beats traditional stores
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-center text-gray-300 mb-12 sm:mb-16 max-w-2xl mx-auto text-base sm:text-lg font-medium px-2"
          >
            While others make you build websites, we make buying instant—scan, tap, done.
          </motion.p>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {
                icon: ScanLine,
                title: "One scan = instant storefront",
                desc: "No website needed. Customers scan your QR and see your menu instantly—zero loading, zero apps.",
                step: "01",
              },
              {
                icon: CreditCard,
                title: "Checkout in 3 taps",
                desc: "Apple Pay, Google Pay, or card. Payment done before they put their phone down. Money hits your bank instantly.",
                step: "02",
              },
              {
                icon: BadgeCheck,
                title: "Your QR, everywhere",
                desc: "Print it, post it, share it. Tables, business cards, Instagram stories—customers buy anywhere they see it.",
                step: "03",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="relative group"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                <div className="relative bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-8 hover:border-cyan-500/30 transition-all duration-300 overflow-hidden">
                  {/* Subtle animated gradient on hover */}
                  <motion.div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: "linear-gradient(135deg, rgba(34,211,238,0.08), rgba(167,139,250,0.08))",
                    }}
                  />
                  <div className="absolute top-6 right-6 text-7xl font-black text-white/5 group-hover:text-cyan-500/10 transition-colors">
                    {item.step}
                  </div>
                  <div className="relative z-10">
                    <div className="w-14 h-14 mb-5 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg">
                      <item.icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">
                      {item.title}
                    </h3>
                    <p className="text-gray-400 text-base leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits With Numbers */}
      <section className="relative py-20 sm:py-28 px-4 sm:px-6 overflow-hidden bg-gradient-to-b from-black via-cyan-950/10 to-black">
        <div className="max-w-6xl mx-auto">
          <motion.h3
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-center mb-3 sm:mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent px-2"
          >
            The numbers don't lie 📈
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-gray-400 mb-10 sm:mb-16 text-base sm:text-lg px-2"
          >
            Real results from creators using MyScanly
          </motion.p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-6 text-center hover:border-cyan-500/40 transition-all"
            >
              <div className="text-5xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">3.2x</div>
              <div className="text-gray-300 font-semibold mb-1">More sales</div>
              <div className="text-sm text-gray-500">vs. traditional checkout</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6 text-center hover:border-purple-500/40 transition-all"
            >
              <div className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">8 sec</div>
              <div className="text-gray-300 font-semibold mb-1">Avg checkout time</div>
              <div className="text-sm text-gray-500">scan to payment done</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-2xl p-6 text-center hover:border-orange-500/40 transition-all"
            >
              <div className="text-5xl font-black bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-2">$0</div>
              <div className="text-gray-300 font-semibold mb-1">Setup cost</div>
              <div className="text-sm text-gray-500">forever free to start</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6 text-center hover:border-green-500/40 transition-all"
            >
              <div className="text-5xl font-black bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-2">90 sec</div>
              <div className="text-gray-300 font-semibold mb-1">Time to go live</div>
              <div className="text-sm text-gray-500">setup to first sale</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Interactive phone demo */}
      <section className="relative py-20 sm:py-28 px-4 sm:px-6 overflow-hidden bg-gradient-to-b from-black to-gray-950">
        {/* Animated background gradients - matching create page */}
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(circle at 20% 30%, rgba(34,211,238,0.15), transparent 55%), radial-gradient(circle at 80% 70%, rgba(167,139,250,0.12), transparent 60%)",
          }}
          animate={{
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="pointer-events-none absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full blur-3xl opacity-20"
          style={{
            background: "linear-gradient(135deg, #22D3EE, #A78BFA, #F472B6)",
          }}
          animate={{
            scale: [1, 1.15, 1],
            rotate: [0, 60, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div className="container mx-auto max-w-7xl relative z-10">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl md:text-6xl font-black text-center mb-4 sm:mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent px-2"
          >
            This is what they see when they scan
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-center text-gray-300 mb-12 sm:mb-16 max-w-2xl mx-auto text-base sm:text-lg font-medium px-2"
          >
            No app downloads. No typing URLs. Just scan → see → buy. Try the demos below.
          </motion.p>

          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            {/* Phone preview - wrapped in card like create page */}
            <div className="order-2 lg:order-1">
              <section className="rounded-3xl border border-white/12 bg-white/8 backdrop-blur-xl p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="text-sm font-semibold text-white/90">Live preview</div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/35 px-3 py-1 text-[11px] text-white/85">
                    <Sparkles className="h-3.5 w-3.5" />
                    Interactive demo
                  </div>
                </div>
                <AnimatedPhonePreview mode={active} />
              </section>
            </div>

            {/* Mode selector - wrapped in card like create page */}
            <div className="order-1 lg:order-2">
              <section className="rounded-3xl border border-white/12 bg-white/8 backdrop-blur-xl p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="text-sm font-semibold text-white/90">Pick a demo</div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/35 px-3 py-1 text-[11px] text-white/85">
                    <ScanLine className="h-3.5 w-3.5" />
                    {activeId === "services" ? "Services" : activeId === "products" ? "Products" : "Digital"}
                  </div>
                </div>
                <div className="space-y-3">
              {MODES.map((m) => {
                const Icon = m.icon;
                const isActive = m.id === activeId;
                return (
                  <motion.button
                    key={m.id}
                    onClick={() => setActiveId(m.id)}
                    className={cn(
                      "w-full p-4 rounded-2xl border text-left transition-all relative overflow-hidden",
                      isActive
                        ? "border-cyan-500/40 bg-cyan-500/15 shadow-lg shadow-cyan-500/20"
                        : "border-white/12 bg-black/30 hover:bg-white/10"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isActive && (
                      <motion.div
                        className="absolute inset-0"
                        style={{
                          background: "linear-gradient(90deg, transparent, rgba(34,211,238,0.2), transparent)",
                        }}
                        animate={{
                          x: [-200, 400],
                        }}
                        transition={{
                          duration: 2.5,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                    )}
                    <div className="flex items-start gap-4 relative z-10">
                      <motion.div
                        className="p-3 rounded-xl"
                        style={{
                          backgroundColor: isActive ? `${m.brandColor}25` : "rgba(255,255,255,0.08)",
                        }}
                        animate={isActive ? {
                          rotate: [0, 5, -5, 0],
                          scale: [1, 1.05, 1],
                        } : {}}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                      >
                        <Icon
                          className="w-6 h-6"
                          style={{ color: isActive ? m.brandColor : "rgba(255,255,255,0.7)" }}
                        />
                      </motion.div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-white/90 mb-1">
                          {m.title}
                        </h3>
                        <p className="text-sm text-white/70 mb-1">{m.desc}</p>
                        <div className="text-xs text-white/50">
                          Example: <span style={{ color: m.brandColor }}>{m.exampleName}</span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
                </div>
              </section>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-20 sm:py-28 px-4 sm:px-6 overflow-hidden bg-gradient-to-b from-gray-950 via-black to-gray-950">
        <div className="max-w-4xl mx-auto">
          <motion.h3
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl md:text-5xl font-black text-center mb-3 sm:mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent px-2"
          >
            Questions? We got you 👇
          </motion.h3>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-gray-400 mb-10 sm:mb-12 text-base sm:text-lg px-2"
          >
            Everything you need to know before you start
          </motion.p>
          <div className="space-y-3 sm:space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:bg-white/8 transition-all"
            >
              <h4 className="text-lg sm:text-xl font-bold text-white mb-2">👋 Is MyScanly really free?</h4>
              <p className="text-gray-400 leading-relaxed text-sm sm:text-base">Yes! Your first store is 100% free forever—no hidden fees, no trials, no limits. When you want to create additional stores (for more locations or brands), it's just $15/month per extra store. To accept payments, connect Stripe (standard processing fees apply).</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:bg-white/8 transition-all"
            >
              <h4 className="text-lg sm:text-xl font-bold text-white mb-2">⚡ How fast can I actually go live?</h4>
              <p className="text-gray-400 leading-relaxed text-sm sm:text-base">Most people are done in 60-120 seconds. Sign up → add your items → get your QR. That's it. You can be making sales in the time it takes to make instant ramen.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:bg-white/8 transition-all"
            >
              <h4 className="text-lg sm:text-xl font-bold text-white mb-2">💳 Do I need Stripe right away?</h4>
              <p className="text-gray-400 leading-relaxed text-sm sm:text-base">Nope! You can create your store now and connect Stripe whenever you want. Perfect for testing, getting feedback, or going live before handling payments.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.15 }}
              className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:bg-white/8 transition-all"
            >
              <h4 className="text-lg sm:text-xl font-bold text-white mb-2">📱 Does this work on all phones?</h4>
              <p className="text-gray-400 leading-relaxed text-sm sm:text-base">Yes! iPhone, Android, any phone with a camera. QR codes are universal. Your customers just scan and buy—no app needed, no special software.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:bg-white/8 transition-all"
            >
              <h4 className="text-lg sm:text-xl font-bold text-white mb-2">🤔 What if I'm not tech-savvy?</h4>
              <p className="text-gray-400 leading-relaxed text-sm sm:text-base">Perfect! MyScanly is built for people who hate tech. If you can text, you can use MyScanly. No coding, no complicated dashboards. Just simple forms and buttons.</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.25 }}
              className="bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:bg-white/8 transition-all"
            >
              <h4 className="text-xl font-bold text-white mb-2">📦 Can I sell physical products?</h4>
              <p className="text-gray-400 leading-relaxed">Absolutely! Sell merch, products at pop-ups, items at markets—whatever. Customers scan, pay, and you fulfill the order. Simple.</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-28 sm:py-36 px-4 sm:px-6 overflow-hidden bg-gradient-to-b from-black to-gray-950">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-500 rounded-full filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="container mx-auto max-w-4xl text-center relative z-10 px-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-400/30 rounded-full mb-6 sm:mb-8"
          >
            <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-yellow-300 whitespace-nowrap">First store FREE forever • No credit card • Live in 90 seconds</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 sm:mb-8 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight"
          >
            Don't lose another sale.
            <br />Get your QR now.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-base sm:text-lg md:text-xl text-gray-300 mb-10 sm:mb-12 font-medium max-w-3xl mx-auto"
          >
            While your competitors fumble with payment apps, your customers will be checking out in 3 seconds. Start today.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <motion.a
              href="/signup"
              className="inline-flex items-center gap-2 px-6 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-full font-bold text-base sm:text-lg md:text-xl shadow-2xl shadow-cyan-500/30 transition-all group relative overflow-hidden"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
                animate={{
                  x: [-200, 400],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <span className="relative z-10 whitespace-nowrap">Create My QR Code — Free</span>
              <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform relative z-10" />
            </motion.a>
          </motion.div>
        </div>
      </section>
      {/* Footer */}
      <footer className="w-full text-center py-8 sm:py-12 text-xs sm:text-sm text-gray-400 bg-black border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-6 mb-4 sm:mb-6">
            <Link href="/pricing" className="text-white hover:text-cyan-400 transition-colors font-medium text-sm">
              Pricing
            </Link>
            <Link href="/login" className="text-white hover:text-cyan-400 transition-colors font-medium text-sm">
              Login
            </Link>
            <Link href="/signup" className="text-white hover:text-cyan-400 transition-colors font-medium text-sm">
              Sign Up
            </Link>
            <Link href="/dashboard" className="text-white hover:text-cyan-400 transition-colors font-medium text-sm">
              Dashboard
            </Link>
          </div>
          <div className="text-gray-500 text-xs">
            © 2026 MyScanly LLC. All rights reserved.<br />
            MyScanly is a QR-based storefront and mini-app platform.
          </div>
        </div>
      </footer>
    </>
  );
}
