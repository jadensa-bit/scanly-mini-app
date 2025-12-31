"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarClock,
  ExternalLink,
  Gift,
  ShoppingBag,
  Sparkles,
  Instagram,
  Globe,
  Phone,
  MapPin,
  Copy,
  Share2,
  Star,
  Clock,
} from "lucide-react";

/* =======================
   Types
======================= */
type ModeId = "services" | "booking" | "digital" | "products";

type ItemBadge = "popular" | "limited" | "none";
type BgMode = "solid" | "gradient" | "image";
type LayoutMode = "cards" | "menu" | "tiles";
type FontFamily = "inter" | "poppins" | "sora" | "space" | "jakarta" | "dmsans";
type CtaStyle = "accent" | "white";

type BuildItem = {
  title: string;
  price: string;
  note?: string;
  badge?: ItemBadge;
};

type Appearance = {
  accent?: string;
  background?: "glow" | "grid" | "dots" | "none";
  radius?: number;
  button?: "pill" | "soft" | "sharp";

  fontFamily?: FontFamily;

  // background builder
  bgMode?: BgMode;
  bgColor?: string;
  gradient?: { c1: string; c2: string; angle: number };
  bgImage?: string;
  bgOverlay?: number;

  // layout + CTA
  layout?: LayoutMode;
  ctaStyle?: CtaStyle;
  ctaShine?: boolean;

  // ✅ advanced builder extras
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
  specialties?: string[];
  next?: string[];
};

type SocialLinks = {
  instagram?: string;
  tiktok?: string;
  website?: string;
  phone?: string;
  address?: string;
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
  brandLogo?: string;
  social?: SocialLinks;
};

/* =======================
   Helpers
======================= */
function cn(...c: (string | false | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

// ✅ MUST MATCH api/site + stripe routes (allow dash + underscore)
function safeHandle(input: unknown) {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function storageKey(handle: string) {
  return `scanly:site:${handle}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function hexToRgba(hex = "#22D3EE", alpha = 0.2) {
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
}

function isLightHex(hex?: string) {
  const h = (hex || "#22D3EE").replace("#", "").padEnd(6, "0");
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum > 0.72;
}

function fontFamilyCss(f?: Appearance["fontFamily"]) {
  switch (f) {
    case "poppins":
      return "Poppins, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
    case "sora":
      return "Sora, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
    case "space":
      return "Space Grotesk, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
    case "jakarta":
      return "Plus Jakarta Sans, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
    case "dmsans":
      return "DM Sans, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
    case "inter":
    default:
      return "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
  }
}

function buttonShape(a?: Appearance) {
  if (a?.button === "sharp") return "rounded-xl";
  if (a?.button === "soft") return "rounded-2xl";
  return "rounded-full";
}

function radiusClass(a?: Appearance) {
  const r = a?.radius ?? 28;
  if (r >= 30) return "rounded-[30px]";
  if (r >= 28) return "rounded-[28px]";
  if (r >= 24) return "rounded-3xl";
  return "rounded-2xl";
}

function modeLabel(mode: ModeId) {
  if (mode === "services") return "Services";
  if (mode === "booking") return "Booking";
  if (mode === "digital") return "Digital drop";
  return "Shop";
}

function badgeLabel(b?: ItemBadge) {
  if (b === "popular") return "Popular";
  if (b === "limited") return "Limited";
  return null;
}

async function getSite(handle: string) {
  const res = await fetch(`/api/site?handle=${encodeURIComponent(handle)}`, { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  return { res, data };
}

function readLocal(handle: string): BuildConfig | null {
  try {
    const raw = localStorage.getItem(storageKey(handle));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.handle) return null;
    return parsed as BuildConfig;
  } catch {
    return null;
  }
}

function writeLocal(handle: string, cfg: any) {
  try {
    localStorage.setItem(storageKey(handle), JSON.stringify(cfg));
  } catch {}
}

// ✅ UPDATED: match new /api/site response shape
function normalizeConfigFromApi(data: any): BuildConfig | null {
  // new route returns: { ok, site, config }
  const cfg = data?.config ?? data?.site?.config ?? null;
  if (!cfg?.handle) return null;
  return cfg as BuildConfig;
}

function patternCss(bg: NonNullable<Appearance["background"]>, accent: string) {
  if (bg === "none") return "none";

  if (bg === "grid") {
    return `
      linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)
    `;
  }

  if (bg === "dots") {
    return `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.10) 1px, transparent 0)`;
  }

  return `
    radial-gradient(circle at 20% 10%, ${hexToRgba(accent, 0.22)}, transparent 55%),
    radial-gradient(circle at 80% 90%, rgba(255,255,255,0.06), transparent 60%)
  `;
}

function normalizeUrl(raw?: string) {
  const s = String(raw || "").trim();
  if (!s) return "";
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.includes(".")) return `https://${s}`;
  return s;
}

function mapsUrl(addr?: string) {
  const s = String(addr || "").trim();
  if (!s) return "";
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s)}`;
}

/* =======================
   Page
======================= */
export default function HandlePage() {
  const params = useParams();
  const router = useRouter();
  const sp = useSearchParams();

  const handle = useMemo(() => safeHandle((params as any)?.handle), [params]);
  const preview = sp.get("preview") === "1";

  // signals
  const published = sp.get("published") || "";
  const success = sp.get("success") || "";
  const canceled = sp.get("canceled") || "";

  const [cfg, setCfg] = useState<BuildConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [shareUrl, setShareUrl] = useState("");
  useEffect(() => {
    if (!handle) return;
    setShareUrl(`${window.location.origin}/u/${handle}`);
  }, [handle]);

  // toast banner
  const [banner, setBanner] = useState<null | { tone: "good" | "warn"; msg: string }>(null);
  useEffect(() => {
    if (success === "1") setBanner({ tone: "good", msg: "Payment successful ✅" });
    else if (canceled === "1") setBanner({ tone: "warn", msg: "Payment canceled" });
    else setBanner(null);
  }, [success, canceled]);

  const loadedRef = useRef<string>("");

  useEffect(() => {
    if (!handle) return;

    const key = `${handle}|preview=${preview}|published=${published}|success=${success}|canceled=${canceled}`;
    if (loadedRef.current === key) return;
    loadedRef.current = key;

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setErr(null);

      // Preview mode: draft-only
      if (preview) {
        const local = readLocal(handle);
        if (!cancelled) {
          setCfg(local);
          setLoading(false);
          if (!local) setErr("No draft found for this handle yet.");
        }
        return;
      }

      try {
        const out = await getSite(handle);
        if (cancelled) return;

        if (out.res.ok) {
          const normalized = normalizeConfigFromApi(out.data);
          if (normalized) {
            setCfg(normalized);
            setLoading(false);
            writeLocal(handle, normalized);
            return;
          }
        }

        // Fallback: local draft
        const local = readLocal(handle);
        if (local) {
          setCfg(local);
          setLoading(false);
          setErr(out?.data?.error ? `Using local draft (${out.data.error})` : "Using local draft");
          return;
        }

        setCfg(null);
        setLoading(false);
        setErr(out?.data?.error || "Not found");
      } catch (e: any) {
        const local = readLocal(handle);
        if (local) {
          setCfg(local);
          setLoading(false);
          setErr("Using local draft (network error loading publish).");
          return;
        }

        setCfg(null);
        setLoading(false);
        setErr(e?.message || "Failed to load");
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [handle, preview, published, success, canceled]);

  /* =======================
     Stripe Checkout
  ======================= */
  async function startCheckout(item: BuildItem) {
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle,
          mode: cfg?.mode,
          item_title: item.title,
          item_price: item.price,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data?.error || data?.detail || "Checkout failed.");
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      alert("Checkout failed (no url returned).");
    } catch {
      alert("Checkout error.");
    }
  }

  const a = cfg?.appearance;
  const accent = a?.accent || "#22D3EE";

  const bgMode: BgMode = a?.bgMode || "solid";
  const bgColor = a?.bgColor || "#000000";
  const bgType = a?.background || "glow";
  const bgImage = a?.bgImage || "";
  const bgOverlay = clamp(Number(a?.bgOverlay ?? 0.45), 0, 0.9);
  const gradient = a?.gradient || { c1: "#22D3EE", c2: "#A78BFA", angle: 135 };

  const layout: LayoutMode = a?.layout || "cards";
  const ctaStyle: CtaStyle = a?.ctaStyle || "accent";
  const ctaShine = a?.ctaShine !== false;

  // advanced toggles (default ON)
  const logoShape = a?.logoShape || "square";
  const headerStyle = a?.headerStyle || "hero";
  const showPoweredBy = a?.showPoweredBy !== false;
  const showStaff = a?.showStaff !== false;
  const showSocials = a?.showSocials !== false;
  const ctaText = (a?.ctaText || "").trim();

  const fontFamily = fontFamilyCss(a?.fontFamily);

  // ✅ layer-aware background
  const bgLayers = useMemo(() => {
    const layers: string[] = [];
    const repeats: string[] = [];
    const sizes: string[] = [];
    const positions: string[] = [];

    // Base layer
    if (bgMode === "image" && bgImage) {
      layers.push(
        `linear-gradient(rgba(0,0,0,${bgOverlay}), rgba(0,0,0,${bgOverlay})), url(${bgImage})`
      );
      repeats.push("no-repeat");
      sizes.push("cover");
      positions.push("center");
    } else if (bgMode === "gradient") {
      layers.push(
        `linear-gradient(${Number(gradient.angle) || 135}deg, ${gradient.c1 || "#22D3EE"}, ${gradient.c2 || "#A78BFA"})`
      );
      repeats.push("no-repeat");
      sizes.push("cover");
      positions.push("center");
    }

    // Pattern layer
    const pat = patternCss(bgType, accent);
    if (pat && pat !== "none") {
      layers.push(pat);

      if (bgType === "grid") {
        repeats.push("repeat");
        sizes.push("42px 42px, 42px 42px");
        positions.push("center");
      } else if (bgType === "dots") {
        repeats.push("repeat");
        sizes.push("18px 18px");
        positions.push("top left");
      } else {
        repeats.push("no-repeat");
        sizes.push("cover");
        positions.push("center");
      }
    }

    return { layers, repeats, sizes, positions };
  }, [bgMode, bgImage, bgOverlay, gradient.angle, gradient.c1, gradient.c2, bgType, accent]);

  const bgStyle = useMemo<React.CSSProperties>(() => {
    const hasLayers = bgLayers.layers.length > 0;

    return {
      backgroundColor: bgMode === "solid" ? bgColor : "#000000",
      backgroundImage: hasLayers ? bgLayers.layers.join(", ") : "none",
      backgroundRepeat: hasLayers ? bgLayers.repeats.join(", ") : "no-repeat",
      backgroundSize: hasLayers ? bgLayers.sizes.join(", ") : "cover",
      backgroundPosition: hasLayers ? bgLayers.positions.join(", ") : "center",
      opacity: 1,
    };
  }, [bgLayers, bgMode, bgColor]);

  const buttonTextColor =
    ctaStyle === "white" ? "#000000" : isLightHex(accent) ? "#000000" : "#0b0b0b";

  const ctaBg = ctaStyle === "white" ? "#FFFFFF" : accent;
  const ctaShadow = ctaStyle === "white" ? "rgba(255,255,255,0.12)" : hexToRgba(accent, 0.22);

  // socials
  const social = cfg?.social;
  const ig = (social?.instagram || "").trim();
  const tt = (social?.tiktok || "").trim();
  const web = normalizeUrl(social?.website);
  const tel = (social?.phone || "").trim();
  const addr = (social?.address || "").trim();

  const igUrl = ig ? `https://instagram.com/${ig.replace(/^@/, "")}` : "";
  const ttUrl = tt ? `https://tiktok.com/@${tt.replace(/^@/, "")}` : "";
  const telUrl = tel ? `tel:${tel.replace(/[^0-9+]/g, "")}` : "";
  const mapUrl = mapsUrl(addr);

  const hasQuickLinks = !!(igUrl || ttUrl || web || telUrl || mapUrl);

  function CtaLabel() {
    if (!cfg) return null;
    if (ctaText) return <>{ctaText}</>;
    if (cfg.mode === "booking") return <>Book & Pay</>;
    if (cfg.mode === "digital") return <>Get access</>;
    return <>Buy now</>;
  }

  function CtaIcon() {
    if (!cfg) return null;
    if (cfg.mode === "booking") return <CalendarClock className="inline h-4 w-4 mr-1" />;
    if (cfg.mode === "digital") return <Gift className="inline h-4 w-4 mr-1" />;
    return <ShoppingBag className="inline h-4 w-4 mr-1" />;
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setBanner({ tone: "good", msg: "Link copied 🔗" });
      setTimeout(() => setBanner(null), 1500);
    } catch {
      setBanner({ tone: "warn", msg: "Couldn’t copy link" });
      setTimeout(() => setBanner(null), 1500);
    }
  }

  async function nativeShare() {
    try {
      // @ts-ignore
      if (navigator.share) {
        // @ts-ignore
        await navigator.share({ title: cfg?.brandName || "Scanly", url: shareUrl });
      } else {
        await copyLink();
      }
    } catch {
      // user canceled share – no big
    }
  }

  const logoRound = (a?.logoShape || "square") === "circle" ? "rounded-full" : "rounded-2xl";

  function ItemCard({ it, i }: { it: BuildItem; i: number }) {
    const badge = badgeLabel(it.badge);

    return (
      <motion.div
        key={`${it.title}-${i}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-4 transition"
      >
        <div className="flex justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-semibold truncate">{it.title}</div>
              {badge ? (
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    it.badge === "popular"
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-50"
                      : "border-amber-400/30 bg-amber-500/10 text-amber-50"
                  )}
                >
                  {badge}
                </span>
              ) : null}
            </div>

            {it.note ? <div className="text-xs text-white/60">{it.note}</div> : null}
          </div>

          <div className="font-semibold whitespace-nowrap">{it.price}</div>
        </div>

        <button
          onClick={() => startCheckout(it)}
          className={cn(
            "group relative mt-3 w-full px-4 py-3 text-sm font-semibold transition active:scale-[0.99] overflow-hidden",
            buttonShape(a)
          )}
          style={{
            backgroundColor: ctaBg,
            color: buttonTextColor,
            boxShadow: `0 12px 38px ${ctaShadow}`,
          }}
        >
          {ctaShine ? (
            <span
              className="pointer-events-none absolute inset-0 opacity-70 group-hover:opacity-95"
              style={{
                backgroundImage:
                  "linear-gradient(120deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.25) 35%, rgba(255,255,255,0.00) 70%)",
                animation: "scanlyShine 2.2s ease-in-out infinite",
                transform: "translateX(-55%)",
                mixBlendMode: "overlay",
              }}
            />
          ) : null}

          <span className="relative">
            <CtaIcon />
            <CtaLabel />
          </span>
        </button>
      </motion.div>
    );
  }

  function ItemMenuRow({ it, i }: { it: BuildItem; i: number }) {
    const badge = badgeLabel(it.badge);
    return (
      <motion.button
        key={`${it.title}-${i}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -1 }}
        onClick={() => startCheckout(it)}
        className="w-full text-left rounded-2xl border border-white/10 bg-black/25 backdrop-blur-xl px-4 py-3 transition hover:bg-black/30"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="font-semibold truncate">{it.title}</div>
              {badge ? (
                <span
                  className={cn(
                    "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                    it.badge === "popular"
                      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-50"
                      : "border-amber-400/30 bg-amber-500/10 text-amber-50"
                  )}
                >
                  {badge}
                </span>
              ) : null}
            </div>
            {it.note ? <div className="text-xs text-white/60 truncate">{it.note}</div> : null}
          </div>

          <div className="shrink-0">
            <div className="font-semibold whitespace-nowrap">{it.price}</div>
            <div className="mt-1 text-[11px] text-white/60 inline-flex items-center gap-1 justify-end">
              <CtaIcon />
              <span className="relative top-[1px]">{ctaText || "Tap"}</span>
            </div>
          </div>
        </div>
      </motion.button>
    );
  }

  function StaffSection() {
    const staff = cfg?.staffProfiles || [];
    if (!staff.length) return null;

    return (
      <div className="mt-6">
        <div className="mb-2 text-xs font-semibold text-white/80">Team</div>

        <div className="grid gap-3 sm:grid-cols-2">
          {staff.map((p, idx) => (
            <motion.div
              key={`${p.name}-${idx}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/10 bg-black/25 backdrop-blur-xl p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{p.name}</div>
                  <div className="text-xs text-white/60 truncate">{p.role}</div>
                </div>
                <div className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/5 px-2 py-1 text-[11px] text-white/80">
                  <Star className="h-3.5 w-3.5" />
                  {p.rating || "5.0"}
                </div>
              </div>

              {p.bio ? <div className="mt-2 text-xs text-white/70">{p.bio}</div> : null}

              {p.next?.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {p.next.slice(0, 3).map((t, i) => (
                    <div
                      key={`${t}-${i}`}
                      className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-white/5 px-2 py-1 text-[11px] text-white/75"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {t}
                    </div>
                  ))}
                </div>
              ) : null}
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen text-white" style={{ fontFamily }}>
      <style>{`
        @keyframes scanlyShine {
          0% { transform: translateX(-60%); }
          55% { transform: translateX(110%); }
          100% { transform: translateX(110%); }
        }
      `}</style>

      <div className="fixed inset-0 pointer-events-none" style={bgStyle} />

      <motion.div
        className="fixed -top-24 -right-24 h-72 w-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: hexToRgba(accent, 0.18) }}
        animate={{ y: [0, 18, 0], x: [0, -10, 0] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto max-w-2xl px-4 py-8 pb-28">
        <div className="mb-5 flex items-center justify-between gap-2">
          <button
            onClick={() => router.push("/create")}
            className="rounded-2xl border border-white/12 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 transition"
          >
            <ArrowLeft className="inline h-4 w-4 mr-1" />
            Builder
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={copyLink}
              className="rounded-2xl border border-white/12 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 transition"
              title="Copy link"
            >
              <Copy className="inline h-4 w-4 mr-1" />
              Copy
            </button>

            <button
              onClick={nativeShare}
              className="rounded-2xl border border-white/12 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 transition"
              title="Share"
            >
              <Share2 className="inline h-4 w-4 mr-1" />
              Share
            </button>

            {shareUrl ? (
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-2xl border border-white/12 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 transition"
              >
                <ExternalLink className="inline h-4 w-4 mr-1" />
                Open
              </a>
            ) : null}
          </div>
        </div>

        {banner ? (
          <div
            className={cn(
              "mb-4 rounded-2xl border px-4 py-3 text-sm backdrop-blur-xl",
              banner.tone === "good"
                ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-50"
                : "border-amber-400/30 bg-amber-500/10 text-amber-50"
            )}
          >
            {banner.msg}
          </div>
        ) : null}

        <div className={cn("border border-white/10 bg-white/5 backdrop-blur-xl p-5", radiusClass(a))}>
          {loading ? (
            <div className="animate-pulse h-20 bg-white/10 rounded-2xl" />
          ) : !cfg ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
              <div className="font-semibold text-white/85">Nothing published here yet</div>
              <div className="mt-1">{err || "Not found"}</div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => router.push(`/create?handle=${encodeURIComponent(handle)}`)}
                  className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-white/90 transition"
                >
                  Create this mini-app
                </button>
                <button
                  onClick={() => router.push("/create")}
                  className="rounded-2xl border border-white/12 bg-white/5 px-4 py-2 text-sm font-semibold text-white/85 hover:bg-white/10 transition"
                >
                  Go to builder
                </button>
              </div>
            </div>
          ) : (
            <>
              {headerStyle === "minimal" ? (
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={cn(
                      "grid h-11 w-11 place-items-center overflow-hidden border border-white/12 bg-black/30",
                      logoRound
                    )}
                  >
                    {cfg.brandLogo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={cfg.brandLogo} alt="Logo" className="h-full w-full object-contain p-2" />
                    ) : (
                      <Sparkles className="h-5 w-5 text-white/70" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h1 className="text-xl font-semibold truncate">{cfg.brandName}</h1>
                    <p className="text-sm text-white/70 truncate">{cfg.tagline}</p>
                  </div>

                  <div className="ml-auto h-3 w-3 rounded-full border border-white/20" style={{ background: accent }} />
                </div>
              ) : (
                <div className="mb-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "grid h-12 w-12 place-items-center overflow-hidden border border-white/12 bg-black/30",
                        logoRound
                      )}
                    >
                      {cfg.brandLogo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cfg.brandLogo} alt="Logo" className="h-full w-full object-contain p-2" />
                      ) : (
                        <Sparkles className="h-5 w-5 text-white/70" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs text-white/60 flex items-center gap-2">
                        <Sparkles className="h-3 w-3" />
                        {modeLabel(cfg.mode)}
                      </div>
                      <h1 className="text-2xl font-semibold mt-2">{cfg.brandName}</h1>
                      <p className="text-sm text-white/70">{cfg.tagline}</p>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full border border-white/20" style={{ background: accent }} />
                    </div>
                  </div>

                  <div className="mt-4 h-px w-full bg-white/10" />
                </div>
              )}

              {cfg.items?.length ? (
                <>
                  {layout === "tiles" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {cfg.items.map((it, i) => (
                        <ItemCard it={it} i={i} key={`${it.title}-${i}`} />
                      ))}
                    </div>
                  ) : layout === "menu" ? (
                    <div className="grid gap-2">
                      {cfg.items.map((it, i) => (
                        <ItemMenuRow it={it} i={i} key={`${it.title}-${i}`} />
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {cfg.items.map((it, i) => (
                        <ItemCard it={it} i={i} key={`${it.title}-${i}`} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
                  No items yet.
                </div>
              )}

              {cfg && showStaff ? <StaffSection /> : null}

              {showPoweredBy ? (
                <div className="mt-6 text-xs text-white/50 flex items-center gap-2">
                  <BadgeCheck className="h-4 w-4" />
                  Powered by Scanly
                  {err ? <span className="ml-2 text-white/40">• {err}</span> : null}
                </div>
              ) : err ? (
                <div className="mt-6 text-xs text-white/40">{err}</div>
              ) : null}
            </>
          )}
        </div>
      </div>

      {cfg && showSocials && hasQuickLinks ? (
        <div className="fixed bottom-4 left-0 right-0 z-50 px-4">
          <div className="mx-auto max-w-2xl rounded-3xl border border-white/12 bg-black/55 backdrop-blur-xl px-3 py-2">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {igUrl ? (
                <a
                  href={igUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-2 text-xs font-semibold text-white/85 hover:bg-white/10 transition"
                >
                  <Instagram className="h-4 w-4" />
                  IG
                </a>
              ) : null}

              {ttUrl ? (
                <a
                  href={ttUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-2 text-xs font-semibold text-white/85 hover:bg-white/10 transition"
                >
                  <Sparkles className="h-4 w-4" />
                  TikTok
                </a>
              ) : null}

              {web ? (
                <a
                  href={web}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-2 text-xs font-semibold text-white/85 hover:bg-white/10 transition"
                >
                  <Globe className="h-4 w-4" />
                  Site
                </a>
              ) : null}

              {telUrl ? (
                <a
                  href={telUrl}
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-2 text-xs font-semibold text-white/85 hover:bg-white/10 transition"
                >
                  <Phone className="h-4 w-4" />
                  Call
                </a>
              ) : null}

              {mapUrl ? (
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-2 text-xs font-semibold text-white/85 hover:bg-white/10 transition"
                >
                  <MapPin className="h-4 w-4" />
                  Map
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
