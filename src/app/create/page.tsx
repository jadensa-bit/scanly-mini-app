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
} from "lucide-react";

type ModeId = "services" | "booking" | "digital" | "products";

type BuildItem = {
  title: string;
  price: string;
  note?: string;
};

type ThemePreset = "neon" | "minimal" | "warm" | "luxe" | "custom";
type Appearance = {
  preset?: ThemePreset;
  accent?: string; // hex
  surface?: "glass" | "solid";
  background?: "glow" | "grid" | "dots" | "none";
  radius?: number; // 16..32
  font?: "sans" | "display" | "mono";
  button?: "pill" | "soft" | "sharp";
};

type StaffProfile = {
  name: string;
  role: string;
  rating: string;
  bio: string;
  specialties: string[];
  next: string[];
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
  ownerEmail?: string; // notifications for owner
};

function cn(...c: (string | false | undefined)[]) {
  return c.filter(Boolean).join(" ");
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

const MODE_CARDS: Array<{
  id: ModeId;
  title: string;
  sub: string;
  vibe: string;
}> = [
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

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let t: any;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function pickDefaultItemsForMode(mode: ModeId): BuildItem[] {
  if (mode === "services") {
    return [
      { title: "Signature Service", price: "$35", note: "30 min • Clean + quick" },
      { title: "Premium Service", price: "$50", note: "45 min • Extra detail" },
      { title: "VIP Service", price: "$70", note: "60 min • Full experience" },
    ];
  }
  if (mode === "booking") {
    return [
      { title: "Deposit (standard)", price: "$15", note: "Locks your time • policy shown" },
      { title: "Deposit (priority)", price: "$25", note: "Priority slot • faster confirmation" },
      { title: "Consultation", price: "$0", note: "Free consult • limited availability" },
    ];
  }
  if (mode === "digital") {
    return [
      { title: "Starter Pack", price: "$9", note: "Instant access • beginner friendly" },
      { title: "Pro Guide", price: "$19", note: "Most popular • step-by-step" },
      { title: "Bundle", price: "$29", note: "Best value • everything included" },
    ];
  }
  return [
    { title: "Item 1", price: "$15", note: "Best seller" },
    { title: "Item 2", price: "$25", note: "Limited drop" },
    { title: "Item 3", price: "$40", note: "Premium" },
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
   - expects you to have:
     POST /api/stripe/connect  { handle }
     GET  /api/stripe/status?handle=...
   These should store/retrieve Stripe Connect status on the server.
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

export default function CreatePage() {
  const router = useRouter();

  const [mode, setMode] = useState<ModeId>("services");
  const [brandName, setBrandName] = useState("My Scanly");
  const [handleRaw, setHandleRaw] = useState("my-scanly");
  const [tagline, setTagline] = useState("Scan → tap → done.");

  const [ownerEmail, setOwnerEmail] = useState("");

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

  // refetch when handle changes (debounced-ish by slugify)
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
        setStripeErr(data?.error || data?.detail || "Could not start Stripe Connect.");
        return;
      }

      if (data?.url) {
        window.location.href = data.url; // Stripe onboarding
        return;
      }

      setStripeErr("Stripe Connect route did not return a URL.");
    } catch (e: any) {
      setStripeErr(e?.message || "Could not start Stripe Connect.");
    } finally {
      setStripeLoading(false);
    }
  }

  // draft config for live preview
  const configDraft: BuildConfig | null = useMemo(() => {
    const h = cleanHandle;
    if (!h) return null;

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
      ownerEmail: ownerEmail.trim() || undefined,
    };
  }, [cleanHandle, mode, brandName, tagline, items, appearance, staffProfiles, ownerEmail]);

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

  const lastHandleRef = useRef<string>("");
  useEffect(() => {
    if (!configDraft) return;
    lastHandleRef.current = configDraft.handle;
    saveDraftDebounced(configDraft);
  }, [configDraft, saveDraftDebounced]);

  // actions
  const addItem = () => setItems((prev) => [...prev, { title: "New item", price: "$0", note: "" }]);
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
    setItems((prev) => (prev?.length ? prev : pickDefaultItemsForMode(m)));
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
    if (saving) return; // prevent double click
    setErr(null);

    const h = slugify(handleRaw);
    if (!h) return setErr("Handle is required (letters/numbers).");
    if (!brandName.trim()) return setErr("Brand name is required.");

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
      ownerEmail: ownerEmail.trim() || undefined,
    };

    // 1) local save first
    try {
      localStorage.setItem(storageKey(h), JSON.stringify(config));
    } catch {}

    // 2) save to API
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

      // published flag tells /u/[handle] to retry & not show “not set up”
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

  // Stripe badge logic (pure UI)
  const stripeBadge = useMemo(() => {
    const s = stripeStatus;
    if (!cleanHandle) return { tone: "muted", label: "Add a handle first" as const };

    if (stripeLoading) return { tone: "muted", label: "Checking…" as const };

    if (!s) return { tone: "muted", label: "Not connected" as const };

    if (s.connected || s.charges_enabled) return { tone: "good", label: "Connected" as const };

    if (s.requires_action || s.details_submitted === false) return { tone: "warn", label: "Action needed" as const };

    return { tone: "muted", label: "Not connected" as const };
  }, [stripeStatus, stripeLoading, cleanHandle]);

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

            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Build your QR mini-app</h1>
            <p className="mt-1 text-white/85">People scan → it feels like an app → they tap → you convert.</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <StepPill n={1} label="Basics" active={!progress.brandOk} done={progress.brandOk} />
              <StepPill n={2} label="Items" active={progress.brandOk && !progress.itemsOk} done={progress.itemsOk} />
              <StepPill n={3} label="Vibe" active={progress.itemsOk && !progress.themeOk} done={progress.themeOk} />
            </div>

            <div className="mt-2 text-[11px] text-white/70">
              Your link: <span className="text-white/90">/u/{cleanHandle || "handle"}</span> • Preview updates live.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
              <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
                <Palette className="h-4 w-4" />
                Brand + link
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

                <label className="grid gap-1 sm:col-span-2">
                  <span className="text-xs text-white/80">Notification email (get booked/purchase alerts)</span>
                  <input
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="rounded-2xl border border-white/12 bg-black/40 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/40 focus:border-white/25"
                    placeholder="you@domain.com"
                    inputMode="email"
                  />
                  <div className="text-[11px] text-white/70">
                    We’ll email you when someone pays or books through your mini-app.
                  </div>
                </label>
              </div>
            </section>

            {/* ✅ NEW: Stripe Connect */}
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
