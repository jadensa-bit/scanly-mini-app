"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

type ModeId = "services" | "booking" | "digital" | "products";

type ItemBadge = "popular" | "limited" | "none";

type BuildItem = {
  title: string;
  price: string;
  note?: string;
  badge?: ItemBadge;
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
  bgOverlay?: number; // 0..0.9
  layout?: LayoutMode;
  ctaStyle?: CtaStyle;
  ctaShine?: boolean;

  // ✅ ADVANCED (dope builder extras)
  logoShape?: "square" | "circle";
  headerStyle?: "hero" | "minimal";
  showPoweredBy?: boolean;
  showStaff?: boolean;
  showSocials?: boolean;
  ctaText?: string;
};

type StaffProfile = {
  name: string;
  role: string;
  rating: string;
  bio: string;
  specialties: string[];
  next: string[];
};

type SocialLinks = {
  instagram?: string;
  tiktok?: string;
  website?: string;
  phone?: string;
  address?: string;
};

type WeekdayId = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

type AvailabilityDay = {
  enabled: boolean;
  start: string; // "09:00"
  end: string; // "17:00"
};

type Availability = {
  timezone: string; // IANA
  slotMinutes: number; // 15..120
  bufferMinutes: number; // 0..60
  advanceDays: number; // 1..60
  days: Record<WeekdayId, AvailabilityDay>;
};

type Notifications = {
  email: string; // creator email
  onOrders: boolean;
  onBookings: boolean;
  smsPhone?: string;
};

type BuildConfig = {
  mode: ModeId;
  brandName: string;
  handle: string;
  tagline: string;
  items: BuildItem[];
  active: boolean;
  createdAt: number;
  appearance?: Appearance;
  staffProfiles?: StaffProfile[];
  ownerEmail?: string; // legacy (keep)

  brandLogo?: string; // data URL
  social?: SocialLinks;

  // ✅ new
  availability?: Availability;
  notifications?: Notifications;
};

function cn(...c: (string | false | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function storageKey(handle: string) {
  return `scanly:site:${handle}`;
}

function buildPublicUrl(handle: string) {
  if (typeof window === "undefined") return `https://scanly.app/u/${handle}`;
  return `${window.location.origin}/u/${handle}`;
}

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

const MODE_CARDS: Array<{ id: ModeId; title: string; sub: string; vibe: string }> = [
  { id: "services", title: "Services", sub: "Barbers, nails, detailing, etc.", vibe: "Book & pay" },
  { id: "booking", title: "Booking", sub: "Pick a time + pay deposit", vibe: "Lock it in" },
  { id: "digital", title: "Digital", sub: "Pay → instant access/download", vibe: "Instant unlock" },
  { id: "products", title: "Products", sub: "Short list → fast checkout", vibe: "Fast buy" },
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
      { title: "Signature Service", price: "$35", note: "30 min • Clean + quick", badge: "popular" },
      { title: "Premium Service", price: "$50", note: "45 min • Extra detail", badge: "none" },
      { title: "VIP Service", price: "$70", note: "60 min • Full experience", badge: "limited" },
    ];
  }
  if (mode === "booking") {
    return [
      { title: "Deposit (standard)", price: "$15", note: "Locks your time • policy shown", badge: "popular" },
      { title: "Deposit (priority)", price: "$25", note: "Priority slot • faster confirmation", badge: "none" },
      { title: "Consultation", price: "$0", note: "Free consult • limited availability", badge: "limited" },
    ];
  }
  if (mode === "digital") {
    return [
      { title: "Starter Pack", price: "$9", note: "Instant access • beginner friendly", badge: "none" },
      { title: "Pro Guide", price: "$19", note: "Most popular • step-by-step", badge: "popular" },
      { title: "Bundle", price: "$29", note: "Best value • everything included", badge: "limited" },
    ];
  }
  return [
    { title: "Item 1", price: "$15", note: "Best seller", badge: "popular" },
    { title: "Item 2", price: "$25", note: "Limited drop", badge: "limited" },
    { title: "Item 3", price: "$40", note: "Premium", badge: "none" },
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
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
        done
          ? "border-white/25 bg-white/12 text-white/90"
          : active
          ? "border-white/25 bg-white/10 text-white/90"
          : "border-white/12 bg-black/30 text-white/70"
      )}
    >
      {done ? (
        <CheckCircle2 className="h-3.5 w-3.5" />
      ) : (
        <span className="grid h-4 w-4 place-items-center rounded-full border border-white/18 text-[11px] text-white/80">
          {n}
        </span>
      )}
      {label}
    </div>
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

  const [mode, setMode] = useState<ModeId>("services");
  const [brandName, setBrandName] = useState("My Scanly");
  const [handleRaw, setHandleRaw] = useState("my-scanly");
  const [tagline, setTagline] = useState("Scan → tap → done.");

  const [ownerEmail, setOwnerEmail] = useState("");

  const [brandLogo, setBrandLogo] = useState<string>(""); // data URL
  const [social, setSocial] = useState<SocialLinks>({
    instagram: "",
    tiktok: "",
    website: "",
    phone: "",
    address: "",
  });
  // 🔁 Restore draft on load (CRITICAL FIX)
useEffect(() => {
  if (typeof window === "undefined") return;

  const h = slugify(handleRaw);
  if (!h) return;

  try {
    const raw = localStorage.getItem(storageKey(h));
    if (!raw) return;

    const saved: BuildConfig = JSON.parse(raw);

    // hydrate state safely
    setMode(saved.mode);
    setBrandName(saved.brandName);
    setHandleRaw(saved.handle);
    setTagline(saved.tagline || "");
    setItems(saved.items || []);
    setAppearance(saved.appearance || appearance);
    setStaffProfiles(saved.staffProfiles || []);
    setBrandLogo(saved.brandLogo || "");
    setSocial(saved.social || {});
    setAvailability(saved.availability || availability);
    setNotifications(saved.notifications || notifications);
    setOwnerEmail(saved.ownerEmail || "");

  } catch (e) {
    console.warn("Failed to restore Scanly draft", e);
  }
  // run ONCE
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


  // ✅ Availability + notifications (new)
  const [availability, setAvailability] = useState<Availability>({
    timezone: "America/New_York",
    slotMinutes: 30,
    bufferMinutes: 10,
    advanceDays: 14,
    days: {
      mon: { enabled: true, start: "09:00", end: "17:00" },
      tue: { enabled: true, start: "09:00", end: "17:00" },
      wed: { enabled: true, start: "09:00", end: "17:00" },
      thu: { enabled: true, start: "09:00", end: "17:00" },
      fri: { enabled: true, start: "09:00", end: "17:00" },
      sat: { enabled: false, start: "10:00", end: "14:00" },
      sun: { enabled: false, start: "10:00", end: "14:00" },
    },
  });

  const [notifications, setNotifications] = useState<Notifications>({
    email: "",
    onOrders: true,
    onBookings: true,
    smsPhone: "",
  });

  useEffect(() => {
    // keep notifications.email in sync with ownerEmail if user edits it
    setNotifications((n) => ({ ...n, email: ownerEmail }));
  }, [ownerEmail]);

  const cleanHandle = useMemo(() => slugify(handleRaw), [handleRaw]);
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

    // ✅ advanced defaults
    logoShape: "square",
    headerStyle: "hero",
    showPoweredBy: true,
    showStaff: true,
    showSocials: true,
    ctaText: "",
  });

  const [staffProfiles, setStaffProfiles] = useState<StaffProfile[]>([
    {
      name: "Ari",
      role: "Barber",
      rating: "4.9",
      bio: "Clean fades + sharp lineups. Fast hands, no wasted time.",
      specialties: ["Fades", "Lineups", "Beard work", "Enhancements"],
      next: ["11:00 AM", "12:00 PM", "2:30 PM"],
    },
    {
      name: "Jay",
      role: "Barber",
      rating: "4.8",
      bio: "Detail-driven cuts. Great if you want the ‘fresh all week’ look.",
      specialties: ["Tapers", "Scissor work", "Texture"],
      next: ["11:30 AM", "12:45 PM", "3:30 PM"],
    },
  ]);

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [showQr, setShowQr] = useState(false);
  const [previewOn, setPreviewOn] = useState(true);
  const [previewTick, setPreviewTick] = useState(0);

  const publicUrl = useMemo(() => buildPublicUrl(cleanHandle || "yourname"), [cleanHandle]);
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
      const res = await fetch(`/api/stripe/status?handle=${encodeURIComponent(h)}`, { cache: "no-store" });
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
    fetchStripeStatus(cleanHandle);
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
      body: JSON.stringify({ handle: h }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setStripeErr(data?.error || "Could not start Stripe Connect.");
      return;
    }

    if (data?.url) {
      window.location.href = data.url;
      return;
    }

    setStripeErr("Stripe Connect route did not return a URL.");
  } catch (e: any) {
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
    const url = await fileToDataUrl(file);
    setBrandLogo(url);
  }

  async function onPickBgImage(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const url = await fileToDataUrl(file);
    setAppearance((p) => ({ ...p, bgMode: "image", bgImage: url }));
  }

  // draft config for live preview
  const configDraft: BuildConfig | null = useMemo(() => {
    const h = cleanHandle;
    if (!h) return null;

    const notifEmail = (notifications.email || ownerEmail || "").trim();

    return {
      mode,
      brandName: brandName.trim() || "My Scanly",
      handle: h,
      tagline: tagline.trim(),
      items: items.filter((x) => (x.title || "").trim().length > 0),
      active: true,
      createdAt: Date.now(),
      appearance,
      staffProfiles: staffProfiles.length ? staffProfiles : undefined,
      ownerEmail: ownerEmail.trim() || undefined, // legacy

      brandLogo: brandLogo || undefined,
      social: {
        instagram: (social.instagram || "").trim() || undefined,
        tiktok: (social.tiktok || "").trim() || undefined,
        website: (social.website || "").trim() || undefined,
        phone: (social.phone || "").trim() || undefined,
        address: (social.address || "").trim() || undefined,
      },

      availability: availability || undefined,
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
        setPreviewTick((x) => x + 1);
      }, 220),
    []
  );

 useEffect(() => {
  if (!configDraft) return;

  // ✅ Prevent overwriting restored draft on the first render
  if (!hasHydratedRef.current) {
    hasHydratedRef.current = true;
    return;
  }

  saveDraftDebounced(configDraft);
}, [configDraft, saveDraftDebounced]);


  // actions
  const addItem = () => setItems((prev) => [...prev, { title: "New item", price: "$0", note: "", badge: "none" }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, patch: Partial<BuildItem>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

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
      appearance,
      staffProfiles: staffProfiles.length ? staffProfiles : undefined,

      ownerEmail: ownerEmail.trim() || undefined, // legacy keep
      brandLogo: brandLogo || undefined,
      social: {
        instagram: (social.instagram || "").trim() || undefined,
        tiktok: (social.tiktok || "").trim() || undefined,
        website: (social.website || "").trim() || undefined,
        phone: (social.phone || "").trim() || undefined,
        address: (social.address || "").trim() || undefined,
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
      const out = await postJson("/api/site", config);

      if (!out.res.ok) {
        const msg =
          out?.data?.error ||
          out?.data?.detail ||
          (out.res.status === 404
            ? "Missing API route /api/site. Check: src/app/api/site/route.ts"
            : "Failed to save site.");
        throw new Error(msg);
      }

      router.push(`/u/${h}?published=1`);
      router.refresh();
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
    return `/u/${h}?handle=${h}&preview=1&t=${previewTick}`;
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
  const accent = appearance.accent || "#22D3EE";

  const previewBg = useMemo(() => {
    if (bgMode === "image" && appearance.bgImage) {
      return `linear-gradient(rgba(0,0,0,${overlay}), rgba(0,0,0,${overlay})), url(${appearance.bgImage})`;
    }
    if (bgMode === "gradient") {
      return `linear-gradient(${gradient.angle}deg, ${gradient.c1}, ${gradient.c2})`;
    }
    return appearance.bgColor || "#000";
  }, [bgMode, appearance.bgImage, appearance.bgColor, overlay, gradient.angle, gradient.c1, gradient.c2]);

  // ✅ FIX: longhand-only background styling (no shorthand `background`)
  const previewStyle = useMemo<React.CSSProperties>(() => {
    const s: React.CSSProperties = {
      backgroundColor: "transparent",
      backgroundImage: "none",
      backgroundPosition: "center",
      backgroundSize: "cover",
      backgroundRepeat: "no-repeat",
    };

    const v = String(previewBg ?? "").trim();
    if (!v) return s;

    if (
      v.startsWith("linear-gradient") ||
      v.startsWith("radial-gradient") ||
      v.startsWith("conic-gradient") ||
      v.startsWith("url(")
    ) {
      s.backgroundImage = v;
      return s;
    }

    s.backgroundColor = v;
    return s;
  }, [previewBg]);

  const headerStyle = appearance.headerStyle || "hero";

  const ctaBg = (appearance.ctaStyle || "accent") === "white" ? "#ffffff" : accent;
  const ctaFg = "#000000";
  const shine = appearance.ctaShine !== false;

  const logoRound = (appearance.logoShape || "square") === "circle" ? "rounded-full" : "rounded-2xl";

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
    <main className="min-h-screen bg-black text-white">
      <div
        className="pointer-events-none fixed inset-0 opacity-55"
        style={{
          background:
            "radial-gradient(circle at 20% 10%, rgba(34,211,238,0.18), transparent 55%), radial-gradient(circle at 80% 90%, rgba(255,255,255,0.06), transparent 60%)",
        }}
      />

      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 backdrop-blur-xl px-3 py-1 text-xs text-white/85">
              <Wand2 className="h-3.5 w-3.5" />
              Scanly Builder
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              {headerStyle === "hero" ? "Build your QR mini-app" : "Create your mini-app"}
            </h1>
            <p className="mt-1 text-white/85">
              {headerStyle === "hero"
                ? "People scan → it feels like an app → they tap → you convert."
                : "Fast setup. Clean link. Instant checkout."}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <StepPill n={1} label="Basics" active={!progress.brandOk} done={progress.brandOk} />
              <StepPill n={2} label="Items" active={progress.brandOk && !progress.itemsOk} done={progress.itemsOk} />
              <StepPill n={3} label="Style" active={progress.itemsOk && !progress.themeOk} done={progress.themeOk} />
            </div>

            <div className="mt-2 text-[11px] text-white/70">
              Your link: <span className="text-white/90">/u/{cleanHandle || "handle"}</span> • Preview updates live.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={randomizeTheme}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/8 backdrop-blur-xl px-4 py-2 text-sm font-semibold hover:bg-white/12 transition"
              title="Randomize a dope style"
            >
              <Sparkles className="h-4 w-4" />
              Randomize
            </button>

            <button
              type="button"
              onClick={() => setPreviewOn((v) => !v)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/8 backdrop-blur-xl px-4 py-2 text-sm font-semibold hover:bg-white/12 transition"
              title="Toggle live preview"
            >
              <Smartphone className="h-4 w-4" />
              {previewOn ? "Preview on" : "Preview off"}
            </button>

            <button
              type="button"
              onClick={() => setShowQr((v) => !v)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/8 backdrop-blur-xl px-4 py-2 text-sm font-semibold hover:bg-white/12 transition"
            >
              <QrCode className="h-4 w-4" />
              QR preview
            </button>
          </div>
        </header>

        {err ? (
          <div className="mt-6 rounded-2xl border border-red-500/35 bg-red-500/12 px-4 py-3 text-sm text-red-50">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <div className="min-w-0">
                <div className="font-semibold">Failed to save site</div>
                <div className="mt-1 text-red-50/90">{err}</div>
                <div className="mt-2 text-[11px] text-red-50/80">
                  Your API file should be: <span className="text-red-50">src/app/api/site/route.ts</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_440px]">
          {/* LEFT */}
          <div className="space-y-6">
            {/* Mode */}
            <section className="rounded-3xl border border-white/12 bg-white/8 backdrop-blur-xl p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                  <Sparkles className="h-4 w-4" />
                  What are you selling?
                </div>
                {modeCard ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/35 px-3 py-1 text-[11px] text-white/85">
                    <Zap className="h-3.5 w-3.5" />
                    {modeCard.vibe}
                  </div>
                ) : null}
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {MODE_CARDS.map((m) => {
                  const selected = mode === m.id;
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => onPickMode(m.id)}
                      className={cn(
                        "rounded-2xl border p-4 text-left transition",
                        selected ? "border-white/35 bg-white/12" : "border-white/12 bg-black/30 hover:bg-white/10"
                      )}
                    >
                      <div className="text-sm font-semibold text-white/90">{m.title}</div>
                      <div className="mt-1 text-xs text-white/80">{m.sub}</div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Brand */}
            <section className="rounded-3xl border border-white/12 bg-white/8 backdrop-blur-xl p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                  <Palette className="h-4 w-4" />
                  Brand + link
                </div>

                <div className="flex items-center gap-2">
                  <div className={cn("h-10 w-10 overflow-hidden border border-white/12 bg-black/30 grid place-items-center", logoRound)}>
                    {brandLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={brandLogo} alt="Logo" className="h-full w-full object-contain p-2" />
                    ) : (
                      <BadgeCheck className="h-4 w-4 text-white/65" />
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-xs text-white/80">Brand name</span>
                  <input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                    placeholder="Ex: Fresh Cutz"
                  />
                </label>

                <label className="grid gap-1">
                  <span className="text-xs text-white/80">Handle (your QR link)</span>
                  <input
                    value={handleRaw}
                    onChange={(e) => setHandleRaw(e.target.value)}
                    className="rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                    placeholder="Ex: freshcutz"
                  />
                  <div className="text-[11px] text-white/70">
                    Becomes: <span className="text-white/90">/u/{cleanHandle || "handle"}</span>
                  </div>
                </label>

                <label className="grid gap-1 sm:col-span-2">
                  <span className="text-xs text-white/80">Tagline</span>
                  <input
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                    placeholder="Ex: Tap, pay, confirmed."
                  />
                </label>

                <div className="grid gap-1 sm:col-span-2">
                  <span className="text-xs text-white/80">Logo (optional)</span>
                  <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/12 bg-black/30 px-4 py-3 text-sm text-white/85 hover:bg-white/10 transition cursor-pointer">
                    <span className="inline-flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      {brandLogo ? "Replace logo" : "Upload logo"}
                    </span>
                    <span className="text-[11px] text-white/65">PNG/JPG/SVG</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => onPickLogoFile(e.target.files?.[0])}
                    />
                  </label>

                  {brandLogo ? (
                    <button
                      type="button"
                      onClick={() => setBrandLogo("")}
                      className="mt-1 inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-4 py-2 text-xs font-semibold text-white/85 hover:bg-white/10 transition"
                    >
                      Remove logo
                    </button>
                  ) : null}
                </div>

                <label className="grid gap-1 sm:col-span-2">
                  <span className="text-xs text-white/80">Notification email (get booked/purchase alerts)</span>
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
            </section>

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
                  Availability
                </div>
                <div className="text-[11px] text-white/70">
                  {showAvailability ? "Used for booking" : "Optional"}
                </div>
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

            {/* App Style */}
            <section className="rounded-3xl border border-white/12 bg-white/8 backdrop-blur-xl p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <Layers className="h-4 w-4" />
                App style
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-xs text-white/80">Font</span>
                  <div className="relative">
                    <Type className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/55" />
                    <select
                      value={appearance.fontFamily || "inter"}
                      onChange={(e) => setAppearance((p) => ({ ...p, fontFamily: e.target.value as FontFamily }))}
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
                  <div className="text-[11px] text-white/65">We’ll apply this to the whole mini-app.</div>
                </label>

                <label className="grid gap-1">
                  <span className="text-xs text-white/80">Layout</span>
                  <div className="grid grid-cols-3 gap-2">
                    {(["cards", "menu", "tiles"] as LayoutMode[]).map((l) => {
                      const on = (appearance.layout || "cards") === l;
                      return (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setAppearance((p) => ({ ...p, layout: l }))}
                          className={cn(
                            "rounded-2xl border px-3 py-3 text-xs font-semibold transition",
                            on ? "border-white/35 bg-white/12" : "border-white/12 bg-black/30 hover:bg-white/10"
                          )}
                        >
                          {l === "cards" ? "Cards" : l === "menu" ? "Menu" : "Tiles"}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-[11px] text-white/65">Different “app templates” for the same content.</div>
                </label>
              </div>

              {/* Background mode */}
              <div className="mt-5 grid gap-3">
                <div className="text-xs font-semibold text-white/85">Background</div>

                <div className="grid grid-cols-3 gap-2">
                  {(["solid", "gradient", "image"] as BgMode[]).map((m) => {
                    const on = (appearance.bgMode || "solid") === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setAppearance((p) => ({ ...p, bgMode: m }))}
                        className={cn(
                          "rounded-2xl border px-3 py-3 text-xs font-semibold transition",
                          on ? "border-white/35 bg-white/12" : "border-white/12 bg-black/30 hover:bg-white/10"
                        )}
                      >
                        {m === "solid" ? "Solid" : m === "gradient" ? "Gradient" : "Image"}
                      </button>
                    );
                  })}
                </div>

                {/* Solid */}
                {bgMode === "solid" ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <label className="grid gap-1">
                      <span className="text-xs text-white/80">Background color</span>
                      <div className="flex items-center gap-3 rounded-2xl border border-white/12 bg-black/30 px-4 py-3">
                        <input
                          type="color"
                          value={appearance.bgColor || "#000000"}
                          onChange={(e) => setAppearance((p) => ({ ...p, bgColor: e.target.value }))}
                          className="h-8 w-10 rounded-lg border border-white/12 bg-transparent"
                        />
                        <input
                          value={appearance.bgColor || "#000000"}
                          onChange={(e) => setAppearance((p) => ({ ...p, bgColor: e.target.value }))}
                          className="flex-1 bg-transparent text-sm text-white/90 outline-none"
                        />
                      </div>
                    </label>
                  </div>
                ) : null}

                {/* Gradient */}
                {bgMode === "gradient" ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-1">
                      <span className="text-xs text-white/80">Color 1</span>
                      <input
                        type="color"
                        value={gradient.c1}
                        onChange={(e) => setAppearance((p) => ({ ...p, gradient: { ...gradient, c1: e.target.value } }))}
                        className="h-11 w-full rounded-2xl border border-white/12 bg-black/30"
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs text-white/80">Color 2</span>
                      <input
                        type="color"
                        value={gradient.c2}
                        onChange={(e) => setAppearance((p) => ({ ...p, gradient: { ...gradient, c2: e.target.value } }))}
                        className="h-11 w-full rounded-2xl border border-white/12 bg-black/30"
                      />
                    </label>
                    <label className="grid gap-1 sm:col-span-2">
                      <span className="text-xs text-white/80">Angle</span>
                      <input
                        type="range"
                        min={0}
                        max={360}
                        value={gradient.angle}
                        onChange={(e) =>
                          setAppearance((p) => ({ ...p, gradient: { ...gradient, angle: Number(e.target.value) } }))
                        }
                        className="w-full"
                      />
                      <div className="text-[11px] text-white/65">{gradient.angle}°</div>
                    </label>

                    <div
                      className="sm:col-span-2 h-14 rounded-2xl border border-white/12"
                      style={{ background: `linear-gradient(${gradient.angle}deg, ${gradient.c1}, ${gradient.c2})` }}
                    />
                  </div>
                ) : null}

                {/* Image */}
                {bgMode === "image" ? (
                  <div className="grid gap-3">
                    <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/12 bg-black/30 px-4 py-3 text-sm text-white/85 hover:bg-white/10 transition cursor-pointer">
                      <span className="inline-flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        {appearance.bgImage ? "Replace background image" : "Upload background image"}
                      </span>
                      <span className="text-[11px] text-white/65">Looks crazy with overlay</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => onPickBgImage(e.target.files?.[0])}
                      />
                    </label>

                    {appearance.bgImage ? (
                      <>
                        <div className="rounded-2xl border border-white/12 bg-black/30 p-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={appearance.bgImage} alt="BG" className="w-full rounded-xl object-cover max-h-48" />
                        </div>

                        <label className="grid gap-1">
                          <span className="text-xs text-white/80">Overlay darkness</span>
                          <input
                            type="range"
                            min={0}
                            max={0.9}
                            step={0.05}
                            value={overlay}
                            onChange={(e) => setAppearance((p) => ({ ...p, bgOverlay: Number(e.target.value) }))}
                            className="w-full"
                          />
                          <div className="text-[11px] text-white/65">{overlay.toFixed(2)}</div>
                        </label>

                        <button
                          type="button"
                          onClick={() => setAppearance((p) => ({ ...p, bgImage: "", bgMode: "solid" }))}
                          className="inline-flex items-center justify-center rounded-2xl border border-white/12 bg-white/5 px-4 py-2 text-xs font-semibold text-white/85 hover:bg-white/10 transition"
                        >
                          Remove background image
                        </button>
                      </>
                    ) : (
                      <div className="text-[11px] text-white/65">
                        Tip: upload a photo, then slide overlay to make text readable.
                      </div>
                    )}
                  </div>
                ) : null}
              </div>

              {/* CTA style */}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-xs text-white/80">CTA style</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(["accent", "white"] as CtaStyle[]).map((c) => {
                      const on = (appearance.ctaStyle || "accent") === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setAppearance((p) => ({ ...p, ctaStyle: c }))}
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
                  <span className="text-xs text-white/80">CTA “shine”</span>
                  <button
                    type="button"
                    onClick={() => setAppearance((p) => ({ ...p, ctaShine: !p.ctaShine }))}
                    className="inline-flex items-center justify-between rounded-2xl border border-white/12 bg-black/30 px-4 py-3 text-sm text-white/85 hover:bg-white/10 transition"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      {appearance.ctaShine ? "On" : "Off"}
                    </span>
                    <span className="text-[11px] text-white/65">More “app” feel</span>
                  </button>
                </label>

                {/* Mini preview swatch */}
                <div className="sm:col-span-2 rounded-2xl border border-white/12 bg-black/30 p-3">
                  <div className="text-[11px] text-white/65 mb-2">Style preview</div>

                  <div className="rounded-2xl border border-white/12 p-4" style={previewStyle}>
                    <div className="flex items-center gap-2">
                      <div className={cn("h-10 w-10 border border-white/15 bg-black/40 grid place-items-center overflow-hidden", logoRound)}>
                        {brandLogo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={brandLogo} alt="logo" className="h-full w-full object-contain p-2" />
                        ) : (
                          <Sparkles className="h-4 w-4 text-white/70" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-white/90 truncate">{brandName || "Your brand"}</div>
                        <div className="text-xs text-white/70 truncate">{tagline || "Your tagline"}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="mt-3 w-full rounded-2xl px-4 py-3 text-sm font-semibold relative overflow-hidden"
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
                            animation: "scanlyShine 2.6s ease-in-out infinite",
                          }}
                        />
                      ) : null}
                      <span className="relative">
                        {appearance.ctaText?.trim() ? appearance.ctaText.trim() : "Tap to checkout"}
                      </span>
                    </button>

                    <style jsx>{`
                      @keyframes scanlyShine {
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
              </div>

              {/* ✅ ADVANCED: Extras */}
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-xs text-white/80">Logo shape</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(["square", "circle"] as const).map((v) => {
                      const on = (appearance.logoShape || "square") === v;
                      return (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setAppearance((p) => ({ ...p, logoShape: v }))}
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
                          onClick={() => setAppearance((p) => ({ ...p, headerStyle: v }))}
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

                <label className="grid gap-1 sm:col-span-2">
                  <span className="text-xs text-white/80">CTA button text (optional)</span>
                  <input
                    value={appearance.ctaText || ""}
                    onChange={(e) => setAppearance((p) => ({ ...p, ctaText: e.target.value }))}
                    className="rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                    placeholder="Ex: Reserve spot • Book now • Get instant access"
                  />
                  <div className="text-[11px] text-white/65">If empty, mini-app uses the default label for the mode.</div>
                </label>

                <div className="sm:col-span-2 grid gap-2">
                  <div className="text-xs font-semibold text-white/85">Show / hide sections</div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      { key: "showPoweredBy", label: "Powered by Scanly" },
                      { key: "showStaff", label: "Staff / team section" },
                      { key: "showSocials", label: "Social + contact buttons" },
                    ].map((x) => {
                      const k = x.key as "showPoweredBy" | "showStaff" | "showSocials";
                      const on = (appearance[k] ?? true) === true;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setAppearance((p) => ({ ...p, [k]: !(p[k] ?? true) }))}
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
                </div>
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
              </div>

              <div className="mt-2 text-[11px] text-white/65">
                These show as quick action buttons on the mini-app once you wire them into /u/[handle].
              </div>
            </section>

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

            {/* Presets */}
            <section className="rounded-3xl border border-white/12 bg-white/8 backdrop-blur-xl p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-white/90">
                  <LayoutTemplate className="h-4 w-4" />
                  Pick a vibe
                </div>
                <div className="text-[11px] text-white/70">
                  Current: <span className="text-white/90">{appearance.preset || "custom"}</span>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {PRESETS.map((p) => {
                  const selected = appearance.preset === p.id;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => applyPreset(p.id)}
                      className={cn(
                        "rounded-2xl border p-4 text-left transition",
                        selected ? "border-white/35 bg-white/12" : "border-white/12 bg-black/30 hover:bg-white/10"
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-white/90">{p.name}</div>
                        <div className="h-3.5 w-3.5 rounded-full border border-white/25" style={{ background: p.accent }} />
                      </div>
                      <div className="mt-1 text-xs text-white/80">{p.desc}</div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Items */}
            <section className="rounded-3xl border border-white/12 bg-white/8 backdrop-blur-xl p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white/90">Items</div>
                <button
                  type="button"
                  onClick={addItem}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/8 backdrop-blur-xl px-3 py-2 text-xs font-semibold hover:bg-white/12 transition"
                >
                  <Plus className="h-4 w-4" />
                  Add item
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                {items.map((it, idx) => (
                  <div key={idx} className="rounded-2xl border border-white/12 bg-black/30 p-4">
                    <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                      <input
                        value={it.title}
                        onChange={(e) => updateItem(idx, { title: e.target.value })}
                        className="rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                        placeholder="Item title"
                      />
                      <input
                        value={it.price}
                        onChange={(e) => updateItem(idx, { price: e.target.value })}
                        className="rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                        placeholder="$35"
                      />
                      <input
                        value={it.note || ""}
                        onChange={(e) => updateItem(idx, { note: e.target.value })}
                        className="sm:col-span-2 rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                        placeholder="Optional note (duration, details, etc.)"
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="inline-flex items-center gap-2 text-[11px] text-white/70">
                        <BadgeCheck className="h-4 w-4" />
                        Badge
                      </div>
                      <div className="flex gap-2">
                        {(["none", "popular", "limited"] as ItemBadge[]).map((b) => {
                          const on = (it.badge || "none") === b;
                          return (
                            <button
                              key={b}
                              type="button"
                              onClick={() => updateItem(idx, { badge: b })}
                              className={cn(
                                "rounded-full border px-3 py-1 text-[11px] font-semibold transition",
                                on
                                  ? "border-white/30 bg-white/12 text-white/90"
                                  : "border-white/12 bg-black/30 text-white/75 hover:bg-white/10"
                              )}
                            >
                              {b === "none" ? "None" : b === "popular" ? "Popular" : "Limited"}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/8 backdrop-blur-xl px-3 py-2 text-xs font-semibold hover:bg-white/12 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Staff */}
            <section className="rounded-3xl border border-white/12 bg-white/8 backdrop-blur-xl p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-white/90">
                  <Users className="h-4 w-4" />
                  Team / Staff (optional)
                </div>

                <button
                  type="button"
                  onClick={addStaff}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/8 backdrop-blur-xl px-3 py-2 text-xs font-semibold hover:bg-white/12 transition"
                >
                  <Plus className="h-4 w-4" />
                  Add person
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                {staffProfiles.map((s, idx) => (
                  <div key={idx} className="rounded-2xl border border-white/12 bg-black/30 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        value={s.name}
                        onChange={(e) => updateStaff(idx, { name: e.target.value })}
                        className="rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                        placeholder="Name"
                      />
                      <input
                        value={s.role}
                        onChange={(e) => updateStaff(idx, { role: e.target.value })}
                        className="rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                        placeholder="Role"
                      />
                      <input
                        value={s.rating}
                        onChange={(e) => updateStaff(idx, { rating: e.target.value })}
                        className="rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                        placeholder="Rating (ex 4.9)"
                      />
                      <input
                        value={s.bio}
                        onChange={(e) => updateStaff(idx, { bio: e.target.value })}
                        className="rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                        placeholder="Short bio"
                      />
                    </div>

                    <div className="mt-3 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeStaff(idx)}
                        className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/8 backdrop-blur-xl px-3 py-2 text-xs font-semibold hover:bg-white/12 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 text-[11px] text-white/70">If you don’t want staff, you can leave this empty.</div>
            </section>

            {/* Generate */}
            <section className="rounded-3xl border border-white/12 bg-white/8 backdrop-blur-xl p-5">
              <button
                type="button"
                onClick={onGenerate}
                disabled={saving}
                className={cn(
                  "inline-flex w-full items-center justify-center rounded-2xl px-4 py-4 text-sm font-semibold text-black transition active:scale-[0.99]",
                  saving ? "bg-white/80" : "bg-white hover:bg-white/90"
                )}
              >
                {saving ? "Generating..." : "Generate my app"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>

              <div className="mt-3 text-center text-[11px] text-white/70">
                Saves your config + opens your live link at{" "}
                <span className="text-white/90">/u/{cleanHandle || "handle"}</span>.
              </div>
            </section>
          </div>

          {/* RIGHT */}
          <aside className="space-y-6">
            {/* Live Preview */}
            <section className="rounded-3xl border border-white/12 bg-white/8 backdrop-blur-xl p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-white/90">Live preview</div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/35 px-3 py-1 text-[11px] text-white/85">
                  <Smartphone className="h-3.5 w-3.5" />
                  {previewOn ? "Updating" : "Paused"}
                </div>
              </div>

              <div className="mt-2 text-xs text-white/80 break-all">
                {cleanHandle ? `Previewing /u/${cleanHandle}` : "Pick a handle to preview"}
              </div>

              <div className="mt-4 rounded-[28px] border border-white/12 bg-black/45 p-3">
                <div className="mx-auto w-full max-w-[380px]">
                  <div className="relative overflow-hidden rounded-[28px] border border-white/12 bg-black">
                    <div className="flex items-center justify-between px-4 py-2 text-[11px] text-white/80 border-b border-white/10 bg-black/70">
                      <span className="inline-flex items-center gap-2">
                        <Smartphone className="h-3.5 w-3.5" />
                        Scanly preview
                      </span>
                      <span className="text-white/60">{previewOn ? "live" : "paused"}</span>
                    </div>

                    {previewOn && cleanHandle ? (
                      <iframe
                        key={previewUrl}
                        src={previewUrl}
                        className="h-[560px] w-full"
                        style={{ border: "none" }}
                        title="Scanly Preview"
                      />
                    ) : (
                      <div className="grid h-[560px] place-items-center p-6 text-center">
                        <div>
                          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 backdrop-blur-xl px-3 py-1 text-xs text-white/85">
                            <Sparkles className="h-3.5 w-3.5" />
                            Preview ready
                          </div>
                          <div className="mt-3 text-lg font-semibold text-white/90">
                            {cleanHandle ? "Preview paused" : "Add a handle to preview"}
                          </div>
                          <div className="mt-2 text-sm text-white/80">
                            {cleanHandle
                              ? "Turn Preview on to see changes update instantly."
                              : "Type a handle on the left and your mini-app will appear here."}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 text-[11px] text-white/70">
                    This preview uses the draft saved in localStorage — instant feel.
                  </div>
                </div>
              </div>
            </section>

            {/* QR */}
            {showQr ? (
              <section className="rounded-3xl border border-white/12 bg-white/8 backdrop-blur-xl p-5">
                <div className="text-sm font-semibold text-white/90">QR preview</div>
                <div className="mt-2 text-xs text-white/80 break-all">{publicUrl}</div>

                <div className="mt-4 rounded-2xl border border-white/12 bg-black/30 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrUrl} alt="QR preview" className="h-auto w-full rounded-xl" />
                </div>

                <div className="mt-3 text-[11px] text-white/70">
                  This QR points to <span className="text-white/90">/u/{cleanHandle || "handle"}</span>.
                </div>
              </section>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}