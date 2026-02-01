
import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Download, ShoppingBag, User, Mail, Phone, MapPin } from "lucide-react";
import { useParams } from "next/navigation";
import QRCode from "qrcode";
import { supabase } from "@/lib/supabaseclient";
import InstallPiqoButton from "./InstallPiqoButton";

// Type definitions
type Item = {
  type?: "product" | "service" | "section" | "subsection" | "addon";
  title?: string;
  price?: string;
  note?: string;
  image?: string;
  badge?: string;
  layout?: "cards" | "menu" | "tiles";
  buttonText?: string;
  deposit?: string;
  bullets?: string[];
  itemStyle?: "normal" | "featured";
  digitalFile?: string;
  digitalFileName?: string;
  digitalFileType?: string;
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
  email?: string;
  bio?: string;
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
  timezone?: string;
  bufferMinutes?: number;
  leadTime?: number;
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
  specialMessage?: string;
  layout?: "cards" | "tiles" | "menu";
};
export type StorefrontPreviewProps = {
  brandName?: string;
  tagline?: string;
  businessDescription?: string; // NEW: Short business description
  items?: Item[];
  appearance?: Appearance;
  staffProfiles?: StaffProfile[];
  ownerEmail?: string;
  brandLogo?: string;
  profilePic?: string;
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
  delivery?: {
    enabled: boolean;
    fee: number;
    freeAbove?: number;
    estimatedTime?: string;
    zones?: string[];
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

// Convert 24-hour time to 12-hour AM/PM format
function formatTime12Hour(time24: string | undefined): string {
  if (!time24) return '';
  const [hourStr, minute] = time24.split(':');
  let hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12 || 12; // Convert 0 to 12 for midnight
  return `${hour}:${minute} ${ampm}`;
}

// Check if price should be displayed (not $0 or empty)
function shouldShowPrice(price: string | undefined): boolean {
  if (!price) return false;
  const numericPrice = parseFloat(price.replace(/[^0-9.]/g, ''));
  return numericPrice > 0;
}

// Day ordering for display (Mon-Sun)
const DAY_ORDER: Record<string, number> = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 };
const DAY_LABELS: Record<string, string> = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' };

// Badge styling helper
function getBadgeStyle(badge: string): { background: string; color: string; emoji: string } {
  switch (badge) {
    case "popular":
      return {
        background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
        color: "white",
        emoji: "🔥"
      };
    case "trending":
      return {
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        emoji: "📈"
      };
    case "new":
      return {
        background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
        color: "white",
        emoji: "✨"
      };
    case "bestseller":
      return {
        background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        color: "white",
        emoji: "⭐"
      };
    case "limited":
      return {
        background: "linear-gradient(135deg, #ffd32a 0%, #f39c12 100%)",
        color: "#1a1a1a",
        emoji: "⚡"
      };
    case "sale":
      return {
        background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
        color: "#1a1a1a",
        emoji: "🏷️"
      };
    case "exclusive":
      return {
        background: "linear-gradient(135deg, #30cfd0 0%, #330867 100%)",
        color: "white",
        emoji: "💎"
      };
    default:
      return {
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        emoji: "✨"
      };
  }
}

// Check if a slot falls within a staff member's working hours
function slotMatchesStaffSchedule(slot: any, staffMember: any): boolean {
  if (!staffMember || !staffMember.workingDays) return true; // No custom schedule
  
  const slotDate = new Date(slot.start_time);
  const dayOfWeek = slotDate.getDay(); // 0=Sun, 1=Mon, etc.
  const dayMap: Record<number, string> = { 0: 'sun', 1: 'mon', 2: 'tue', 3: 'wed', 4: 'thu', 5: 'fri', 6: 'sat' };
  const dayKey = dayMap[dayOfWeek];
  
  const staffDay = staffMember.workingDays[dayKey];
  if (!staffDay || !staffDay.enabled) return false; // Staff doesn't work this day
  
  // Check if slot time is within staff's working hours for this day
  const slotHour = slotDate.getUTCHours();
  const slotMinute = slotDate.getUTCMinutes();
  const slotTimeMinutes = slotHour * 60 + slotMinute;
  
  const [startHour, startMin] = staffDay.start.split(':').map(Number);
  const [endHour, endMin] = staffDay.end.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;
  
  return slotTimeMinutes >= startMinutes && slotTimeMinutes < endMinutes;
}

// Cart item type
type CartItem = {
  item: Item;
  quantity: number;
};

export default function StorefrontPreview(props: StorefrontPreviewProps) {
  // Get handle from props first (preferred), then try URL params as fallback
  const params = useParams();
  const handle = props.handle || (params?.handle as string) || "";

  // Destructure other props
  const brandName = props.brandName || "My Brand";
  const tagline = props.tagline || ""; // Use empty string if not provided
  const businessDescription = props.businessDescription || "";
  const items = props.items || [];
  const appearance = props.appearance || {};
  const staffProfiles = props.staffProfiles || [];
  const ownerEmail = props.ownerEmail || "";
  const brandLogo = props.brandLogo || "";
  const profilePic = props.profilePic || "";
  const social = props.social || {};
  const availability = props.availability || null;
  const mode = props.mode || "services";
  const payments = props.payments || { enabled: false, depositRequired: false, depositPercentage: 50, currencyCode: "usd" };
  const specialMessage = appearance.specialMessage || "";

  // Debug logging
  console.log('🎨 StorefrontPreview render:', { 
    social, 
    businessDescription, 
    specialMessage,
    headerStyle: appearance.headerStyle,
    showSocials: appearance.showSocials 
  });
  console.log('🎨 Items with layouts:', items?.map(item => ({ title: item.title, type: item.type, layout: item.layout })));

  // Cart state (for products, digital, and services with add-ons)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [itemQuantities, setItemQuantities] = useState<Record<number, number>>({});
  
  // Helper to get quantity for an item index
  const getItemQuantity = (idx: number) => itemQuantities[idx] || 1;
  const setItemQuantity = (idx: number, qty: number) => {
    setItemQuantities(prev => ({ ...prev, [idx]: qty }));
  };
  
  // Scroll state for hiding header
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Creator info modal
  const [showCreatorInfo, setShowCreatorInfo] = useState(false);
  
  // Image modal state
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  
  // Item details modal state
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [selectedItemDetails, setSelectedItemDetails] = useState<Item | null>(null);
  
  // Booking state
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [bookingStep, setBookingStep] = useState<"browse" | "confirm" | "success">("browse");
  const [slots, setSlots] = useState<any[]>([]);
  const [slotsData, setSlotsData] = useState<any>({}); // Full slots API response with reason
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTeamMember, setSelectedTeamMember] = useState<string>("");
  const [selectedAddOns, setSelectedAddOns] = useState<Record<string, number>>({}); // Track selected add-ons with quantities
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const qrCanvasRef = useRef<HTMLImageElement>(null);
  
  // Track if we've already attempted slot generation to prevent infinite loops
  const slotsGenerationAttempted = useRef<Record<string, boolean>>({});
  
  // Toast notification for cart actions
  const [cartToast, setCartToast] = useState<{ show: boolean; message: string }>({ show: false, message: "" });
  
  // Get available add-on items for the dropdown
  const availableAddOns = items.filter(item => 
    item.type === "product" || 
    item.type === "addon" || 
    (item.type !== "service" && item.type !== "section" && item.type !== "subsection")
  );
  
  // Debug logging
  useEffect(() => {
    if (mode === 'services') {
      console.log('🛍️ Available add-ons for dropdown:', availableAddOns);
      console.log('🛍️ All items:', items.map(i => ({ title: i.title, type: i.type })));
    }
  }, [mode, items, availableAddOns]);
  
  const showCartToast = (message: string) => {
    setCartToast({ show: true, message });
    setTimeout(() => setCartToast({ show: false, message: "" }), 2000);
  };

  // Cart helper functions
  const addToCart = (item: Item, qty: number = 1) => {
    // Don't add section headers or subsections to cart
    if (item.type === "section" || item.type === "subsection") return;
    
    console.log('🛒 Adding to cart:', { title: item.title, type: item.type, quantity: qty });
    
    setCart(prev => {
      const existing = prev.find(ci => ci.item.title === item.title);
      if (existing) {
        const updated = prev.map(ci =>
          ci.item.title === item.title
            ? { ...ci, quantity: ci.quantity + qty }
            : ci
        );
        console.log('🛒 Updated cart:', updated);
        showCartToast(`Updated ${item.title} (${existing.quantity + qty})`);
        return updated;
      }
      const newCart = [...prev, { item, quantity: qty }];
      console.log('🛒 New cart:', newCart);
      showCartToast(`Added ${item.title} to cart! 🎉`);
      return newCart;
    });
  };

  const removeFromCart = (itemTitle: string) => {
    setCart(prev => prev.filter(ci => ci.item.title !== itemTitle));
    showCartToast(`Removed ${itemTitle}`);
  };

  const updateCartQuantity = (itemTitle: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemTitle);
      return;
    }
    setCart(prev =>
      prev.map(ci =>
        ci.item.title === itemTitle ? { ...ci, quantity } : ci
      )
    );
  };

  const cartTotal = cart.reduce((total, ci) => {
    const price = parseFloat(String(ci.item.price || '0').replace(/[^0-9.]/g, ''));
    return total + (price * ci.quantity);
  }, 0);

  // Calculate delivery fee
  const deliveryFee = props.delivery?.enabled 
    ? (cartTotal >= (props.delivery.freeAbove || 0) ? 0 : (props.delivery.fee || 0))
    : 0;

  const cartTotalWithDelivery = cartTotal + deliveryFee;

  const cartItemCount = cart.reduce((count, ci) => count + ci.quantity, 0);

  console.log('🛒 Cart state:', { mode, cartItemCount, cartItems: cart.length, cart });

  // Scroll listener to hide header on scroll
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    let lastScrollTop = 0;
    const handleScroll = () => {
      const scrollTop = scrollContainer.scrollTop;
      
      // Hide header when scrolling down past 50px, show when scrolling up or at top
      if (scrollTop > 50 && scrollTop > lastScrollTop) {
        setIsHeaderVisible(false);
      } else if (scrollTop < lastScrollTop || scrollTop <= 10) {
        setIsHeaderVisible(true);
      }
      
      lastScrollTop = scrollTop;
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Debug: Log mode and availability on component mount/update
  useEffect(() => {
    console.log("📱 StorefrontPreview mounted/updated:", { 
      mode, 
      handle, 
      hasAvailability: !!availability,
      availabilityDays: availability?.days,
      enabledDays: availability?.days ? Object.entries(availability.days).filter(([_, day]) => day.enabled).map(([name]) => name) : [],
      timezone: availability?.timezone,
      slotMinutes: availability?.slotMinutes,
      bufferMinutes: availability?.bufferMinutes,
      advanceDays: availability?.advanceDays,
      leadTime: availability?.leadTime,
    });
    
    // Verify Services mode has availability
    if (mode === 'services' && !availability) {
      console.warn("⚠️ Services mode Piqo but no availability config!");
    }
    
    if (mode === 'services' && availability && !Object.values(availability.days || {}).some((day: any) => day?.enabled)) {
      console.warn("⚠️ Services mode has availability but no enabled days!");
    }
  }, [mode, handle, availability]);

  // Fetch slots and team members when modal opens for services
  useEffect(() => {
    // Only fetch if we have a handle and the booking modal is open (selectedItem is set)
    if (!selectedItem || !handle || mode !== 'services') {
      console.log("⏭️ Skipping fetch - selectedItem:", !!selectedItem, "mode:", mode, "handle:", handle);
      return;
    }
    
    console.log(`🚀 Starting fetch for handle: ${handle}, mode: ${mode}`);
    
    let isMounted = true;
    const abortController = new AbortController();
    
    const fetchData = async () => {
      if (!isMounted) {
        console.log("⏭️ Component unmounted, skipping fetch");
        return;
      }
      
      try {
        console.log(`📋 Fetching slots and team for handle: ${handle}`);
        const [slotsRes, teamRes] = await Promise.all([
          fetch(`/api/slots?handle=${encodeURIComponent(handle)}`, { signal: abortController.signal }),
          fetch(`/api/team?handle=${encodeURIComponent(handle)}`, { signal: abortController.signal }),
        ]);
        
        if (!isMounted) return;
        
        console.log('📊 Slots response status:', slotsRes.status);
        console.log('📊 Team response status:', teamRes.status);
        
        const slotsData = await slotsRes.json();
        const teamData = await teamRes.json();
        
        if (!isMounted) return;
        
        console.log("✅ Slots API response:", {
          count: slotsData.slots?.length || 0,
          reason: slotsData.reason || 'NONE',
          message: slotsData.message || 'N/A',
          ok: slotsData.ok,
        });
        console.log("✅ Team API response:", {
          count: teamData.team?.length || 0,
          source: teamData.source || 'unknown',
        });
        
        // 🔍 DEBUG: Log unique dates in slots
        if (slotsData.slots && slotsData.slots.length > 0) {
          const uniqueDates = [...new Set(slotsData.slots.map((s: any) => 
            new Date(s.start_time).toLocaleDateString()
          ))];
          console.log(`🔍 Slots span ${uniqueDates.length} unique dates:`, uniqueDates.slice(0, 10));
        }
        
        const fetchedSlots = slotsData.slots || [];
        setSlotsData(slotsData); // Store full response including reason
        setSlots(fetchedSlots);
        setTeamMembers(teamData.team || []);
        
        // Check if slots API returned a specific reason for no slots
        if (slotsData.reason === 'MISSING_AVAILABILITY' || slotsData.reason === 'NO_ENABLED_DAYS') {
          console.log(`⚠️ Availability not configured: ${slotsData.reason}`);
          return; // Don't attempt auto-generation, let UI show "not configured" message
        }
        
        // 🔍 DEBUG: Log auto-generation decision factors
        const generationKey = `${handle}-${mode}`;
        console.log("🔍 Auto-generation check:", {
          fetchedSlotsLength: fetchedSlots.length,
          alreadyAttempted: slotsGenerationAttempted.current[generationKey],
          slotsDataOk: slotsData.ok,
          willAttempt: fetchedSlots.length === 0 && !slotsGenerationAttempted.current[generationKey] && slotsData.ok !== false
        });
        
        // Only attempt auto-generation once per handle to prevent infinite loops
        // Skip if we've already tried or if triggered by realtime updates
        if (fetchedSlots.length === 0 && 
            !slotsGenerationAttempted.current[generationKey] &&
            slotsData.ok !== false) { // Only auto-generate if API didn't return an error
          console.log("🚀 No slots found, attempting auto-generation...");
          console.log("🔍 Availability config:", availability);
          const hasEnabledDays = Object.values(availability?.days || {}).some((day: any) => day?.enabled);
          console.log("🔍 Has enabled days:", hasEnabledDays, "days:", availability?.days);
          
          if (hasEnabledDays && availability) {
            console.log("✨ Auto-generating slots for", handle, "with config:", {
              daysInAdvance: availability.advanceDays || 30,
              slotMinutes: availability.slotMinutes,
              timezone: availability.timezone,
            });
            // Mark as attempted before making the request
            slotsGenerationAttempted.current[generationKey] = true;
            
            try {
              const generateRes = await fetch(`/api/slots/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  handle,
                  daysInAdvance: availability.advanceDays || 30
                }),
                signal: abortController.signal,
              });
              
              if (!isMounted) return;
              
              if (generateRes.ok) {
                const generateData = await generateRes.json();
                console.log("✅ Slots auto-generated successfully:", {
                  count: generateData.slotsCount,
                  firstSlot: generateData.firstSlot,
                  lastSlot: generateData.lastSlot,
                });
                // Re-fetch slots after generation
                const newSlotsRes = await fetch(`/api/slots?handle=${encodeURIComponent(handle)}`, { signal: abortController.signal });
                if (!isMounted) return;
                const newSlotsData = await newSlotsRes.json();
                if (!isMounted) return;
                setSlots(newSlotsData.slots || []);
              } else {
                const errData = await generateRes.json().catch(() => ({ error: 'Unknown error' }));
                console.warn("⚠️ Failed to auto-generate slots:", errData.error);
              }
            } catch (genErr: any) {
              if (genErr.name === 'AbortError') {
                console.log("⏭️ Slot generation aborted");
                return;
              }
              console.error("❌ Error auto-generating slots:", genErr);
            }
          } else {
            console.log("⏭️ No enabled days in availability config, skipping auto-generation");
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          console.log("⏭️ Fetch aborted");
          return;
        }
        console.error("❌ Failed to fetch slots or team:", err);
        if (isMounted) {
          setSlots([]);
          setTeamMembers([]);
        }
      }
    };
    
    fetchData();
    
    // Subscribe to real-time changes for slots and team members
    const slotSubscription = supabase
      .channel(`slots-${handle}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slots' }, (payload: any) => {
        console.log('🔄 Slot changed:', payload.eventType, payload.new);
        // Only refetch if component is still mounted
        if (isMounted) {
          fetchData();
        }
      })
      .subscribe();
    
    const teamSubscription = supabase
      .channel(`team-${handle}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members', filter: `creator_handle=eq.${handle}` }, (payload: any) => {
        console.log('🔄 Team member changed:', payload.eventType, payload.new);
        // Only refetch if component is still mounted
        if (isMounted) {
          fetchData();
        }
      })
      .subscribe();
    
    const siteSubscription = supabase
      .channel(`site-${handle}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sites', filter: `handle=eq.${handle}` }, (payload: any) => {
        console.log('🔄 Site config updated:', payload.new);
        // Only refetch if component is still mounted
        if (isMounted) {
          fetchData();
        }
      })
      .subscribe();
    
    return () => {
      isMounted = false;
      abortController.abort();
      slotSubscription.unsubscribe();
      teamSubscription.unsubscribe();
      siteSubscription.unsubscribe();
    };
  }, [selectedItem, handle, mode, availability]);

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
      // For products/digital products with cart functionality
      if ((mode === "products" || mode === "digital") && cart.length > 0) {
        // Create checkout session with multiple items including digital files
        const checkoutRes = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            handle: handle || "",
            mode: mode,
            customer_name: customerName.trim(),
            customer_email: customerEmail.trim(),
            items: cart.map(ci => ({
              item_title: ci.item.title || "",
              item_price: ci.item.price || "",
              quantity: ci.quantity,
              note: ci.item.note || "",
              digitalFile: ci.item.digitalFile || null,
              digitalFileName: ci.item.digitalFileName || null,
              digitalFileType: ci.item.digitalFileType || null,
            })),
          }),
        });

        if (!checkoutRes.ok) {
          const data = await checkoutRes.json();
          throw new Error(data.error || "Checkout failed");
        }

        const checkoutData = await checkoutRes.json();
        
        // If no payment required (Stripe not set up), show confirmation
        if (checkoutData.noPayment) {
          setCart([]); // Clear cart
          setShowCart(false);
          alert(`✅ Order received!\n\n${checkoutData.message}\n\nOrder ID: ${checkoutData.orderId}`);
          // Reset form
          setCustomerName("");
          setCustomerEmail("");
          setBookingLoading(false);
          return;
        }
        
        // Redirect to Stripe checkout URL
        if (checkoutData.url) {
          window.location.href = checkoutData.url;
        } else {
          throw new Error("No checkout URL returned");
        }
        return;
      }

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
      const selectedMember = teamMembers.find(m => m.id === selectedTeamMember);
      
      // Prepare add-ons data from the dropdown selections
      const bookingAddOns = Object.entries(selectedAddOns)
        .map(([key, qty]) => {
          if (qty === 0) return null;
          const addonIdx = parseInt(key.split('-').pop() || '0');
          const addon = availableAddOns[addonIdx];
          if (!addon) return null;
          return {
            item_title: addon.title,
            item_price: addon.price,
            quantity: qty,
            note: addon.note || "",
          };
        })
        .filter(Boolean);
      
      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          handle,
          slot_id: selectedSlot.id,
          // Only send team_member_id if it's a real UUID (not config-based like "config-0")
          team_member_id: (selectedTeamMember && !selectedTeamMember.startsWith('config-')) ? selectedTeamMember : null,
          team_member_name: selectedMember?.name || null,
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim(),
          item_title: selectedItem?.title,
          add_ons: bookingAddOns.length > 0 ? bookingAddOns : undefined, // Include add-ons if any selected
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
    setSelectedAddOns({}); // Clear selected add-ons
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

  // Clean storefront preview without phone frame wrapper
  return (
    <div 
      ref={scrollContainerRef}
      className="relative w-full min-h-screen overflow-y-auto scrollbar-hide bg-gray-50" 
      style={{ fontFamily: previewFontFamily }}
    >
                {/* Profile Picture in Corner */}
                {profilePic && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    className="absolute top-3 right-3 z-30"
                  >
                    <div className="h-12 w-12 rounded-full border-2 border-white/40 shadow-lg overflow-hidden bg-white/10 backdrop-blur-sm">
                      <img 
                        src={profilePic} 
                        alt="Creator" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Special Message Banner */}
                {specialMessage && (
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-2.5 text-center shadow-lg relative z-20"
                  >
                    <p className="text-white text-sm font-black drop-shadow">
                      {specialMessage}
                    </p>
                  </motion.div>
                )}

                {/* Header - conditional hero vs minimal */}
                {headerStyle === "hero" ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="relative min-h-44 flex flex-col"
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
                    <div className="flex justify-center pt-2 pb-2 flex-shrink-0">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0, y: -10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                        className={cn(
                          businessDescription ? "h-20 w-20" : "h-32 w-32",
                          "border-2 border-white/30 bg-black/40 backdrop-blur-sm grid place-items-center overflow-hidden shadow-xl",
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
                          <Sparkles className={cn(businessDescription ? "h-10 w-10" : "h-16 w-16", "text-white/70")} />
                        )}
                      </motion.div>
                    </div>
                    {/* Brand name & tagline */}
                    <div className="px-4 pb-6 text-center flex-1 flex flex-col justify-end">
                      <motion.h2
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl font-bold text-white mb-0.5 truncate drop-shadow-lg"
                      >
                        {brandName || "Your Brand"}
                      </motion.h2>
                      {tagline && (
                        <motion.p
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          className="text-white/90 text-sm font-medium drop-shadow line-clamp-2"
                        >
                          {tagline}
                        </motion.p>
                      )}
                      {businessDescription && (
                        <motion.p
                          initial={{ y: 10, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="text-white/80 text-xs mt-1 mb-2 line-clamp-2 drop-shadow"
                        >
                          {businessDescription}
                        </motion.p>
                      )}
                    </div>
                    {/* About Creator button for hero header */}
                    {(() => {
                      const hasInfo = !!(social?.bio || social?.email || social?.phone || social?.address || social?.instagram || social?.tiktok || social?.website);
                      return hasInfo ? (
                        <motion.button
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5, type: "spring" }}
                          onClick={() => setShowCreatorInfo(true)}
                          className="absolute top-3 right-3 p-2.5 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-full transition-all shadow-lg border border-white/30"
                          title="About Creator"
                        >
                          <User className="h-5 w-5 text-white" />
                        </motion.button>
                      ) : null;
                    })()}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-4 px-5 py-4 border-b border-gray-200 bg-gradient-to-b from-white to-gray-50/50"
                  >
                    <div className={cn(
                      businessDescription ? "h-16 w-16" : "h-24 w-24",
                      "border-2 border-gray-300 bg-white grid place-items-center overflow-hidden shadow-md",
                      logoRound
                    )}>
                      {brandLogo ? (
                        <img
                          src={brandLogo}
                          alt="Logo"
                          className={cn("h-full w-full", logoFit === "cover" ? "object-cover" : "object-contain p-2")}
                        />
                      ) : (
                        <Sparkles className={cn(businessDescription ? "h-7 w-7" : "h-10 w-10", "text-gray-400")} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-black text-gray-900 truncate">{brandName || "Your Brand"}</h2>
                      {tagline && (
                        <p className="text-sm text-gray-600 font-medium line-clamp-2">{tagline}</p>
                      )}
                      {businessDescription && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 font-medium">
                          {businessDescription}
                        </p>
                      )}
                    </div>
                    {/* About Creator button - show if bio or contact info exists */}
                    {(() => {
                      const hasInfo = !!(social?.bio || social?.email || social?.phone || social?.address || social?.instagram || social?.tiktok || social?.website);
                      return hasInfo ? (
                        <button
                          onClick={() => setShowCreatorInfo(true)}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                          title="About Creator"
                        >
                          <User className="h-5 w-5 text-gray-600" />
                        </button>
                      ) : null;
                    })()}
                  </motion.div>
                )}
                {/* Items list - ONLY for products/digital modes */}
                {(mode === "products" || mode === "digital") && (
                <div className="px-4 pb-6 space-y-3 bg-gradient-to-b from-gray-50 via-white to-gray-50">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-center justify-between pt-4 pb-3 border-b border-gray-200">
                      <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                        <span className="text-lg">
                          {mode === "products" ? "🔥" : "💎"}
                        </span>
                        {mode === "products" ? "Items" : "Digital"}
                      </h3>
                      <span className="text-xs text-gray-600 font-bold bg-gray-100 px-3 py-1 rounded-full">{items.filter(it => it.type !== "section" && it.type !== "subsection").length}</span>
                    </div>
                    {/* Individual layout rendering - each item controls its own layout */}
                    <div className="mt-3">
                      {items.map((item: Item, idx: number) => {
                        // Get individual item layout (defaults to "cards")
                        const itemLayout = item.layout || "cards";
                        
                        // Section header - always full width
                        if (item.type === "section") {
                            return (
                              <div key={idx} className="col-span-2 my-4 first:mt-1">
                                <div className="flex items-center gap-2 px-1">
                                  <div className="h-[2px] w-10 rounded-full" style={{ background: accentSolid }} />
                                  <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: accentSolid }}>
                                    {item.title || "SECTION"}
                                  </h3>
                                  <div className="h-[2px] flex-1 rounded-full" style={{ background: `linear-gradient(90deg, ${accentSolid}, transparent)` }} />
                                </div>
                                {item.note && (
                                  <p className="text-xs text-gray-600 font-medium px-1 mt-1 italic">{item.note}</p>
                                )}
                              </div>
                            );
                          }
                          
                          // Subsection
                          if (item.type === "subsection") {
                            return (
                              <div key={idx} className="col-span-2 my-3 first:mt-1 ml-3">
                                <div className="flex items-center gap-2 px-1">
                                  <div className="h-[1.5px] w-7 rounded-full" style={{ background: `${accentSolid}80` }} />
                                  <h4 className="text-xs font-bold uppercase tracking-wide" style={{ color: `${accentSolid}cc` }}>
                                    {item.title || "Subsection"}
                                  </h4>
                                  <div className="h-[1.5px] flex-1 rounded-full" style={{ background: `linear-gradient(90deg, ${hexToRgba(accentSolid, 0.5)}, transparent)` }} />
                                </div>
                                {item.note && (
                                  <p className="text-xs text-gray-500 font-medium px-1 mt-1 italic">{item.note}</p>
                                )}
                              </div>
                            );
                          }

                          // TILES LAYOUT - compact 2-column
                          if (itemLayout === "tiles") {
                            return (
                              <div key={idx} className="w-1/2 inline-block align-top px-1.5 mb-3">
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 + idx * 0.05 }}
                                className="overflow-hidden border-2 shadow-md hover:shadow-lg transition-all relative group cursor-pointer h-full"
                                style={{
                                  borderRadius: `${cardRadius}px`,
                                  borderColor: `${accentSolid}40`,
                                  background: `linear-gradient(135deg, white 0%, ${hexToRgba(accentSolid, 0.05)} 100%)`,
                                }}
                                whileHover={{ y: -2 }}
                                onClick={() => {
                                  setSelectedItemDetails(item);
                                  setShowItemDetails(true);
                                }}
                              >
                                <div className="relative h-24 overflow-hidden">
                                  {item.image ? (
                                    <img src={item.image} alt={item.title || "Item"} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-2xl"
                                      style={{ background: `linear-gradient(135deg, ${accentSolid}, ${hexToRgba(accentSolid, 0.6)})` }}>
                                      <span>{mode === "products" ? "🛍️" : "⚡"}</span>
                                    </div>
                                  )}
                                  {item.badge && item.badge !== "none" && (
                                    <span className="absolute top-1.5 right-1.5 rounded-lg px-2 py-0.5 text-[8px] font-black uppercase shadow-lg"
                                      style={{
                                        background: getBadgeStyle(item.badge).background,
                                        color: getBadgeStyle(item.badge).color,
                                      }}>
                                      {getBadgeStyle(item.badge).emoji}
                                    </span>
                                  )}
                                </div>
                                <div className="p-2.5">
                                  <h4 className="text-xs font-black text-gray-900 mb-1 line-clamp-2">{item.title || "Item"}</h4>
                                  {item.note && <p className="text-[10px] text-gray-600 mb-2 line-clamp-2">{item.note}</p>}
                                  {shouldShowPrice(item.price) && (
                                    <div className="text-xs font-black mb-2" style={{ color: accentSolid }}>{item.price}</div>
                                  )}
                                  <motion.button
                                    className="w-full py-2 text-[10px] font-black"
                                    style={{
                                      background: ctaBg,
                                      color: ctaFg,
                                      borderRadius: `${Math.min(cardRadius * 0.6, 10)}px`,
                                    }}
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const itemType = item.type || "product";
                                      if (itemType === "product" || mode === "digital") {
                                        addToCart(item, getItemQuantity(idx));
                                        setItemQuantity(idx, 1);
                                      } else if (itemType === "service") {
                                        setSelectedItem(item);
                                        setBookingStep("confirm");
                                      }
                                    }}
                                  >
                                    {item.buttonText || appearance.ctaText?.trim() || "Add"}
                                  </motion.button>
                                </div>
                              </motion.div>
                              </div>
                            );
                          }

                          // MENU LAYOUT - compact horizontal row
                          if (itemLayout === "menu") {
                            return (
                              <motion.div
                                key={idx}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 + idx * 0.05 }}
                                className="flex gap-2 p-3 rounded-xl border-2 shadow-sm hover:shadow-md transition-all cursor-pointer mb-3"
                                style={{
                                  borderColor: `${accentSolid}30`,
                                  background: `linear-gradient(90deg, white 0%, ${hexToRgba(accentSolid, 0.05)} 100%)`,
                                }}
                                whileHover={{ x: 2 }}
                                onClick={() => {
                                  setSelectedItemDetails(item);
                                  setShowItemDetails(true);
                                }}
                              >
                                {item.image && (
                                  <div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden">
                                    <img src={item.image} alt={item.title || "Item"} className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-black text-xs text-gray-900 truncate">{item.title || "Item"}</h4>
                                  {item.note && <p className="text-[10px] text-gray-600 truncate">{item.note}</p>}
                                </div>
                                {shouldShowPrice(item.price) && (
                                  <span className="font-black text-xs flex-shrink-0" style={{ color: accentSolid }}>{item.price}</span>
                                )}
                              </motion.div>
                            );
                          }

                          // CARDS LAYOUT - full width with details (default)
                          return (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.5 + idx * 0.05 }}
                              className="overflow-hidden border-2 shadow-md hover:shadow-lg transition-all relative group cursor-pointer mb-3"
                              style={{
                                borderRadius: `${cardRadius}px`,
                                borderColor: `${accentSolid}40`,
                                background: `linear-gradient(135deg, white 0%, ${hexToRgba(accentSolid, 0.05)} 100%)`,
                              }}
                              whileHover={{ y: -2 }}
                              onClick={() => {
                                setSelectedItemDetails(item);
                                setShowItemDetails(true);
                              }}
                            >
                              {/* Image/Icon */}
                              <div 
                                className="relative h-24 overflow-hidden cursor-pointer group/image"
                                onClick={() => {
                                  if (item.image) {
                                    setSelectedImage(item.image);
                                    setShowImageModal(true);
                                  }
                                }}
                              >
                                {item.image ? (
                                  <>
                                    <img src={item.image} alt={item.title || "Item"} className="w-full h-full object-cover transition-transform group-hover/image:scale-110" />
                                    {/* Zoom indicator overlay */}
                                    <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-all flex items-center justify-center">
                                      <div className="opacity-0 group-hover/image:opacity-100 transition-opacity bg-white/90 rounded-full p-1.5 shadow-lg">
                                        <svg className="w-4 h-4 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                        </svg>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <div 
                                    className="w-full h-full flex items-center justify-center text-2xl relative overflow-hidden"
                                    style={{ background: `linear-gradient(135deg, ${accentSolid}, ${hexToRgba(accentSolid, 0.6)})` }}
                                  >
                                    <motion.div
                                      className="absolute inset-0"
                                      style={{ background: `linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)` }}
                                      animate={{ x: ["-100%", "200%"] }}
                                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    />
                                    <span className="relative z-10">
                                      {mode === "products" ? "🛍️" : "⚡"}
                                    </span>
                                  </div>
                                )}
                                {item.badge && item.badge !== "none" && (
                                  <motion.span
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="absolute top-1.5 right-1.5 rounded-lg px-2 py-0.5 text-[8px] font-black uppercase shadow-lg"
                                    style={{
                                      background: getBadgeStyle(item.badge).background,
                                      color: getBadgeStyle(item.badge).color,
                                    }}
                                  >
                                    {getBadgeStyle(item.badge).emoji}
                                  </motion.span>
                                )}
                              </div>
                              {/* Content */}
                              <div className="p-2.5">
                                <h4 className="text-xs font-black text-gray-900 mb-1 line-clamp-2">{item.title || "Item"}</h4>
                                {item.note && (
                                  <p className="text-[10px] text-gray-600 mb-2 line-clamp-2 leading-snug">{item.note}</p>
                                )}
                                {shouldShowPrice(item.price) && (
                                  <div className="text-xs font-black mb-2" style={{ color: accentSolid }}>{item.price}</div>
                                )}
                                <motion.button
                                  className="w-full py-2 text-[10px] font-black relative overflow-hidden"
                                  style={{
                                    background: ctaBg,
                                    color: ctaFg,
                                    borderRadius: `${Math.min(cardRadius * 0.6, 10)}px`,
                                  }}
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={(e) => {
                                    e.stopPropagation(); // Prevent modal from opening
                                    const itemType = item.type || "product";
                                    if (itemType === "product" || mode === "digital") {
                                      addToCart(item, getItemQuantity(idx));
                                      setItemQuantity(idx, 1);
                                    } else if (itemType === "service") {
                                      setSelectedItem(item);
                                      setBookingStep("confirm");
                                    }
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
                                    {item.buttonText || appearance.ctaText?.trim() || (mode === "products" ? "Add" : "Get")}
                                  </span>
                                </motion.button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  </div>
                )}
              
              {/* SERVICES MODE */}
              {mode === "services" && (
                <div>
                  {bookingStep === "browse" && (
                    <div>
                      {/* Add-ons info banner - only show if there are product/addon items */}
                      {items.some(item => item.type === "product" || item.type === "addon") && (
                        <div className="px-4 pt-4 pb-2">
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-xl shadow-md"
                            style={{ borderColor: accentSolid }}
                          >
                            <div className="flex items-start gap-3">
                              <span className="text-2xl">🛒</span>
                              <div className="flex-1">
                                <p className="text-sm font-black text-gray-900 mb-1">
                                  Add Extras Before Booking!
                                </p>
                                <p className="text-xs text-gray-700 font-medium">
                                  Browse add-ons below and tap "Add to Cart" to include them with your booking.
                                </p>
                              </div>
                            </div>
                            {cartItemCount > 0 && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="mt-3 pt-3 border-t-2 border-blue-200"
                              >
                                <p className="text-xs font-bold flex items-center gap-2" style={{ color: accentSolid }}>
                                  <span>✓</span>
                                  <span>{cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} in cart • ${cartTotal.toFixed(2)}</span>
                                </p>
                              </motion.div>
                            )}
                          </motion.div>
                        </div>
                      )}
                      {/* Services List - Organized by sections/subsections */}
                      <div className="px-4 py-4">
                        <div className="grid grid-cols-2 gap-2">
                        {items.map((item, idx) => {
                          // Get individual item layout (defaults to "cards")
                          const itemLayout = item.layout || "cards";
                          
                          // Debug log to verify layout changes
                          if (typeof window !== 'undefined' && item.type !== 'section' && item.type !== 'subsection') {
                            console.log(`[Services Layout] ${item.title}: type="${item.type}" layout="${item.layout}" → using "${itemLayout}"`);
                          }
                          
                          // Section Header rendering - completely different from products
                          if (item.type === "section") {
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + idx * 0.1 }}
                            className="my-1.5 first:mt-1 col-span-full -mx-4 px-4"
                          >
                            {/* Full-width section divider */}
                            <div className="px-2 mb-3">
                              <div className="flex items-center gap-3 mb-2">
                                <div 
                                  className="h-[3px] w-12 rounded-full flex-shrink-0"
                                  style={{ background: accentSolid }}
                                />
                                <div 
                                  className="h-[3px] flex-1 rounded-full"
                                  style={{ background: `linear-gradient(90deg, ${accentSolid}, transparent)` }}
                                />
                              </div>
                              <h3 
                                className="text-xl font-black uppercase tracking-wider break-words"
                                style={{ color: accentSolid }}
                              >
                                {item.title || "SECTION"}
                              </h3>
                            </div>
                            {item.note && (
                              <p className="text-sm text-gray-600 font-medium px-2 mb-2 italic">
                                {item.note}
                              </p>
                            )}
                          </motion.div>
                        );
                      }

                      // Subsection rendering - smaller, indented
                      if (item.type === "subsection") {
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 + idx * 0.1 }}
                            className="my-1 first:mt-0.5 ml-0 col-span-full -mx-4 px-4"
                          >
                            <div className="px-2 mb-2">
                              <div className="flex items-center gap-2 mb-1.5">
                                <div 
                                  className="h-[2px] w-6 rounded-full flex-shrink-0"
                                  style={{ background: `${accentSolid}80` }}
                                />
                                <div 
                                  className="h-[2px] flex-1 rounded-full"
                                  style={{ background: `linear-gradient(90deg, ${hexToRgba(accentSolid, 0.5)}, transparent)` }}
                                />
                              </div>
                              <h4 
                                className="text-sm font-bold uppercase tracking-wide break-words"
                                style={{ color: `${accentSolid}cc` }}
                              >
                                {item.title || "Subsection"}
                              </h4>
                            </div>
                            {item.note && (
                              <p className="text-xs text-gray-500 font-medium px-2 mb-2 italic">
                                {item.note}
                              </p>
                            )}
                          </motion.div>
                        );
                      }

                      // MENU LAYOUT - compact horizontal row
                      if (itemLayout === "menu") {
                        return (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + idx * 0.05 }}
                            className="col-span-2 flex gap-2 p-3 rounded-xl border-2 shadow-sm hover:shadow-md transition-all cursor-pointer relative"
                            style={{
                              borderColor: `${accentSolid}30`,
                              background: `linear-gradient(90deg, white 0%, ${hexToRgba(accentSolid, 0.05)} 100%)`,
                            }}
                            whileHover={{ x: 2 }}
                            onClick={() => {
                              setSelectedItemDetails(item);
                              setShowItemDetails(true);
                            }}
                          >
                            {item.image && (
                              <div className="w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden">
                                <img src={item.image} alt={item.title || "Item"} className="w-full h-full object-cover" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-black text-xs text-gray-900 truncate">{item.title || "Item"}</h4>
                              {item.note && <p className="text-[10px] text-gray-600 truncate">{item.note}</p>}
                            </div>
                            {shouldShowPrice(item.price) && (
                              <span className="font-black text-xs flex-shrink-0" style={{ color: accentSolid }}>{item.price}</span>
                            )}
                          </motion.div>
                        );
                      }

                      // TILES LAYOUT - compact tiles
                      if (itemLayout === "tiles") {
                        return (
                          <div key={idx} className="col-span-1">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.5 + idx * 0.05 }}
                              className="overflow-hidden border-2 shadow-md hover:shadow-lg transition-all cursor-pointer h-full relative"
                              style={{
                                borderRadius: `${cardRadius}px`,
                                borderColor: `${accentSolid}40`,
                                background: `linear-gradient(135deg, white 0%, ${hexToRgba(accentSolid, 0.05)} 100%)`,
                              }}
                              whileHover={{ y: -2 }}
                              onClick={() => {
                                setSelectedItemDetails(item);
                                setShowItemDetails(true);
                              }}
                            >
                              <div className="relative h-20 overflow-hidden">
                                {item.image ? (
                                  <img src={item.image} alt={item.title || "Item"} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xl"
                                    style={{ background: `linear-gradient(135deg, ${accentSolid}, ${hexToRgba(accentSolid, 0.6)})` }}>
                                    <span>✂️</span>
                                  </div>
                                )}
                              </div>
                              <div className="p-2">
                                <h4 className="text-xs font-black text-gray-900 mb-1 line-clamp-1">{item.title || "Service"}</h4>
                                {shouldShowPrice(item.price) && (
                                  <div className="text-xs font-black" style={{ color: accentSolid }}>{item.price}</div>
                                )}
                              </div>
                            </motion.div>
                          </div>
                        );
                      }

                      // CARDS LAYOUT (default) - full width cards
                      return (
                      <motion.div
                        key={idx}
                        className="col-span-2 mb-3 overflow-hidden border-2 shadow-lg hover:shadow-xl transition-all duration-200 group relative cursor-pointer"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + idx * 0.1 }}
                        style={{
                          borderRadius: `${cardRadius}px`,
                          borderColor: `${accentSolid}50`,
                          background: `linear-gradient(135deg, white 0%, ${hexToRgba(accentSolid, 0.08)} 100%)`,
                        }}
                        whileHover={{ y: -2, scale: 1.01 }}
                        onClick={() => {
                          setSelectedItemDetails(item);
                          setShowItemDetails(true);
                        }}
                      >
                        <div className="flex gap-3 p-3 relative z-10">
                          {/* Item image or icon */}
                          <motion.div
                            className="w-20 h-20 rounded-xl flex-shrink-0 relative overflow-hidden shadow-md cursor-pointer border-2 border-white/50"
                            style={{
                              background: item.image ? "transparent" : `linear-gradient(135deg, ${accentSolid}, ${hexToRgba(accentSolid, 0.7)})`,
                            }}
                            whileHover={{ scale: 1.1, rotate: 2 }}
                            transition={{ duration: 0.2 }}
                            onClick={() => {
                              if (item.image) {
                                setSelectedImage(item.image);
                                setShowImageModal(true);
                              }
                            }}
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
                            <div className="flex items-start justify-between mb-1 gap-2">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <h4 className="font-black text-gray-900 text-sm leading-tight truncate">
                                  {item.title || "Item"}
                                </h4>
                                {item.badge && item.badge !== "none" && (
                                  <motion.span
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-wide flex-shrink-0 shadow-lg relative overflow-hidden"
                                    style={{
                                      background: getBadgeStyle(item.badge).background,
                                      color: getBadgeStyle(item.badge).color,
                                      boxShadow: `0 2px 10px ${hexToRgba(getBadgeStyle(item.badge).color === "white" ? "#ff6b6b" : "#ffd32a", 0.6)}, inset 0 1px 0 rgba(255,255,255,0.3)`,
                                    }}
                                  >
                                    <span className="relative z-10 flex items-center gap-1">
                                      {getBadgeStyle(item.badge).emoji} {item.badge.charAt(0).toUpperCase() + item.badge.slice(1)}
                                    </span>
                                  </motion.span>
                                )}
                              </div>
                              {shouldShowPrice(item.price) && (
                                <span className="font-black text-sm flex-shrink-0" style={{ color: accentSolid }}>
                                  {item.price}
                                </span>
                              )}
                            </div>
                            {item.note && (
                              <p className="text-xs text-gray-700 mb-2 leading-relaxed font-medium">
                                {item.note}
                              </p>
                            )}
                            {item.type === "product" || item.type === "addon" ? (
                              <div className="flex gap-2">
                                <div className="flex items-center border-2 rounded-xl overflow-hidden bg-white shadow-md" style={{ borderColor: `${accentSolid}60` }}>
                                  <button
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      setItemQuantity(idx, Math.max(1, getItemQuantity(idx) - 1)); 
                                    }}
                                    className="px-3 py-2 text-sm font-black hover:bg-gray-100 transition-colors duration-200"
                                    style={{ color: accentSolid }}
                                  >
                                    −
                                  </button>
                                  <span className="px-3 text-sm font-black min-w-[30px] text-center text-gray-900">{getItemQuantity(idx)}</span>
                                  <button
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      setItemQuantity(idx, getItemQuantity(idx) + 1); 
                                    }}
                                    className="px-3 py-2 text-sm font-black hover:bg-gray-100 transition-colors duration-200"
                                    style={{ color: accentSolid }}
                                  >
                                    +
                                  </button>
                                </div>
                                <motion.button
                                  className="flex-1 py-2.5 text-xs font-black shadow-lg hover:shadow-xl relative overflow-hidden cursor-pointer"
                                  style={{
                                    background: ctaBg,
                                    color: ctaFg,
                                    borderRadius: `${Math.min(cardRadius * 0.6, 12)}px`,
                                  }}
                                  whileHover={{ scale: 1.05, y: -1 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(item, getItemQuantity(idx));
                                    setItemQuantity(idx, 1);
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
                                  <span className="relative z-10 flex items-center justify-center gap-1.5">
                                    <span className="text-sm">🛒</span> Add to Cart
                                  </span>
                                </motion.button>
                              </div>
                            ) : (
                              <motion.button
                                className="w-full py-2.5 text-xs font-black shadow-lg hover:shadow-xl relative overflow-hidden cursor-pointer"
                                style={{
                                  background: ctaBg,
                                  color: ctaFg,
                                  borderRadius: `${Math.min(cardRadius * 0.6, 12)}px`,
                                }}
                                whileHover={{ scale: 1.05, y: -1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
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
                                <span className="relative z-10 flex items-center justify-center gap-1.5">
                                  <span className="text-sm">📅</span>
                                  {appearance.ctaText?.trim() || "Book Now"}
                                </span>
                              </motion.button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                        </div>
                      </div>
                      {/* Social + Contact Buttons Section */}
                      {(appearance.showSocials ?? true) && (social.instagram || social.tiktok || social.website || social.phone || social.address || handle) && (
                        <div className="px-4 pb-4 bg-gradient-to-b from-white to-gray-50">
                          <div className="pt-4 pb-3 border-t border-gray-200">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                              <span className="text-lg">💬</span> Connect
                            </h3>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {handle && (
                              <a 
                                href={`/profile/${handle}`}
                                className="flex items-center gap-1.5 px-3 py-2 text-white text-xs font-black hover:shadow-lg hover:scale-105 transition-all duration-200" 
                                style={{ 
                                  borderRadius: `${Math.min(cardRadius * 0.5, 8)}px`,
                                  background: `linear-gradient(135deg, ${accentSolid} 0%, ${hexToRgba(accentSolid, 0.8)} 100%)`
                                }}
                              >
                                👤 View Profile
                              </a>
                            )}
                            {social.instagram && (
                              <a 
                                href={`https://instagram.com/${social.instagram.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-black hover:shadow-lg hover:scale-105 transition-all duration-200" 
                                style={{ borderRadius: `${Math.min(cardRadius * 0.5, 8)}px` }}
                              >
                                📷 Instagram
                              </a>
                            )}
                            {social.tiktok && (
                              <a 
                                href={`https://tiktok.com/@${social.tiktok.replace('@', '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-2 bg-black text-white text-xs font-black hover:shadow-lg hover:scale-105 transition-all duration-200" 
                                style={{ borderRadius: `${Math.min(cardRadius * 0.5, 8)}px` }}
                              >
                                🎵 TikTok
                              </a>
                            )}
                            {social.website && (
                              <a 
                                href={social.website.startsWith('http') ? social.website : `https://${social.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-[8px] font-bold hover:shadow-lg transition-shadow" 
                                style={{ borderRadius: `${Math.min(cardRadius * 0.5, 8)}px` }}
                              >
                                🌐 Website
                              </a>
                            )}
                            {social.phone && (
                              <a 
                                href={`tel:${social.phone}`}
                                className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-[8px] font-bold hover:shadow-lg transition-shadow" 
                                style={{ borderRadius: `${Math.min(cardRadius * 0.5, 8)}px` }}
                              >
                                📞 Call
                              </a>
                            )}
                            {social.address && (
                              <a 
                                href={`https://maps.google.com/?q=${encodeURIComponent(social.address)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-[8px] font-bold hover:shadow-lg transition-shadow" 
                                style={{ borderRadius: `${Math.min(cardRadius * 0.5, 8)}px` }}
                              >
                                📍 Directions
                              </a>
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
                            {staffProfiles.slice(0, 2).map((staff: any, idx: number) => {
                              const hasCustomHours = staff.workingDays && Object.values(staff.workingDays).some((day: any) => day?.enabled);
                              const enabledDays = hasCustomHours 
                                ? Object.entries(staff.workingDays).filter(([_, day]) => (day as any)?.enabled)
                                : [];
                              
                              return (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: 0.6 + idx * 0.1 }}
                                  className="rounded-xl border-2 p-3 bg-white shadow-lg hover:shadow-xl transition-all duration-200"
                                  style={{ borderRadius: `${cardRadius}px`, borderColor: `${appearance.accent || "#22D3EE"}50` }}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="h-14 w-14 rounded-full flex items-center justify-center text-white font-black text-lg shadow-md" style={{ background: accentSolid }}>
                                      {staff.name.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5 mb-0.5">
                                        <span className="text-sm font-black text-gray-900 truncate">{staff.name}</span>
                                        <span className="text-xs text-yellow-600 flex items-center gap-0.5">⭐ {staff.rating}</span>
                                      </div>
                                      <div className="text-xs text-gray-700 font-medium truncate mb-1">{staff.role} • {staff.specialties?.slice(0, 2).join(", ")}</div>
                                      {hasCustomHours && enabledDays.length > 0 && (
                                        <div className="text-[10px] text-gray-600 mt-1 font-medium">
                                          🕐 {enabledDays.length} days • {formatTime12Hour((enabledDays[0][1] as any).start)}-{formatTime12Hour((enabledDays[0][1] as any).end)}
                                        </div>
                                      )}
                                    </div>
                                    <button className="px-3 py-2 text-xs font-black text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200" style={{ backgroundColor: accentSolid, borderRadius: `${Math.min(cardRadius * 0.5, 8)}px` }}>
                                      Book
                                    </button>
                                  </div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {/* Business Hours Section - optional for all modes */}
                      {(appearance.showHours ?? false) && availability?.days && (
                        <div className="px-4 pb-4 bg-gradient-to-b from-white to-gray-50">
                          <div className="pt-4 pb-3 border-t border-gray-200">
                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider flex items-center gap-2">
                              <span className="text-lg">🕐</span> Hours
                            </h3>
                          </div>
                          <div className="space-y-1.5 bg-white border-2 border-gray-200 rounded-xl p-3 shadow-md">
                            {Object.entries(availability.days)
                              .filter(([_dayId, day]) => (day as Day).enabled)
                              .length > 0 ? (
                                Object.entries(availability.days)
                                  .filter(([_dayId, day]) => (day as Day).enabled)
                                  .sort(([dayA], [dayB]) => (DAY_ORDER[dayA] || 99) - (DAY_ORDER[dayB] || 99))
                                  .map(([dayId, day], idx) => {
                                    const d = day as Day;
                                    return (
                                      <div key={dayId} className="flex justify-between items-center text-xs py-1">
                                        <span className="text-gray-900 font-black">
                                          {DAY_LABELS[dayId] || dayId}
                                        </span>
                                        <span className="text-gray-700 font-bold">{formatTime12Hour(d.start)} - {formatTime12Hour(d.end)}</span>
                                      </div>
                                    );
                                  })
                              ) : (
                                <div className="flex justify-between items-center text-[9px]">
                                  <span className="text-gray-700 font-semibold">Hours</span>
                                  <span className="text-gray-500">Set in Details tab</span>
                                </div>
                              )}
                            <div className="flex justify-between items-center text-xs pt-2 border-t-2 border-gray-200 mt-2">
                              <span className="text-gray-700 font-bold">
                                {mode === "services"
                                  ? `${availability.slotMinutes}min slots • ${availability.advanceDays} days ahead`
                                  : `Open ${availability.advanceDays} days/week`}
                              </span>
                              <span className="px-2.5 py-1 bg-green-100 text-green-700 font-black text-[10px] rounded-lg shadow-sm" style={{ borderRadius: `${Math.min(cardRadius * 0.3, 4)}px` }}>
                                {mode === "services" ? "BOOKABLE" : "OPEN"}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Powered by MyScanly Footer */}
                      {(appearance.showPoweredBy ?? true) && (
                        <div className="px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-50 text-center border-t-2 border-gray-200">
                          <div className="text-xs text-gray-600 font-bold">
                            Powered by <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-purple-500">MyScanly</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Floating Cart Button - for products/digital and services with add-ons */}
      {((mode === "products" || mode === "digital" || mode === "services") && cartItemCount > 0) && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center border-4 border-white"
          style={{
            background: accentSolid,
            color: ctaFg,
          }}
        >
          <div className="relative">
            <ShoppingBag className="w-7 h-7" />
            <span className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-black rounded-full w-6 h-6 flex items-center justify-center shadow-lg border-2 border-white">
              {cartItemCount}
            </span>
          </div>
        </motion.button>
      )}
      
      {/* Cart Toast Notification */}
      <AnimatePresence>
        {cartToast.show && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl border-2 border-white max-w-xs"
            style={{
              background: accentSolid,
              color: ctaFg,
            }}
          >
            <p className="text-sm font-black text-center">{cartToast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Modal */}
      <AnimatePresence>
        {showCart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center sm:justify-center"
            onClick={() => setShowCart(false)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full sm:w-96 sm:rounded-2xl bg-white text-gray-900 shadow-xl max-h-[90vh] overflow-hidden flex flex-col"
              style={{ borderTopLeftRadius: "24px", borderTopRightRadius: "24px" }}
            >
              {/* Cart Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b-2 bg-gradient-to-r from-gray-50 to-white shadow-md">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛒</span>
                  <span className="text-base font-black text-gray-900">Cart</span>
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs font-black rounded-full">{cartItemCount}</span>
                </div>
                <button
                  onClick={() => setShowCart(false)}
                  className="p-2 hover:bg-gray-200 rounded-xl transition-all duration-200 hover:rotate-90"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-white to-gray-50">
                {cart.map((ci, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white border-2 border-gray-200 rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
                    <div className="flex-1">
                      <p className="font-black text-sm text-gray-900">{ci.item.title}</p>
                      {shouldShowPrice(ci.item.price) && (
                        <p className="text-xs text-gray-700 font-bold">{ci.item.price} each</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateCartQuantity(ci.item.title!, ci.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center bg-white border-2 border-gray-300 rounded-lg font-black text-sm hover:bg-gray-100 transition"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-black text-sm">{ci.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(ci.item.title!, ci.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center bg-white border-2 border-gray-300 rounded-lg font-black text-sm hover:bg-gray-100 transition"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(ci.item.title!)}
                      className="p-1.5 hover:bg-red-100 rounded-lg text-red-500 transition-all duration-200 hover:scale-110"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Cart Footer */}
              <div className="sticky bottom-0 border-t-2 bg-white p-5 space-y-3 shadow-lg">
                <div className="space-y-2 pb-3 border-b-2 border-gray-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-gray-700">Subtotal:</span>
                    <span className="font-bold text-gray-900">${cartTotal.toFixed(2)}</span>
                  </div>
                  
                  {props.delivery?.enabled && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-700">
                        Delivery:
                        {deliveryFee === 0 && props.delivery.freeAbove && cartTotal >= props.delivery.freeAbove && (
                          <span className="ml-1 text-xs text-green-600 font-bold">FREE!</span>
                        )}
                      </span>
                      <span className="font-bold text-gray-900">
                        {deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}
                      </span>
                    </div>
                  )}
                  
                  {props.delivery?.enabled && props.delivery.estimatedTime && (
                    <p className="text-xs text-gray-500">
                      🚚 Est. delivery: {props.delivery.estimatedTime}
                    </p>
                  )}
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-base font-black text-gray-900">Total:</span>
                    <span className="text-2xl font-black" style={{ color: accentSolid }}>
                      ${cartTotalWithDelivery.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                {/* Customer Info for Cart Checkout */}
                <div className="space-y-2.5">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                  />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Your email"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                  />
                </div>

                <button
                  onClick={createBooking}
                  disabled={bookingLoading || !customerName.trim() || !customerEmail.trim()}
                  className="w-full py-3.5 rounded-xl font-black text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-base"
                  style={{
                    background: !bookingLoading && customerName.trim() && customerEmail.trim() ? accentSolid : "#ccc",
                  }}
                >
                  {bookingLoading ? "Processing..." : "🔒 Secure Checkout"}
                </button>
                
                <button
                  onClick={() => setShowCart(false)}
                  className="w-full py-2.5 text-sm text-gray-700 font-bold hover:text-gray-900 transition hover:bg-gray-100 rounded-lg"
                >
                  ← Continue Shopping
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Image Modal - View full-size product images */}
      <AnimatePresence>
        {showImageModal && selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowImageModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] w-full"
            >
              {/* Close button */}
              <button
                onClick={() => setShowImageModal(false)}
                className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full transition"
              >
                <X className="h-6 w-6 text-white" />
              </button>
              
              {/* Image */}
              <img
                src={selectedImage}
                alt="Product"
                className="w-full h-full object-contain rounded-lg"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b-2 bg-gradient-to-r from-gray-50 to-white shadow-md">
                <div className="flex items-center gap-2">
                  <span className="text-xl">
                    {bookingStep === "success" 
                      ? "✅" 
                      : mode === 'services' 
                        ? "📅" 
                        : "🛒"}
                  </span>
                  <span className="text-base font-black text-gray-900">
                    {bookingStep === "success" 
                      ? "Confirmed!" 
                      : mode === 'services' 
                        ? "Book " + selectedItem.title 
                        : "Get Now"}
                  </span>
                </div>
                <button
                  onClick={resetBooking}
                  className="p-2 hover:bg-gray-200 rounded-xl transition-all duration-200 hover:rotate-90"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 max-h-[70vh] overflow-y-auto bg-gradient-to-b from-white to-gray-50">
                {bookingStep === "confirm" ? (
                  <>
                    {/* Booking/Product Confirmation Form */}
                    <div className="space-y-4">
                      <div className="p-4 bg-white border-2 border-gray-200 rounded-xl shadow-md">
                        <p className="text-sm font-black mb-1 text-gray-900">{mode === 'services' ? 'Service' : 'Item'}: {selectedItem.title}</p>
                        {shouldShowPrice(selectedItem.price) && (
                          <p className="text-sm text-gray-700 font-bold">{selectedItem.price}</p>
                        )}
                      </div>

                      {/* Show cart items (add-ons) if any */}
                      {mode === 'services' && cart.length > 0 && (
                        <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl shadow-md space-y-2">
                          <p className="text-sm font-black text-gray-900 mb-2">🛍️ Add-ons to purchase:</p>
                          {cart.map((cartItem, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                              <span className="font-medium text-gray-700">
                                {cartItem.item.title} × {cartItem.quantity}
                              </span>
                              <span className="font-black text-gray-900">
                                {cartItem.item.price}
                              </span>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-blue-300 flex justify-between items-center">
                            <span className="font-black text-gray-900">Total:</span>
                            <span className="font-black text-gray-900">${cartTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      )}

                      {/* Show booking fields ONLY for services */}
                      {mode === 'services' && (
                        <>
                          {/* Check if availability is configured */}
                          {!availability || !availability.days || Object.values(availability.days).every((day: any) => !day?.enabled) ? (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-sm font-semibold text-amber-900 mb-2">📅 Bookings aren't configured yet</p>
                              <p className="text-xs text-amber-700 mb-3">
                                The creator hasn't set up their business hours. You can still request a time:
                              </p>
                              <div className="space-y-2">
                                <a
                                  href={`mailto:${ownerEmail || social?.instagram || ''}?subject=Booking Request: ${selectedItem?.title}`}
                                  className="block text-center px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold rounded-lg transition"
                                >
                                  📧 Request a time via email
                                </a>
                                {social?.phone && (
                                  <a
                                    href={`tel:${social.phone}`}
                                    className="block text-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 text-sm font-semibold rounded-lg transition"
                                  >
                                    📞 Call to book
                                  </a>
                                )}
                              </div>
                            </div>
                          ) : (
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
                            <label className="block text-sm font-black mb-2 text-gray-900">📅 Select a time slot</label>
                            {!selectedDate ? (
                              <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded-xl border-2 border-gray-200 font-medium">
                                Please select a date first
                              </div>
                            ) : (slotsData?.reason === 'MISSING_AVAILABILITY' || slotsData?.reason === 'NO_ENABLED_DAYS') ? (
                              <div className="text-xs text-amber-700 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                ⚠️ Bookings aren't configured yet. The creator hasn't set up business hours.
                              </div>
                            ) : slots.length === 0 ? (
                              <div className="space-y-2">
                                <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded-lg">
                                  No available slots for this date. Try another date or contact directly.
                                </div>
                                {(ownerEmail || social?.phone) && (
                                  <div className="text-xs text-gray-500 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="font-semibold text-blue-900 mb-1">💡 Alternative options:</p>
                                    {ownerEmail && (
                                      <a href={`mailto:${ownerEmail}`} className="text-blue-600 hover:underline block">
                                        📧 Email to request a custom time
                                      </a>
                                    )}
                                    {social?.phone && (
                                      <a href={`tel:${social.phone}`} className="text-blue-600 hover:underline block">
                                        📞 Call to discuss availability
                                      </a>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="grid grid-cols-3 gap-2">
                                {slots
                                  .filter((slot: any) => {
                                    // Filter by selected date
                                    if (new Date(slot.start_time).toLocaleDateString() !== new Date(selectedDate).toLocaleDateString()) {
                                      return false;
                                    }
                                    
                                    // Filter by selected staff member's working hours if applicable
                                    if (selectedTeamMember) {
                                      const selectedStaff = staffProfiles.find(sp => sp.name === teamMembers.find((tm: any) => tm.id === selectedTeamMember)?.name);
                                      if (selectedStaff && !slotMatchesStaffSchedule(slot, selectedStaff)) {
                                        return false;
                                      }
                                    }
                                    
                                    return true;
                                  })
                                  .slice(0, 9)
                                  .map((slot: any) => (
                                  <button
                                    key={slot.id}
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`p-2.5 rounded-xl text-xs font-black transition shadow-md hover:shadow-lg ${
                                      selectedSlot?.id === slot.id
                                        ? "bg-cyan-500 text-white scale-105"
                                        : "bg-white text-gray-900 hover:bg-gray-50 border-2 border-gray-200"
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
                            <label className="block text-sm font-black mb-2 text-gray-900">
                              👥 Choose your specialist 
                              {teamMembers.length > 0 && <span className="text-gray-600 font-bold">({teamMembers.length})</span>}
                            </label>
                            {teamMembers.length === 0 ? (
                              <div className="text-sm text-gray-600 p-4 bg-gray-50 rounded-xl border-2 border-gray-200 font-medium">
                                No specialists available. Booking is open to anyone.
                              </div>
                            ) : (
                              <select
                                value={selectedTeamMember}
                                onChange={(e) => setSelectedTeamMember(e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition bg-white"
                              >
                                <option value="">Any available</option>
                                {teamMembers.map((member: any) => (
                                  <option key={member.id} value={member.id}>
                                    {member.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          {/* Add-ons Dropdown Selector */}
                          {availableAddOns.length > 0 && (
                            <div>
                              <label className="block text-sm font-black mb-2 text-gray-900">
                                🛍️ Add extras to your booking
                                <span className="text-xs font-medium text-gray-600 ml-2">(Optional)</span>
                              </label>
                              <div className="space-y-3">
                                {availableAddOns.map((addon, idx) => {
                                  const addonKey = `${addon.title}-${idx}`;
                                  const quantity = selectedAddOns[addonKey] || 0;
                                  
                                  return (
                                    <div key={addonKey} className="p-3 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 transition">
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-black text-gray-900 truncate">{addon.title}</p>
                                          {addon.note && (
                                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{addon.note}</p>
                                          )}
                                        </div>
                                        {shouldShowPrice(addon.price) && (
                                          <span className="text-sm font-black ml-2 flex-shrink-0" style={{ color: accentSolid }}>
                                            {addon.price}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedAddOns(prev => {
                                              const newQuantity = Math.max(0, (prev[addonKey] || 0) - 1);
                                              if (newQuantity === 0) {
                                                const { [addonKey]: _, ...rest } = prev;
                                                return rest;
                                              }
                                              return { ...prev, [addonKey]: newQuantity };
                                            });
                                          }}
                                          disabled={quantity === 0}
                                          className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg font-black text-sm transition"
                                          style={{ color: accentSolid }}
                                        >
                                          −
                                        </button>
                                        <span className="w-12 text-center text-sm font-black text-gray-900">
                                          {quantity}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedAddOns(prev => ({
                                              ...prev,
                                              [addonKey]: (prev[addonKey] || 0) + 1
                                            }));
                                          }}
                                          className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200 rounded-lg font-black text-sm transition"
                                          style={{ color: accentSolid }}
                                        >
                                          +
                                        </button>
                                        <span className="flex-1 text-xs text-gray-600 font-medium ml-2">
                                          {quantity > 0 ? `Added: ${quantity}` : 'Not added'}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                                
                                {/* Add-ons Summary */}
                                {Object.keys(selectedAddOns).length > 0 && (
                                  <div className="p-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl">
                                    <p className="text-xs font-black text-gray-900 mb-2">📦 Selected add-ons:</p>
                                    {Object.entries(selectedAddOns).map(([key, qty]) => {
                                      const addonIdx = parseInt(key.split('-').pop() || '0');
                                      const addon = availableAddOns[addonIdx];
                                      if (!addon || qty === 0) return null;
                                      
                                      return (
                                        <div key={key} className="flex justify-between text-xs text-gray-700 mb-1">
                                          <span className="font-medium">{addon.title} × {qty}</span>
                                          <span className="font-black">{addon.price}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                            </>
                          )}
                        </>
                      )}

                      {/* Customer Info */}
                      <div>
                        <label className="block text-sm font-black mb-2 text-gray-900">👤 Your name</label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="John Doe"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-black mb-2 text-gray-900">✉️ Email</label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="john@example.com"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition"
                        />
                      </div>

                      {bookingError && (
                        <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl text-sm text-red-700 font-medium">
                          {bookingError}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <button
                        onClick={createBooking}
                        disabled={bookingLoading || (mode === 'services' && !selectedSlot) || !customerName || !customerEmail}
                        className="w-full py-3.5 rounded-xl font-black text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-base"
                        style={{
                          background: !bookingLoading && (mode !== 'services' || selectedSlot) && customerName && customerEmail ? accentSolid : "#ccc",
                        }}
                      >
                        {bookingLoading 
                          ? (mode === 'services' ? "Booking..." : "Processing...") 
                          : (mode === 'services' ? "📌 Confirm Booking" : "🔒 Continue to Payment")}
                      </button>
                      <button
                        onClick={resetBooking}
                        className="w-full py-2.5 rounded-xl font-bold border-2 border-gray-200 hover:bg-gray-100 transition-all duration-200 text-gray-700"
                      >
                        ← Cancel
                      </button>
                    </div>
                  </>
                ) : bookingStep === "success" ? (
                  <>
                    {/* Success Screen */}
                    <div className="text-center space-y-5 py-8">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="text-6xl mx-auto"
                      >
                        ✅
                      </motion.div>
                      <div>
                        <h3 className="text-xl font-black text-gray-900">Booking Confirmed!</h3>
                        <p className="text-sm text-gray-700 mt-2 font-medium">We'll send a confirmation email shortly</p>
                      </div>
                      <div className="p-4 bg-white border-2 border-gray-200 rounded-xl shadow-md space-y-2 text-sm text-left">
                        <div className="font-black text-gray-900"><span className="text-gray-600 font-bold">Service:</span> {selectedItem.title}</div>
                        <div className="font-black text-gray-900"><span className="text-gray-600 font-bold">Customer:</span> {customerName}</div>
                        <div className="font-black text-gray-900"><span className="text-gray-600 font-bold">Email:</span> {customerEmail}</div>
                        {selectedSlot && (
                          <div className="font-black text-gray-900"><span className="text-gray-600 font-bold">Time:</span> {new Date(selectedSlot.start_time).toLocaleDateString()} {new Date(selectedSlot.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                        )}
                        {selectedTeamMember && (
                          <div><strong>Specialist:</strong> {teamMembers.find((tm: any) => tm.id === selectedTeamMember)?.name || "Selected"}</div>
                        )}
                        {/* Show selected add-ons from dropdown */}
                        {Object.keys(selectedAddOns).length > 0 && (
                          <div className="pt-2 border-t border-gray-200">
                            <div className="font-black text-gray-900 mb-1">Add-ons included:</div>
                            {Object.entries(selectedAddOns).map(([key, qty]) => {
                              if (qty === 0) return null;
                              const addonIdx = parseInt(key.split('-').pop() || '0');
                              const addon = availableAddOns[addonIdx];
                              if (!addon) return null;
                              return (
                                <div key={key} className="text-xs text-gray-700 ml-2">
                                  • {addon.title} × {qty}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {/* Also show cart items if any */}
                        {cart.length > 0 && (
                          <div className="pt-2 border-t border-gray-200">
                            <div className="font-black text-gray-900 mb-1">Cart items:</div>
                            {cart.map((cartItem, idx) => (
                              <div key={idx} className="text-xs text-gray-700 ml-2">
                                • {cartItem.item.title} × {cartItem.quantity}
                              </div>
                            ))}
                          </div>
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

      {/* Creator Info Modal */}
      <AnimatePresence>
        {showCreatorInfo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreatorInfo(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-pink-500 to-orange-500 p-6 relative">
                <button
                  onClick={() => setShowCreatorInfo(false)}
                  className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white text-2xl font-bold">
                    {(brandName || "C")[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{brandName || "Creator"}</h3>
                    {tagline && <p className="text-white/90 text-sm">{tagline}</p>}
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Bio */}
                {social?.bio && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2">About</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">{social.bio}</p>
                  </div>
                )}

                {/* Contact Info */}
                <div className="space-y-3">
                  {social?.email && (
                    <a
                      href={`mailto:${social.email}`}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                    >
                      <div className="p-2 bg-pink-100 rounded-lg group-hover:bg-pink-200 transition-colors">
                        <Mail className="h-4 w-4 text-pink-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-medium">Email</p>
                        <p className="text-sm text-gray-900 truncate">{social.email}</p>
                      </div>
                    </a>
                  )}

                  {social?.phone && (
                    <a
                      href={`tel:${social.phone}`}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group"
                    >
                      <div className="p-2 bg-pink-100 rounded-lg group-hover:bg-pink-200 transition-colors">
                        <Phone className="h-4 w-4 text-pink-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-medium">Phone</p>
                        <p className="text-sm text-gray-900">{social.phone}</p>
                      </div>
                    </a>
                  )}

                  {social?.address && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-pink-100 rounded-lg">
                        <MapPin className="h-4 w-4 text-pink-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 font-medium">Location</p>
                        <p className="text-sm text-gray-900">{social.address}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {(social?.instagram || social?.tiktok || social?.website) && (
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-3">Connect</h4>
                    <div className="flex gap-2 flex-wrap">
                      {social?.instagram && (
                        <a
                          href={`https://instagram.com/${social.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all"
                        >
                          Instagram
                        </a>
                      )}
                      {social?.tiktok && (
                        <a
                          href={`https://tiktok.com/@${social.tiktok.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all"
                        >
                          TikTok
                        </a>
                      )}
                      {social?.website && (
                        <a
                          href={social.website.startsWith('http') ? social.website : `https://${social.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all"
                        >
                          Website
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item Details Modal */}
      <AnimatePresence>
        {showItemDetails && selectedItemDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowItemDetails(false)}
          >
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[85vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h3 className="text-lg font-black text-gray-900 flex-1 pr-4">{selectedItemDetails.title}</h3>
                <button
                  onClick={() => setShowItemDetails(false)}
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-6 overflow-y-auto max-h-[calc(85vh-140px)]">
                {/* Image */}
                {selectedItemDetails.image && (
                  <div className="mb-6 rounded-2xl overflow-hidden">
                    <img
                      src={selectedItemDetails.image}
                      alt={selectedItemDetails.title}
                      className="w-full h-64 object-cover"
                    />
                  </div>
                )}

                {/* Badge */}
                {selectedItemDetails.badge && selectedItemDetails.badge !== "none" && (
                  <div className="mb-4">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black uppercase shadow-lg"
                      style={{
                        background: getBadgeStyle(selectedItemDetails.badge).background,
                        color: getBadgeStyle(selectedItemDetails.badge).color,
                      }}
                    >
                      {getBadgeStyle(selectedItemDetails.badge).emoji} {selectedItemDetails.badge.charAt(0).toUpperCase() + selectedItemDetails.badge.slice(1)}
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="mb-6">
                  <span className="text-3xl font-black" style={{ color: accentSolid }}>
                    {selectedItemDetails.price || "$0"}
                  </span>
                </div>

                {/* Description */}
                {selectedItemDetails.note && (
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {selectedItemDetails.note}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer CTA */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
                <motion.button
                  className="w-full py-4 text-base font-black rounded-2xl shadow-lg"
                  style={{
                    background: ctaBg,
                    color: ctaFg,
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setShowItemDetails(false);
                    if (mode === "products" || mode === "digital") {
                      addToCart(selectedItemDetails, 1);
                    } else {
                      setSelectedItem(selectedItemDetails);
                      setBookingStep("confirm");
                    }
                  }}
                >
                  {appearance.ctaText?.trim() || (mode === "services" ? "Book Now" : mode === "products" ? "Add to Cart" : "Get It")}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
