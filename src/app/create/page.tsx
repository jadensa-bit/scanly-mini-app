"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  Wand2,
  Plus,
  Trash2,
  QrCode,
  ArrowRight,
  Users,
  Palette,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  Zap,
  LayoutTemplate,
  Link as LinkIcon,
  ExternalLink,
  CreditCard,
  ShieldCheck,
  Image as ImageIcon,
  Type,
  Layers,
  BadgeCheck,
  Phone,
  MapPin,
  Instagram,
  Globe,
  Mail,
  User,
  X,
  CalendarClock,
  ShoppingBag,
} from "lucide-react";
import StorefrontPreview from "@/components/StorefrontPreview";

type ModeId = "services" | "booking" | "digital" | "products";

type ItemBadge = "popular" | "limited" | "new" | "trending" | "bestseller" | "sale" | "exclusive" | "none";
type ItemType = "product" | "service" | "section" | "subsection" | "addon";

type BuildItem = {
  type?: ItemType; // "product", "service", "section", or "subsection"
  title: string;
  price: string;
  deposit?: string; // deposit amount for services
  note?: string;
  bullets?: string[]; // bullet points for features/details
  badge?: ItemBadge;
  image?: string; // data URL for item image
  itemStyle?: "normal" | "featured"; // highlight individual products
  buttonText?: string; // custom button text for add-ons
  layout?: LayoutMode; // individual layout style for this item
};

type ThemePreset = "neon" | "minimal" | "warm" | "luxe" | "custom";

type BgMode = "solid" | "gradient" | "image";
type LayoutMode = "cards" | "menu" | "tiles";
type FontFamily = "inter" | "poppins" | "sora" | "space" | "jakarta" | "dmsans";
type CtaStyle = "accent" | "white";

type Appearance = {
  preset?: ThemePreset;
  accent?: string; // hex
  surface?: "glass" | "solid";
  background?: "glow" | "grid" | "dots" | "none";
  radius?: number; // 16..32
  font?: "sans" | "display" | "mono"; // legacy (keep)
  button?: "pill" | "soft" | "sharp";

  // designer controls
  fontFamily?: FontFamily;
  bgMode?: BgMode;
  bgColor?: string;
  gradient?: { c1: string; c2: string; angle: number };
  bgImage?: string; // data URL
  bgImageFit?: "cover" | "contain";
  bgOverlay?: number; // 0..0.9
  layout?: LayoutMode;
  ctaStyle?: CtaStyle;
  ctaShine?: boolean;
  headerBg?: string; // color or gradient for header/logo background

  // ✅ ADVANCED (dope builder extras)
  logoShape?: "square" | "circle";
  logoFit?: "contain" | "cover";
  quickPreset?: "glassy" | "modern";
  headerStyle?: "hero" | "minimal";
  showPoweredBy?: boolean;
  showStaff?: boolean;
  showSocials?: boolean;
  showHours?: boolean;
  ctaText?: string;
  specialMessage?: string; // NEW: Special announcement banner
  
  // Accent gradient
  accentMode?: "solid" | "gradient";
  accentGradient?: { c1: string; c2: string; angle: number };
};

type StaffProfile = {
  name: string;
  role: string;
  rating: string;
  bio: string;
  specialties: string[];
  next: string[];
  photo?: string; // data URL
  availability?: {
    start?: string; // "09:00" (legacy - overall start)
    end?: string; // "17:00" (legacy - overall end)
    slotMinutes?: number;
  };
  // Per-day availability (overrides general availability)
  workingDays?: Record<WeekdayId, {
    enabled: boolean;
    start: string; // "09:00"
    end: string; // "17:00"
  }>;
};

type SocialLinks = {
  instagram?: string;
  tiktok?: string;
  website?: string;
  phone?: string;
  address?: string;
  email?: string;
  bio?: string;
};

type WeekdayId = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type AvailabilityDay = {
  enabled: boolean;
  start: string; // "09:00"
  end: string; // "17:00"
};

type Availability = {
  timezone: string; // IANA timezone
  slotMinutes: number; // 15..120 (slot duration)
  bufferMinutes: number; // 0..60 (buffer between slots)
  advanceDays: number; // 1..60 (how far ahead customers can book)
  leadTime?: number; // 0..24 (minimum hours notice required)
  days: Record<WeekdayId, AvailabilityDay>;
};

type Notifications = {
  email: string; // creator email
  onOrders: boolean;
  onBookings: boolean;
  smsPhone?: string;
};

type BuildConfig = {
  publishedAt?: string | null;
mode: ModeId;
  brandName: string;
  handle: string;
  tagline: string;
  businessDescription?: string; // NEW: Short business description
  items: BuildItem[];
  active: boolean;
  createdAt: number;
  appearance?: Appearance;
  staffProfiles?: StaffProfile[];
  ownerEmail?: string; // legacy (keep)

  brandLogo?: string; // data URL
  profilePic?: string; // data URL - creator's profile picture
  social?: SocialLinks;

  // ✅ new
  availability?: Availability;
  notifications?: Notifications;
};

import { buildStorefrontUrl } from "@/lib/storefrontUrls";

function cn(...c: (string | false | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function storageKey(handle: string) {
  return `piqo:site:${handle}`;
}

// Use the centralized utility for URL generation
// Removed local buildPublicUrl - now imported from @/lib/storefrontUrls

function qrPngUrl(dataUrl: string, size = 520) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
    dataUrl
  )}`;
}

function hexToRgba(hex = "#22D3EE", alpha = 0.2) {
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
}

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let t: any;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

const MODE_CARDS: Array<{ id: ModeId; title: string; sub: string; vibe: string; icon: string; color: string }> = [
  { id: "services", title: "Services", sub: "Barbers, salons, trainers", vibe: "Book & pay", icon: "✂️", color: "#06b6d4" },
  { id: "products", title: "Products", sub: "Pop-ups, merch, markets", vibe: "Fast checkout", icon: "🛍️", color: "#f97316" },
  { id: "digital", title: "Digital", sub: "Courses, templates, files", vibe: "Instant access", icon: "⚡", color: "#d946ef" },
];

const PRESETS: Array<{
  id: ThemePreset;
  name: string;
  desc: string;
  accent: string;
  background: NonNullable<Appearance["background"]>;
  font: NonNullable<Appearance["font"]>;
  button: NonNullable<Appearance["button"]>;
  radius: number;
  surface: NonNullable<Appearance["surface"]>;
}> = [
  {
    id: "neon",
    name: "Neon glow",
    desc: "Hip, nightlife, “scan me” energy",
    accent: "#22D3EE",
    background: "glow",
    font: "display",
    button: "pill",
    radius: 28,
    surface: "glass",
  },
  {
    id: "minimal",
    name: "Clean minimal",
    desc: "Premium, super clean, no distractions",
    accent: "#FFFFFF",
    background: "none",
    font: "sans",
    button: "soft",
    radius: 22,
    surface: "solid",
  },
  {
    id: "warm",
    name: "Warm & friendly",
    desc: "Welcoming, community brand vibe",
    accent: "#F59E0B",
    background: "dots",
    font: "sans",
    button: "pill",
    radius: 26,
    surface: "glass",
  },
  {
    id: "luxe",
    name: "Luxury",
    desc: "High-end, rich brand feel",
    accent: "#A78BFA",
    background: "grid",
    font: "display",
    button: "sharp",
    radius: 20,
    surface: "solid",
  },
];



function pickDefaultItemsForMode(mode: ModeId): BuildItem[] {
  if (mode === "services") {
    return [
      { title: "Signature Fade + Lineup", price: "$45", note: "45 min • Most popular", badge: "popular" },
      { title: "Beard Trim + Hot Towel", price: "$35", note: "30 min • Premium add-on", badge: "trending" },
      { title: "VIP Treatment", price: "$85", note: "90 min • Full experience", badge: "exclusive" },
    ];
  }
  if (mode === "products") {
    return [
      { title: "Signature Tee (Black)", price: "$28", note: "100% cotton • Limited edition", badge: "bestseller" },
      { title: "Holographic Sticker Pack", price: "$8", note: "Pack of 5 • Waterproof", badge: "new" },
      { title: "Premium Bundle", price: "$45", note: "Tee + Cap + Stickers", badge: "sale" },
    ];
  }
  if (mode === "digital") {
    return [
      { title: "8-Week Shred Program", price: "$29", note: "Instant access • Video guides", badge: "popular" },
      { title: "Macro Calculator + Guide", price: "$15", note: "PDF download • Lifetime access", badge: "new" },
      { title: "Complete Bundle", price: "$39", note: "Everything included • Best value", badge: "limited" },
    ];
  }
  // Fallback for booking or other modes
  return [
    { title: "Standard Booking", price: "$25", note: "Locks your time slot", badge: "popular" },
    { title: "Priority Booking", price: "$40", note: "Faster confirmation", badge: "trending" },
    { title: "Consultation", price: "$0", note: "Free • Limited slots", badge: "new" },
  ];
}

function StepPill({
  n,
  label,
  active,
  done,
}: {
  n: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <motion.div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold relative overflow-hidden",
        done
          ? "border-green-500/40 bg-green-500/15 text-white/90 shadow-lg shadow-green-500/20"
          : active
          ? "border-cyan-500/40 bg-cyan-500/15 text-white/90 shadow-lg shadow-cyan-500/20"
          : "border-white/12 bg-black/30 text-white/60"
      )}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
    >
      {(active || done) && (
        <motion.div
          className="absolute inset-0"
          style={{
            background: done
              ? "linear-gradient(90deg, transparent, rgba(34,197,94,0.3), transparent)"
              : "linear-gradient(90deg, transparent, rgba(34,211,238,0.3), transparent)",
          }}
          animate={{
            x: [-100, 200],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      )}
      {done ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
        >
          <CheckCircle2 className="h-3.5 w-3.5 relative z-10" />
        </motion.div>
      ) : (
        <span className="grid h-4 w-4 place-items-center rounded-full border border-white/18 text-[11px] text-white/80 relative z-10">
          {n}
        </span>
      )}
      <span className="relative z-10">{label}</span>
    </motion.div>
  );
}

/* =======================
   Stripe helpers (front-end)
======================= */
type StripeStatus = {
  ok?: boolean;
  connected?: boolean;
  requires_action?: boolean;
  details_submitted?: boolean;
  charges_enabled?: boolean;
  payouts_enabled?: boolean;
  account_id?: string | null;
  dashboard_url?: string | null;
  message?: string;
  error?: string;
};

const WEEKDAYS: Array<{ id: WeekdayId; label: string }> = [
  { id: "mon", label: "Mon" },
  { id: "tue", label: "Tue" },
  { id: "wed", label: "Wed" },
  { id: "thu", label: "Thu" },
  { id: "fri", label: "Fri" },
  { id: "sat", label: "Sat" },
  { id: "sun", label: "Sun" },
];

function safeTime(v: string) {
  // keep it simple—HTML time inputs already give "HH:MM"
  if (!v) return "09:00";
  return v;
}

export default function CreatePage() {
  const hasHydratedRef = useRef(false);
  const router = useRouter();

  // Declare all state hooks before any useEffect that references them
  const [mode, setMode] = useState<ModeId>("services");
  const [brandName, setBrandName] = useState("My Piqo");
  const [handleRaw, setHandleRaw] = useState("my-piqo");
  const [handleInput, setHandleInput] = useState("my-piqo"); // Local input state for immediate UI updates
  const [tagline, setTagline] = useState("Scan → tap → done.");
  const [businessDescription, setBusinessDescription] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [brandLogo, setBrandLogo] = useState("");
  const [profilePic, setProfilePic] = useState("");
  const [items, setItems] = useState<BuildItem[]>(pickDefaultItemsForMode("services"));
  const [appearance, setAppearance] = useState<Appearance>({
    preset: "neon",
    accent: "#22D3EE",
    surface: "glass",
    background: "glow",
    radius: 28,
    font: "display",
    button: "pill",
    fontFamily: "inter",
    bgMode: "solid",
    bgColor: "#000000",
    gradient: { c1: "#22D3EE", c2: "#A78BFA", angle: 135 },
    bgImage: "",
    bgOverlay: 0.45,
    layout: "cards",
    ctaStyle: "accent",
    ctaShine: true,
    headerBg: "linear-gradient(135deg, #22D3EE 0%, #A78BFA 100%)",
    logoShape: "square",
    headerStyle: "hero",
    showPoweredBy: true,
    showStaff: true,
    showSocials: true,
    showHours: true,
    ctaText: "",
  });
  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>([]);
  const [notifications, setNotifications] = useState<Notifications>({
    email: "",
    onOrders: true,
    onBookings: true,
    smsPhone: "",
  });
  const [social, setSocial] = useState<SocialLinks>({
    instagram: "",
    tiktok: "",
    website: "",
    phone: "",
    address: "",
  });
  const [availability, setAvailability] = useState<Availability>({
    timezone: "America/New_York",
    slotMinutes: 60,
    bufferMinutes: 15,
    advanceDays: 30,
    leadTime: 2, // 2 hours minimum notice
    days: {
      mon: { enabled: true, start: "09:00", end: "17:00" },
      tue: { enabled: true, start: "09:00", end: "17:00" },
      wed: { enabled: true, start: "09:00", end: "17:00" },
      thu: { enabled: true, start: "09:00", end: "17:00" },
      fri: { enabled: true, start: "09:00", end: "17:00" },
      sat: { enabled: false, start: "09:00", end: "17:00" },
      sun: { enabled: false, start: "09:00", end: "17:00" },
    },
  });

  // Collapsible state for optional sections (Products/Digital modes)
  const [hoursExpanded, setHoursExpanded] = useState(false);
  const [staffExpanded, setStaffExpanded] = useState(false);

  // Real-time draft save: persist all edits to localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const h = slugify(handleRaw);
    if (!h) return;
    const draft: BuildConfig = {
      mode,
      brandName,
      handle: h,
      tagline,
      businessDescription,
      items,
      appearance,
      staffProfiles,
      brandLogo,
      social,
      availability,
      notifications,
      ownerEmail,
      active: true,
      createdAt: Date.now(),
    };
    try {
      localStorage.setItem(storageKey(h), JSON.stringify(draft));
    } catch {}
  }, [mode, brandName, handleRaw, tagline, businessDescription, items, appearance, staffProfiles, brandLogo, social, availability, notifications, ownerEmail]);

  // Debounce handle input to prevent spazzing
  useEffect(() => {
    const timer = setTimeout(() => {
      setHandleRaw(handleInput);
      
      // Update URL with handle for bookmarking/sharing (optional, doesn't reload page)
      if (typeof window !== "undefined" && handleInput.trim()) {
        const cleanH = slugify(handleInput);
        if (cleanH) {
          const url = new URL(window.location.href);
          url.searchParams.set('handle', cleanH);
          window.history.replaceState({}, '', url.toString());
        }
      }
    }, 300); // Update handleRaw 300ms after user stops typing

    return () => clearTimeout(timer);
  }, [handleInput]);

  // Force immediate preview update for tagline changes
  useEffect(() => {
    setPreviewTick((x) => x + 1);
  }, [tagline]);

  // ...existing code...
  // 🔁 Detect edit mode and hydrate from server on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasHydratedRef.current) return; // Only hydrate once
    
    try {
      const params = new URLSearchParams(window.location.search || "");
      const handleParam = params.get("handle") || "";
      const editParam = params.get("edit") === "true";
      
      if (editParam && handleParam) {
        // Edit mode - fetch from server and hydrate
        setIsEditMode(true);
        setEditLoading(true);
        hasHydratedRef.current = true;
        
        fetch(`/api/site?handle=${encodeURIComponent(handleParam)}&edit=true`, { cache: "no-store", credentials: 'include' })
          .then(async (res) => {
            if (!res.ok) {
              const data = await res.json().catch(() => ({ error: "Failed to load Piqo" }));
              throw new Error(data.error || "Piqo not found or unauthorized");
            }
            return res.json();
          })
          .then((data) => {
            if (!data?.site?.config) {
              throw new Error("Piqo configuration not found");
            }
            
            const config = data.site.config;
            
            console.log("🔄 Hydrating Piqo config:", {
              mode: config.mode,
              hasAvailability: !!config.availability,
              availabilityDays: config.availability?.days,
              enabledDays: config.availability?.days ? Object.entries(config.availability.days).filter(([_, d]: [string, any]) => d.enabled).map(([k]) => k) : [],
              timezone: config.availability?.timezone,
              slotMinutes: config.availability?.slotMinutes,
              advanceDays: config.availability?.advanceDays,
              leadTime: config.availability?.leadTime,
              hasStaffProfiles: !!config.staffProfiles,
              staffCount: config.staffProfiles?.length || 0,
            });
            
            // Hydrate all fields from server
            if (config.mode) {
              setMode(config.mode);
              console.log("✅ Set mode to:", config.mode);
            }
            if (config.brandName) setBrandName(config.brandName);
            if (config.handle) {
              setHandleRaw(config.handle);
              setHandleInput(config.handle);
            }
            if (config.tagline !== undefined) setTagline(config.tagline);
            if (config.businessDescription !== undefined) setBusinessDescription(config.businessDescription);
            if (config.items) setItems(config.items);
            if (config.appearance) setAppearance(config.appearance);
            if (config.staffProfiles) setStaffProfiles(config.staffProfiles);
            if (config.brandLogo) setBrandLogo(config.brandLogo);
            if (config.profilePic) setProfilePic(config.profilePic);
            if (config.social) setSocial(config.social);
            if (config.availability) {
              console.log("✅ Hydrating availability:", config.availability);
              setAvailability(config.availability);
            } else {
              console.warn("⚠️ No availability config found for Services Piqo");
            }
            if (config.notifications) setNotifications(config.notifications);
            if (config.ownerEmail) setOwnerEmail(config.ownerEmail);
            
            setEditLoading(false);
            setEditError(null);
            
            // Force preview update
            skipNextPreviewTickRef.current = false;
            setPreviewTick((x) => x + 1);
          })
          .catch((err) => {
            console.error("Failed to load Piqo for editing:", err);
            setEditError(err.message || "Failed to load Piqo");
            setEditLoading(false);
          });
      } else if (handleParam) {
        // Create mode with prefilled handle
        setHandleRaw(handleParam);
        setHandleInput(handleParam);
        hasHydratedRef.current = true;
      }
    } catch (err) {
      console.error("Failed to parse URL params:", err);
    }
  }, []);


  // ✅ Availability + notifications (new)
  // ...existing code...

  useEffect(() => {
    // keep notifications.email in sync with ownerEmail if user edits it
    setNotifications((n) => ({ ...n, email: ownerEmail }));
  }, [ownerEmail]);

  const cleanHandle = useMemo(() => slugify(handleRaw), [handleRaw]);
  // ...existing code...

  // Tab navigation state
  const [activeTab, setActiveTab] = useState<"setup" | "design" | "details" | "payment">("setup");



  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [showQr, setShowQr] = useState(false);
  const [previewOn, setPreviewOn] = useState(true);
  const [previewTick, setPreviewTick] = useState(0);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Force preview update when items change
  useEffect(() => {
    setPreviewTick(prev => prev + 1);
  }, [items]);
  
  // Force preview update when availability changes (slot length, days, etc.)
  useEffect(() => {
    setPreviewTick(prev => prev + 1);
  }, [availability]);

  const publicUrl = useMemo(() => buildStorefrontUrl(cleanHandle || "yourname"), [cleanHandle]);
  const qrUrl = useMemo(() => qrPngUrl(publicUrl, 520), [publicUrl]);

  // -------- Stripe connect UI state --------
  const [stripeStatus, setStripeStatus] = useState<StripeStatus | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeErr, setStripeErr] = useState<string | null>(null);

  async function fetchStripeStatus(h: string) {
    setStripeErr(null);
    if (!h) {
      setStripeStatus(null);
      return;
    }
    setStripeLoading(true);
    try {
      const res = await fetch(`/api/stripe/status?handle=${encodeURIComponent(h)}`, { cache: "no-store", credentials: 'include' });
      const data = (await res.json().catch(() => ({}))) as StripeStatus;
      if (!res.ok) {
        setStripeStatus(null);
        setStripeErr(data?.error || "Failed to load Stripe status.");
        return;
      }
      setStripeStatus(data);
    } catch (e: any) {
      setStripeStatus(null);
      setStripeErr(e?.message || "Failed to load Stripe status.");
    } finally {
      setStripeLoading(false);
    }
  }

  useEffect(() => {
    if (!cleanHandle) {
      setStripeStatus(null);
      setStripeErr(null);
      return;
    }
    
    // Debounce Stripe status checks to avoid excessive API calls
    const timer = setTimeout(() => {
      fetchStripeStatus(cleanHandle);
    }, 800); // Wait 800ms after user stops typing
    
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cleanHandle]);

async function startStripeConnect() {
  const h = cleanHandle;
  if (!h) {
    setStripeErr("Add a handle first.");
    return;
  }

  // ✅ FORCE SAVE DRAFT BEFORE REDIRECT
  if (configDraft) {
    try {
      localStorage.setItem(storageKey(h), JSON.stringify(configDraft));
    } catch {}
  }

  setStripeErr(null);
  setStripeLoading(true);

  try {
    const res = await fetch("/api/stripe/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include',
      body: JSON.stringify({ 
        handle: h,
        email: notifications.email || ownerEmail || "" 
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("Stripe Connect error:", data);
      setStripeErr(data?.error || data?.detail || "Could not start Stripe Connect.");
      return;
    }

    if (data?.url) {
      window.location.href = data.url;
      return;
    }

    setStripeErr("Stripe Connect route did not return a URL.");
  } catch (e: any) {
    console.error("Stripe Connect exception:", e);
    setStripeErr(e?.message || "Could not start Stripe Connect.");
  } finally {
    setStripeLoading(false);
  }
}

  // ---------- Upload helpers ----------
  async function fileToDataUrl(file: File): Promise<string> {
    return await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result || ""));
      r.onerror = () => reject(new Error("Failed to read file"));
      r.readAsDataURL(file);
    });
  }

  async function onPickLogoFile(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    
    // Show uploading state
    setToast("📤 Uploading logo...");
    
    // Show preview immediately while uploading
    const preview = await fileToDataUrl(file);
    setBrandLogo(preview);
    
    // write instant preview draft so the preview iframe updates immediately
    try {
      const h = cleanHandle;
      if (typeof window !== "undefined" && h) {
        const base = configDraft;
        if (base) {
          try {
            localStorage.setItem(storageKey(h), JSON.stringify({ ...base, brandLogo: preview, createdAt: Date.now() }));
          } catch {}
          skipNextPreviewTickRef.current = true;
          setPreviewTick((x) => x + 1);
        }
      }
    } catch {}
    
    // Upload to server to get hosted URL
    try {
      const fd = new FormData();
      fd.append("file", file, file.name || "upload.jpg");
      const res = await fetch("/api/uploads", { method: "POST", body: fd, credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      
      if (res.ok && data?.url) {
        // Success - replace preview with hosted URL
        setBrandLogo(data.url);
        
        // Update localStorage with hosted URL
        try {
          const h = cleanHandle;
          if (typeof window !== "undefined" && h) {
            const base = configDraft;
            if (base) {
              try {
                localStorage.setItem(storageKey(h), JSON.stringify({ ...base, brandLogo: data.url, createdAt: Date.now() }));
              } catch {}
              skipNextPreviewTickRef.current = true;
              setPreviewTick((x) => x + 1);
            }
          }
        } catch {}
        
        setToast("✅ Logo uploaded!");
        setTimeout(() => setToast(null), 2000);
      } else {
        // Upload failed - show error
        setToast("❌ Logo upload failed. Please try again.");
        setTimeout(() => setToast(null), 3000);
        // Remove preview since upload failed
        setBrandLogo("");
      }
    } catch (err) {
      // Upload failed - show error
      console.error('Logo upload error:', err);
      setToast("❌ Logo upload failed. Please check your connection.");
      setTimeout(() => setToast(null), 3000);
      // Remove preview since upload failed
      setBrandLogo("");
    }
  }

  async function onPickBgImage(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    
    // Show uploading state
    setToast("📤 Uploading background...");
    
    // Show preview immediately while uploading
    const preview = await fileToDataUrl(file);
    setAppearance((p) => ({ ...p, bgMode: "image", bgImage: preview }));
    
    // Upload to server to get hosted URL
    try {
      const fd = new FormData();
      fd.append("file", file, file.name || "upload.jpg");
      const res = await fetch("/api/uploads", { method: "POST", body: fd, credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      
      if (res.ok && data?.url) {
        // Success - replace preview with hosted URL
        setAppearance((p) => ({ ...p, bgMode: "image", bgImage: data.url }));
        setToast("✅ Background uploaded!");
        setTimeout(() => setToast(null), 2000);
      } else {
        // Upload failed - show error
        setToast("❌ Background upload failed. Please try again.");
        setTimeout(() => setToast(null), 3000);
        // Remove preview since upload failed
        setAppearance((p) => ({ ...p, bgMode: "gradient", bgImage: undefined }));
      }
    } catch (err) {
      // Upload failed - show error
      console.error('Background upload error:', err);
      setToast("❌ Background upload failed. Please check your connection.");
      setTimeout(() => setToast(null), 3000);
      // Remove preview since upload failed
      setAppearance((p) => ({ ...p, bgMode: "gradient", bgImage: undefined }));
    }
  }

  async function onPickProfilePic(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    
    // Show uploading state
    setToast("📤 Uploading profile photo...");
    
    // Show preview immediately while uploading
    const preview = await fileToDataUrl(file);
    setProfilePic(preview);
    
    // write instant preview draft so the preview updates immediately
    try {
      const h = cleanHandle;
      if (typeof window !== "undefined" && h) {
        const base = configDraft;
        if (base) {
          try {
            localStorage.setItem(storageKey(h), JSON.stringify({ ...base, profilePic: preview, createdAt: Date.now() }));
          } catch {}
          skipNextPreviewTickRef.current = true;
          setPreviewTick((x) => x + 1);
        }
      }
    } catch {}
    
    // Upload to server to get hosted URL
    try {
      const fd = new FormData();
      fd.append("file", file, file.name || "upload.jpg");
      const res = await fetch("/api/uploads", { method: "POST", body: fd, credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      
      if (res.ok && data?.url) {
        // Success - replace preview with hosted URL
        setProfilePic(data.url);
        
        // Update localStorage with hosted URL
        try {
          const h = cleanHandle;
          if (typeof window !== "undefined" && h) {
            const base = configDraft;
            if (base) {
              try {
                localStorage.setItem(storageKey(h), JSON.stringify({ ...base, profilePic: data.url, createdAt: Date.now() }));
              } catch {}
              skipNextPreviewTickRef.current = true;
              setPreviewTick((x) => x + 1);
            }
          }
        } catch {}
        
        setToast("✅ Profile photo uploaded!");
        setTimeout(() => setToast(null), 2000);
      } else {
        // Upload failed - show error
        setToast("❌ Photo upload failed. Please try again.");
        setTimeout(() => setToast(null), 3000);
        // Remove preview since upload failed
        setProfilePic("");
      }
    } catch (err) {
      // Upload failed - show error
      console.error('Profile pic upload error:', err);
      setToast("❌ Photo upload failed. Please check your connection.");
      setTimeout(() => setToast(null), 3000);
      // Remove preview since upload failed
      setProfilePic("");
    }
  }

  async function onPickStaffPhoto(file: File | null, idx: number) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    
    // Show uploading state
    setToast("📤 Uploading staff photo...");
    
    // show an instant preview first
    const preview = await fileToDataUrl(file);
    updateStaff(idx, { photo: preview });

    try {
      const h = cleanHandle;
      if (typeof window !== "undefined" && h) {
        const base = configDraft;
        if (base) {
          const updated = { ...base, staffProfiles: (base.staffProfiles || []).map((p, i) => (i === idx ? { ...p, photo: preview } : p)) };
          try {
            localStorage.setItem(storageKey(h), JSON.stringify({ ...updated, createdAt: Date.now() }));
          } catch {}
          skipNextPreviewTickRef.current = true;
          setPreviewTick((x) => x + 1);
        }
      }
    } catch {}

    // upload to server to get hosted URL (resized)
    try {
      const fd = new FormData();
      fd.append("file", file, file.name || "upload.jpg");
      const res = await fetch("/api/uploads", { method: "POST", body: fd, credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      
      if (res.ok && data?.url) {
        updateStaff(idx, { photo: data.url });

        // persist hosted URL to local draft
        try {
          const h = cleanHandle;
          if (typeof window !== "undefined" && h) {
            const base = configDraft;
            if (base) {
              const updated = { ...base, staffProfiles: (base.staffProfiles || []).map((p, i) => (i === idx ? { ...p, photo: data.url } : p)) };
              try {
                localStorage.setItem(storageKey(h), JSON.stringify({ ...updated, createdAt: Date.now() }));
              } catch {}
              skipNextPreviewTickRef.current = true;
              setPreviewTick((x) => x + 1);
            }
          }
        } catch {}
        
        setToast("✅ Staff photo uploaded!");
        setTimeout(() => setToast(null), 2000);
      } else {
        // Upload failed - show error
        setToast("❌ Staff photo upload failed. Please try again.");
        setTimeout(() => setToast(null), 3000);
        // Remove preview since upload failed
        updateStaff(idx, { photo: undefined });
      }
    } catch (err) {
      // Upload failed - show error
      console.error('Staff photo upload error:', err);
      setToast("❌ Staff photo upload failed. Please check your connection.");
      setTimeout(() => setToast(null), 3000);
      // Remove preview since upload failed
      updateStaff(idx, { photo: undefined });
    }
  }

  // draft config for live preview
  const configDraft: BuildConfig | null = useMemo(() => {
    const h = cleanHandle;
    if (!h) return null;

    const notifEmail = (notifications.email || ownerEmail || "").trim();

    return {
      mode,
      brandName: brandName.trim() || "My Piqo",
      handle: h,
      tagline: tagline.trim(),
      businessDescription: businessDescription.trim() || undefined,
      items: items.filter((x) => (x.title || "").trim().length > 0),
      active: true,
      createdAt: Date.now(),
      appearance,
      staffProfiles: staffProfiles.length ? staffProfiles : undefined,
      ownerEmail: ownerEmail.trim() || undefined, // legacy

      brandLogo: brandLogo || undefined,
      profilePic: profilePic || undefined,
      social: {
        instagram: (social.instagram || "").trim() || undefined,
        tiktok: (social.tiktok || "").trim() || undefined,
        website: (social.website || "").trim() || undefined,
        phone: (social.phone || "").trim() || undefined,
        address: (social.address || "").trim() || undefined,
        email: (social.email || "").trim() || undefined,
        bio: (social.bio || "").trim() || undefined,
      },

      availability: availability ? {
        timezone: availability.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
        slotMinutes: availability.slotMinutes || 60,
        bufferMinutes: availability.bufferMinutes || 15,
        advanceDays: availability.advanceDays || 30,
        leadTime: availability.leadTime ?? 2, // Default 2 hours minimum notice
        days: availability.days || {
          mon: { enabled: true, start: "09:00", end: "17:00" },
          tue: { enabled: true, start: "09:00", end: "17:00" },
          wed: { enabled: true, start: "09:00", end: "17:00" },
          thu: { enabled: true, start: "09:00", end: "17:00" },
          fri: { enabled: true, start: "09:00", end: "17:00" },
          sat: { enabled: false, start: "09:00", end: "17:00" },
          sun: { enabled: false, start: "09:00", end: "17:00" },
        },
      } : undefined,
      notifications: {
        email: notifEmail,
        onOrders: notifications.onOrders !== false,
        onBookings: notifications.onBookings !== false,
        smsPhone: (notifications.smsPhone || "").trim() || undefined,
      },
    };
  }, [
    cleanHandle,
    mode,
    brandName,
    tagline,
    businessDescription,
    items,
    appearance,
    staffProfiles,
    ownerEmail,
    brandLogo,
    social,
    availability,
    notifications,
  ]);

  const saveDraftDebounced = useMemo(
    () =>
      debounce((cfg: BuildConfig) => {
        try {
          localStorage.setItem(storageKey(cfg.handle), JSON.stringify(cfg));
        } catch {}

        // Avoid a second iframe refresh when we already refreshed instantly.
        if (skipNextPreviewTickRef.current) {
          skipNextPreviewTickRef.current = false;
          return;
        }

        setPreviewTick((x) => x + 1);
      }, 220),
    []
  );

  // Debounced server-side save so edits persist to the published handle
  const [savingServer, setSavingServer] = useState(false);
  const saveDraftServerDebounced = useMemo(
    () =>
      debounce(async (cfg: BuildConfig) => {
        try {
          setSavingServer(true);
          console.log("Attempting to save draft to server for handle:", cfg.handle);

          // best-effort: POST to /api/site to upsert the draft on server
          const res = await postJson("/api/site", cfg).catch((error) => {
            console.error("Failed to save draft to server:", error);
            return null;
          });

          if (!res) {
            console.warn("No response from /api/site, draft not saved");
            return;
          }

          console.log("Draft save response:", res);

          // ✅ Auto-publish ALL edits immediately so changes go live
          try {
            const raw = res?.data || {};
            const ok = res?.res?.ok && raw?.ok !== false;

            if (ok) {
              console.log("Auto-publishing edits for handle:", cfg.handle);
              const pub = await postJson("/api/site/publish", { handle: cfg.handle }).catch((error) => {
                console.error("Failed to auto-publish:", error);
                return null;
              });
              if (pub?.res?.ok && pub?.data?.ok) {
                const publishedAt = pub.data.publishedAt || new Date().toISOString();
                console.log("✅ Auto-published successfully, changes are LIVE at u/" + cfg.handle, "publishedAt:", publishedAt);
                
                // Force preview refresh to show published changes
                setPreviewTick((x) => x + 1);
                
                // Update local storage with published state
                try {
                  const storedRaw = localStorage.getItem(storageKey(cfg.handle));
                  const stored = storedRaw ? JSON.parse(storedRaw) : cfg;
                  stored.publishedAt = publishedAt;
                  stored.active = true;
                  localStorage.setItem(storageKey(cfg.handle), JSON.stringify(stored));
                } catch (error) {
                  console.error("Failed to update local storage after publish:", error);
                }
              } else {
                console.warn("⚠️ Auto-publish failed:", pub?.data?.error || "Unknown error");
              }
            } else {
              console.warn("⚠️ Draft save failed, skipping auto-publish");
            }
          } catch (error) {
            console.error("Error in auto-publish logic:", error);
          }

        } catch (error) {
          console.error("Error in saveDraftServerDebounced:", error);
        } finally {
          try {
            setSavingServer(false);
          } catch (error) {
            console.error("Error setting savingServer to false:", error);
          }
        }
      }, 300), // Fast auto-publish for instant live updates (300ms)
    []
  );

  const skipNextPreviewTickRef = useRef(false);

  function applyAppearancePatchInstant(patch: Partial<Appearance>) {
    const nextAppearance: Appearance = { ...appearance, ...patch };
    setAppearance(nextAppearance);

    // Make the live preview feel instant (don’t wait for debounced autosave)
    if (typeof window !== "undefined" && cleanHandle) {
      const base = configDraft;
      if (base) {
        try {
          localStorage.setItem(
            storageKey(cleanHandle),
            JSON.stringify({ ...base, appearance: nextAppearance, createdAt: Date.now() })
          );
        } catch {}
      }
      skipNextPreviewTickRef.current = true;
      setPreviewTick((x) => x + 1);
    }
  }


 useEffect(() => {
  if (!configDraft) return;

  // ✅ Prevent overwriting restored draft on the first render
  if (!hasHydratedRef.current) {
    hasHydratedRef.current = true;
    return;
  }

  saveDraftDebounced(configDraft);
}, [configDraft, saveDraftDebounced]);

// ✅ Auto-save edits to server as draft_config so changes persist
// ⚠️ ONLY auto-save for EDIT MODE - don't create piqos until user clicks "Generate Live"
useEffect(() => {
  if (!configDraft) return;
  // Prevent saving during initial restore
  if (!hasHydratedRef.current) return;
  // ✅ ONLY save to server if we're editing an existing piqo
  if (!isEditMode) return; // Skip server save for new piqos
  // only attempt server save when we have a valid handle
  try {
    saveDraftServerDebounced(configDraft);
  } catch {}
}, [configDraft, saveDraftServerDebounced, isEditMode]);

  // Broadcast live preview updates to any open preview window/tab
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!configDraft) return;

    try {
      if (typeof BroadcastChannel !== "undefined") {
        const bc = new BroadcastChannel("piqo-preview");
        console.log('📡 Broadcasting config:', { 
          social: configDraft.social, 
          businessDescription: configDraft.businessDescription,
          specialMessage: configDraft.appearance?.specialMessage 
        });
        bc.postMessage({ type: "config", handle: configDraft.handle, config: configDraft });
        bc.close();
      }
    } catch {}
  }, [configDraft]);


  // actions
  const addItem = () => {
    setItems((prev) => {
      const next = [...prev, { type: "product", title: "New item", price: "$0", note: "", badge: "none" } as BuildItem];
      // Instant preview update
      if (typeof window !== "undefined" && cleanHandle) {
        const base = configDraft;
        if (base) {
          try {
            localStorage.setItem(storageKey(cleanHandle), JSON.stringify({ ...base, items: next, createdAt: Date.now() }));
          } catch {}
        }
        skipNextPreviewTickRef.current = true;
        setPreviewTick((x) => x + 1);
      }
      return next;
    });
  };

  const addService = () => {
    setItems((prev) => {
      const next = [...prev, { type: "service", title: "New service", price: "$0", note: "", badge: "none" } as BuildItem];
      // Instant preview update
      if (typeof window !== "undefined" && cleanHandle) {
        const base = configDraft;
        if (base) {
          try {
            localStorage.setItem(storageKey(cleanHandle), JSON.stringify({ ...base, items: next, createdAt: Date.now() }));
          } catch {}
        }
        skipNextPreviewTickRef.current = true;
        setPreviewTick((x) => x + 1);
      }
      return next;
    });
  };

  const addAddon = () => {
    setItems((prev) => {
      const next = [...prev, { type: "addon", title: "Add-on", price: "$0", note: "", badge: "none", layout: "menu" } as BuildItem];
      // Instant preview update
      if (typeof window !== "undefined" && cleanHandle) {
        const base = configDraft;
        if (base) {
          try {
            localStorage.setItem(storageKey(cleanHandle), JSON.stringify({ ...base, items: next, createdAt: Date.now() }));
          } catch {}
        }
        skipNextPreviewTickRef.current = true;
        setPreviewTick((x) => x + 1);
      }
      return next;
    });
  };

  const addSectionHeader = () => {
    setItems((prev) => {
      const next = [...prev, { type: "section", title: "New Section", price: "", note: "", badge: "none" } as BuildItem];
      // Instant preview update
      if (typeof window !== "undefined" && cleanHandle) {
        const base = configDraft;
        if (base) {
          try {
            localStorage.setItem(storageKey(cleanHandle), JSON.stringify({ ...base, items: next, createdAt: Date.now() }));
          } catch {}
        }
        skipNextPreviewTickRef.current = true;
        setPreviewTick((x) => x + 1);
      }
      return next;
    });
  };

  const addSubsection = () => {
    setItems((prev) => {
      const next = [...prev, { type: "subsection", title: "New Subsection", price: "", note: "", badge: "none" } as BuildItem];
      // Instant preview update
      if (typeof window !== "undefined" && cleanHandle) {
        const base = configDraft;
        if (base) {
          try {
            localStorage.setItem(storageKey(cleanHandle), JSON.stringify({ ...base, items: next, createdAt: Date.now() }));
          } catch {}
        }
        skipNextPreviewTickRef.current = true;
        setPreviewTick((x) => x + 1);
      }
      return next;
    });
  };
  const removeItem = (idx: number) => {
    setItems((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      // Instant preview update
      if (typeof window !== "undefined" && cleanHandle) {
        const base = configDraft;
        if (base) {
          try {
            localStorage.setItem(storageKey(cleanHandle), JSON.stringify({ ...base, items: next, createdAt: Date.now() }));
          } catch {}
        }
        skipNextPreviewTickRef.current = true;
        setPreviewTick((x) => x + 1);
      }
      return next;
    });
  };
  const updateItem = (idx: number, patch: Partial<BuildItem>) => {
    setItems((prev) => {
      const next = prev.map((it, i) => (i === idx ? { ...it, ...patch } : it));
      // Instant preview update
      if (typeof window !== "undefined" && cleanHandle) {
        const base = configDraft;
        if (base) {
          try {
            localStorage.setItem(storageKey(cleanHandle), JSON.stringify({ ...base, items: next, createdAt: Date.now() }));
          } catch {}
        }
        skipNextPreviewTickRef.current = true;
        setPreviewTick((x) => x + 1);
      }
      return next;
    });
  };

  const addStaff = () =>
    setStaffProfiles((prev) => [
      ...prev,
      {
        name: `Staff ${prev.length + 1}`,
        role: "Staff",
        rating: "5.0",
        bio: "Tap to edit this profile.",
        specialties: [],
        next: ["11:00 AM", "12:00 PM", "2:30 PM"],
      },
    ]);
  const removeStaff = (idx: number) => setStaffProfiles((prev) => prev.filter((_, i) => i !== idx));
  const updateStaff = (idx: number, patch: Partial<StaffProfile>) =>
    setStaffProfiles((prev) => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)));

  // Initialize working days from business hours if not set
  const initStaffWorkingDays = (idx: number) => {
    const staff = staffProfiles[idx];
    if (staff.workingDays) return; // Already initialized
    
    const workingDays: Record<WeekdayId, { enabled: boolean; start: string; end: string }> = {} as any;
    WEEKDAYS.forEach(day => {
      const dayConfig = availability.days[day.id];
      workingDays[day.id] = {
        enabled: dayConfig?.enabled || false,
        start: dayConfig?.start || "09:00",
        end: dayConfig?.end || "17:00",
      };
    });
    
    updateStaff(idx, { workingDays });
  };

  const updateStaffWorkingDay = (staffIdx: number, dayId: WeekdayId, patch: Partial<{ enabled: boolean; start: string; end: string }>) => {
    const staff = staffProfiles[staffIdx];
    if (!staff.workingDays) initStaffWorkingDays(staffIdx);
    
    const currentDay = staff.workingDays?.[dayId] || { enabled: false, start: "09:00", end: "17:00" };
    
    updateStaff(staffIdx, {
      workingDays: {
        ...staff.workingDays,
        [dayId]: { ...currentDay, ...patch },
      } as Record<WeekdayId, { enabled: boolean; start: string; end: string }>,
    });
  };

  const onPickMode = (m: ModeId) => {
    setMode(m);
    setItems(pickDefaultItemsForMode(m));
  };

  const applyPreset = (preset: ThemePreset) => {
    const p = PRESETS.find((x) => x.id === preset);
    if (!p) return;
    setAppearance((prev) => ({
      ...prev,
      preset: p.id,
      accent: p.accent,
      background: p.background,
      font: p.font,
      button: p.button,
      radius: p.radius,
      surface: p.surface,
    }));
  };

  function randomFrom<T>(arr: T[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function randomizeTheme() {
    const preset = randomFrom(PRESETS);
    const accentPool = ["#22D3EE", "#A78BFA", "#F472B6", "#34D399", "#F59E0B", "#60A5FA", "#FB7185"];
    const bgModePool: BgMode[] = ["solid", "gradient"];
    const fontPool: FontFamily[] = ["inter", "poppins", "sora", "space", "jakarta", "dmsans"];

    const accent = randomFrom(accentPool);
    const bgMode = randomFrom(bgModePool);

    setAppearance((p) => ({
      ...p,
      preset: "custom",
      accent,
      background: preset.background,
      surface: preset.surface,
      button: preset.button,
      radius: preset.radius,
      font: preset.font,
      fontFamily: randomFrom(fontPool),
      bgMode,
      bgColor: bgMode === "solid" ? "#000000" : p.bgColor,
      gradient: {
        c1: accent,
        c2: randomFrom(accentPool),
        angle: Math.floor(Math.random() * 360),
      },
      ctaStyle: Math.random() > 0.7 ? "white" : "accent",
      ctaShine: Math.random() > 0.2,
      headerStyle: Math.random() > 0.5 ? "hero" : "minimal",
      logoShape: Math.random() > 0.5 ? "square" : "circle",
    }));
  }

  async function postJson(url: string, body: any) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: 'include', // ✅ Send cookies for authentication
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { raw: text };
    }
    return { res, data };
  }

  const onGenerate = async () => {
    if (saving) return;
    setErr(null);

    const h = slugify(handleRaw);
    if (!h) return setErr("Handle is required (letters/numbers).");
    if (!brandName.trim()) return setErr("Brand name is required.");

    const notifEmail = (notifications.email || ownerEmail || "").trim();

    const config: BuildConfig = {
      mode,
      brandName: brandName.trim(),
      handle: h,
      tagline: tagline.trim(),
      items: items.filter((x) => (x.title || "").trim().length > 0),
      active: true,
      createdAt: Date.now(),
      appearance: {
        ...appearance,
        headerBg: appearance.headerBg || undefined,
      },
      staffProfiles: staffProfiles.length ? staffProfiles : undefined,

      ownerEmail: ownerEmail.trim() || undefined, // legacy keep
      brandLogo: brandLogo || undefined,
      profilePic: profilePic || undefined,
      social: {
        instagram: (social.instagram || "").trim() || undefined,
        tiktok: (social.tiktok || "").trim() || undefined,
        website: (social.website || "").trim() || undefined,
        phone: (social.phone || "").trim() || undefined,
        address: (social.address || "").trim() || undefined,
        email: (social.email || "").trim() || undefined,
        bio: (social.bio || "").trim() || undefined,
      },

      availability,
      notifications: {
        email: notifEmail,
        onOrders: notifications.onOrders !== false,
        onBookings: notifications.onBookings !== false,
        smsPhone: (notifications.smsPhone || "").trim() || undefined,
      },
    };

    try {
      localStorage.setItem(storageKey(h), JSON.stringify(config));
    } catch {}

    setSaving(true);
    try {
      console.log(`📤 Publishing Piqo:`, {
        handle: h,
        brandName: config.brandName,
        mode: config.mode,
        itemCount: config.items?.length || 0,
        hasAvailability: !!config.availability,
        hasStaffProfiles: !!config.staffProfiles,
        staffCount: config.staffProfiles?.length || 0,
      });
      
      console.log('🔐 Attempting to save piqo to server...');
      const out = await postJson("/api/site", config);
      
      console.log('📊 Save response:', {
        status: out.res.status,
        ok: out.res.ok,
        data: out.data
      });

      if (!out.res.ok) {
        const detail = String(out?.data?.detail || out?.data?.error || "").trim();
        const missingSupabaseEnv =
          detail.includes("Missing SUPABASE_URL") || detail.includes("Missing SUPABASE_SERVICE_ROLE_KEY");
        
        // Check if user is not authenticated
        const isUnauthorized = out.res.status === 401 || detail.toLowerCase().includes("unauthorized") || detail.toLowerCase().includes("not authenticated");

        const msg =
          out.res.status === 404
            ? "Missing API route /api/site. Check: src/app/api/site/route.ts"
            : missingSupabaseEnv
              ? "Server is missing Supabase env vars (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY). Your draft is saved locally, but server publish is unavailable until env is set."
              : isUnauthorized
                ? "You must be logged in to create a piqo. Please sign up or log in first."
                : detail || `Failed to save site (server error ${out.res.status}).`;
        
        if (isUnauthorized) {
          // Redirect to login if not authenticated
          console.error("User not authenticated, redirecting to login");
          router.push('/login?redirect=/create');
          return;
        }
        
        throw new Error(msg);
      }

      // Publish the piqo to make it live
      console.log('🚀 Publishing piqo to make it live at u/' + h);
      try {
        const publishRes = await fetch("/api/site/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: 'include',
          body: JSON.stringify({ handle: h }),
        });
        
        const publishData = await publishRes.json().catch(() => ({}));
        
        if (publishRes.ok) {
          console.log('✅ Piqo published successfully');
        } else {
          console.error('❌ Publish failed:', publishData);
        }
      } catch (err) {
        console.error('❌ Publish error:', err);
      }

      try {
        // ensure latest draft is saved
        if (typeof window !== "undefined") {
          if (config) localStorage.setItem(storageKey(h), JSON.stringify(config));
        }
      } catch {}

      // Show success message
      console.log('🎉 Piqo created successfully! Redirecting to dashboard...');
      setToast("✅ Piqo published! Redirecting...");
      
      // Wait for publish to complete and databases to sync
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Redirect to dashboard where the new Piqo will appear
      console.log('📍 Redirecting to dashboard');
      if (typeof window !== 'undefined') {
        // Force full page reload to ensure fresh data from database
        window.location.href = '/dashboard';
      } else {
        router.push(`/dashboard`);
        router.refresh();
      }
    } catch (e: any) {
      setErr(e?.message || "Failed to generate. Check API route.");
    } finally {
      setSaving(false);
    }
  };

  const progress = useMemo(() => {
    const h = cleanHandle;
    const brandOk = !!brandName.trim() && !!h;
    const itemsOk = items.some((x) => (x.title || "").trim());
    const themeOk = !!appearance?.accent;
    const score = [brandOk, itemsOk, themeOk].filter(Boolean).length;
    return { brandOk, itemsOk, themeOk, score };
  }, [cleanHandle, brandName, items, appearance]);

  const modeCard = MODE_CARDS.find((m) => m.id === mode);

  const previewUrl = useMemo(() => {
    const h = cleanHandle || "yourname";
    // Add random to force iframe reload on every tick change
    return `/u/${h}?handle=${h}&preview=1&t=${previewTick}&r=${Date.now()}`;
  }, [cleanHandle, previewTick]);

  const stripeBadge = useMemo(() => {
    const s = stripeStatus;
    if (!cleanHandle) return { tone: "muted", label: "Add a handle first" as const };
    if (stripeLoading) return { tone: "muted", label: "Checking…" as const };
    if (!s) return { tone: "muted", label: "Not connected" as const };
    if (s.connected || s.charges_enabled) return { tone: "good", label: "Connected" as const };
    if (s.requires_action || s.details_submitted === false) return { tone: "warn", label: "Action needed" as const };
    return { tone: "muted", label: "Not connected" as const };
  }, [stripeStatus, stripeLoading, cleanHandle]);

  const bgMode = appearance.bgMode || "solid";
  const gradient = appearance.gradient || { c1: "#22D3EE", c2: "#A78BFA", angle: 135 };
  const overlay = clamp(Number(appearance.bgOverlay ?? 0.45), 0, 0.9);
  
  // Accent - supports solid color or gradient
  const accentMode = appearance.accentMode || "solid";
  const accentGradient = appearance.accentGradient || { c1: "#22D3EE", c2: "#A78BFA", angle: 135 };
  const accent = accentMode === "gradient" 
    ? `linear-gradient(${accentGradient.angle}deg, ${accentGradient.c1}, ${accentGradient.c2})`
    : (appearance.accent || "#22D3EE");
  
  // Solid accent color for borders, prices, and other elements that need hex colors
  const accentSolid = accentMode === "gradient" ? accentGradient.c1 : (appearance.accent || "#22D3EE");
    
  const bgImageFit: "cover" | "contain" = appearance.bgImageFit || "cover";

  const previewBg = useMemo(() => {
    return appearance.bgColor || "#FFFFFF";
  }, [appearance.bgColor]);

  // ✅ Simple background styling - solid colors only
  const previewStyle = useMemo<React.CSSProperties>(() => {
    return {
      backgroundColor: previewBg,
    };
  }, [previewBg]);

  const cardRadius = appearance.radius || 16;

  // Header background - works with solid or gradient accent
  const headerBg = useMemo(() => {
    if (appearance.headerBg) {
      return appearance.headerBg;
    }
    if (accentMode === "gradient") {
      return `linear-gradient(135deg, ${accentGradient.c1} 0%, ${accentGradient.c2} 100%)`;
    }
    return `linear-gradient(135deg, ${accentSolid}bb 0%, ${hexToRgba(accentSolid, 0.6)} 100%)`;
  }, [accentMode, accentGradient.c1, accentGradient.c2, accentSolid]);

  const previewFontFamily = useMemo(() => {
    switch (appearance.fontFamily || "inter") {
      case "poppins":
        return "var(--font-poppins), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
      case "sora":
        return "var(--font-sora), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
      case "space":
        return "var(--font-space), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
      case "jakarta":
        return "var(--font-jakarta), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
      case "dmsans":
        return "var(--font-dmsans), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
      case "inter":
      default:
        return "var(--font-inter), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
    }
  }, [appearance.fontFamily]);

  const headerStyle = appearance.headerStyle || "hero";

  const ctaBg = (appearance.ctaStyle || "accent") === "white" ? "#ffffff" : accent;
  const ctaFg = "#000000";
  const shine = appearance.ctaShine !== false;

  const logoRound = (appearance.logoShape || "square") === "circle" ? "rounded-full" : "rounded-2xl";
  const logoFit: "contain" | "cover" = appearance.logoFit || "contain";

  const showAvailability =
    mode === "services" || mode === "booking";

  const updateDay = (day: WeekdayId, patch: Partial<AvailabilityDay>) => {
    setAvailability((a) => ({
      ...a,
      days: {
        ...a.days,
        [day]: { ...a.days[day], ...patch },
      },
    }));
  };

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated background gradients */}
      <motion.div
        className="pointer-events-none fixed inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 20% 10%, rgba(34,211,238,0.25), transparent 55%), radial-gradient(circle at 80% 90%, rgba(167,139,250,0.2), transparent 60%)",
        }}
        animate={{
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full blur-3xl opacity-30"
        style={{
          background: "linear-gradient(135deg, #22D3EE, #A78BFA, #F472B6)",
        }}
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 py-10">
        {/* Header - Full Width */}
        <div className="max-w-6xl mx-auto">
          <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <motion.div
              className="inline-flex items-center gap-2 rounded-full border border-white/25 backdrop-blur-2xl px-4 py-1.5 text-xs font-bold text-white relative overflow-hidden shadow-2xl shadow-cyan-500/30 ring-1 ring-white/10"
              style={{
                background: isEditMode 
                  ? "linear-gradient(135deg, rgba(34,211,238,0.3), rgba(99,102,241,0.3))"
                  : "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(167,139,250,0.2))",
              }}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: [-200, 400],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
              <motion.div
                animate={{
                  rotate: [0, 15, -15, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
              >
                <Wand2 className="h-3.5 w-3.5 relative z-10" />
              </motion.div>
              <span className="relative z-10">{isEditMode ? "Editing Piqo" : "Piqo Builder"}</span>
            </motion.div>

            <motion.h1
              className="mt-4 text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            >
              {headerStyle === "hero" ? "Build your QR mini-app" : "Create your mini-app"}
            </motion.h1>
            <motion.p
              className="mt-2 text-base text-white/90 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              {headerStyle === "hero"
                ? "People scan → it feels like an app → they tap → you convert."
                : "Fast setup. Clean link. Instant checkout."}
            </motion.p>

            <div className="mt-4 flex flex-wrap gap-2">
              <StepPill n={1} label="Basics" active={!progress.brandOk} done={progress.brandOk} />
              <StepPill n={2} label="Items" active={progress.brandOk && !progress.itemsOk} done={progress.itemsOk} />
              <StepPill n={3} label="Style" active={progress.itemsOk && !progress.themeOk} done={progress.themeOk} />
            </div>

            <div className="mt-2 text-[11px] text-white/70">
              Your link: <span className="text-white/90">/u/{cleanHandle || "handle"}</span> • Preview updates live.
            </div>
            <div className="mt-1 text-[11px] text-white/60 flex items-center gap-3">
              {savingServer ? (
                <span className="text-xs text-cyan-200 font-medium">Saving…</span>
              ) : configDraft?.publishedAt ? (
                <span className="text-xs text-emerald-200 font-medium">Published: {new Date(configDraft.publishedAt).toLocaleString()}</span>
              ) : (
                <span className="text-xs text-white/50">Draft saved locally</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Buttons moved to preview section */}
          </div>
        </header>
        </div>

        {/* Edit Mode Loading State */}
        {editLoading && (
          <div className="max-w-6xl mx-auto mt-6 rounded-2xl border border-cyan-500/35 bg-cyan-500/12 px-4 py-8 text-sm text-cyan-50">
            <div className="flex flex-col items-center gap-3">
              <motion.div
                className="h-8 w-8 border-2 border-cyan-400 border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
              <div className="font-semibold">Loading your Piqo...</div>
              <div className="text-cyan-50/80">Fetching saved configuration</div>
            </div>
          </div>
        )}

        {/* Edit Mode Error State */}
        {editError && (
          <div className="max-w-6xl mx-auto mt-6 rounded-2xl border border-red-500/35 bg-red-500/12 px-4 py-3 text-sm text-red-50">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <div className="min-w-0">
                <div className="font-semibold">Failed to load Piqo</div>
                <div className="mt-1 text-red-50/90">{editError}</div>
                <div className="mt-2 text-[11px] text-red-50/80">
                  This Piqo may not exist or you don't have permission to edit it.
                </div>
              </div>
            </div>
          </div>
        )}

        {err ? (
          <div className="max-w-6xl mx-auto mt-6 rounded-2xl border border-red-500/35 bg-red-500/12 px-4 py-3 text-sm text-red-50">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <div className="min-w-0">
                <div className="font-semibold">Failed to save site</div>
                <div className="mt-1 text-red-50/90">{err}</div>
                {String(err).includes("Missing API route /api/site") ? (
                  <div className="mt-2 text-[11px] text-red-50/80">
                    Your API file should be: <span className="text-red-50">src/app/api/site/route.ts</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {/* Tab Navigation */}
        <motion.div
          className="mt-8 flex gap-2 p-1 rounded-2xl border border-white/12 bg-white/5 backdrop-blur-xl overflow-x-auto lg:max-w-[calc(100%-540px)]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {[
            { id: "setup" as const, label: "Setup", icon: Sparkles },
            { id: "design" as const, label: "Style", icon: Palette },
            { id: "details" as const, label: "Details", icon: Layers },
            { id: "payment" as const, label: "Payment", icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            // Check if Details tab needs attention for Services mode
            const needsAttention = tab.id === "details" && 
              mode === "services" && 
              (!availability || !availability.days || Object.values(availability.days).every((day: any) => !day?.enabled));
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 min-w-[120px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all relative overflow-hidden",
                  isActive
                    ? "text-white shadow-lg shadow-cyan-500/20"
                    : "text-white/60 hover:text-white/80"
                )}
                whileHover={{ scale: isActive ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, rgba(34,211,238,0.2), rgba(167,139,250,0.2))"
                    : "transparent",
                }}
              >
                {isActive && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    animate={{
                      x: [-200, 400],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                )}
                <Icon className="h-4 w-4 relative z-10" />
                <span className="relative z-10">{tab.label}</span>
                {needsAttention && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-pulse z-20" title="Business hours required for booking" />
                )}
              </motion.button>
            );
          })}
        </motion.div>

        {/* Mobile Preview Toggle Button - Only visible on mobile */}
        <motion.button
          type="button"
          onClick={() => setPreviewOn((v) => !v)}
          className="lg:hidden fixed bottom-6 left-6 z-50 inline-flex items-center gap-2 rounded-2xl border border-cyan-500/30 backdrop-blur-xl px-4 py-3 font-semibold text-sm transition shadow-lg shadow-cyan-500/20"
          style={{
            background: previewOn
              ? "linear-gradient(135deg, rgba(34,211,238,0.3), rgba(167,139,250,0.3))"
              : "rgba(0,0,0,0.8)",
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Smartphone className="h-4 w-4" />
          <span>{previewOn ? "Hide" : "Show"} Preview</span>
        </motion.button>

        {/* Mobile Preview Overlay - Full screen on mobile */}
        {previewOn && (
          <motion.div
            className="lg:hidden fixed inset-0 z-40 bg-black/95 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="h-full flex flex-col">
              {/* Header with close button */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Sparkles className="h-4 w-4 text-cyan-400" />
                  Live Preview
                </div>
                <motion.button
                  type="button"
                  onClick={() => setPreviewOn(false)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/8 backdrop-blur-xl px-3 py-2 text-sm font-semibold hover:bg-white/12 transition"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="h-4 w-4" />
                  Close
                </motion.button>
              </div>

              {/* Preview content - scrollable both horizontally and vertically */}
              <div className="flex-1 overflow-auto p-4">
                <div className="min-w-max">
                  {/* Preview Controls */}
                  <div className="flex items-center gap-2 mb-4 max-w-md mx-auto">
                    <motion.button
                      type="button"
                      onClick={randomizeTheme}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-purple-500/30 backdrop-blur-xl px-3 py-2 text-sm font-semibold transition"
                      style={{
                        background: "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(244,114,182,0.2))",
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Sparkles className="h-4 w-4" />
                      🎲 Randomize
                    </motion.button>

                    <motion.button
                      type="button"
                      onClick={() => setShowQr((v) => !v)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/8 backdrop-blur-xl px-3 py-2 text-sm font-semibold hover:bg-white/12 transition"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <QrCode className="h-4 w-4" />
                      QR
                    </motion.button>
                  </div>

                  {/* Phone frame */}
                  <motion.div 
                    className="rounded-[24px] p-0.5 relative max-w-md mx-auto"
                    style={{
                      background: "linear-gradient(135deg, rgba(34,211,238,0.3), rgba(167,139,250,0.3), rgba(244,114,182,0.3))",
                    }}
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="rounded-[22px] border border-white/12 bg-black/80 p-1.5">
                      <div className="relative overflow-visible rounded-[18px] border border-white/12 bg-black shadow-2xl">
                        {/* Phone header bar */}
                        <div className="flex items-center justify-between px-3 py-2 text-[10px] text-white/80 border-b border-white/10 bg-gradient-to-r from-black/90 via-black/70 to-black/90">
                          <span className="inline-flex items-center gap-1.5 truncate">
                            <Sparkles className="h-3 w-3 text-cyan-400" />
                            <span className="font-medium truncate max-w-[120px]">{brandName || "Your Store"}</span>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <motion.div
                              className="w-1.5 h-1.5 rounded-full bg-green-400"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                            <span className="text-white/50 text-[9px]">live</span>
                          </div>
                        </div>

                        {/* Notch */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-b-xl z-10" />

                        <motion.div
                          key={previewTick}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="relative mx-auto w-full min-h-[600px]"
                        >
                          {/* Embedded preview content - reusing desktop preview structure */}
                          <div className="rounded-[28px] border border-white/12 bg-black/45 p-3">
                            <div className="relative overflow-auto rounded-[28px] border border-white/12 bg-black flex flex-col max-h-[70vh]">
                              {/* Header bar */}
                              <div className="flex items-center justify-between px-4 py-2 text-[11px] text-white/80 border-b border-white/10 bg-black/70 flex-shrink-0">
                                <span className="inline-flex items-center gap-2">
                                  <Sparkles className="h-3.5 w-3.5" />
                                  Live • {mode}
                                </span>
                                <span className="text-white/60">{brandName || "Brand basics"}</span>
                              </div>

                              {/* Screen content - scrollable both directions */}
                              <div className="relative overflow-auto scrollbar-hide flex-1" style={{ ...previewStyle, fontFamily: previewFontFamily }}>
                                <StorefrontPreview
                                  key={`${previewTick}-${items.length}-${JSON.stringify(items.map(i => i.layout))}`}
                                  mode={mode}
                                  brandName={brandName}
                                  tagline={tagline}
                                  businessDescription={businessDescription}
                                  items={items.filter(item => item.type !== 'addon')}
                                  appearance={appearance}
                                  staffProfiles={staffProfiles}
                                  ownerEmail={ownerEmail}
                                  brandLogo={brandLogo}
                                  profilePic={profilePic}
                                  social={social}
                                  availability={availability}
                                  notifications={notifications}
                                  handle={cleanHandle}
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Content Area */}
        <div className="mt-6 relative">
          {/* LEFT - Form content - with right margin for preview */}
          <div className="space-y-5 lg:max-w-[calc(100%-540px)]">
            
            {/* SETUP TAB */}
            {activeTab === "setup" && (
              <>
                {/* Mode Selection - Cleaner cards */}
                <motion.section
              className="rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl shadow-cyan-500/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-purple-500/10 opacity-60"
                animate={{
                  opacity: [0.4, 0.7, 0.4],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                }}
              />
              <div className="flex items-center justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3 text-base font-black text-white">
                  <motion.div
                    animate={{
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  >
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                  </motion.div>
                  What are you selling?
                </div>
                {modeCard ? (
                  <motion.div
                    className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] text-cyan-200"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    {modeCard.vibe}
                  </motion.div>
                ) : null}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3 relative z-10">
                {MODE_CARDS.map((m) => {
                  const selected = mode === m.id;
                  return (
                    <motion.button
                      type="button"
                      key={m.id}
                      onClick={() => onPickMode(m.id)}
                      className={cn(
                        "rounded-2xl border p-5 text-left transition relative overflow-hidden shadow-lg",
                        selected
                          ? "border-white/40 bg-white/15 shadow-2xl ring-2"
                          : "border-white/15 bg-black/40 hover:bg-white/12 hover:border-white/25"
                      )}
                      style={selected ? { borderColor: `${m.color}60`, boxShadow: `0 0 30px ${m.color}40` } : {}}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {selected && (
                        <motion.div
                          className="absolute inset-0"
                          style={{ background: `linear-gradient(135deg, ${m.color}25, transparent)` }}
                          animate={{ opacity: [0.5, 0.8, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                      )}
                      <div className="flex items-center gap-3 relative z-10">
                        <div className="text-3xl w-12 h-12 flex items-center justify-center rounded-xl bg-white/10">{m.icon}</div>
                        <div>
                          <div className="text-base font-bold text-white">{m.title}</div>
                          <div className="text-xs text-white/70 mt-0.5">{m.sub}</div>
                        </div>
                      </div>
                      {selected && (
                        <motion.div
                          className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: m.color }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", bounce: 0.5 }}
                        >
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
              {/* Mode-specific helper text */}
              <div className="mt-5 text-sm text-white/80 bg-gradient-to-r from-black/40 to-black/30 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
                {mode === "services" && (
                  <p className="flex items-start gap-2">
                    <span className="text-xl">📅</span>
                    <span><strong className="text-white font-bold">Services</strong> let customers book appointments. Add services, set availability & staff below.</span>
                  </p>
                )}
                {mode === "products" && (
                  <p className="flex items-start gap-2">
                    <span className="text-xl">🛍️</span>
                    <span><strong className="text-white font-bold">Products</strong> are for physical items. Add products, upload images, set prices below.</span>
                  </p>
                )}
                {mode === "digital" && (
                  <p className="flex items-start gap-2">
                    <span className="text-xl">⚡</span>
                    <span><strong className="text-white font-bold">Digital</strong> items deliver instantly. Add files/links, customers get them after checkout.</span>
                  </p>
                )}
              </div>
            </motion.section>

            {/* Brand Basics */}
            <motion.section
              className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-purple-500/10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-3 text-base font-black text-white mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                  <Type className="h-5 w-5 text-white" />
                </div>
                Brand basics
              </div>

              <div className="grid gap-4">
                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">Brand name</span>
                  <input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="rounded-2xl border border-white/15 bg-black/50 px-4 py-3.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 hover:border-white/25"
                    placeholder="Ex: Fresh Cutz"
                  />
                  <span className="text-xs text-white/60">Your brand's name</span>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">Your unique handle</span>
                  <input
                    value={handleInput}
                    onChange={(e) => setHandleInput(e.target.value)}
                    className="rounded-2xl border border-white/15 bg-black/50 px-4 py-3.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 hover:border-white/25"
                    placeholder="Ex: freshcutz"
                  />
                  <div className="text-xs text-white/70 bg-black/30 rounded-lg px-3 py-2 border border-white/10">
                    Your link: <span className="text-cyan-300 font-bold">/u/{cleanHandle || "handle"}</span>
                  </div>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">Tagline</span>
                  <input
                    value={tagline}
                    onChange={(e) => {
                      setTagline(e.target.value);
                      // Force immediate preview update for tagline changes
                      skipNextPreviewTickRef.current = true;
                      setPreviewTick(x => x + 1);
                    }}
                    className="rounded-2xl border border-white/15 bg-black/50 px-4 py-3.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 hover:border-white/25"
                    placeholder="Ex: Tap, pay, confirmed."
                  />
                  <span className="text-xs text-white/60">Tagline shown on your storefront</span>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-white">Business Description <span className="text-white/50 font-normal">(optional)</span></span>
                  <textarea
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                    rows={3}
                    className="rounded-2xl border border-white/15 bg-black/50 px-4 py-3.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 hover:border-white/25 resize-none"
                    placeholder="Ex: Premium barbershop in downtown. Walk-ins welcome!"
                    maxLength={150}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60">Appears in hero section under brand name</span>
                    <span className="text-[10px] text-white/50">{(businessDescription || "").length}/150</span>
                  </div>
                </label>

                <div className="grid gap-2 sm:col-span-2">
                  <span className="text-sm font-bold text-white">Logo (optional)</span>

                {/* Logo Upload */}
                  <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-gradient-to-r from-black/50 to-black/40 px-4 py-3.5 text-sm text-white hover:bg-black/60 hover:border-white/25 transition cursor-pointer group/upload">
                    <span className="inline-flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover/upload:scale-110 transition-transform">
                        <ImageIcon className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-semibold">{brandLogo ? "Change logo" : "Upload logo"}</span>
                    </span>
                    <span className="text-xs text-white/60 bg-white/5 px-2.5 py-1 rounded-lg">PNG/JPG/SVG</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onPickLogoFile(e.target.files?.[0])}
                    />
                  </label>

                  <label className="grid gap-1 mt-2">
                    <span className="text-[11px] text-white/70">Logo framing (live preview)</span>
                    <select
                      value={appearance.logoFit || "contain"}
                      onChange={(e) => applyAppearancePatchInstant({ logoFit: e.target.value as "contain" | "cover" })}
                      className="w-full appearance-none rounded-2xl border border-white/12 bg-black/40 px-4 py-2.5 text-xs text-white/85 outline-none focus:border-white/25 cursor-pointer"
                    >
                      <option value="contain">Fit (no crop)</option>
                      <option value="cover">Crop (fill box)</option>
                    </select>
                  </label>

                  {brandLogo && (
                    <div className="flex items-center gap-3 mt-2">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="h-14 w-14 rounded-xl border border-white/20 bg-black/40 overflow-hidden flex-shrink-0"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={brandLogo}
                          alt="Logo preview"
                          className={cn(
                            "h-full w-full",
                            logoFit === "cover" ? "object-cover" : "object-contain p-1"
                          )}
                        />
                      </motion.div>
                      <button
                        type="button"
                        onClick={() => setBrandLogo("")}
                        className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid gap-2 sm:col-span-2">
                  <span className="text-sm font-bold text-white">Profile Picture (optional)</span>

                {/* Profile Picture Upload */}
                  <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-gradient-to-r from-black/50 to-black/40 px-4 py-3.5 text-sm text-white hover:bg-black/60 hover:border-white/25 transition cursor-pointer group/upload">
                    <span className="inline-flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center group-hover/upload:scale-110 transition-transform overflow-hidden">
                        {profilePic ? (
                          <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <span className="font-semibold">{profilePic ? "Change photo" : "Upload photo"}</span>
                    </span>
                    <span className="text-xs text-white/60 bg-white/5 px-2.5 py-1 rounded-lg">PNG/JPG</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onPickProfilePic(e.target.files?.[0])}
                    />
                  </label>

                  <div className="text-[11px] text-white/70">Your photo will appear in the top corner of your live piqo</div>

                  {profilePic && (
                    <div className="flex items-center gap-3 mt-2">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="h-14 w-14 rounded-full border-2 border-white/20 bg-black/40 overflow-hidden flex-shrink-0"
                      >
                        <img
                          src={profilePic}
                          alt="Profile preview"
                          className="h-full w-full object-cover"
                        />
                      </motion.div>
                      <button
                        type="button"
                        onClick={() => setProfilePic("")}
                        className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/5 px-3 py-1.5 text-xs text-white/70 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                <label className="grid gap-1 sm:col-span-2">
                  <span className="text-xs text-white/80">Email for alerts</span>
                  <input
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                    placeholder="you@domain.com"
                    inputMode="email"
                  />
                  <div className="text-[11px] text-white/70">We’ll email you when someone pays or books (once wired).</div>
                </label>
              </div>
            </motion.section>

            {/* Your Offerings */}
            <motion.section
              className="rounded-3xl border border-white/12 bg-white/8 backdrop-blur-xl p-5 relative overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                  <Layers className="h-4 w-4 text-orange-400" />
                  {mode === "services" ? "Services" : mode === "products" ? "Products" : "Digital Items"} ({items.length})
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {items.length === 0 && (
                    <motion.button
                      type="button"
                      onClick={() => setItems(pickDefaultItemsForMode(mode))}
                      className="inline-flex items-center gap-1.5 rounded-2xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition shadow-lg shadow-purple-500/10"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Wand2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      <span className="hidden xs:inline">Quick Fill</span>
                      <span className="xs:hidden">Fill</span>
                    </motion.button>
                  )}
                  {(mode === "products" || mode === "services") && (
                    <>
                      <motion.button
                        type="button"
                        onClick={addSectionHeader}
                        className="inline-flex items-center gap-1.5 rounded-2xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-500/20 transition shadow-lg shadow-blue-500/10"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Type className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="hidden xs:inline">Add Section</span>
                        <span className="xs:hidden">Section</span>
                      </motion.button>
                      <motion.button
                        type="button"
                        onClick={addSubsection}
                        className="inline-flex items-center gap-1.5 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition shadow-lg shadow-indigo-500/10"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Type className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span className="hidden xs:inline">Add Subsection</span>
                        <span className="xs:hidden">Sub</span>
                      </motion.button>
                    </>
                  )}
                  <motion.button
                    type="button"
                    onClick={addItem}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs font-semibold text-green-300 hover:bg-green-500/20 transition shadow-lg shadow-green-500/10"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Add Product</span>
                    <span className="xs:hidden">Product</span>
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={addService}
                    className="inline-flex items-center gap-1.5 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition shadow-lg shadow-cyan-500/10"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <CalendarClock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Add Service</span>
                    <span className="xs:hidden">Service</span>
                  </motion.button>
                  {mode === "services" && (
                    <motion.button
                      type="button"
                      onClick={addAddon}
                      className="inline-flex items-center gap-1.5 rounded-2xl border border-purple-500/30 bg-purple-500/10 px-3 py-2 text-xs font-semibold text-purple-300 hover:bg-purple-500/20 transition shadow-lg shadow-purple-500/10"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Plus className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span className="hidden xs:inline">Add-on</span>
                      <span className="xs:hidden">Add-on</span>
                    </motion.button>
                  )}
                </div>
              </div>

              {items.length === 0 ? (
                <motion.div 
                  className="rounded-2xl border border-dashed border-white/20 bg-black/20 p-8 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-3">
                    <Layers className="h-6 w-6 text-white/40" />
                  </div>
                  <div className="text-sm text-white/70 font-medium">No {mode === "services" ? "services" : mode === "products" ? "products" : "items"} yet</div>
                  <div className="text-xs text-white/40 mt-1">
                    Click &quot;Add {mode === "services" ? "Service" : mode === "products" ? "Product" : "Item"}&quot; to get started
                  </div>
                </motion.div>
              ) : (
                <div className="grid gap-3">
                  {items.map((it, idx) => {
                    const isSection = it.type === "section";
                    const isSubsection = it.type === "subsection";
                    const isService = it.type === "service";
                    const isAddon = it.type === "addon";
                    const isProduct = it.type === "product" || !it.type; // default to product
                    
                    return (
                    <motion.div 
                      key={idx} 
                      className={`rounded-2xl border p-4 transition group ${
                        isSection 
                          ? 'border-blue-500/30 bg-gradient-to-r from-blue-500/10 to-purple-500/10 hover:border-blue-500/40' 
                          : isSubsection
                          ? 'border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 hover:border-indigo-500/40 ml-4'
                          : isService
                          ? 'border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 hover:border-cyan-500/40'
                          : isAddon
                          ? 'border-purple-500/30 bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:border-purple-500/40'
                          : 'border-white/12 bg-black/30 hover:border-white/20 hover:bg-black/35'
                      }`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      layout
                    >
                      {/* Header row */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1">
                          {/* Item number badge */}
                          <div className={`flex-shrink-0 w-7 h-7 rounded-lg border grid place-items-center text-xs font-bold ${
                            isSection 
                              ? 'bg-blue-500/20 border-blue-500/30 text-blue-300' 
                              : isSubsection
                              ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
                              : isService
                              ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
                              : 'bg-white/5 border-white/10 text-white/50'
                          }`}>
                            {isSection ? <Type className="h-3.5 w-3.5" /> : isSubsection ? <Type className="h-3 w-3" /> : isService ? <CalendarClock className="h-3.5 w-3.5" /> : idx + 1}
                          </div>

                          {/* Title input */}
                          <input
                            value={it.title}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setItems((prev) => {
                                const newItems = [...prev];
                                newItems[idx] = { ...newItems[idx], title: newValue };
                                return newItems;
                              });
                            }}
                            className={`flex-1 rounded-xl border bg-black/50 px-3 py-2.5 text-sm font-semibold text-white placeholder:text-white/40 outline-none focus:ring-2 transition-all duration-200 ${
                              isSection
                                ? 'border-blue-500/30 focus:border-blue-500/50 focus:ring-blue-500/20 hover:border-blue-500/40'
                                : isSubsection
                                ? 'border-indigo-500/30 focus:border-indigo-500/50 focus:ring-indigo-500/20 hover:border-indigo-500/40'
                                : 'border-white/15 focus:border-orange-500/50 focus:ring-orange-500/20 hover:border-white/25'
                            }`}
                            placeholder={
                              isSection 
                                ? (mode === "services" ? "e.g. Hair Services" : "e.g. Breakfast")
                                : isSubsection 
                                ? (mode === "services" ? "e.g. Cuts & Styling" : "e.g. Hot Drinks")
                                : (mode === "services" ? "e.g. Haircut" : mode === "products" ? "e.g. T-Shirt" : "e.g. eBook")
                            }
                          />

                          {/* Price input - show inline on desktop, below on mobile */}
                          {!isSection && !isSubsection && (
                            <input
                              value={it.price}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                setItems((prev) => {
                                  const newItems = [...prev];
                                  newItems[idx] = { ...newItems[idx], price: newValue };
                                  return newItems;
                                });
                              }}
                              className="w-20 sm:w-24 rounded-xl border border-white/15 bg-black/50 px-2 sm:px-3 py-2.5 text-sm font-bold text-white placeholder:text-white/40 outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 hover:border-white/25 text-center"
                              placeholder="$25"
                            />
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 sm:opacity-60 sm:group-hover:opacity-100 transition-opacity">
                          {/* Move up */}
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => {
                              if (idx === 0) return;
                              setItems((prev) => {
                                const arr = [...prev];
                                [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                                return arr;
                              });
                            }}
                            className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-black/20 w-7 h-7 text-white/60 hover:bg-white/10 hover:text-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            title="Move up"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                          </button>
                          {/* Move down */}
                          <button
                            type="button"
                            disabled={idx === items.length - 1}
                            onClick={() => {
                              if (idx === items.length - 1) return;
                              setItems((prev) => {
                                const arr = [...prev];
                                [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
                                return arr;
                              });
                            }}
                            className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-black/20 w-7 h-7 text-white/60 hover:bg-white/10 hover:text-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition"
                            title="Move down"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </button>
                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => setItems((prev) => prev.filter((_, i) => i !== idx))}
                            className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-black/20 w-7 h-7 text-white/60 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 transition"
                            title="Remove item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {!isSection && !isSubsection && !isAddon && (
                      <>
                      {/* Layout Selector - For products, services, and addons */}
                      {(isProduct || isService || isAddon) && (
                        <div className="pl-4 sm:pl-10 mb-3">
                          <span className="text-xs font-semibold text-white/70 block mb-1.5">
                            Display Format {it.layout && `(${it.layout})`}
                          </span>
                          <div className="grid grid-cols-3 gap-1.5">
                            {(["cards", "menu", "tiles"] as LayoutMode[]).map((layoutOption) => {
                              const isActive = (it.layout || "cards") === layoutOption;
                              return (
                                <button
                                  key={layoutOption}
                                  type="button"
                                  onClick={() => {
                                    console.log(`[Layout Button] Clicked ${layoutOption} for item ${idx}: "${items[idx]?.title}"`);
                                    const newItems = [...items];
                                    newItems[idx] = { ...newItems[idx], layout: layoutOption };
                                    console.log(`[Layout Button] Updated item layout:`, newItems[idx]);
                                    
                                    // Force synchronous state update
                                    flushSync(() => {
                                      setItems(newItems);
                                    });
                                    console.log(`[Layout Button] State updated, new items count:`, newItems.length);
                                    
                                    // Update localStorage immediately
                                    if (typeof window !== "undefined" && cleanHandle && configDraft) {
                                      const updatedConfig = { ...configDraft, items: newItems, createdAt: Date.now() };
                                      try {
                                        localStorage.setItem(storageKey(cleanHandle), JSON.stringify(updatedConfig));
                                        console.log(`[Layout Button] LocalStorage updated for ${cleanHandle}`);
                                      } catch {}
                                    }
                                    
                                    // Force preview update - items are now guaranteed to be updated
                                    skipNextPreviewTickRef.current = true;
                                    setPreviewTick(x => x + 1);
                                    console.log(`[Layout Button] Preview tick incremented`);
                                  }}
                                  className={`px-2 py-2 rounded-lg border text-xs font-medium transition-all duration-200 ${
                                    isActive
                                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-300"
                                      : "bg-black/30 border-white/10 text-white/60 hover:bg-white/5 hover:border-white/20 hover:text-white/80"
                                  }`}
                                >
                                  {layoutOption === "cards" && "📋 Card"}
                                  {layoutOption === "menu" && "📜 Menu"}
                                  {layoutOption === "tiles" && "🔳 Tile"}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {/* Details row */}
                      <div className="grid gap-2 sm:grid-cols-2 pl-4 sm:pl-10">
                        {/* Button Text for Add-ons */}
                        {isAddon && (
                          <label className="grid gap-1.5 sm:col-span-2">
                            <span className="text-xs font-semibold text-white/70">Button Text <span className="text-white/50 font-normal">(optional)</span></span>
                            <input
                              value={it.buttonText || ""}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                setItems((prev) => {
                                  const newItems = [...prev];
                                  newItems[idx] = { ...newItems[idx], buttonText: newValue };
                                  return newItems;
                                });
                              }}
                              className="rounded-xl border border-purple-500/20 bg-purple-500/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 hover:border-purple-500/30"
                              placeholder="e.g. Add this, Book Now, Buy"
                            />
                            <span className="text-[10px] text-purple-300/60">Customize what the button says for this add-on</span>
                          </label>
                        )}
                        <label className="grid gap-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-white/70">Description</span>
                            <button
                              type="button"
                              onClick={() => {
                                setItems((prev) => {
                                  const newItems = [...prev];
                                  const currentNote = newItems[idx].note || "";
                                  const newNote = currentNote + (currentNote ? "\n" : "") + "• ";
                                  newItems[idx] = { ...newItems[idx], note: newNote };
                                  return newItems;
                                });
                              }}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/15 text-white/70 hover:text-white transition flex items-center gap-1"
                              title="Add bullet point"
                            >
                              <Plus className="h-2.5 w-2.5" />
                              Bullet
                            </button>
                          </div>
                          <textarea
                            value={it.note || ""}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setItems((prev) => {
                                const newItems = [...prev];
                                newItems[idx] = { ...newItems[idx], note: newValue };
                                return newItems;
                              });
                            }}
                            rows={3}
                            className="rounded-xl border border-white/15 bg-black/50 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 hover:border-white/25 resize-none"
                            placeholder={mode === "services" ? "e.g. 30 min session\n• Includes consultation\n• Professional styling" : "e.g. Premium quality\n• Free shipping\n• 30-day returns"}
                          />
                        </label>

                        <label className="grid gap-1.5">
                          <span className="text-xs font-semibold text-white/70">Badge</span>
                          <select
                            value={it.badge || "none"}
                            onChange={(e) => {
                              const newValue = e.target.value as ItemBadge;
                              setItems((prev) => {
                                const newItems = [...prev];
                                newItems[idx] = { ...newItems[idx], badge: newValue };
                                return newItems;
                              });
                            }}
                            className="w-full appearance-none rounded-xl border border-white/15 bg-black/50 px-3 py-2.5 text-sm text-white outline-none focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 hover:border-white/25 cursor-pointer"
                          >
                            <option value="none">No badge</option>
                            <option value="popular">🔥 Popular</option>
                            <option value="trending">📈 Trending</option>
                            <option value="new">✨ New</option>
                            <option value="bestseller">⭐ Bestseller</option>
                            <option value="limited">⚡ Limited</option>
                            <option value="sale">🏷️ Sale</option>
                            <option value="exclusive">💎 Exclusive</option>
                          </select>
                        </label>
                      </div>

                      {/* Deposit field for services */}
                      {isService && (
                        <div className="pl-4 sm:pl-10">
                          <label className="grid gap-1.5">
                            <span className="text-xs font-semibold text-white/70">Deposit Amount <span className="text-white/50 font-normal">(optional)</span></span>
                            <input
                              value={it.deposit || ""}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                setItems((prev) => {
                                  const newItems = [...prev];
                                  newItems[idx] = { ...newItems[idx], deposit: newValue };
                                  return newItems;
                                });
                              }}
                              className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 transition-all duration-200 hover:border-cyan-500/30"
                              placeholder="e.g. $10 or 50%"
                            />
                            <span className="text-[10px] text-cyan-300/60">Require a deposit to secure this booking</span>
                          </label>
                        </div>
                      )}

                      {/* Image upload row */}
                      <div className="pl-4 sm:pl-10 mt-2">
                        <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-3">
                          {/* Image preview */}
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/12 bg-black/40 flex-shrink-0">
                            {it.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={it.image} alt="Item" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/30">
                                <ImageIcon className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                          
                          {/* Upload / Remove buttons */}
                          <div className="flex-1 flex items-center gap-2">
                            <label className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-white/12 bg-black/30 px-3 py-2 text-xs text-white/70 hover:bg-white/10 hover:text-white/90 transition cursor-pointer">
                              <ImageIcon className="h-3.5 w-3.5" />
                              <span className="hidden xs:inline">{it.image ? "Change image" : "Add image"}</span>
                              <span className="xs:hidden">{it.image ? "Change" : "Add"}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file || !file.type.startsWith("image/")) return;
                                  
                                  // Show uploading state
                                  setToast("📤 Uploading image...");
                                  
                                  // Show preview immediately while uploading
                                  const preview = await fileToDataUrl(file);
                                  setItems((prev) =>
                                    prev.map((x, i) => (i === idx ? { ...x, image: preview } : x))
                                  );
                                  
                                  // Upload to server to get hosted URL
                                  try {
                                    const fd = new FormData();
                                    fd.append("file", file, file.name || "upload.jpg");
                                    const res = await fetch("/api/uploads", { method: "POST", body: fd, credentials: 'include' });
                                    const data = await res.json().catch(() => ({}));
                                    
                                    if (res.ok && data?.url) {
                                      // Success - replace preview with hosted URL
                                      setItems((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, image: data.url } : x))
                                      );
                                      setToast("✅ Image uploaded!");
                                      setTimeout(() => setToast(null), 2000);
                                    } else {
                                      // Upload failed - show error
                                      setToast("❌ Upload failed. Please try again.");
                                      setTimeout(() => setToast(null), 3000);
                                      // Remove preview since upload failed
                                      setItems((prev) =>
                                        prev.map((x, i) => (i === idx ? { ...x, image: undefined } : x))
                                      );
                                    }
                                  } catch (err) {
                                    // Upload failed - show error
                                    console.error('Upload error:', err);
                                    setToast("❌ Upload failed. Please check your connection.");
                                    setTimeout(() => setToast(null), 3000);
                                    // Remove preview since upload failed
                                    setItems((prev) =>
                                      prev.map((x, i) => (i === idx ? { ...x, image: undefined } : x))
                                    );
                                  }
                                }}
                              />
                            </label>
                            {it.image && (
                              <button
                                type="button"
                                onClick={() =>
                                  setItems((prev) =>
                                    prev.map((x, i) => (i === idx ? { ...x, image: undefined } : x))
                                  )
                                }
                                className="rounded-xl border border-white/12 bg-black/30 px-3 py-2 text-xs text-white/60 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 transition"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="text-[10px] text-white/40 mt-1.5">Optional: Add a photo for this item</div>
                      </div>
                      </>
                      )}

                      {isSection && (
                        <div className="pl-4 sm:pl-10 text-xs text-blue-300/70 flex items-center gap-2">
                          <Type className="h-3 w-3" />
                          Section header • Groups items visually
                        </div>
                      )}
                      {isSubsection && (
                        <div className="pl-4 sm:pl-10 text-xs text-indigo-300/70 flex items-center gap-2">
                          <Type className="h-3 w-3" />
                          Subsection • Organizes items within a section
                        </div>
                      )}
                      {isService && (
                        <div className="pl-4 sm:pl-10 text-xs text-cyan-300/70 flex items-center gap-2">
                          <CalendarClock className="h-3 w-3" />
                          Service • Customers can book appointments for this
                        </div>
                      )}
                      {isAddon && (
                        <div className="pl-4 sm:pl-10 text-xs text-purple-300/70 flex items-center gap-2">
                          <Plus className="h-3 w-3" />
                          Add-on • Simple optional extra (name + price only)
                        </div>
                      )}
                      {isProduct && !isSection && !isSubsection && (
                        <div className="pl-4 sm:pl-10 text-xs text-green-300/70 flex items-center gap-2">
                          <ShoppingBag className="h-3 w-3" />
                          Product • Customers can add to cart and checkout
                        </div>
                      )}
                    </motion.div>
                  )})}
                </div>
              )}

              <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-blue-500/15 to-cyan-500/15 border border-blue-500/30 shadow-lg shadow-blue-500/10">
                <div className="text-sm text-blue-100 flex items-start gap-2">
                  <span className="text-lg">💡</span>
                  <p>
                    <span className="font-bold">Tip:</span> Add 2-5 {mode === "services" ? "services" : "items"} for best results. 
                    {mode === "services" || mode === "products" ? " Use sections to organize them into categories." : ""} Customers see the first 3 on your storefront preview.
                  </p>
                </div>
              </div>

              {/* Next Button */}
              <div className="mt-8 flex justify-end">
                <motion.button
                  type="button"
                  onClick={() => setActiveTab("design")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 px-8 py-4 text-base font-bold text-white transition-all shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Next: Style your store
                  <motion.div
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.div>
                </motion.button>
              </div>
            </motion.section>
              </>
            )}

            {/* DESIGN TAB */}
            {activeTab === "design" && (
              <>
            {/* App Style - Complete Design Controls (same controls, clearer flow) */}
            <section className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-purple-500/10">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="inline-flex items-center gap-3 text-base font-black text-white">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <Layers className="h-5 w-5 text-white" />
                  </div>
                  Structure
                </div>
                <div className="text-[11px] text-white/70">Font + layout + header</div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                                {/* ...existing code... */}
                                <label className="grid gap-1 mt-2">
                                  <span className="text-xs text-white/80">Header color</span>
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="color"
                                      value={appearance.headerBg || "#22223b"}
                                      onChange={e => applyAppearancePatchInstant({ headerBg: e.target.value })}
                                      className="w-10 h-10 rounded-lg border border-white/20 bg-black/40 cursor-pointer"
                                      style={{ background: appearance.headerBg || "#22223b" }}
                                    />
                                    <span className="text-xs text-white/70">Pick a color for your storefront header</span>
                                  </div>
                                </label>
                <label className="grid gap-1">
                  <span className="text-xs text-white/80">Font</span>
                  <div className="relative">
                    <Type className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
                    <select
                      value={appearance.fontFamily || "inter"}
                      onChange={(e) =>
                        applyAppearancePatchInstant({ fontFamily: e.target.value as FontFamily })
                      }
                      className="w-full appearance-none rounded-2xl border border-white/12 bg-black/40 pl-11 pr-10 py-3 text-sm text-white/90 outline-none focus:border-white/25"
                    >
                      <option value="inter">Inter (clean)</option>
                      <option value="poppins">Poppins (friendly)</option>
                      <option value="sora">Sora (modern)</option>
                      <option value="space">Space Grotesk (tech)</option>
                      <option value="jakarta">Plus Jakarta Sans (premium)</option>
                      <option value="dmsans">DM Sans (sleek)</option>
                    </select>
                  </div>
                </label>

                {/* Layout selector removed - creators control individual item formatting via Item Style toggle */}

                <label className="grid gap-1">
                  <span className="text-xs text-white/80">Logo shape</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(["square", "circle"] as const).map((v) => {
                      const on = (appearance.logoShape || "square") === v;
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => applyAppearancePatchInstant({ logoShape: v })}
                          className={cn(
                            "rounded-2xl border px-3 py-3 text-xs font-semibold transition",
                            on ? "border-white/35 bg-white/12" : "border-white/12 bg-black/30 hover:bg-white/10"
                          )}
                        >
                          {v === "square" ? "Rounded square" : "Circle"}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-[11px] text-white/65">Crop/fit is under Setup → Logo framing.</div>
                </label>

                <label className="grid gap-1">
                  <span className="text-xs text-white/80">Header style</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(["hero", "minimal"] as const).map((v) => {
                      const on = (appearance.headerStyle || "hero") === v;
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => applyAppearancePatchInstant({ headerStyle: v })}
                          className={cn(
                            "rounded-2xl border px-3 py-3 text-xs font-semibold transition",
                            on ? "border-white/35 bg-white/12" : "border-white/12 bg-black/30 hover:bg-white/10"
                          )}
                        >
                          {v === "hero" ? "Hero" : "Minimal"}
                        </button>
                      );
                    })}
                  </div>
                </label>

                <label className="grid gap-1">
                  <span className="text-xs text-white/80">Card roundness</span>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 8, label: "Sharp" },
                      { value: 12, label: "Soft" },
                      { value: 16, label: "Round" },
                      { value: 20, label: "Pill" },
                    ].map((r) => {
                      const on = (appearance.radius || 16) === r.value;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => applyAppearancePatchInstant({ radius: r.value })}
                          className={cn(
                            "rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all flex items-center justify-center min-h-[44px]",
                            on 
                              ? "border-cyan-500/50 bg-cyan-500/20 text-white shadow-lg shadow-cyan-500/25" 
                              : "border-white/12 bg-black/30 hover:bg-white/10 text-white/80 hover:text-white"
                          )}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <div 
                              className="w-4 h-3 border border-current bg-current/20" 
                              style={{ borderRadius: `${r.value * 0.3}px` }}
                            />
                            <span className="text-[10px]">{r.label}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </label>
              </div>
            </section>

            {/* Accent Color */}
            <section className="rounded-3xl border border-white/12 bg-white/8 backdrop-blur-xl p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-white/90">
                  <Palette className="h-4 w-4 text-pink-400" />
                  Accent color
                </div>
                <div className="text-[11px] text-white/70">Brand color for buttons & highlights</div>
              </div>

              <div className="grid gap-3">
                {/* Solid vs Gradient toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => applyAppearancePatchInstant({ accentMode: "solid" })}
                    className={cn(
                      "rounded-2xl border px-3 py-2.5 text-xs font-semibold transition",
                      (appearance.accentMode || "solid") === "solid" 
                        ? "border-white/35 bg-white/12" 
                        : "border-white/12 bg-black/30 hover:bg-white/10"
                    )}
                  >
                    Solid
                  </button>
                  <button
                    type="button"
                    onClick={() => applyAppearancePatchInstant({ accentMode: "gradient" })}
                    className={cn(
                      "rounded-2xl border px-3 py-2.5 text-xs font-semibold transition",
                      (appearance.accentMode || "solid") === "gradient" 
                        ? "border-white/35 bg-white/12" 
                        : "border-white/12 bg-black/30 hover:bg-white/10"
                    )}
                  >
                    Gradient
                  </button>
                </div>

                {/* Solid color */}
                {(appearance.accentMode || "solid") === "solid" ? (
                  <>
                    <label className="grid gap-1">
                      <span className="text-xs text-white/80">Brand accent</span>
                      <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-black/30 px-4 py-3">
                        <input
                          type="color"
                          value={accent}
                          onChange={(e) => applyAppearancePatchInstant({ accent: e.target.value })}
                          className="h-8 w-10 rounded-lg border border-white/12 bg-transparent"
                        />
                        <input
                          value={accent}
                          onChange={(e) => applyAppearancePatchInstant({ accent: e.target.value })}
                          className="flex-1 bg-transparent text-sm text-white/90 outline-none"
                        />
                      </div>
                    </label>

                    {/* Quick accent presets */}
                    <div className="grid grid-cols-7 gap-2">
                      {["#22D3EE", "#A78BFA", "#F472B6", "#34D399", "#F59E0B", "#60A5FA", "#FB7185"].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => applyAppearancePatchInstant({ accent: color })}
                          className={cn(
                            "h-10 rounded-xl border-2 transition-all",
                            accent === color ? "border-white/60 scale-110" : "border-white/20 hover:border-white/40"
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </>
                ) : (
                  /* Gradient colors */
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-1">
                      <span className="text-xs text-white/80">Color 1</span>
                      <input
                        type="color"
                        value={appearance.accentGradient?.c1 || "#22D3EE"}
                        onChange={(e) => applyAppearancePatchInstant({ 
                          accentGradient: { 
                            c1: e.target.value, 
                            c2: appearance.accentGradient?.c2 || "#A78BFA",
                            angle: appearance.accentGradient?.angle || 135
                          } 
                        })}
                        className="h-11 w-full rounded-2xl border border-white/12 bg-black/30"
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs text-white/80">Color 2</span>
                      <input
                        type="color"
                        value={appearance.accentGradient?.c2 || "#A78BFA"}
                        onChange={(e) => applyAppearancePatchInstant({ 
                          accentGradient: { 
                            c1: appearance.accentGradient?.c1 || "#22D3EE",
                            c2: e.target.value,
                            angle: appearance.accentGradient?.angle || 135
                          } 
                        })}
                        className="h-11 w-full rounded-2xl border border-white/12 bg-black/30"
                      />
                    </label>
                    <label className="grid gap-1 sm:col-span-2">
                      <span className="text-xs text-white/80">Angle</span>
                      <input
                        type="range"
                        min={0}
                        max={360}
                        value={appearance.accentGradient?.angle || 135}
                        onChange={(e) => applyAppearancePatchInstant({ 
                          accentGradient: { 
                            c1: appearance.accentGradient?.c1 || "#22D3EE",
                            c2: appearance.accentGradient?.c2 || "#A78BFA",
                            angle: Number(e.target.value)
                          } 
                        })}
                        className="w-full"
                      />
                      <div className="text-[11px] text-white/65">{appearance.accentGradient?.angle || 135}°</div>
                    </label>

                    {/* Preview swatch */}
                    <div
                      className="sm:col-span-2 h-14 rounded-2xl border border-white/12"
                      style={{ 
                        background: `linear-gradient(${appearance.accentGradient?.angle || 135}deg, ${appearance.accentGradient?.c1 || "#22D3EE"}, ${appearance.accentGradient?.c2 || "#A78BFA"})` 
                      }}
                    />
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-3xl border border-white/12 bg-white/8 backdrop-blur-xl p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-white/90">
                  <Sparkles className="h-4 w-4 text-white/80" />
                  CTA button
                </div>
                <div className="text-[11px] text-white/70">Style + label</div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-xs text-white/80">CTA style</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(["accent", "white"] as CtaStyle[]).map((c) => {
                      const on = (appearance.ctaStyle || "accent") === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => applyAppearancePatchInstant({ ctaStyle: c })}
                          className={cn(
                            "rounded-2xl border px-3 py-3 text-xs font-semibold transition",
                            on ? "border-white/35 bg-white/12" : "border-white/12 bg-black/30 hover:bg-white/10"
                          )}
                        >
                          {c === "accent" ? "Accent" : "White"}
                        </button>
                      );
                    })}
                  </div>
                </label>

                <label className="grid gap-1">
                  <span className="text-xs text-white/80">CTA "shine"</span>
                  <button
                    type="button"
                    onClick={() => applyAppearancePatchInstant({ ctaShine: !appearance.ctaShine })}
                    className="inline-flex items-center justify-between rounded-2xl border border-white/12 bg-black/30 px-4 py-3 text-sm text-white/85 hover:bg-white/10 transition"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      {appearance.ctaShine ? "On" : "Off"}
                    </span>
                    <span className="text-[11px] text-white/65">More "app" feel</span>
                  </button>
                </label>

                <label className="grid gap-1 sm:col-span-2">
                  <span className="text-xs text-white/80">CTA button text (optional)</span>
                  <input
                    value={appearance.ctaText || ""}
                    onChange={(e) => applyAppearancePatchInstant({ ctaText: e.target.value })}
                    className="rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                    placeholder="Ex: Reserve spot • Book now • Get instant access"
                  />
                  <div className="text-[11px] text-white/65">Leave empty to use the default label for your mode.</div>
                </label>
              </div>
            </section>

            <section className="rounded-3xl border border-white/12 bg-white/8 backdrop-blur-xl p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-white/90">
                  <LayoutTemplate className="h-4 w-4 text-white/80" />
                  Sections
                </div>
                <div className="text-[11px] text-white/70">Show / hide</div>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { key: "showPoweredBy", label: "Powered by Piqo" },
                  { key: "showStaff", label: "Staff / team section" },
                  { key: "showSocials", label: "Social + contact buttons" },
                  { key: "showHours", label: "Business hours" },
                ].map((x) => {
                  const k = x.key as "showPoweredBy" | "showStaff" | "showSocials" | "showHours";
                  const on = (appearance[k] ?? true) === true;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => applyAppearancePatchInstant({ [k]: !(appearance[k] ?? true) })}
                      className="inline-flex items-center justify-between rounded-2xl border border-white/12 bg-black/30 px-4 py-3 text-sm text-white/85 hover:bg-white/10 transition"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        {x.label}
                      </span>
                      <span className="text-[11px] text-white/65">{on ? "On" : "Off"}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-2xl border border-white/12 bg-black/30 p-3">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="text-[11px] text-white/65">Live style preview</div>
                  <div className="text-[11px] text-white/55">Logo/name from Setup</div>
                </div>

                {/* Special Message Banner */}
                <label className="grid gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Special Message <span className="text-white/50 font-normal">(optional)</span></span>
                    <span className="text-[10px] px-2 py-0.5 bg-orange-500/20 text-orange-300 rounded-full font-bold">NEW</span>
                  </div>
                  <input
                    value={appearance.specialMessage || ""}
                    onChange={(e) => applyAppearancePatchInstant({ specialMessage: e.target.value })}
                    className="rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                    placeholder="Ex: 🎉 Grand opening this weekend! • ⚡ Free shipping on all orders"
                    maxLength={100}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-white/65">Displays as a banner at the top of your piqo</span>
                    <span className="text-[10px] text-white/50">{(appearance.specialMessage || "").length}/100</span>
                  </div>
                </label>

                <div className="rounded-2xl border border-white/12 p-4" style={{ ...previewStyle, fontFamily: previewFontFamily }}>
                  <div className="flex items-center gap-2">
                    <div className={cn("h-10 w-10 border border-white/15 bg-black/40 grid place-items-center overflow-hidden", logoRound)}>
                      {brandLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={brandLogo}
                          alt="logo"
                          className={cn(
                            "h-full w-full",
                            logoFit === "cover" ? "object-cover" : "object-contain p-2"
                          )}
                        />
                      ) : (
                        <Sparkles className="h-4 w-4 text-white/70" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-semibold text-white/90 truncate">{brandName || "Brand basics"}</div>
                      <div className="text-sm text-white/70 truncate">{tagline || "Your tagline"}</div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="mt-3 w-full rounded-2xl px-4 py-3 text-base font-semibold relative overflow-hidden"
                    style={{
                      background: ctaBg,
                      color: ctaFg,
                      boxShadow: `0 18px 50px ${hexToRgba(accent, 0.25)}`,
                    }}
                  >
                    {shine ? (
                      <span
                        className="pointer-events-none absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(120deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.45) 40%, rgba(255,255,255,0.0) 70%)",
                          transform: "translateX(-70%)",
                          animation: "piqoShine 2.6s ease-in-out infinite",
                        }}
                      />
                    ) : null}
                    <span className="relative">
                      {appearance.ctaText?.trim() ? appearance.ctaText.trim() : "Tap to checkout"}
                    </span>
                  </button>

                  <style jsx>{`
                    @keyframes piqoShine {
                      0% {
                        transform: translateX(-80%);
                        opacity: 0;
                      }
                      20% {
                        opacity: 1;
                      }
                      50% {
                        transform: translateX(120%);
                        opacity: 1;
                      }
                      100% {
                        transform: translateX(120%);
                        opacity: 0;
                      }
                    }
                  `}</style>
                </div>
              </div>
            </section>

            {/* Next Button */}
            <div className="mt-6 flex justify-end">
              <motion.button
                type="button"
                onClick={() => setActiveTab("details")}
                className="inline-flex items-center gap-2 rounded-2xl border border-purple-500/30 bg-purple-500/20 px-6 py-3 text-sm font-semibold text-white transition-all shadow-lg shadow-purple-500/25 hover:bg-purple-500/30"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Next: Add details
                <motion.div
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.div>
              </motion.button>
            </div>
              </>
            )}

            {/* DETAILS TAB */}
            {activeTab === "details" && (
              <>
            {/* Notifications (new) */}
            <section className="rounded-3xl border border-white/12 bg-white/8 backdrop-blur-xl p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-white/90">
                  <ShieldCheck className="h-4 w-4" />
                  Notifications
                </div>
                <div className="text-[11px] text-white/70">
                  Creator alerts
                </div>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setNotifications((n) => ({ ...n, onOrders: !n.onOrders }))}
                  className="inline-flex items-center justify-between rounded-2xl border border-white/12 bg-black/30 px-4 py-3 text-sm text-white/85 hover:bg-white/10 transition"
                >
                  <span className="inline-flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Order paid
                  </span>
                  <span className="text-[11px] text-white/65">{notifications.onOrders ? "On" : "Off"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNotifications((n) => ({ ...n, onBookings: !n.onBookings }))}
                  className="inline-flex items-center justify-between rounded-2xl border border-white/12 bg-black/30 px-4 py-3 text-sm text-white/85 hover:bg-white/10 transition"
                >
                  <span className="inline-flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Booking created
                  </span>
                  <span className="text-[11px] text-white/65">{notifications.onBookings ? "On" : "Off"}</span>
                </button>

                <label className="grid gap-1 sm:col-span-2">
                  <span className="text-xs text-white/80">Optional SMS phone (later)</span>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
                    <input
                      value={notifications.smsPhone || ""}
                      onChange={(e) => setNotifications((n) => ({ ...n, smsPhone: e.target.value }))}
                      className="w-full rounded-2xl border border-white/12 bg-black/40 pl-11 pr-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                      placeholder="(555) 555-5555"
                      inputMode="tel"
                    />
                  </div>
                  <div className="text-[11px] text-white/65">
                    Saved now so when you add SMS later, it’s already in the creator’s config.
                  </div>
                </label>
              </div>
            </section>

            {/* Availability (new) */}
            <section className="rounded-3xl border border-white/12 bg-white/8 backdrop-blur-xl p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-white/90">
                  <Zap className="h-4 w-4" />
                  Business Hours
                  {mode === "services" && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full">
                      REQUIRED
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-white/70">
                  {showAvailability ? "For booking slots" : "Optional"}
                  {mode === "services" && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full">
                      REQUIRED
                    </span>
                  )}
                </div>

              {mode === "services" && (!availability || !availability.days || Object.values(availability.days).every((day: any) => !day?.enabled)) && (
                <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <p className="text-xs font-semibold text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    ⚠️ Enable at least one day below to allow bookings
                  </p>
                  <p className="text-[11px] text-amber-200/80 mt-1">
                    Without business hours, customers will see a "Contact for booking" message instead of available time slots.
                  </p>
                </div>
              )}
              </div>

              <div className="mt-2 text-xs text-white/80">
                Set weekly hours + rules. We’ll use this when we wire booking slots on <span className="text-white/90">/u/[handle]</span>.
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-xs text-white/80">Timezone</span>
                  <input
                    value={availability.timezone}
                    onChange={(e) => setAvailability((a) => ({ ...a, timezone: e.target.value }))}
                    className="rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                    placeholder="America/New_York"
                  />
                  <div className="text-[11px] text-white/65">IANA format (works well with calendars).</div>
                </label>

                <label className="grid gap-1">
                  <span className="text-xs text-white/80">Slot length</span>
                  <select
                    value={availability.slotMinutes}
                    onChange={(e) => setAvailability((a) => ({ ...a, slotMinutes: Number(e.target.value) }))}
                    className="w-full appearance-none rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white/90 outline-none focus:border-white/25"
                  >
                    {[15, 20, 30, 45, 60, 90, 120].map((m) => (
                      <option key={m} value={m}>
                        {m} minutes
                      </option>
                    ))}
                  </select>
                  <div className="text-[11px] text-white/65">Controls how bookings are generated.</div>
                </label>

                <label className="grid gap-1">
                  <span className="text-xs text-white/80">Buffer between bookings</span>
                  <select
                    value={availability.bufferMinutes}
                    onChange={(e) => setAvailability((a) => ({ ...a, bufferMinutes: Number(e.target.value) }))}
                    className="w-full appearance-none rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white/90 outline-none focus:border-white/25"
                  >
                    {[0, 5, 10, 15, 20, 30, 45, 60].map((m) => (
                      <option key={m} value={m}>
                        {m} minutes
                      </option>
                    ))}
                  </select>
                  <div className="text-[11px] text-white/65">Gives you reset time.</div>
                </label>

                <label className="grid gap-1">
                  <span className="text-xs text-white/80">Allow booking up to</span>
                  <select
                    value={availability.advanceDays}
                    onChange={(e) => setAvailability((a) => ({ ...a, advanceDays: Number(e.target.value) }))}
                    className="w-full appearance-none rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white/90 outline-none focus:border-white/25"
                  >
                    {[7, 14, 21, 30, 45, 60].map((d) => (
                      <option key={d} value={d}>
                        {d} days ahead
                      </option>
                    ))}
                  </select>
                  <div className="text-[11px] text-white/65">Stops people booking crazy far out.</div>
                </label>
              </div>

              <div className="mt-5 rounded-2xl border border-white/12 bg-black/30 p-4">
                <div className="text-xs font-semibold text-white/85">Weekly hours</div>
                <div className="mt-3 grid gap-2">
                  {WEEKDAYS.map((d) => {
                    const day = availability.days[d.id];
                    return (
                      <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/12 bg-black/35 px-3 py-2">
                        <button
                          type="button"
                          onClick={() => updateDay(d.id, { enabled: !day.enabled })}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition",
                            day.enabled
                              ? "border-white/30 bg-white/12 text-white/90"
                              : "border-white/12 bg-black/30 text-white/70 hover:bg-white/10"
                          )}
                        >
                          <span className="text-white/85">{d.label}</span>
                          <span className="text-[11px] text-white/65">{day.enabled ? "On" : "Off"}</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={day.start}
                            onChange={(e) => updateDay(d.id, { start: safeTime(e.target.value) })}
                            disabled={!day.enabled}
                            className={cn(
                              "rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-sm text-white/90 outline-none focus:border-white/25",
                              !day.enabled && "opacity-40"
                            )}
                          />
                          <span className="text-xs text-white/60">to</span>
                          <input
                            type="time"
                            value={day.end}
                            onChange={(e) => updateDay(d.id, { end: safeTime(e.target.value) })}
                            disabled={!day.enabled}
                            className={cn(
                              "rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-sm text-white/90 outline-none focus:border-white/25",
                              !day.enabled && "opacity-40"
                            )}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!showAvailability ? (
                  <div className="mt-3 text-[11px] text-white/65">
                    This matters most for <span className="text-white/85">Services</span> +{" "}
                    <span className="text-white/85">Booking</span> modes — but saving it now is still smart.
                  </div>
                ) : (
                  <div className="mt-3 text-[11px] text-white/65">
                    Next step: we’ll use this to generate selectable time slots + send booking notifications.
                  </div>
                )}
              </div>
            </section>

            {/* Social links */}
            <section className="rounded-3xl border border-white/12 bg-white/8 backdrop-blur-xl p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <Globe className="h-4 w-4" />
                Social + contact (optional)
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-xs text-white/80">Instagram</span>
                  <div className="relative">
                    <Instagram className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
                    <input
                      value={social.instagram || ""}
                      onChange={(e) => setSocial((s) => ({ ...s, instagram: e.target.value }))}
                      className="w-full rounded-2xl border border-white/12 bg-black/40 pl-11 pr-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                      placeholder="@yourpage"
                    />
                  </div>
                </label>

                <label className="grid gap-1">
                  <span className="text-xs text-white/80">TikTok</span>
                  <div className="relative">
                    <Sparkles className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
                    <input
                      value={social.tiktok || ""}
                      onChange={(e) => setSocial((s) => ({ ...s, tiktok: e.target.value }))}
                      className="w-full rounded-2xl border border-white/12 bg-black/40 pl-11 pr-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                      placeholder="@yourtiktok"
                    />
                  </div>
                </label>

                <label className="grid gap-1">
                  <span className="text-xs text-white/80">Website</span>
                  <div className="relative">
                    <Globe className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
                    <input
                      value={social.website || ""}
                      onChange={(e) => setSocial((s) => ({ ...s, website: e.target.value }))}
                      className="w-full rounded-2xl border border-white/12 bg-black/40 pl-11 pr-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                      placeholder="https://..."
                    />
                  </div>
                </label>

                <label className="grid gap-1">
                  <span className="text-xs text-white/80">Phone</span>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
                    <input
                      value={social.phone || ""}
                      onChange={(e) => setSocial((s) => ({ ...s, phone: e.target.value }))}
                      className="w-full rounded-2xl border border-white/12 bg-black/40 pl-11 pr-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                      placeholder="(555) 555-5555"
                      inputMode="tel"
                    />
                  </div>
                </label>

                <label className="grid gap-1 sm:col-span-2">
                  <span className="text-xs text-white/80">Address (for directions)</span>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
                    <input
                      value={social.address || ""}
                      onChange={(e) => setSocial((s) => ({ ...s, address: e.target.value }))}
                      className="w-full rounded-2xl border border-white/12 bg-black/40 pl-11 pr-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                      placeholder="123 Main St, City, ST"
                    />
                  </div>
                </label>

                <label className="grid gap-1 sm:col-span-2">
                  <span className="text-xs text-white/80">Contact Email</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
                    <input
                      type="email"
                      value={social.email || ""}
                      onChange={(e) => setSocial((s) => ({ ...s, email: e.target.value }))}
                      className="w-full rounded-2xl border border-white/12 bg-black/40 pl-11 pr-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                      placeholder="hello@yourbrand.com"
                    />
                  </div>
                </label>

                <label className="grid gap-1 sm:col-span-2">
                  <span className="text-xs text-white/80">Short Bio</span>
                  <textarea
                    value={social.bio || ""}
                    onChange={(e) => setSocial((s) => ({ ...s, bio: e.target.value }))}
                    rows={3}
                    className="w-full rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/25 resize-none"
                    placeholder="Tell customers about yourself or your business..."
                    maxLength={300}
                  />
                  <span className="text-[10px] text-white/50 text-right">{(social.bio || "").length}/300</span>
                </label>
              </div>

              <div className="mt-2 text-[11px] text-white/65">
                Add your bio and contact info to help customers learn more about you. This appears when they click the "About" button on your piqo.
              </div>
            </section>

            {/* Team Management - only for services */}
            {mode === "services" && (
              <section className="rounded-3xl border border-white/12 bg-white/8 backdrop-blur-xl p-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="inline-flex items-center gap-2 text-sm font-semibold text-white/90">
                    <Users className="h-4 w-4 text-blue-400" />
                    Team Members
                  </div>
                  <div className="text-[11px] text-white/70">{staffProfiles.length} added</div>
                </div>

                <div className="text-[11px] text-white/70 mb-3">
                  You can upload a photo for each team member by clicking their avatar. Photos are saved to your draft and will be included when you publish.
                </div>

                <div className="space-y-3">
                  {staffProfiles.map((staff, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-white/12 bg-black/30 p-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          {staff.photo ? (
                            <img
                              src={staff.photo}
                              alt={staff.name}
                              className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div
                              className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                              style={{ background: accentMode === "gradient" ? accentSolid : accent }}
                            >
                              {staff.name.charAt(0) || "?"}
                            </div>
                          )}

                          <input
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const f = e.target.files ? e.target.files[0] : null;
                              if (f) await onPickStaffPhoto(f, idx);
                            }}
                            className="absolute inset-0 h-10 w-10 opacity-0 cursor-pointer rounded-full"
                            aria-label={`Upload photo for ${staff.name}`}
                          />
                        </div>
                        <div className="grid gap-2 flex-1 min-w-0">
                          <div className="grid gap-2 sm:grid-cols-2">
                            <input
                              placeholder="Name"
                              value={staff.name}
                              onChange={(e) => updateStaff(idx, { name: e.target.value })}
                              className="rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-xs text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                            />
                            <input
                              placeholder="Role (e.g., Senior Barber)"
                              value={staff.role}
                              onChange={(e) => updateStaff(idx, { role: e.target.value })}
                              className="rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-xs text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                            />
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <input
                              placeholder="Rating (e.g., 4.9)"
                              value={staff.rating}
                              onChange={(e) => updateStaff(idx, { rating: e.target.value })}
                              className="rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-xs text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                            />
                            <input
                              placeholder="Specialties (comma separated)"
                              value={staff.specialties.join(", ")}
                              onChange={(e) => updateStaff(idx, { specialties: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                              className="rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-xs text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                            />
                          </div>
                          <textarea
                            placeholder="Short bio (e.g., Clean fades + sharp lineups. Fast hands, no wasted time.)"
                            value={staff.bio}
                            onChange={(e) => updateStaff(idx, { bio: e.target.value })}
                            className="rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-xs text-white/90 outline-none placeholder:text-white/40 focus:border-white/25 resize-none"
                            rows={2}
                          />
                          
                          {/* Per-Day Working Hours */}
                          <details className="mt-3 rounded-xl border border-white/12 bg-black/30">
                            <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-white/85 hover:bg-white/5">
                              📅 Working Days & Hours (optional)
                            </summary>
                            <div className="p-3 space-y-2">
                              <div className="text-[11px] text-white/60 mb-2">
                                Set specific working days for {staff.name || "this staff member"}. If not set, they work all business hours.
                              </div>
                              {!staff.workingDays && (
                                <button
                                  type="button"
                                  onClick={() => initStaffWorkingDays(idx)}
                                  className="w-full text-xs px-3 py-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
                                >
                                  ✨ Customize Working Schedule
                                </button>
                              )}
                              {staff.workingDays && WEEKDAYS.map((day) => {
                                const dayData = staff.workingDays![day.id];
                                return (
                                  <div key={day.id} className="flex items-center gap-2 rounded-lg border border-white/8 bg-black/20 px-2 py-1.5">
                                    <button
                                      type="button"
                                      onClick={() => updateStaffWorkingDay(idx, day.id, { enabled: !dayData.enabled })}
                                      className={cn(
                                        "text-[10px] px-2 py-1 rounded-full border transition",
                                        dayData.enabled
                                          ? "border-white/20 bg-white/10 text-white/85"
                                          : "border-white/10 bg-black/20 text-white/50"
                                      )}
                                    >
                                      {day.label}
                                    </button>
                                    <input
                                      type="time"
                                      value={dayData.start}
                                      onChange={(e) => updateStaffWorkingDay(idx, day.id, { start: e.target.value })}
                                      disabled={!dayData.enabled}
                                      className="flex-1 rounded border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-white/80 disabled:opacity-40"
                                    />
                                    <span className="text-[10px] text-white/50">to</span>
                                    <input
                                      type="time"
                                      value={dayData.end}
                                      onChange={(e) => updateStaffWorkingDay(idx, day.id, { end: e.target.value })}
                                      disabled={!dayData.enabled}
                                      className="flex-1 rounded border border-white/10 bg-black/30 px-2 py-1 text-[11px] text-white/80 disabled:opacity-40"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </details>
                          
                          <div className="mt-2 grid gap-2 sm:grid-cols-3">
                            <input
                              type="time"
                              value={staff.availability?.start || "09:00"}
                              onChange={(e) => updateStaff(idx, { availability: { ...(staff.availability || {}), start: e.target.value } })}
                              className="rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-xs text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                            />
                            <input
                              type="time"
                              value={staff.availability?.end || "17:00"}
                              onChange={(e) => updateStaff(idx, { availability: { ...(staff.availability || {}), end: e.target.value } })}
                              className="rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-xs text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                            />
                            <input
                              type="number"
                              min={5}
                              max={240}
                              value={staff.availability?.slotMinutes || 60}
                              onChange={(e) => updateStaff(idx, { availability: { ...(staff.availability || {}), slotMinutes: Number(e.target.value) } })}
                              className="rounded-xl border border-white/12 bg-black/40 px-3 py-2 text-xs text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                              placeholder="Slot minutes"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeStaff(idx)}
                          className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition flex-shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addStaff}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-black/30 px-4 py-3 text-sm text-white/85 hover:bg-white/10 transition"
                  >
                    <Plus className="h-4 w-4" />
                    Add Team Member
                  </button>
                </div>

                <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
                  <div className="text-xs text-blue-200/90">
                    💡 <span className="font-medium">Tip:</span> Team members show on your services storefront when "Staff / team section" is enabled in Style → Sections.
                  </div>
                </div>
              </section>
            )}

            {/* Next Button */}
            <div className="mt-6 flex justify-end">
              <motion.button
                type="button"
                onClick={() => setActiveTab("payment")}
                className="inline-flex items-center gap-2 rounded-2xl border border-green-500/30 bg-green-500/20 px-6 py-3 text-sm font-semibold text-white transition-all shadow-lg shadow-green-500/25 hover:bg-green-500/30"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Next: Setup payment
                <motion.div
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.div>
              </motion.button>
            </div>
              </>
            )}

            {/* PAYMENT TAB */}
            {activeTab === "payment" && (
              <>
            {/* Stripe Connect */}
            <section className="rounded-3xl border border-white/12 bg-white/8 backdrop-blur-xl p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-white/90">
                  <CreditCard className="h-4 w-4" />
                  Get paid (Stripe)
                </div>

                <div
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold",
                    stripeBadge.tone === "good"
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-50"
                      : stripeBadge.tone === "warn"
                      ? "border-amber-400/30 bg-amber-500/10 text-amber-50"
                      : "border-white/12 bg-black/35 text-white/80"
                  )}
                  title="Stripe Connect status"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {stripeBadge.label}
                </div>
              </div>

              <div className="mt-2 text-xs text-white/80">
                Connect Stripe once so customers can pay you directly when someone checks out on{" "}
                <span className="text-white/90">/u/{cleanHandle || "handle"}</span>.
              </div>

              {stripeErr ? (
                <div className="mt-4 rounded-2xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-50">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4" />
                    <div className="min-w-0">
                      <div className="font-semibold">Stripe error</div>
                      <div className="mt-1 text-red-50/90">{stripeErr}</div>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={startStripeConnect}
                  disabled={stripeLoading || !cleanHandle}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-black transition active:scale-[0.99]",
                    stripeLoading || !cleanHandle ? "bg-white/80" : "bg-white hover:bg-white/90"
                  )}
                >
                  <LinkIcon className="h-4 w-4" />
                  {stripeLoading ? "Working…" : "Connect Stripe"}
                </button>

                <button
                  type="button"
                  onClick={() => fetchStripeStatus(cleanHandle)}
                  disabled={stripeLoading || !cleanHandle}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/8 backdrop-blur-xl px-4 py-3 text-sm font-semibold text-white/90 hover:bg-white/12 transition"
                >
                  <ExternalLink className="h-4 w-4" />
                  Refresh status
                </button>
              </div>

              {stripeStatus?.dashboard_url ? (
                <div className="mt-3 text-[11px] text-white/75">
                  <a
                    href={stripeStatus.dashboard_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/35 px-3 py-1 hover:bg-white/10 transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open Stripe dashboard
                  </a>
                </div>
              ) : null}

              <div className="mt-3 text-[11px] text-white/70">
                If checkout says “creator is not connected to Stripe yet”, that’s correct until they finish onboarding.
              </div>
            </section>

            {/* Completion Button */}
            <div className="mt-6 flex justify-center">
              <motion.button
                type="button"
                onClick={async () => {
                  if (!cleanHandle) return;
                  setSaving(true);
                  setErr(null);
                  try {
                    // ✅ For NEW piqos: ONLY publish (which will save + set user_id)
                    // ✅ For EXISTING piqos: Save draft first, then publish
                    if (configDraft && isEditMode) {
                      const save = await postJson('/api/site', configDraft);
                      if (!save.res.ok) {
                        const detail = String(save?.data?.detail || save?.data?.error || '').trim();
                        throw new Error(detail || 'Failed to save draft before publish.');
                      }
                    }

                    // Call publish endpoint - this sets user_id for new piqos
                    const res = await fetch('/api/site/publish', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      credentials: 'include',
                      body: JSON.stringify({ 
                        handle: cleanHandle,
                        config: !isEditMode ? configDraft : undefined // Pass config for new piqos
                      })
                    });
                    const data = await res.json();
                    if (!res.ok || !data.ok) {
                      setErr(data.error || 'Failed to publish site.');
                    } else {
                      setPreviewOn(true);
                      try {
                        if (typeof window !== "undefined") {
                          try {
                            // ensure latest draft is saved locally so preview shows current state
                            if (configDraft) localStorage.setItem(storageKey(cleanHandle), JSON.stringify(configDraft));
                          } catch {}
                        }
                      } catch {}
                      
                      // Show publishing state, then redirect to dashboard
                      setToast("Publishing…");
                      
                      // Ensure publish completes before redirecting
                      await new Promise(resolve => setTimeout(resolve, 1200));
                      
                      // Redirect to dashboard where the new Piqo will appear
                      // Force a full page reload to ensure fresh data
                      if (typeof window !== 'undefined') {
                        window.location.href = '/dashboard';
                      } else {
                        router.push(`/dashboard`);
                        router.refresh();
                      }
                    }
                  } catch (e) {
                    setErr(typeof e === 'object' && e !== null && 'message' in e ? (e as any).message : 'Failed to publish site.');
                  } finally {
                    setSaving(false);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/20 px-8 py-4 text-base font-semibold text-white transition-all shadow-lg shadow-emerald-500/25 hover:bg-emerald-500/30"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🚀
                </motion.div>
                Go live
              </motion.button>
            </div>
              </>
            )}

          </div>

          {/* RIGHT - Fixed Preview */}
          <div 
            className="hidden md:block w-[400px] lg:w-[500px] fixed right-4 lg:right-[max(1rem,calc((100%-80rem)/2))] z-30"
            style={{
              top: '1rem',
              height: 'calc(100vh - 2rem)',
              overflowY: 'auto'
            }}
          >
            <div className="space-y-4 pr-4">
            
            {/* Live Preview - Always visible and sticky */}
            <section className="rounded-3xl border border-white/12 bg-white/8 backdrop-blur-xl p-4 relative overflow-hidden lg:h-fit">
              {/* Animated background glow */}
              <motion.div
                className="absolute inset-0 opacity-30 pointer-events-none"
                style={{
                  background: "radial-gradient(circle at 50% 50%, rgba(34,211,238,0.15), transparent 70%)",
                }}
                animate={{
                  opacity: [0.2, 0.4, 0.2],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              <div className="flex items-center justify-between gap-3 relative z-10 mb-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Sparkles className="h-4 w-4 text-cyan-400" />
                  </motion.div>
                  Live preview
                </div>
                
                {/* Preview Controls */}
                <div className="flex items-center gap-1.5">
                  <motion.button
                    type="button"
                    onClick={randomizeTheme}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-purple-500/30 backdrop-blur-xl px-2.5 py-1.5 text-xs font-semibold transition relative overflow-hidden"
                    style={{
                      background: "linear-gradient(135deg, rgba(167,139,250,0.2), rgba(244,114,182,0.2))",
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Randomize style"
                  >
                    <motion.div
                      animate={{ rotate: [0, 180, 360] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="h-3 w-3" />
                    </motion.div>
                    🎲
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={() => setPreviewOn((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 backdrop-blur-xl px-2.5 py-1.5 text-xs font-semibold transition relative overflow-hidden"
                    style={{
                      background: previewOn
                        ? "linear-gradient(135deg, rgba(34,211,238,0.25), rgba(52,211,153,0.25))"
                        : "rgba(255,255,255,0.08)",
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Toggle preview"
                  >
                    <Smartphone className="h-3 w-3" />
                    {previewOn ? "On" : "Off"}
                  </motion.button>

                  <motion.button
                    type="button"
                    onClick={() => setShowQr((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/8 backdrop-blur-xl px-2.5 py-1.5 text-xs font-semibold hover:bg-white/12 transition"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="QR code"
                  >
                    <QrCode className="h-3 w-3" />
                    QR
                  </motion.button>
                </div>
                <motion.div 
                  className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] text-cyan-200"
                  animate={previewOn ? {
                    boxShadow: ["0 0 8px rgba(34,211,238,0.2)", "0 0 16px rgba(34,211,238,0.4)", "0 0 8px rgba(34,211,238,0.2)"],
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                    animate={previewOn ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  {previewOn ? "Live" : "Paused"}
                </motion.div>
              </div>

              {/* Phone frame */}
              <div className="relative z-10">
                <motion.div 
                  className="rounded-[24px] p-0.5 relative"
                  style={{
                    background: "linear-gradient(135deg, rgba(34,211,238,0.3), rgba(167,139,250,0.3), rgba(244,114,182,0.3))",
                  }}
                >
                  <div className="rounded-[22px] border border-white/12 bg-black/80 p-1.5">
                    <div className="relative overflow-hidden rounded-[18px] border border-white/12 bg-black shadow-2xl">
                      {/* Phone header bar */}
                      <div className="flex items-center justify-between px-3 py-2 text-[10px] text-white/80 border-b border-white/10 bg-gradient-to-r from-black/90 via-black/70 to-black/90">
                        <span className="inline-flex items-center gap-1.5 truncate">
                          <Sparkles className="h-3 w-3 text-cyan-400" />
                          <span className="font-medium truncate max-w-[120px]">{brandName || "Your Store"}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <motion.div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: previewOn ? "#34d399" : "#6b7280" }}
                            animate={previewOn ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ duration: 1, repeat: Infinity }}
                          />
                          <span className="text-white/50 text-[9px]">{previewOn ? "live" : "off"}</span>
                        </div>
                      </div>

                      {/* Notch */}
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-b-xl z-10" />

                      {previewOn ? (
                        <motion.div
                          key={previewTick}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="relative mx-auto w-full h-[600px] overflow-hidden"
                        >
                          {/* Phone frame with glass effect */}
                          <div className="rounded-[28px] border border-white/12 bg-black/45 p-3 h-full">
                            <div className="relative overflow-hidden rounded-[28px] border border-white/12 bg-black h-full flex flex-col">
                              {/* Header bar */}
                              <div className="flex items-center justify-between px-4 py-2 text-[11px] text-white/80 border-b border-white/10 bg-black/70 flex-shrink-0">
                                <span className="inline-flex items-center gap-2">
                                  <Sparkles className="h-3.5 w-3.5" />
                                  Live • {mode}
                                </span>
                                <span className="text-white/60">{brandName || "Brand basics"}</span>
                              </div>

                              {/* Screen content - scrollable */}
                              <div className="relative overflow-y-scroll scrollbar-hide flex-1" style={{ ...previewStyle, fontFamily: previewFontFamily }}>
                                {/* Header - conditional hero vs minimal */}
                                {headerStyle === "hero" ? (
                                  <motion.div
                                    key={`hero-${mode}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="relative h-40 overflow-hidden"
                                    style={{
                                      background: headerBg,
                                    }}
                                  >
                                  {/* Shimmer overlay */}
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

                                  {/* Logo - centered top */}
                                  <div className="absolute top-0 left-0 right-0 flex justify-center pt-1">
                                    <motion.div
                                      initial={{ scale: 0.8, opacity: 0, y: -10 }}
                                      animate={{ scale: 1, opacity: 1, y: 0 }}
                                      transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                                      className={cn(
                                        "h-20 w-20 border-2 border-white/30 bg-black/40 backdrop-blur-sm grid place-items-center overflow-hidden shadow-xl",
                                        logoRound
                                      )}
                                      style={{
                                        boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1) inset"
                                      }}
                                    >
                                      {brandLogo ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={brandLogo}
                                          alt="Logo"
                                          className={cn(
                                            "h-full w-full",
                                            logoFit === "cover" ? "object-cover" : "object-contain p-2"
                                          )}
                                        />
                                      ) : (
                                        <Sparkles className="h-8 w-8 text-white/70" />
                                      )}
                                    </motion.div>
                                  </div>

                                  {/* Brand name & tagline */}
                                  <div className="absolute bottom-1.5 left-3 right-3 text-center">
                                    <motion.h2
                                      initial={{ y: 10, opacity: 0 }}
                                      animate={{ y: 0, opacity: 1 }}
                                      transition={{ delay: 0.2 }}
                                      className="text-xl font-bold text-white mb-0.5 truncate drop-shadow-lg"
                                    >
                                      {brandName || "Your Brand"}
                                    </motion.h2>
                                    <motion.p
                                      initial={{ y: 10, opacity: 0 }}
                                      animate={{ y: 0, opacity: 1 }}
                                      transition={{ delay: 0.3 }}
                                      className="text-white/90 text-sm font-medium truncate drop-shadow"
                                    >
                                      {tagline || "Your tagline here"}
                                    </motion.p>
                                  </div>
                                </motion.div>
                                ) : (
                                  <motion.div
                                    key={`minimal-${mode}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.1 }}
                                    className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white"
                                  >
                                    <div
                                      className={cn(
                                        "h-12 w-12 border border-gray-200 bg-gray-50 grid place-items-center overflow-hidden shadow-sm",
                                        logoRound
                                      )}
                                    >
                                      {brandLogo ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          src={brandLogo}
                                          alt="Logo"
                                          className={cn(
                                            "h-full w-full",
                                            logoFit === "cover" ? "object-cover" : "object-contain p-1.5"
                                          )}
                                        />
                                      ) : (
                                        <Sparkles className="h-5 w-5 text-gray-400" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h2 className="text-base font-bold text-gray-900 truncate">
                                        {brandName || "Your Brand"}
                                      </h2>
                                      <p className="text-xs text-gray-500 truncate">
                                        {tagline || "Your tagline here"}
                                      </p>
                                    </div>
                                  </motion.div>
                                )}

                                {/* Items list */}
                                <div className="px-3 pb-4 space-y-2.5 bg-gradient-to-b from-gray-50 to-white">
                                  <motion.div
                                    key={`list-${mode}-${appearance.layout || "cards"}`}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                  >
                                    <div className="flex items-center justify-between pt-3 pb-2">
                                      <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                                        {mode === "services"
                                          ? "⚡ Services"
                                          : mode === "products"
                                            ? "🔥 Items"
                                            : "💎 Digital"}
                                      </h3>
                                      <span className="text-[9px] text-gray-500 font-medium">{items.length} items</span>
                                    </div>

                                    {/* Tiles layout - 2 column grid */}
                                    {(appearance.layout || "cards") === "tiles" ? (
                                      <div className="grid grid-cols-2 gap-2">
                                        {items.map((item, idx) => {
                                          // Section header for tiles layout
                                          if (item.type === "section") {
                                            return (
                                              <div key={idx} className="col-span-2 my-3 first:mt-1">
                                                <div className="flex items-center gap-2 px-1">
                                                  <div className="h-[2px] w-8" style={{ background: accentSolid }} />
                                                  <h3 className="text-[11px] font-black uppercase tracking-wider" style={{ color: accentSolid }}>
                                                    {item.title || "SECTION"}
                                                  </h3>
                                                  <div className="h-[2px] flex-1" style={{ background: `linear-gradient(90deg, ${accentSolid}, transparent)` }} />
                                                </div>
                                              </div>
                                            );
                                          }
                                          
                                          // Subsection for tiles layout
                                          if (item.type === "subsection") {
                                            return (
                                              <div key={idx} className="col-span-2 my-2 first:mt-1 ml-2">
                                                <div className="flex items-center gap-2 px-1">
                                                  <div className="h-[1.5px] w-6" style={{ background: `${accentSolid}80` }} />
                                                  <h4 className="text-[10px] font-bold uppercase tracking-wide" style={{ color: `${accentSolid}cc` }}>
                                                    {item.title || "Subsection"}
                                                  </h4>
                                                  <div className="h-[1.5px] flex-1" style={{ background: `linear-gradient(90deg, ${hexToRgba(accentSolid, 0.5)}, transparent)` }} />
                                                </div>
                                              </div>
                                            );
                                          }
                                          
                                          return (
                                          <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.5 + idx * 0.1 }}
                                            className="overflow-hidden border shadow-sm hover:shadow-md transition-all group relative"
                                            style={{
                                              borderRadius: `${cardRadius}px`,
                                              borderColor: `${accentSolid}40`,
                                              background: `linear-gradient(135deg, white 0%, ${hexToRgba(accentSolid, 0.05)} 100%)`,
                                            }}
                                          >
                                            {/* Item Image or Icon */}
                                            <div className="relative h-16 overflow-hidden bg-gray-100">
                                              {item.image ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={item.image} alt={item.title || "Item"} className="w-full h-full object-cover" />
                                              ) : (
                                                <motion.div
                                                  className="relative w-full h-full flex items-center justify-center text-lg relative overflow-hidden"
                                                  style={{
                                                    background: `linear-gradient(135deg, ${accentSolid}, ${hexToRgba(accentSolid, 0.6)})`,
                                                  }}
                                                  whileHover={{ scale: 1.05 }}
                                                  transition={{ duration: 0.2 }}
                                                >
                                                  {/* Shimmer */}
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
                                                  <div className="text-white relative z-10">
                                                    {mode === "services" ? "✂️" : mode === "products" ? "🛍️" : "⚡"}
                                                  </div>
                                                </motion.div>
                                              )}
                                              
                                              {/* Badge */}
                                              {item.badge && item.badge !== "none" && (
                                                <motion.div
                                                  initial={{ scale: 0.8, opacity: 0 }}
                                                  animate={{ scale: 1, opacity: 1 }}
                                                  className="absolute top-1 right-1 rounded px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wide shadow-lg"
                                                  style={{
                                                    background: item.badge === "popular" 
                                                      ? "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 50%, #fa8231 100%)"
                                                      : "linear-gradient(135deg, #ffd32a 0%, #ff9f1a 50%, #f39c12 100%)",
                                                    color: item.badge === "popular" ? "white" : "#1a1a1a",
                                                  }}
                                                >
                                                  {item.badge === "popular" ? "🔥" : "⚡"}
                                                </motion.div>
                                              )}
                                            </div>

                                            <div className="p-2">
                                              <div className="text-[10px] font-bold text-gray-900 truncate mb-1">{item.title || "Item"}</div>
                                              {item.note && (
                                                <div className="text-[8px] text-gray-600 truncate mb-1 leading-tight">{item.note}</div>
                                              )}
                                              <div className="text-[9px] font-bold mb-1.5" style={{ color: accentSolid }}>{item.price || "$0"}</div>
                                              <button
                                                className="w-full py-1 text-[8px] font-bold relative overflow-hidden"
                                                style={{
                                                  backgroundColor: ctaBg,
                                                  color: ctaFg,
                                                  borderRadius: `${Math.min(cardRadius * 0.5, 8)}px`,
                                                }}
                                              >
                                                {shine && (
                                                  <span
                                                    className="pointer-events-none absolute inset-0"
                                                    style={{
                                                      background: "linear-gradient(120deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.45) 40%, rgba(255,255,255,0.0) 70%)",
                                                      transform: "translateX(-70%)",
                                                      animation: "piqoShine 2.6s ease-in-out infinite",
                                                    }}
                                                  />
                                                )}
                                                <span className="relative">
                                                  {appearance.ctaText?.trim() || (mode === "services" ? "Book" : mode === "products" ? "Add" : "Get")}
                                                </span>
                                              </button>
                                            </div>
                                          </motion.div>
                                        )})}
                                      </div>
                                    ) : (appearance.layout || "cards") === "menu" ? (
                                      /* Menu layout - compact rows */
                                      <div className="space-y-1.5">
                                        {items.map((item, idx) => {
                                          // Section header for menu layout
                                          if (item.type === "section") {
                                            return (
                                              <div key={idx} className="my-3 first:mt-1">
                                                <div className="flex items-center gap-2 px-1">
                                                  <div className="h-[2px] w-8" style={{ background: accentSolid }} />
                                                  <h3 className="text-[11px] font-black uppercase tracking-wider" style={{ color: accentSolid }}>
                                                    {item.title || "SECTION"}
                                                  </h3>
                                                  <div className="h-[2px] flex-1" style={{ background: `linear-gradient(90deg, ${accentSolid}, transparent)` }} />
                                                </div>
                                              </div>
                                            );
                                          }
                                          
                                          // Subsection for menu layout
                                          if (item.type === "subsection") {
                                            return (
                                              <div key={idx} className="my-2 first:mt-1 ml-2">
                                                <div className="flex items-center gap-2 px-1">
                                                  <div className="h-[1.5px] w-6" style={{ background: `${accentSolid}80` }} />
                                                  <h4 className="text-[10px] font-bold uppercase tracking-wide" style={{ color: `${accentSolid}cc` }}>
                                                    {item.title || "Subsection"}
                                                  </h4>
                                                  <div className="h-[1.5px] flex-1" style={{ background: `linear-gradient(90deg, ${hexToRgba(accentSolid, 0.5)}, transparent)` }} />
                                                </div>
                                              </div>
                                            );
                                          }
                                          
                                          return (
                                          <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 + idx * 0.1 }}
                                            className="flex items-center justify-between p-2 border hover:shadow-sm transition-all group"
                                            style={{
                                              borderRadius: `${cardRadius}px`,
                                              borderColor: `${accentSolid}40`,
                                              background: `linear-gradient(135deg, white 0%, ${hexToRgba(accentSolid, 0.05)} 100%)`,
                                            }}
                                          >
                                            <div className="flex-1 min-w-0">
                                              <div className="text-[10px] font-bold text-gray-900 truncate">{item.title || "Item"}</div>
                                              {item.note && <div className="text-[8px] text-gray-600 truncate mt-0.5">{item.note}</div>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <div className="text-[10px] font-bold" style={{ color: accentSolid }}>{item.price || "$0"}</div>
                                              <button
                                                className="px-2 py-1 text-[8px] font-bold relative overflow-hidden"
                                                style={{
                                                  backgroundColor: ctaBg,
                                                  color: ctaFg,
                                                  borderRadius: `${Math.min(cardRadius * 0.5, 8)}px`,
                                                }}
                                              >
                                                {shine && (
                                                  <span
                                                    className="pointer-events-none absolute inset-0"
                                                    style={{
                                                      background: "linear-gradient(120deg, rgba(255,255,255,0.0) 0%, rgba(255,255,255,0.45) 40%, rgba(255,255,255,0.0) 70%)",
                                                      transform: "translateX(-70%)",
                                                      animation: "piqoShine 2.6s ease-in-out infinite",
                                                    }}
                                                  />
                                                )}
                                                <span className="relative">
                                                  {appearance.ctaText?.trim() || (mode === "services" ? "Book" : mode === "products" ? "Add" : "Get")}
                                                </span>
                                              </button>
                                            </div>
                                          </motion.div>
                                        )})}
                                      </div>
                                    ) : (
                                      /* Cards layout - default */
                                      <>
                                        {items.map((item, idx) => {
                                          // Section header for cards layout
                                          if (item.type === "section") {
                                            return (
                                              <div key={idx} className="my-3 first:mt-1">
                                                <div className="flex items-center gap-2 px-1">
                                                  <div className="h-[2px] w-8" style={{ background: accentSolid }} />
                                                  <h3 className="text-[11px] font-black uppercase tracking-wider" style={{ color: accentSolid }}>
                                                    {item.title || "SECTION"}
                                                  </h3>
                                                  <div className="h-[2px] flex-1" style={{ background: `linear-gradient(90deg, ${accentSolid}, transparent)` }} />
                                                </div>
                                              </div>
                                            );
                                          }
                                          
                                          // Subsection for cards layout
                                          if (item.type === "subsection") {
                                            return (
                                              <div key={idx} className="my-2 first:mt-1 ml-2">
                                                <div className="flex items-center gap-2 px-1">
                                                  <div className="h-[1.5px] w-6" style={{ background: `${accentSolid}80` }} />
                                                  <h4 className="text-[10px] font-bold uppercase tracking-wide" style={{ color: `${accentSolid}cc` }}>
                                                    {item.title || "Subsection"}
                                                  </h4>
                                                  <div className="h-[1.5px] flex-1" style={{ background: `linear-gradient(90deg, ${hexToRgba(accentSolid, 0.5)}, transparent)` }} />
                                                </div>
                                              </div>
                                            );
                                          }
                                          
                                          return (
                                      <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 + idx * 0.1 }}
                                        className="mb-2 overflow-hidden border shadow-sm hover:shadow-md transition-all group relative"
                                        style={{
                                          borderRadius: `${cardRadius}px`,
                                          borderColor: `${accentSolid}40`,
                                          background: `linear-gradient(135deg, white 0%, ${hexToRgba(accentSolid, 0.05)} 100%)`,
                                        }}
                                      >
                                        <div className="flex gap-2 p-2 relative z-10">
                                          {/* Item image or icon */}
                                          <motion.div
                                            className="w-14 h-14 rounded-lg flex-shrink-0 relative overflow-hidden shadow-sm"
                                            style={{
                                              background: item.image ? "transparent" : `linear-gradient(135deg, ${accentSolid}, ${hexToRgba(accentSolid, 0.6)})`,
                                            }}
                                            whileHover={{ scale: 1.05 }}
                                            transition={{ duration: 0.2 }}
                                          >
                                            {item.image ? (
                                              // eslint-disable-next-line @next/next/no-img-element
                                              <img src={item.image} alt={item.title || "Item"} className="w-full h-full object-cover" />
                                            ) : (
                                              <>
                                                {/* Shimmer */}
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
                                                <div className="w-full h-full flex items-center justify-center text-xl relative z-10">
                                                  {mode === "services" ? "✂️" : mode === "products" ? "🛍️" : "⚡"}
                                                </div>
                                              </>
                                            )}
                                          </motion.div>
                                          
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-0.5 gap-1">
                                              <div className="flex items-center gap-1.5 min-w-0">
                                                <h4 className="font-bold text-gray-900 text-xs leading-tight truncate">
                                                  {item.title || "Item"}
                                                </h4>
                                                {item.badge && item.badge !== "none" && (
                                                  <motion.span
                                                    initial={{ scale: 0.8, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wide flex-shrink-0 shadow-lg relative overflow-hidden"
                                                    style={{
                                                      background: item.badge === "popular" 
                                                        ? "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 50%, #fa8231 100%)"
                                                        : "linear-gradient(135deg, #ffd32a 0%, #ff9f1a 50%, #f39c12 100%)",
                                                      color: item.badge === "popular" ? "white" : "#1a1a1a",
                                                      boxShadow: item.badge === "popular"
                                                        ? "0 2px 8px rgba(238, 90, 36, 0.5), inset 0 1px 0 rgba(255,255,255,0.3)"
                                                        : "0 2px 8px rgba(255, 159, 26, 0.5), inset 0 1px 0 rgba(255,255,255,0.4)",
                                                    }}
                                                  >
                                                    <span className="relative z-10 flex items-center gap-0.5">
                                                      {item.badge === "popular" ? "🔥" : "⚡"} {item.badge === "popular" ? "Hot" : "New"}
                                                    </span>
                                                  </motion.span>
                                                )}
                                              </div>
                                              <span
                                                className="font-bold text-xs flex-shrink-0"
                                                style={{ color: accentSolid }}
                                              >
                                                {item.price || "$0"}
                                              </span>
                                            </div>
                                            {item.note && (
                                              <p className="text-[9px] text-gray-600 mb-1.5 leading-relaxed font-semibold">
                                                {item.note}
                                              </p>
                                            )}
                                            <motion.button
                                              className="w-full py-1.5 text-[10px] font-black shadow-md relative overflow-hidden"
                                              style={{
                                                background: ctaBg,
                                                color: ctaFg,
                                                borderRadius: `${Math.min(cardRadius * 0.6, 12)}px`,
                                              }}
                                              whileHover={{ scale: 1.05 }}
                                              whileTap={{ scale: 0.95 }}
                                            >
                                              {shine && (
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
                                              )}
                                              <span className="relative z-10">
                                                {appearance.ctaText?.trim() || (mode === "services" ? "Book" : mode === "products" ? "Add" : "Get")}
                                              </span>
                                            </motion.button>
                                          </div>
                                        </div>
                                      </motion.div>
                                    )})}
                                      </>
                                    )}
                                  </motion.div>

                                  {/* Social + Contact Buttons Section - for all modes */}
                                  {(appearance.showSocials ?? true) && (social.instagram || social.tiktok || social.website || social.phone || social.address) && (
                                    <div className="px-3 pb-3 bg-gray-50">
                                      <div className="pt-3 pb-2">
                                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                                          📞 Get in Touch
                                        </h3>
                                      </div>
                                      
                                      <div className="flex flex-wrap gap-1.5">
                                        {social.instagram && (
                                          <button 
                                            className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[8px] font-bold"
                                            style={{ borderRadius: `${Math.min(cardRadius * 0.5, 8)}px` }}
                                          >
                                            📷 Instagram
                                          </button>
                                        )}
                                        {social.tiktok && (
                                          <button 
                                            className="flex items-center gap-1 px-2 py-1 bg-black text-white text-[8px] font-bold"
                                            style={{ borderRadius: `${Math.min(cardRadius * 0.5, 8)}px` }}
                                          >
                                            🎵 TikTok
                                          </button>
                                        )}
                                        {social.website && (
                                          <button 
                                            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-[8px] font-bold"
                                            style={{ borderRadius: `${Math.min(cardRadius * 0.5, 8)}px` }}
                                          >
                                            🌐 Website
                                          </button>
                                        )}
                                        {social.phone && (
                                          <button 
                                            className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-[8px] font-bold"
                                            style={{ borderRadius: `${Math.min(cardRadius * 0.5, 8)}px` }}
                                          >
                                            📞 Call
                                          </button>
                                        )}
                                        {social.address && (
                                          <button 
                                            className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-[8px] font-bold"
                                            style={{ borderRadius: `${Math.min(cardRadius * 0.5, 8)}px` }}
                                          >
                                            📍 Directions
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Staff/Team Section - only for services */}
                                  {mode === "services" && (appearance.showStaff ?? true) && staffProfiles.length > 0 && (
                                    <div className="px-3 pb-4 bg-gradient-to-b from-white to-gray-50">
                                      <div className="flex items-center justify-between pt-3 pb-2">
                                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                                          👥 Our Team
                                        </h3>
                                        <span className="text-[9px] text-gray-500 font-medium">{staffProfiles.length} staff</span>
                                      </div>

                                      <div className="space-y-2">
                                        {staffProfiles.slice(0, 2).map((staff, idx) => (
                                          <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.6 + idx * 0.1 }}
                                            className="rounded-lg border p-2 bg-white shadow-sm"
                                            style={{
                                              borderRadius: `${cardRadius}px`,
                                              borderColor: `${appearance.accent || "#22D3EE"}30`,
                                            }}
                                          >
                                            <div className="flex items-center gap-2">
                                              <div 
                                                className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-xs"
                                                style={{ background: accentSolid }}
                                              >
                                                {staff.name.charAt(0)}
                                              </div>
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1">
                                                  <span className="text-[10px] font-bold text-gray-900 truncate">{staff.name}</span>
                                                  <span className="text-[8px] text-yellow-600">⭐ {staff.rating}</span>
                                                </div>
                                                <div className="text-[8px] text-gray-600 truncate">{staff.role} • {staff.specialties.slice(0, 2).join(", ")}</div>
                                              </div>
                                              <button
                                                className="px-2 py-1 text-[8px] font-bold text-white"
                                                style={{ 
                                                  backgroundColor: accentSolid,
                                                  borderRadius: `${Math.min(cardRadius * 0.5, 8)}px`,
                                                }}
                                              >
                                                Book
                                              </button>
                                            </div>
                                          </motion.div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Business Hours Section - optional for all modes */}
                                  {(appearance.showHours ?? false) && availability?.days && (
                                    <div className="px-3 pb-3 bg-gray-50">
                                      <div className="pt-3 pb-2">
                                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                                          🕐 Hours
                                        </h3>
                                      </div>
                                      
                                      <div className="space-y-1">
                                        {/* Show enabled weekdays */}
                                        {Object.entries(availability.days)
                                          .filter(([_, day]) => day.enabled)
                                          .slice(0, 3)
                                          .length > 0 ? (
                                            Object.entries(availability.days)
                                              .filter(([_, day]) => day.enabled)
                                              .slice(0, 3)
                                              .map(([dayId, day], idx) => (
                                                <div key={dayId} className="flex justify-between items-center text-[9px]">
                                                  <span className="text-gray-700 font-semibold capitalize">
                                                    {dayId === 'tue' ? 'Tue' : dayId === 'thu' ? 'Thu' : dayId.charAt(0).toUpperCase() + dayId.slice(1)}
                                                  </span>
                                                  <span className="text-gray-600">
                                                    {day.start} - {day.end}
                                                  </span>
                                                </div>
                                              ))
                                        ) : (
                                          <div className="flex justify-between items-center text-[9px]">
                                            <span className="text-gray-700 font-semibold">Hours</span>
                                            <span className="text-gray-500">Set in Details tab</span>
                                          </div>
                                        )}
                                        
                                        {/* Show relevant info based on mode */}
                                        <div className="flex justify-between items-center text-[8px] pt-1 border-t border-gray-200">
                                          <span className="text-gray-500">
                                            {mode === "services" 
                                              ? `${availability.slotMinutes}min slots • ${availability.advanceDays} days ahead`
                                              : `Open ${availability.advanceDays} days a week`
                                            }
                                          </span>
                                          <span 
                                            className="px-1.5 py-0.5 bg-green-100 text-green-700 font-bold rounded"
                                            style={{ borderRadius: `${Math.min(cardRadius * 0.3, 4)}px` }}
                                          >
                                            {mode === "services" ? "BOOKABLE" : "OPEN"}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Powered by Piqo Footer */}
                                  {(appearance.showPoweredBy ?? true) && (
                                    <div className="px-3 py-2 bg-gray-100 text-center">
                                      <div className="text-[8px] text-gray-500 font-medium">
                                        Powered by{" "}
                                        <span className="font-bold text-gray-700">Piqo</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="grid h-[600px] place-items-center p-4 text-center bg-gradient-to-b from-black via-gray-900/50 to-black">
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                          >
                            <motion.div 
                              className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200"
                              animate={{
                                boxShadow: ["0 0 10px rgba(34,211,238,0.2)", "0 0 20px rgba(34,211,238,0.3)", "0 0 10px rgba(34,211,238,0.2)"],
                              }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                              Live demo ready
                            </motion.div>
                            <div className="mt-3 text-base font-semibold text-white/90">
                              Preview paused
                            </div>
                            <div className="mt-2 text-xs text-white/50 max-w-[200px] mx-auto">
                              Turn preview on to see your store come to life as you build
                            </div>
                            
                            {/* Skeleton items */}
                            <div className="mt-6 space-y-2 max-w-[200px] mx-auto">
                              {[1, 2, 3].map((i) => (
                                <motion.div
                                  key={i}
                                  className="rounded-xl border border-white/8 bg-white/5 p-2"
                                  animate={{ opacity: [0.3, 0.5, 0.3] }}
                                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.15 }}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20" />
                                    <div className="flex-1 space-y-1.5">
                                      <div className="h-2 bg-white/10 rounded-full w-3/4" />
                                      <div className="h-1.5 bg-white/5 rounded-full w-1/2" />
                                    </div>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="mt-3 text-center text-[10px] text-white/50 relative z-10">
                {previewOn ? (
                  <span>Live preview • <span className="text-cyan-300/70">{mode}</span> store</span>
                ) : (
                  "Turn on preview to see live updates"
                )}
              </div>
            </section>

            {/* Quick Style Presets - Compact */}
            <section className="rounded-3xl border border-purple-500/20 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-purple-500/10">
              <div className="flex items-center justify-between gap-3 mb-6">
                <div className="inline-flex items-center gap-3 text-base font-black text-white">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                    <Palette className="h-5 w-5 text-white" />
                  </div>
                  Quick styles
                </div>
                <button
                  type="button"
                  onClick={randomizeTheme}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 text-xs font-bold text-cyan-200 hover:from-cyan-500/30 hover:to-purple-500/30 transition-all"
                >
                  <span className="text-base">🎲</span> Random
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {PRESETS.map((p) => {
                  const selected = appearance.preset === p.id;
                  return (
                    <motion.button
                      type="button"
                      key={p.id}
                      onClick={() => applyPreset(p.id)}
                      className={cn(
                        "rounded-2xl border p-4 text-center transition-all relative overflow-hidden shadow-lg",
                        selected ? "border-white/40 bg-white/15 shadow-2xl ring-2 ring-white/20" : "border-white/15 bg-black/40 hover:bg-white/12 hover:border-white/25"
                      )}
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      title={p.desc}
                    >
                      {selected && (
                        <motion.div
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", bounce: 0.5 }}
                        >
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        </motion.div>
                      )}
                      <div className="h-10 w-10 mx-auto rounded-xl border-2 border-white/30 shadow-lg" style={{ background: p.accent }} />
                      <div className="mt-3 text-sm font-bold text-white truncate">{p.name.split(" ")[0]}</div>
                      <div className="text-xs text-white/60 truncate">{p.name.split(" ").slice(1).join(" ")}</div>
                    </motion.button>
                  );
                })}
              </div>
            </section>

            {/* Generate Button - Always visible */}
            <section className="rounded-3xl border border-green-500/30 bg-gradient-to-br from-green-500/15 via-cyan-500/10 to-green-500/15 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-green-500/20 relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/10 to-transparent"
                animate={{ x: [-200, 400] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              />
              <button
                type="button"
                onClick={onGenerate}
                disabled={saving || !cleanHandle}
                className={cn(
                  "relative inline-flex w-full items-center justify-center gap-3 rounded-2xl px-6 py-5 text-lg font-black transition-all active:scale-[0.98] shadow-2xl",
                  saving || !cleanHandle
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-green-500/50 hover:shadow-green-500/70"
                )}
              >
                {saving ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Publishing…
                  </>
                ) : (
                  <>
                    <Zap className="h-6 w-6" />
                    Go live
                  </>
                )}
              </button>
              <div className="mt-3 text-center text-sm font-semibold text-white/80 relative z-10">
                {cleanHandle ? (
                  <>Publish to <span className="text-green-300 font-bold">/u/{cleanHandle}</span></>
                ) : (
                  <span className="text-amber-300">Add a handle to publish</span>
                )}
              </div>
              {/* Stripe optional hint */}
              <div className="mt-4 text-center text-sm text-white/70 bg-white/10 rounded-2xl p-4 border border-white/15 backdrop-blur-sm relative z-10">
                <span className="text-lg">💳</span> You can publish without Stripe. Connect Stripe anytime to accept payments.
              </div>
            </section>
            </div>
          </div>
        </div>
      </div>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl bg-black/90 text-white text-sm font-semibold shadow-lg border border-white/15 animate-fade-in">
          {toast}
        </div>
      )}
    </main>
  );
}