
import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Download } from "lucide-react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabaseclient";

// Type definitions
type Item = {
  title?: string;
  price?: string;
  note?: string;
  image?: string;
  badge?: string;
};
type StaffProfile = {
  name: string;
  rating?: string;
  role?: string;
  specialties?: string[];
};
type Social = {
  instagram?: string;
  tiktok?: string;
  website?: string;
  phone?: string;
  address?: string;
};
type Day = {
  enabled: boolean;
  start?: string;
  end?: string;
};
type Availability = {
  days: Record<string, Day>;
  slotMinutes: number;
  advanceDays: number;
};
type Appearance = {
  radius?: number;
  accentMode?: string;
  accentGradient?: { c1: string; c2: string; angle: number };
  accent?: string;
  ctaStyle?: string;
  ctaShine?: boolean;
  logoShape?: string;
  logoFit?: string;
  headerStyle?: string;
  fontFamily?: string;
  headerBg?: string;
  ctaText?: string;
  showSocials?: boolean;
  showStaff?: boolean;
  showHours?: boolean;
  showPoweredBy?: boolean;
};
export type StorefrontPreviewProps = {
  brandName?: string;
  tagline?: string;
  items?: Item[];
  appearance?: Appearance;
  staffProfiles?: StaffProfile[];
  ownerEmail?: string;
  brandLogo?: string;
  social?: Social;
  availability?: Availability;
  notifications?: any;
  mode?: string;
  handle?: string; // ✅ Added handle as optional prop
  payments?: {
    enabled: boolean;
    depositRequired: boolean;
    depositPercentage: number;
    currencyCode: string;
  };
};

// Utility functions (typed)
function cn(...c: (string | undefined | false | null)[]): string {
  return c.filter(Boolean).join(" ");
}
function hexToRgba(hex: string = "#22D3EE", alpha: number = 0.2): string {
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function StorefrontPreview(props: StorefrontPreviewProps) {
  // Get handle from props first (preferred), then try URL params as fallback
  const params = useParams();
  const handle = props.handle || (params?.handle as string) || "";

  // Booking state
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [bookingStep, setBookingStep] = useState<"browse" | "confirm" | "success">("browse");
  const [slots, setSlots] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTeamMember, setSelectedTeamMember] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const qrCanvasRef = useRef<HTMLImageElement>(null);

  // Accept all config fields as props
  const {
    brandName = "",
    tagline = "",
    items = [],
    appearance = {},
    staffProfiles = [],
    ownerEmail = "",
    brandLogo = "",
    social = {},
    availability = { days: {}, slotMinutes: 30, advanceDays: 7 },
    notifications = {},
    mode = "services",
    payments = { enabled: false, depositRequired: false, depositPercentage: 50, currencyCode: "usd" },
  } = props;

  // Fetch slots and team members when modal opens for services
  useEffect(() => {
    // Only fetch if we have a handle and the booking modal is open (selectedItem is set)
    if (!selectedItem || !handle || mode !== 'services') {
      console.log("⏭️ Skipping fetch - selectedItem:", !!selectedItem, "mode:", mode, "handle:", handle);
      return;
    }
    
    console.log(`🚀 Starting fetch for handle: ${handle}, mode: ${mode}`);
    
    const fetchData = async () => {
      try {
        console.log(`📋 Fetching slots and team for handle: ${handle}`);
        const [slotsRes, teamRes] = await Promise.all([
          fetch(`/api/slots?handle=${encodeURIComponent(handle)}`),
          fetch(`/api/team?handle=${encodeURIComponent(handle)}`),
        ]);
        
        console.log('📊 Slots response status:', slotsRes.status);
        console.log('📊 Team response status:', teamRes.status);
        
        const slotsData = await slotsRes.json();
        const teamData = await teamRes.json();
        
        console.log("✅ Slots fetched:", slotsData.slots?.length || 0, "slots:", slotsData);
        console.log("✅ Team members fetched:", teamData.team?.length || 0, "team:", teamData);
        
        setSlots(slotsData.slots || []);
        setTeamMembers(teamData.team || []);
      } catch (err) {
        console.error("❌ Failed to fetch slots or team:", err);
        setSlots([]);
        setTeamMembers([]);
      }
    };
    
    fetchData();
    
    // Subscribe to real-time changes for slots and team members
    const slotSubscription = supabase
      .channel(`slots-${handle}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slots' }, (payload: any) => {
        console.log('🔄 Slot changed:', payload.eventType, payload.new);
        // Refetch slots to show updated availability
        fetchData();
      })
      .subscribe();
    
    const teamSubscription = supabase
      .channel(`team-${handle}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members', filter: `creator_handle=eq.${handle}` }, (payload: any) => {
        console.log('🔄 Team member changed:', payload.eventType, payload.new);
        // Refetch team members to show updates
        fetchData();
      })
      .subscribe();
    
    const siteSubscription = supabase
      .channel(`site-${handle}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sites', filter: `handle=eq.${handle}` }, (payload: any) => {
        console.log('🔄 Site config updated:', payload.new);
        // Refetch everything when site settings change
        fetchData();
      })
      .subscribe();
    
    return () => {
      slotSubscription.unsubscribe();
      teamSubscription.unsubscribe();
      siteSubscription.unsubscribe();
    };
  }, [selectedItem, handle, mode]);

  // Create booking
  const createBooking = async () => {
    // For services, require date and slot
    if (mode === 'services' && (!selectedDate || !selectedSlot)) {
      setBookingError("Please select a date and time slot");
      return;
    }

    // Always require customer name and email
    if (!customerName.trim() || !customerEmail.trim()) {
      setBookingError("Please enter your name and email");
      return;
    }

    setBookingLoading(true);
    setBookingError(null);

    try {
      // For products/digital products, create order first then redirect to Stripe
      if (mode === "products" || mode === "digital") {
        // Create order in database first
        const orderRes = await fetch("/api/orders/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            handle,
            customer_name: customerName.trim(),
            customer_email: customerEmail.trim(),
            item_title: selectedItem?.title,
            item_price: selectedItem?.price,
            mode: mode,
          }),
        });

        if (!orderRes.ok) {
          const data = await orderRes.json();
          throw new Error(data.error || "Failed to create order");
        }

        const orderData = await orderRes.json();
        
        // Now redirect to Stripe checkout with order ID (POST request)
        const checkoutRes = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            handle: handle || "",
            mode: mode,
            item_title: selectedItem?.title || "",
            item_price: selectedItem?.price || "",
            customer_name: customerName.trim(),
            customer_email: customerEmail.trim(),
            order_id: orderData.order?.id || "",
          }),
        });

        if (!checkoutRes.ok) {
          const data = await checkoutRes.json();
          throw new Error(data.error || "Checkout failed");
        }

        const checkoutData = await checkoutRes.json();
        
        // Redirect to Stripe checkout URL
        if (checkoutData.url) {
          window.location.href = checkoutData.url;
        } else {
          throw new Error("No checkout URL returned");
        }
        return;
      }

      // For services, check if payment is required
      if (payments?.enabled) {
        // Redirect to booking checkout with deposit
        const checkoutParams = new URLSearchParams({
          handle: handle || "",
          slot_id: selectedSlot.id,
          team_member_id: selectedTeamMember || "",
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim(),
          item_title: selectedItem?.title || "",
          item_price: selectedItem?.price || "",
        });
        window.location.href = `/api/bookings/checkout?${checkoutParams.toString()}`;
        return;
      }

      // No payment required for services - create booking immediately
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle,
          slot_id: selectedSlot.id,
          team_member_id: selectedTeamMember || null,
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim(),
          item_title: selectedItem?.title,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Booking failed");
      }

      const bookingData = await res.json();
      
      // Generate QR code for check-in - encode booking confirmation
      const qrText = `${handle}|${customerEmail}|${new Date(selectedSlot.start_time).toISOString()}`;
      try {
        const qrDataUrl = await QRCode.toDataURL(qrText, { width: 200, margin: 2 });
        setQrCodeUrl(qrDataUrl);
      } catch (qrErr) {
        console.error("Failed to generate QR code:", qrErr);
      }

      setBookingStep("success");
    } catch (err: any) {
      setBookingError(err.message || "Failed to create booking");
    } finally {
      setBookingLoading(false);
    }
  };

  const resetBooking = () => {
    setSelectedItem(null);
    setBookingStep("browse");
    setSelectedSlot(null);
    setSelectedDate("");
    setSelectedTeamMember("");
    setCustomerName("");
    setCustomerEmail("");
    setBookingError(null);
    setQrCodeUrl("");
  };

  // Derived values (copied from create page)
  const cardRadius = appearance.radius || 16;
  const accentMode = appearance.accentMode || "solid";
  const accentGradient = appearance.accentGradient || { c1: "#22D3EE", c2: "#A78BFA", angle: 135 };
  const accent = accentMode === "gradient"
    ? `linear-gradient(${accentGradient.angle}deg, ${accentGradient.c1}, ${accentGradient.c2})`
    : (appearance.accent || "#22D3EE");
  const accentSolid = accentMode === "gradient" ? accentGradient.c1 : (appearance.accent || "#22D3EE");
  const ctaBg = (appearance.ctaStyle || "accent") === "white" ? "#ffffff" : accent;
  const ctaFg = "#000000";
  const shine = appearance.ctaShine !== false;
  const logoRound = (appearance.logoShape || "square") === "circle" ? "rounded-full" : "rounded-2xl";
  const logoFit = appearance.logoFit || "contain";
  const headerStyle = appearance.headerStyle || "hero";
  const previewFontFamily = (() => {
    switch (appearance.fontFamily || "inter") {
      case "poppins": return "var(--font-poppins), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
      case "sora": return "var(--font-sora), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
      case "space": return "var(--font-space), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
      case "jakarta": return "var(--font-jakarta), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
      case "dmsans": return "var(--font-dmsans), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
      case "inter": default: return "var(--font-inter), ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial";
    }
  })();
  const headerBg = appearance.headerBg
    ? appearance.headerBg
    : accentMode === "gradient"
      ? `linear-gradient(135deg, ${accentGradient.c1} 0%, ${accentGradient.c2} 100%)`
      : `linear-gradient(135deg, ${accentSolid}bb 0%, ${hexToRgba(accentSolid, 0.6)} 100%)`;

  // Main phone preview (copied and adapted from create page)
  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
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
      <div
        className={
          // On mobile: full screen, no centering. On desktop: center and box.
          "w-full h-full min-h-screen flex justify-center items-center sm:bg-transparent bg-black"
        }
        style={{
          minHeight: '100vh',
          width: '100vw',
          padding: 0,
          margin: 0,
        }}
      >
        <div
          className={
            // On mobile: full screen, no max-width. On desktop: boxed phone frame.
            "relative w-full h-full sm:mx-auto sm:w-full sm:max-w-xs sm:h-[700px] flex flex-col items-center justify-center"
          }
          style={{
            height: '100vh',
            maxWidth: '100vw',
          }}
        >
          {/* Phone frame with glass effect */}
          <div
            className={
              "sm:rounded-[28px] border border-white/12 bg-black/45 p-0 sm:p-3 h-full w-full"
            }
            style={{
              borderRadius: '0px',
              height: '100vh',
              width: '100vw',
              maxWidth: '100vw',
              padding: 0,
            }}
          >
            <div
              className={
                "relative overflow-hidden sm:rounded-[28px] border border-white/12 bg-black h-full flex flex-col"
              }
              style={{
                borderRadius: '0px',
                height: '100vh',
                width: '100vw',
                maxWidth: '100vw',
              }}
            >
              {/* Header bar */}
              <div className="flex items-center justify-between px-4 py-2 text-[11px] text-white/80 border-b border-white/10 bg-black/70 flex-shrink-0">
                <span className="inline-flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5" />
                  Live
                </span>
                <span className="text-white/60">{brandName || "Brand basics"}</span>
              </div>
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-b-xl z-10" />
              {/* Screen content - scrollable */}
              <div className="relative overflow-y-scroll scrollbar-hide flex-1" style={{ fontFamily: previewFontFamily }}>
                {/* Header - conditional hero vs minimal */}
                {headerStyle === "hero" ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative h-40 overflow-hidden"
                    style={{ background: headerBg }}
                  >
                    {/* Shimmer overlay */}
                    <motion.div
                      className="absolute inset-0"
                      style={{ background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)` }}
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
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
                        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1) inset" }}
                      >
                        {brandLogo ? (
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
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white"
                  >
                    <div className={cn("h-12 w-12 border border-gray-200 bg-gray-50 grid place-items-center overflow-hidden shadow-sm", logoRound)}>
                      {brandLogo ? (
                        <img
                          src={brandLogo}
                          alt="Logo"
                          className={cn("h-full w-full", logoFit === "cover" ? "object-cover" : "object-contain p-1.5")}
                        />
                      ) : (
                        <Sparkles className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-base font-bold text-gray-900 truncate">{brandName || "Your Brand"}</h2>
                      <p className="text-xs text-gray-500 truncate">{tagline || "Your tagline here"}</p>
                    </div>
                  </motion.div>
                )}
                {/* Items list */}
                <div className="px-3 pb-4 space-y-2.5 bg-gradient-to-b from-gray-50 to-white">
                  <motion.div
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
                    {/* Cards layout - default */}
                    {items.map((item: Item, idx: number) => (
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
                              <img src={item.image} alt={item.title || "Item"} className="w-full h-full object-cover" />
                            ) : (
                              <>
                                {/* Shimmer */}
                                <motion.div
                                  className="absolute inset-0"
                                  style={{ background: `linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)` }}
                                  animate={{ x: ["-100%", "200%"] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
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
                              <span className="font-bold text-xs flex-shrink-0" style={{ color: accentSolid }}>
                                {item.price || "$0"}
                              </span>
                            </div>
                            <p className="text-[9px] text-gray-600 mb-1.5 leading-relaxed font-semibold">
                              {mode === "services" ? "60 min • Book online" : item.note || "Details here"}
                            </p>
                            <motion.button
                              className="w-full py-1.5 text-[10px] font-black shadow-md relative overflow-hidden cursor-pointer"
                              style={{
                                background: ctaBg,
                                color: ctaFg,
                                borderRadius: `${Math.min(cardRadius * 0.6, 12)}px`,
                              }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setSelectedItem(item);
                                setBookingStep("confirm");
                              }}
                            >
                              {shine && (
                                <motion.div
                                  className="absolute inset-0"
                                  style={{ background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)` }}
                                  animate={{ x: ["-100%", "200%"] }}
                                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                />
                              )}
                              <span className="relative z-10">
                                {appearance.ctaText?.trim() || (mode === "services" ? "Book" : mode === "products" ? "Add" : "Get")}
                              </span>
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                  {/* Social + Contact Buttons Section */}
                  {(appearance.showSocials ?? true) && (social.instagram || social.tiktok || social.website || social.phone || social.address) && (
                    <div className="px-3 pb-3 bg-gray-50">
                      <div className="pt-3 pb-2">
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">📞 Get in Touch</h3>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {social.instagram && (
                          <button className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-[8px] font-bold" style={{ borderRadius: `${Math.min(cardRadius * 0.5, 8)}px` }}>
                            📷 Instagram
                          </button>
                        )}
                        {social.tiktok && (
                          <button className="flex items-center gap-1 px-2 py-1 bg-black text-white text-[8px] font-bold" style={{ borderRadius: `${Math.min(cardRadius * 0.5, 8)}px` }}>
                            🎵 TikTok
                          </button>
                        )}
                        {social.website && (
                          <button className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-[8px] font-bold" style={{ borderRadius: `${Math.min(cardRadius * 0.5, 8)}px` }}>
                            🌐 Website
                          </button>
                        )}
                        {social.phone && (
                          <button className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-[8px] font-bold" style={{ borderRadius: `${Math.min(cardRadius * 0.5, 8)}px` }}>
                            📞 Call
                          </button>
                        )}
                        {social.address && (
                          <button className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-[8px] font-bold" style={{ borderRadius: `${Math.min(cardRadius * 0.5, 8)}px` }}>
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
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">👥 Our Team</h3>
                        <span className="text-[9px] text-gray-500 font-medium">{staffProfiles.length} staff</span>
                      </div>
                      <div className="space-y-2">
                        {staffProfiles.slice(0, 2).map((staff: StaffProfile, idx: number) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 + idx * 0.1 }}
                            className="rounded-lg border p-2 bg-white shadow-sm"
                            style={{ borderRadius: `${cardRadius}px`, borderColor: `${appearance.accent || "#22D3EE"}30` }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ background: accentSolid }}>
                                {staff.name.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-bold text-gray-900 truncate">{staff.name}</span>
                                  <span className="text-[8px] text-yellow-600">⭐ {staff.rating}</span>
                                </div>
                                <div className="text-[8px] text-gray-600 truncate">{staff.role} • {staff.specialties?.slice(0, 2).join(", ")}</div>
                              </div>
                              <button className="px-2 py-1 text-[8px] font-bold text-white" style={{ backgroundColor: accentSolid, borderRadius: `${Math.min(cardRadius * 0.5, 8)}px` }}>
                                Book
                              </button>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Business Hours Section - optional for all modes */}
                  {(appearance.showHours ?? false) && availability.days && (
                    <div className="px-3 pb-3 bg-gray-50">
                      <div className="pt-3 pb-2">
                        <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">🕐 Hours</h3>
                      </div>
                      <div className="space-y-1">
                        {Object.entries(availability.days)
                          .filter(([_dayId, day]) => (day as Day).enabled)
                          .slice(0, 3)
                          .length > 0 ? (
                            Object.entries(availability.days)
                              .filter(([_dayId, day]) => (day as Day).enabled)
                              .slice(0, 3)
                              .map(([dayId, day], idx) => {
                                const d = day as Day;
                                return (
                                  <div key={dayId} className="flex justify-between items-center text-[9px]">
                                    <span className="text-gray-700 font-semibold capitalize">
                                      {dayId === 'tue' ? 'Tue' : dayId === 'thu' ? 'Thu' : dayId.charAt(0).toUpperCase() + dayId.slice(1)}
                                    </span>
                                    <span className="text-gray-600">{d.start} - {d.end}</span>
                                  </div>
                                );
                              })
                          ) : (
                            <div className="flex justify-between items-center text-[9px]">
                              <span className="text-gray-700 font-semibold">Hours</span>
                              <span className="text-gray-500">Set in Details tab</span>
                            </div>
                          )}
                        <div className="flex justify-between items-center text-[8px] pt-1 border-t border-gray-200">
                          <span className="text-gray-500">
                            {mode === "services"
                              ? `${availability.slotMinutes}min slots • ${availability.advanceDays} days ahead`
                              : `Open ${availability.advanceDays} days a week`}
                          </span>
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 font-bold rounded" style={{ borderRadius: `${Math.min(cardRadius * 0.3, 4)}px` }}>
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
                        Powered by <span className="font-bold text-gray-700">Piqo</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal - appears when user taps Book */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center"
            onClick={resetBooking}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:w-96 sm:rounded-2xl bg-white text-gray-900 shadow-xl"
              style={{ borderTopLeftRadius: bookingStep === "browse" ? "24px" : "8px", borderTopRightRadius: bookingStep === "browse" ? "24px" : "8px" }}
            >
              {/* Close button */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b bg-white">
                <span className="text-sm font-semibold">
                  {bookingStep === "success" 
                    ? "✓ Confirmed!" 
                    : mode === 'services' 
                      ? "Book " + selectedItem.title 
                      : "Get product now"}
                </span>
                <button
                  onClick={resetBooking}
                  className="p-1 hover:bg-gray-100 rounded-lg transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 max-h-[70vh] overflow-y-auto">
                {bookingStep === "confirm" ? (
                  <>
                    {/* Booking/Product Confirmation Form */}
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold mb-2">{mode === 'services' ? 'Service' : 'Item'}: {selectedItem.title}</p>
                        <p className="text-xs text-gray-600">{selectedItem.price}</p>
                      </div>

                      {/* Show booking fields ONLY for services */}
                      {mode === 'services' && (
                        <>
                          {/* Date Picker */}
                          <div>
                            <label className="block text-xs font-semibold mb-2">Select a date</label>
                            <input
                              type="date"
                              value={selectedDate}
                              onChange={(e) => {
                                setSelectedDate(e.target.value);
                                setSelectedSlot(null); // Reset slot when date changes
                              }}
                              min={new Date().toISOString().split('T')[0]}
                              max={new Date(Date.now() + (availability?.advanceDays || 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cyan-500"
                            />
                          </div>

                          {/* Time Slot Picker */}
                          <div>
                            <label className="block text-xs font-semibold mb-2">Select a time slot</label>
                            {!selectedDate ? (
                              <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
                                Please select a date first
                              </div>
                            ) : slots.length === 0 ? (
                              <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
                                No available slots for this date. Try another date or contact directly.
                              </div>
                            ) : (
                              <div className="grid grid-cols-3 gap-2">
                                {slots
                                  .filter((slot: any) => new Date(slot.start_time).toLocaleDateString() === new Date(selectedDate).toLocaleDateString())
                                  .slice(0, 9)
                                  .map((slot: any) => (
                                  <button
                                    key={slot.id}
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`p-2 rounded-lg text-xs font-semibold transition ${
                                      selectedSlot?.id === slot.id
                                        ? "bg-cyan-500 text-white"
                                        : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                                    }`}
                                  >
                                    {new Date(slot.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Team Member Selector */}
                          <div>
                            <label className="block text-xs font-semibold mb-2">
                              Choose your specialist 
                              {teamMembers.length > 0 && <span className="text-gray-500">({teamMembers.length})</span>}
                            </label>
                            {teamMembers.length === 0 ? (
                              <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
                                No specialists available. Booking is open to anyone.
                              </div>
                            ) : (
                              <select
                                value={selectedTeamMember}
                                onChange={(e) => setSelectedTeamMember(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cyan-500"
                              >
                                <option value="">Any available</option>
                                {teamMembers.map((member: any) => (
                                  <option key={member.id} value={member.name}>
                                    {member.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </>
                      )}

                      {/* Customer Info */}
                      <div>
                        <label className="block text-xs font-semibold mb-1">Your name</label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1">Email</label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="john@example.com"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      {bookingError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                          {bookingError}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <button
                        onClick={createBooking}
                        disabled={bookingLoading || (mode === 'services' && !selectedSlot) || !customerName || !customerEmail}
                        className="w-full py-3 rounded-lg font-semibold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: !bookingLoading && (mode !== 'services' || selectedSlot) && customerName && customerEmail ? accentSolid : "#ccc",
                        }}
                      >
                        {bookingLoading 
                          ? (mode === 'services' ? "Booking..." : "Processing...") 
                          : (mode === 'services' ? "Confirm Booking" : "Continue to Payment")}
                      </button>
                      <button
                        onClick={resetBooking}
                        className="w-full py-2 rounded-lg font-semibold border border-gray-200 hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : bookingStep === "success" ? (
                  <>
                    {/* Success Screen */}
                    <div className="text-center space-y-4 py-6">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="text-5xl mx-auto"
                      >
                        ✓
                      </motion.div>
                      <div>
                        <h3 className="text-lg font-bold">Booking Confirmed!</h3>
                        <p className="text-xs text-gray-600 mt-1">We'll send a confirmation email shortly</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg space-y-1 text-xs text-left">
                        <div><strong>Service:</strong> {selectedItem.title}</div>
                        <div><strong>Customer:</strong> {customerName}</div>
                        <div><strong>Email:</strong> {customerEmail}</div>
                        {selectedSlot && (
                          <div><strong>Time:</strong> {new Date(selectedSlot.start_time).toLocaleDateString()} {new Date(selectedSlot.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                        )}
                        {selectedTeamMember && (
                          <div><strong>Specialist:</strong> {teamMembers.find((tm: any) => tm.id === selectedTeamMember)?.name || "Selected"}</div>
                        )}
                      </div>

                      {/* QR Code for Check-in */}
                      {qrCodeUrl && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex flex-col items-center gap-3 p-4 bg-white rounded-lg border border-gray-200"
                        >
                          <p className="text-xs font-semibold text-gray-700">Scan for Check-in</p>
                          <img
                            src={qrCodeUrl}
                            alt="Check-in QR Code"
                            className="w-32 h-32 rounded-lg border border-gray-300 bg-white"
                            ref={qrCanvasRef}
                          />
                          <p className="text-[10px] text-gray-500 text-center">Screenshot this QR code to check in on arrival</p>
                        </motion.div>
                      )}

                      <button
                        onClick={resetBooking}
                        className="w-full py-3 rounded-lg font-semibold text-white transition"
                        style={{ background: accentSolid }}
                      >
                        Done
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
