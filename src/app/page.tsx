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
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

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

/** Branded storefront phone preview with full realistic demo */
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
              Live demo • {mode.exampleName}
            </span>
            <span className="text-white/60">{mode.title}</span>
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
      {/* Navigation links for new features */}
      <nav className="w-full flex justify-center gap-6 py-4 bg-black/30 backdrop-blur-md">
        <Link href="/dashboard" className="text-cyan-400 hover:underline font-semibold">Dashboard</Link>
        <Link href="/checkin" className="text-purple-400 hover:underline font-semibold">QR Check-in</Link>
      </nav>

      {/* Header */}
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-xl bg-black/40"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <motion.div
              className="relative h-14 w-14"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 blur-md" />
              <motion.div
                className="absolute inset-0"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                <Image
                  src="/piqo-logo.svg"
                  alt="Piqo"
                  fill
                  className="object-contain"
                />
              </motion.div>
            </motion.div>
            <div>
              <motion.div
                className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent animate-gradient-x"
                style={{
                  backgroundSize: "200% auto",
                }}
              >
                PIQO
              </motion.div>
              <div className="text-xs text-gray-400">Scan. Shop. Done.</div>
            </div>
          </div>

          <a
            href="/create"
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-full font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
          >
            Get started
          </a>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-950/20 via-purple-950/20 to-black pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent"
          >
            Turn any business into a QR storefront
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl md:text-2xl text-gray-400 mb-8 max-w-2xl mx-auto"
          >
            Sell products, services, or digital downloads. Customers scan, choose, and pay—instantly.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <a
              href="/create"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-full font-semibold text-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all group"
            >
              Create your storefront
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* What you get */}
      <section className="relative py-24 px-6 overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-950/5 to-transparent pointer-events-none" />
        
        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent"
          >
            What you get with Piqo
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-center text-white/70 mb-12 max-w-xl mx-auto"
          >
            Everything you need to start selling—no tech skills required
          </motion.p>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: ScanLine,
                title: "Custom mobile page",
                desc: "Your products, services, or downloads—beautifully displayed on mobile.",
                step: "01",
              },
              {
                icon: CreditCard,
                title: "Instant checkout",
                desc: "Customers pay with Apple Pay, Google Pay, or card. You get paid directly.",
                step: "02",
              },
              {
                icon: BadgeCheck,
                title: "Your QR code",
                desc: "Put it anywhere. Tables, cards, flyers, Instagram—scan to buy.",
                step: "03",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative p-6 rounded-3xl border border-white/12 bg-white/8 backdrop-blur-xl hover:border-cyan-500/30 transition-all group overflow-hidden"
              >
                {/* Subtle animated gradient on hover */}
                <motion.div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: "linear-gradient(135deg, rgba(34,211,238,0.08), rgba(167,139,250,0.08))",
                  }}
                />
                <div className="absolute top-4 right-4 text-5xl font-bold text-white/5 group-hover:text-cyan-500/10 transition-colors">
                  {item.step}
                </div>
                <item.icon className="w-10 h-10 mb-4 text-cyan-400 relative z-10" />
                <h3 className="text-lg font-semibold text-white/90 mb-2 relative z-10">
                  {item.title}
                </h3>
                <p className="text-white/70 text-sm relative z-10">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive phone demo */}
      <section className="relative py-24 px-6 overflow-hidden">
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
            className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent"
          >
            See what Piqo creates
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-center text-white/70 mb-16 max-w-2xl mx-auto"
          >
            Switch between demo brands to see real examples of what your customers will experience
          </motion.p>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
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

      {/* Final CTA */}
      <section className="relative py-32 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent"
          >
            Ready to go live?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl text-gray-400 mb-8"
          >
            Create your storefront in 2 minutes. No code, no monthly fees.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <motion.a
              href="/create"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-full font-semibold text-lg shadow-2xl shadow-cyan-500/30 transition-all group relative overflow-hidden"
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
              <span className="relative z-10">Get started for free</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
            </motion.a>
          </motion.div>
        </div>
      </section>
    </>
  );
}
