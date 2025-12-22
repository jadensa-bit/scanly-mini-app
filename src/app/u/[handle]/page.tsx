"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
} from "lucide-react";

/* =======================
   Types
======================= */
type ModeId = "services" | "booking" | "digital" | "products";

type BuildItem = {
  title: string;
  price: string;
  note?: string;
};

type Appearance = {
  accent?: string;
  background?: "glow" | "grid" | "dots" | "none";
  radius?: number;
  button?: "pill" | "soft" | "sharp";
};

type StaffProfile = {
  name: string;
  role: string;
  rating: string;
  bio: string;
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
};

/* =======================
   Helpers
======================= */
function cn(...c: (string | false | undefined | null)[]) {
  return c.filter(Boolean).join(" ");
}

function safeHandle(input: unknown) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 32);
}

function storageKey(handle: string) {
  return `scanly:site:${handle}`;
}

function hexToRgba(hex = "#22D3EE", alpha = 0.2) {
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
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

async function getSite(handle: string) {
  const res = await fetch(`/api/site?handle=${encodeURIComponent(handle)}`, {
    cache: "no-store",
  });
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

/** Normalize DB row shapes into BuildConfig */
function normalizeConfigFromApi(data: any): BuildConfig | null {
  const site = data?.site ?? null;
  if (!site) return null;

  // Common shapes:
  // 1) { site: { handle, config: {...BuildConfig} } }
  // 2) { site: {...BuildConfig} }
  // 3) { site: { config: { config: {...} } } } (older nesting)
  const candidate =
    site?.config?.config ??
    site?.config ??
    site;

  if (!candidate?.handle) return null;
  return candidate as BuildConfig;
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

  // these query params should trigger reloads (ex: ?published=1, ?success=1, etc.)
  const published = sp.get("published") || "";
  const success = sp.get("success") || "";
  const canceled = sp.get("canceled") || "";

  const [cfg, setCfg] = useState<BuildConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // hydration-safe share url
  const [shareUrl, setShareUrl] = useState("");
  useEffect(() => {
    if (!handle) return;
    setShareUrl(`${window.location.origin}/u/${handle}`);
  }, [handle]);

  // ✅ IMPORTANT: include preview + query signals so this re-runs after Generate
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

      // 1) Preview => local only
      if (preview) {
        const local = readLocal(handle);
        if (!cancelled) {
          setCfg(local);
          setLoading(false);
          if (!local) setErr("No draft found for this handle yet.");
        }
        return;
      }

      // 2) Normal mode: try Supabase first, then fallback to local
      try {
        const out = await getSite(handle);
        if (cancelled) return;

        if (out.res.ok && out.data?.site) {
          const normalized = normalizeConfigFromApi(out.data);
          if (normalized) {
            setCfg(normalized);
            setLoading(false);

            // keep local synced
            writeLocal(handle, normalized);
            return;
          }
        }

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
     STRIPE CHECKOUT
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

  const bgImage = useMemo(() => {
    return `
      radial-gradient(circle at 20% 10%, ${hexToRgba(accent, 0.2)}, transparent 55%),
      radial-gradient(circle at 80% 90%, rgba(255,255,255,0.06), transparent 60%)
    `;
  }, [accent]);

  return (
    <main className="min-h-screen bg-black text-white">
      <div
        className="fixed inset-0 pointer-events-none opacity-90"
        style={{
          backgroundColor: "#000",
          backgroundImage: bgImage,
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="relative mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <button
            onClick={() => router.push("/create")}
            className="rounded-2xl border border-white/12 bg-white/5 px-3 py-2 text-xs hover:bg-white/10 transition"
          >
            <ArrowLeft className="inline h-4 w-4 mr-1" />
            Builder
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

        {/* Card */}
        <div className={cn("border border-white/10 bg-white/5 p-5", radiusClass(a))}>
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
              <div className="mb-4">
                <div className="text-xs text-white/60 flex items-center gap-2">
                  <Sparkles className="h-3 w-3" />
                  {modeLabel(cfg.mode)}
                </div>
                <h1 className="text-2xl font-semibold mt-2">{cfg.brandName}</h1>
                <p className="text-sm text-white/70">{cfg.tagline}</p>
              </div>

              {/* Items */}
              <div className="grid gap-3">
                {cfg.items?.length ? (
                  cfg.items.map((it, i) => (
                    <motion.div
                      key={`${it.title}-${i}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-2xl border border-white/10 bg-black/30 p-4"
                    >
                      <div className="flex justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{it.title}</div>
                          {it.note ? <div className="text-xs text-white/60">{it.note}</div> : null}
                        </div>
                        <div className="font-semibold whitespace-nowrap">{it.price}</div>
                      </div>

                      <button
                        onClick={() => startCheckout(it)}
                        className={cn(
                          "mt-3 w-full bg-white text-black px-4 py-3 text-sm font-semibold hover:bg-white/90 transition active:scale-[0.99]",
                          buttonShape(a)
                        )}
                      >
                        {cfg.mode === "booking" ? (
                          <>
                            <CalendarClock className="inline h-4 w-4 mr-1" />
                            Book & Pay
                          </>
                        ) : cfg.mode === "digital" ? (
                          <>
                            <Gift className="inline h-4 w-4 mr-1" />
                            Get access
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="inline h-4 w-4 mr-1" />
                            Buy now
                          </>
                        )}
                      </button>
                    </motion.div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
                    No items yet.
                  </div>
                )}
              </div>

              <div className="mt-6 text-xs text-white/50 flex items-center gap-2">
                <BadgeCheck className="h-4 w-4" />
                Powered by Scanly
                {err ? <span className="ml-2 text-white/40">• {err}</span> : null}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
