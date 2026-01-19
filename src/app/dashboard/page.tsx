"use client";
// Real-time Dashboard Page
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Calendar, ShoppingCart, Eye, Settings, Edit, Trash2, Download, Check, X, ChevronRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode';
import PiqoLivePreview from '@/components/PiqoLivePreview';

type Booking = {
  id: string;
  handle?: string;
  customer_name?: string;
  customer_email?: string;
  status?: string;
  checked_in?: boolean;
  created_at?: string;
  item_title?: string;
  team_member_id?: string;
  team_member_name?: string;
  slot_start_time?: string;
  slot_end_time?: string;
  site_brand_name?: string;
};

type Order = {
  id: string;
  handle: string;
  mode?: string;
  item_title?: string;
  item_price?: string;
  customer_name?: string;
  customer_email?: string;
  status?: string;
  created_at?: string;
  site_brand_name?: string;
  order_items?: Array<{
    title?: string;
    price?: string;
    quantity?: number;
    note?: string;
  }>;
  amount_cents?: number;
};

type Site = {
  handle: string;
  config: any;
  updated_at: string;
  stripe_account_id?: string | null;
  stripe_charges_enabled?: boolean | null;
  stripe_payouts_enabled?: boolean | null;
};

import { subscribeToBookings, subscribeToOrders } from './realtime';
import PiqoLogoFull from '@/components/PiqoLogoFull';
import { supabase } from '@/lib/supabaseclient';

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [deletingHandle, setDeletingHandle] = useState<string | null>(null);
  const [deletingBookingId, setDeletingBookingId] = useState<string | null>(null);
  const [confirmingBookingId, setConfirmingBookingId] = useState<string | null>(null);
  const [totalBookingsCount, setTotalBookingsCount] = useState(0);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  
  // Live preview modal state
  const [editingHandle, setEditingHandle] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  
  // Order detail modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  
  // Booking detail modal state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingDetailOpen, setBookingDetailOpen] = useState(false);
  
  // Week selection state
  const [selectedWeek, setSelectedWeek] = useState<'this' | 'last' | 'next'>('this');
  const [selectedOrderWeek, setSelectedOrderWeek] = useState<'this' | 'last' | 'next'>('this');
  
  // Completed orders state
  const [completedOrders, setCompletedOrders] = useState<Set<string>>(new Set());
  const [showCompletedOrders, setShowCompletedOrders] = useState(true);

  // Helper functions for week calculations
  const getWeekBounds = (weekOffset: number) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek + (weekOffset * 7));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);
    endOfWeek.setHours(23, 59, 59, 999);
    return { startOfWeek, endOfWeek };
  };
  
  // Toggle order completion status
  const toggleOrderComplete = (orderId: string) => {
    setCompletedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const getWeekLabel = (week: 'this' | 'last' | 'next') => {
    const offset = week === 'this' ? 0 : week === 'last' ? -1 : 1;
    const { startOfWeek, endOfWeek } = getWeekBounds(offset);
    const startMonth = startOfWeek.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short' });
    const startDay = startOfWeek.getDate();
    const endDay = endOfWeek.getDate() - 1;
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}`;
    }
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}`;
  };

  const groupByDate = (items: any[], dateField: string) => {
    const grouped: { [date: string]: any[] } = {};
    items.forEach(item => {
      const dateValue = item[dateField];
      if (!dateValue) return;
      const date = new Date(dateValue);
      const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(item);
    });
    return grouped;
  };

  // Derived stats
  const totalBookings = totalBookingsCount || bookings.length;
  const totalOrders = totalOrdersCount || orders.length;
  const totalSites = sites.length;
  const checkedInCount = bookings.filter(b => b.checked_in).length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  
  // Filter bookings by selected week (using scheduled time)
  const bookingWeekOffset = selectedWeek === 'this' ? 0 : selectedWeek === 'last' ? -1 : 1;
  const { startOfWeek: bookingWeekStart, endOfWeek: bookingWeekEnd } = getWeekBounds(bookingWeekOffset);
  const filteredBookings = bookings.filter(b => {
    const scheduleDate = b.slot_start_time ? new Date(b.slot_start_time) : (b.created_at ? new Date(b.created_at) : null);
    if (!scheduleDate) return false;
    return scheduleDate >= bookingWeekStart && scheduleDate < bookingWeekEnd;
  });
  const groupedBookings = groupByDate(filteredBookings, 'slot_start_time');

  // Filter orders by selected week
  const orderWeekOffset = selectedOrderWeek === 'this' ? 0 : selectedOrderWeek === 'last' ? -1 : 1;
  const { startOfWeek: orderWeekStart, endOfWeek: orderWeekEnd } = getWeekBounds(orderWeekOffset);
  const filteredOrders = orders.filter(o => {
    const orderDate = o.created_at ? new Date(o.created_at) : null;
    if (!orderDate) return false;
    const inWeek = orderDate >= orderWeekStart && orderDate < orderWeekEnd;
    // Filter by completion status
    const isCompleted = completedOrders.has(String(o.id));
    if (!showCompletedOrders && isCompleted) return false;
    return inWeek;
  });
  const groupedOrders = groupByDate(filteredOrders, 'created_at');

  // Recent Activity metrics
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Next appointment (upcoming booking with slot_start_time)
  const upcomingBookings = bookings
    .filter(b => b.slot_start_time && new Date(b.slot_start_time) > now)
    .sort((a, b) => new Date(a.slot_start_time!).getTime() - new Date(b.slot_start_time!).getTime());
  const nextAppointment = upcomingBookings[0];
  
  // Last order
  const lastOrder = orders.length > 0 ? orders[0] : null; // Already sorted by created_at desc
  
  // Revenue (last 7 days)
  const recentOrders = orders.filter(o => o.created_at && new Date(o.created_at) >= sevenDaysAgo);
  const revenue7Days = recentOrders.reduce((sum, o) => {
    const price = parseFloat(String(o.item_price || '0').replace(/[^0-9.]/g, ''));
    return sum + (isNaN(price) ? 0 : price);
  }, 0);

  const openEditPreview = (handle: string, config: any) => {
    setEditingHandle(handle);
    setEditingConfig(config);
    setPreviewOpen(true);
  };

  const downloadQR = async (handle: string) => {
    try {
      const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/u/${handle}`;
      const canvas = await QRCode.toCanvas(url);
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `${handle}-qr.png`;
      link.click();
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    }
  };

  const confirmBooking = async (bookingId: string, newStatus: 'confirmed' | 'cancelled') => {
    try {
      setConfirmingBookingId(bookingId);
      const res = await fetch("/api/bookings/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to update booking");
        return;
      }

      // Update local state - the realtime subscription will also update it
      setBookings(bookings.map(b => 
        b.id === bookingId ? { ...b, status: newStatus } : b
      ));
    } catch (err) {
      console.error("Confirm booking error:", err);
      alert("Failed to update booking");
    } finally {
      setConfirmingBookingId(null);
    }
  };

  const deleteBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to delete this booking? This cannot be undone.")) {
      return;
    }

    try {
      setDeletingBookingId(bookingId);
      const res = await fetch("/api/bookings/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Failed to delete booking");
        return;
      }

      // Remove from local state
      setBookings(bookings.filter(b => b.id !== bookingId));
      setTotalBookingsCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Delete booking error:", err);
      alert("Failed to delete booking");
    } finally {
      setDeletingBookingId(null);
    }
  };

  const deleteSite = async (handle: string) => {
    if (!confirm(`Are you sure you want to delete the "${handle}" piqo? This cannot be undone.`)) {
      return;
    }

    try {
      setDeletingHandle(handle);
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      const headers: any = { "Content-Type": "application/json" };
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }

      const res = await fetch("/api/site/delete", {
        method: "DELETE",
        headers,
        credentials: "include",
        body: JSON.stringify({ handle }),
      });

      if (res.ok) {
        // Remove from local state
        setSites(sites.filter(s => s.handle !== handle));
        console.log(`✅ Piqo "${handle}" deleted successfully`);
      } else {
        // Try to parse JSON error, but handle case where response is empty
        let errorMessage = "Failed to delete piqo";
        try {
          const data = await res.json();
          errorMessage = data.error || errorMessage;
        } catch (jsonErr) {
          console.error("Failed to parse error response:", jsonErr);
        }
        alert(errorMessage);
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete piqo");
    } finally {
      setDeletingHandle(null);
    }
  };

  useEffect(() => {
    let bookingsSubscription: any = null;
    let ordersSubscription: any = null;
    
    async function fetchData() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Get Bearer token for API calls
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      const headers: any = {};
      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      }
      
      const res = await fetch('/api/dashboard', { headers, credentials: 'include' });
      const data = await res.json();
      console.log("📊 Dashboard API response:", data);
      console.log("📋 Sites loaded:", data.sites?.length || 0);
      console.log("📋 Site handles:", data.sites?.map((s: any) => s.handle) || []);
      const { bookings, totalBookingsCount, sites, orders, _debug } = data;
      if (_debug) {
        console.log("🔍 Debug info:", _debug);
      }
      // Show initial recent bookings and orders that belong to this user's sites
      setBookings((bookings as Booking[]) || []);
      setTotalBookingsCount(totalBookingsCount || 0);
      setSites((sites as Site[]) || []);
      setOrders((orders as Order[]) || []);
      setTotalOrdersCount(orders?.length || 0);
      setLoading(false);
      
      // Set up realtime subscription with the user's site handles for data isolation
      const siteHandles = ((sites as Site[]) || []).map(s => s.handle);
      console.log("🔔 Setting up realtime subscription for handles:", siteHandles);
      
      // Add NEW bookings from realtime at the top
      bookingsSubscription = subscribeToBookings((updatedBooking: Booking): void => {
        setBookings(prev => {
          const idx = prev.findIndex(b => b.id === updatedBooking.id);
          if (idx !== -1) {
            // Booking already exists, update it
            const updated = [...prev];
            updated[idx] = updatedBooking;
            return updated;
          } else {
            // New booking, add it to the top and update count
            console.log("✨ New booking added to dashboard:", updatedBooking.customer_name);
            setTotalBookingsCount(c => c + 1);
            return [updatedBooking, ...prev];
          }
        });
      }, siteHandles);
      
      // Add NEW orders from realtime at the top
      ordersSubscription = subscribeToOrders((updatedOrder: Order): void => {
        setOrders(prev => {
          const idx = prev.findIndex(o => o.id === updatedOrder.id);
          if (idx !== -1) {
            // Order already exists, update it
            const updated = [...prev];
            updated[idx] = updatedOrder;
            return updated;
          } else {
            // New order, add it to the top and update count
            console.log("✨ New order added to dashboard:", updatedOrder.item_title);
            setTotalOrdersCount(c => c + 1);
            return [updatedOrder, ...prev];
          }
        });
      }, siteHandles);
    }
    
    fetchData();
    
    return () => {
      if (bookingsSubscription) {
        bookingsSubscription.unsubscribe();
      }
      if (ordersSubscription) {
        ordersSubscription.unsubscribe();
      }
    };
  }, []);

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black relative overflow-x-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-2xl border-b border-white/10 shadow-2xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2.5 sm:gap-5">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-xl sm:rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-200"></div>
                <div className="relative w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-gray-900 to-black rounded-xl sm:rounded-2xl flex items-center justify-center border border-white/20">
                  <PiqoLogoFull />
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 tracking-tight">Dashboard</h1>
                <p className="text-gray-400 text-[10px] sm:text-xs lg:text-sm mt-0.5 sm:mt-1 lg:mt-2 font-medium">Manage your piqos, bookings & orders in real-time</p>
              </div>
            </div>
            <Link
              href="/create"
              className="relative group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 hover:from-cyan-600 hover:via-purple-600 hover:to-pink-600 active:scale-95 text-white font-bold rounded-lg sm:rounded-xl transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105 text-xs sm:text-sm lg:text-base min-h-[44px] sm:min-h-0"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Create New Piqo</span>
              <span className="sm:hidden">New</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-10 relative">
        {/* Recent Activity Summary */}
        {!loading && (
          <section className="mb-8 sm:mb-10">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl sm:rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
              <div className="relative bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-white/10">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-cyan-500 rounded-lg sm:rounded-xl blur-md opacity-50"></div>
                    <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 uppercase tracking-wider">Recent Activity</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                  {/* Next Appointment */}
                  <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-0 rounded-lg sm:rounded-none bg-white/5 sm:bg-transparent border border-white/10 sm:border-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 sm:mb-1.5">Next Appointment</p>
                      {nextAppointment ? (
                        <div>
                          <p className="font-bold text-white text-xs sm:text-sm truncate">{nextAppointment.customer_name || nextAppointment.customer_email?.split('@')[0] || 'Customer'}</p>
                          <p className="text-[10px] sm:text-xs text-gray-400">
                            {new Date(nextAppointment.slot_start_time!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {new Date(nextAppointment.slot_start_time!).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-gray-500 italic">No upcoming appointments</p>
                      )}
                    </div>
                  </div>

                  {/* Last Order */}
                  <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-0 rounded-lg sm:rounded-none bg-white/5 sm:bg-transparent border border-white/10 sm:border-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-pink-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 sm:mb-1.5">Last Order</p>
                      {lastOrder ? (
                        <div>
                          <p className="font-bold text-white text-xs sm:text-sm truncate">{lastOrder.item_title || 'Product'}</p>
                          <p className="text-[10px] sm:text-xs text-gray-400">
                            {new Date(lastOrder.created_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {lastOrder.item_price || '$0'}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-gray-500 italic">No orders yet</p>
                      )}
                    </div>
                  </div>

                  {/* Revenue (Last 7 Days) */}
                  <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-0 rounded-lg sm:rounded-none bg-white/5 sm:bg-transparent border border-white/10 sm:border-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 sm:mb-1.5">Revenue (7 Days)</p>
                      {recentOrders.length > 0 ? (
                        <div>
                          <p className="font-bold text-white text-base sm:text-lg">${revenue7Days.toFixed(2)}</p>
                          <p className="text-[10px] sm:text-xs text-gray-400">{recentOrders.length} order{recentOrders.length !== 1 ? 's' : ''}</p>
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-gray-500 italic">No recent sales</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Stats Section */}
        <section className="mb-8 sm:mb-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl sm:rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
            <div className="relative bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border border-cyan-500/30 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-7 hover:border-cyan-400/50 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <p className="text-cyan-400/70 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Published Piqos</p>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-cyan-400" />
                </div>
              </div>
              <p className="text-3xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-cyan-300 to-cyan-500 group-hover:scale-105 transition-transform duration-300">{totalSites}</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl sm:rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
            <div className="relative bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border border-purple-500/30 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-7 hover:border-purple-400/50 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <p className="text-purple-400/70 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Total Bookings</p>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-purple-400" />
                </div>
              </div>
              <p className="text-3xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-300 to-purple-500 group-hover:scale-105 transition-transform duration-300">{totalBookings}</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
            <div className="relative bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border border-green-500/30 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-7 hover:border-green-400/50 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <p className="text-green-400/70 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Checked In</p>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-400" />
                </div>
              </div>
              <p className="text-3xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-green-300 to-emerald-500 group-hover:scale-105 transition-transform duration-300">{checkedInCount}</p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl sm:rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
            <div className="relative bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border border-pink-500/30 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-7 hover:border-pink-400/50 hover:-translate-y-1 transition-all duration-300">
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <p className="text-pink-400/70 text-[10px] sm:text-xs font-bold uppercase tracking-widest">Orders</p>
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-pink-500/20 flex items-center justify-center">
                  <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-pink-400" />
                </div>
              </div>
              <p className="text-3xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-pink-300 to-pink-500 group-hover:scale-105 transition-transform duration-300">{totalOrders}</p>
            </div>
          </motion.div>
        </section>

        {/* Sites Section */}
        <section className="mb-12 sm:mb-16">
          <div className="bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 border border-white/10">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
              <div className="flex-1">
                <div className="flex items-center gap-2 sm:gap-4 mb-2">
                  <div className="relative shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg sm:rounded-xl blur-lg opacity-60"></div>
                    <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
                      <ShoppingCart className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 truncate">Your Piqos</h2>
                    <p className="text-gray-400 text-[11px] sm:text-sm font-medium mt-0.5 truncate">
                      Manage your storefronts
                      {!loading && sites.length > 0 && (
                        <span className="ml-1.5 sm:ml-2 px-1.5 sm:px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded-full text-[10px] sm:text-xs font-bold">
                          {sites.length}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              <Link
                href="/create"
                className="flex items-center justify-center gap-2 px-5 sm:px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 active:scale-95 text-white font-bold rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50 text-sm sm:text-base shadow-lg min-h-[44px] w-full sm:w-auto"
              >
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                <span>Create New Piqo</span>
              </Link>
            </div>
          </div>
          {sites.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl sm:rounded-2xl shadow-xl p-6 sm:p-8 text-center">
              <p className="text-gray-400 mb-4 text-sm sm:text-base">You haven't created any piqos yet.</p>
              <Link href="/create" className="inline-block px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-xl transition min-h-[44px] flex items-center justify-center">
                Create your first piqo
              </Link>
            </div>
          ) : (
            <>
              {/* Group sites by mode */}
              {(() => {
                const servicesSites = sites.filter(s => s.config?.mode === 'services');
                const productsSites = sites.filter(s => s.config?.mode === 'products');
                const digitalSites = sites.filter(s => s.config?.mode === 'digital');
                const bookingSites = sites.filter(s => s.config?.mode === 'booking');
                const otherSites = sites.filter(s => !['services', 'products', 'digital', 'booking'].includes(s.config?.mode || ''));
                
                return (
                  <>
                    {/* Services Section */}
                    {servicesSites.length > 0 && (
                      <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-blue-500/20">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 rounded-lg border border-blue-500/30">
                            <span className="text-lg">🔧</span>
                            <span className="text-sm font-bold text-blue-300 uppercase tracking-wider">Services</span>
                          </div>
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-full">{servicesSites.length}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          {servicesSites.map((site) => {
                            const color = site.config?.appearance?.accent || '#06b6d4';
                            const hasStripeAccount = !!site.stripe_account_id;
                            const stripeFullyEnabled = hasStripeAccount && site.stripe_charges_enabled && site.stripe_payouts_enabled;
                            const stripeIncomplete = hasStripeAccount && !stripeFullyEnabled;
                            const mode = site.config?.mode || 'unknown';
                
                return (
                  <div key={site.handle} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl hover:shadow-2xl hover:shadow-cyan-500/20 hover:border-cyan-500/30 transition-all duration-300 p-3 sm:p-4 flex flex-col gap-3 group active:scale-[0.98]">
                    {/* Header: Logo + Brand name + handle + mode badge */}
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      {/* Brand Logo */}
                      {site.config?.brandLogo ? (
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center shrink-0 ring-2 ring-white/10">
                          <img 
                            src={site.config.brandLogo} 
                            alt={site.config?.brandName || site.handle}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-base sm:text-lg font-bold shrink-0 ring-2 ring-white/10">
                          {(site.config?.brandName || site.handle)[0].toUpperCase()}
                        </div>
                      )}
                      {/* Brand info and mode badge */}
                      <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base font-bold text-white truncate mb-0.5" title={site.config?.brandName || site.handle}>
                            {site.config?.brandName || site.handle}
                          </h3>
                          <p className="text-[11px] sm:text-xs text-gray-400 truncate">@{site.handle}</p>
                        </div>
                        {/* Mode badge */}
                        <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider shrink-0 ${
                          mode === 'services' ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30' :
                          mode === 'products' ? 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/30' :
                          mode === 'digital' ? 'bg-pink-500/20 text-pink-300 ring-1 ring-pink-500/30' :
                          mode === 'booking' ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30' :
                          'bg-gray-500/20 text-gray-300 ring-1 ring-gray-500/30'
                        }`}>
                          <span className="hidden sm:inline">{mode === 'services' ? '🔧' : mode === 'products' ? '🛍️' : mode === 'digital' ? '⚡' : mode === 'booking' ? '📅' : '📦'} </span>{mode}
                        </span>
                      </div>
                    </div>

                    {/* Metadata: Stripe status + published date */}
                    <div className="flex items-center justify-between gap-2 pt-2 sm:pt-2.5 border-t border-white/5">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[10px] sm:text-xs text-gray-500">
                          {site.updated_at ? new Date(site.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}
                        </span>
                      </div>
                      {stripeFullyEnabled ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/20 text-green-300 text-[10px] sm:text-xs font-semibold ring-1 ring-green-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                          <span className="hidden xs:inline">Stripe</span>
                        </span>
                      ) : stripeIncomplete ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 text-[10px] sm:text-xs font-semibold ring-1 ring-yellow-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                          <span className="hidden xs:inline">Stripe</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400 text-[10px] sm:text-xs font-semibold ring-1 ring-gray-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                          <span className="hidden xs:inline">No Stripe</span>
                        </span>
                      )}
                    </div>

                    {/* Primary actions: Edit + View */}
                    <div className="flex gap-1.5 sm:gap-2">
                      <button 
                        onClick={() => openEditPreview(site.handle, site.config)}
                        className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-2.5 sm:py-2 bg-gradient-to-r from-blue-600/80 to-cyan-600/80 hover:from-blue-600 hover:to-cyan-600 active:scale-95 border border-blue-500/50 text-white rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 min-h-[44px] sm:min-h-0">
                        <Edit className="h-3.5 w-3.5 sm:h-3.5 sm:w-3.5" />
                        <span>Edit</span>
                      </button>
                      <Link 
                        href={`/u/${site.handle}`}
                        className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-2.5 sm:py-2 bg-gradient-to-r from-green-600/80 to-emerald-600/80 hover:from-green-600 hover:to-emerald-600 active:scale-95 border border-green-500/50 text-white rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/30 min-h-[44px] sm:min-h-0">
                        <Eye className="h-3.5 w-3.5 sm:h-3.5 sm:w-3.5" />
                        <span>View</span>
                      </Link>
                    </div>

                    {/* Secondary actions: Stripe + QR + Delete */}
                    <div className="flex gap-1.5 pt-2 border-t border-white/5">
                      <Link
                        href={`/connect?handle=${site.handle}`}
                        className="flex-1 flex items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-2 sm:py-1.5 bg-purple-600/20 hover:bg-purple-600/30 active:scale-95 border border-purple-500/40 text-purple-300 rounded-lg font-medium text-[10px] sm:text-xs transition-all duration-200 hover:scale-105 min-h-[44px] sm:min-h-0"
                        title={stripeFullyEnabled ? 'Manage Stripe' : stripeIncomplete ? 'Finish Stripe setup' : 'Connect Stripe'}
                      >
                        <Settings className="h-3 w-3" />
                        <span>{stripeFullyEnabled ? 'Manage' : stripeIncomplete ? 'Setup' : 'Stripe'}</span>
                      </Link>
                      <button 
                        onClick={() => downloadQR(site.handle)}
                        className="flex-1 flex items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-2 sm:py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 active:scale-95 border border-cyan-500/40 text-cyan-300 rounded-lg font-medium text-[10px] sm:text-xs transition-all duration-200 hover:scale-105 min-h-[44px] sm:min-h-0"
                        title="Download QR Code"
                      >
                        <Download className="h-3 w-3" />
                        <span>QR</span>
                      </button>
                      <button 
                        onClick={() => deleteSite(site.handle)}
                        disabled={deletingHandle === site.handle}
                        className="flex-1 flex items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-2 sm:py-1.5 bg-red-600/20 hover:bg-red-600/30 active:scale-95 border border-red-500/40 text-red-300 rounded-lg font-medium text-[10px] sm:text-xs transition-all duration-200 disabled:opacity-50 hover:scale-105 min-h-[44px] sm:min-h-0"
                        title="Delete Piqo"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>{deletingHandle === site.handle ? '...' : 'Delete'}</span>
                      </button>
                    </div>
                  </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Products Section */}
                    {productsSites.length > 0 && (
                      <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-orange-500/20">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 rounded-lg border border-orange-500/30">
                            <span className="text-lg">🛍️</span>
                            <span className="text-sm font-bold text-orange-300 uppercase tracking-wider">Products</span>
                          </div>
                          <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs font-bold rounded-full">{productsSites.length}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          {productsSites.map((site) => {
                            const color = site.config?.appearance?.accent || '#06b6d4';
                            const hasStripeAccount = !!site.stripe_account_id;
                            const stripeFullyEnabled = hasStripeAccount && site.stripe_charges_enabled && site.stripe_payouts_enabled;
                            const stripeIncomplete = hasStripeAccount && !stripeFullyEnabled;
                            const mode = site.config?.mode || 'unknown';
                            
                            return (
                              <div key={site.handle} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl hover:shadow-2xl hover:shadow-cyan-500/20 hover:border-cyan-500/30 transition-all duration-300 p-3 sm:p-4 flex flex-col gap-3 group active:scale-[0.98]">
                                {/* Header: Logo + Brand name + handle + mode badge */}
                                <div className="flex items-start gap-2.5 sm:gap-3">
                                  {/* Brand Logo */}
                                  {site.config?.brandLogo ? (
                                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center shrink-0 ring-2 ring-white/10">
                                      <img 
                                        src={site.config.brandLogo} 
                                        alt={site.config?.brandName || site.handle}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-base sm:text-lg font-bold shrink-0 ring-2 ring-white/10">
                                      {(site.config?.brandName || site.handle)[0].toUpperCase()}
                                    </div>
                                  )}
                                  {/* Brand info and mode badge */}
                                  <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-sm sm:text-base font-bold text-white truncate mb-0.5" title={site.config?.brandName || site.handle}>
                                        {site.config?.brandName || site.handle}
                                      </h3>
                                      <p className="text-[11px] sm:text-xs text-gray-400 truncate">@{site.handle}</p>
                                    </div>
                                    {/* Mode badge */}
                                    <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider shrink-0 ${
                                      mode === 'services' ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30' :
                                      mode === 'products' ? 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/30' :
                                      mode === 'digital' ? 'bg-pink-500/20 text-pink-300 ring-1 ring-pink-500/30' :
                                      mode === 'booking' ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30' :
                                      'bg-gray-500/20 text-gray-300 ring-1 ring-gray-500/30'
                                    }`}>
                                      <span className="hidden sm:inline">{mode === 'services' ? '🔧' : mode === 'products' ? '🛍️' : mode === 'digital' ? '⚡' : mode === 'booking' ? '📅' : '📦'} </span>{mode}
                                    </span>
                                  </div>
                                </div>

                                {/* Metadata: Stripe status + published date */}
                                <div className="flex items-center justify-between gap-2 pt-2 sm:pt-2.5 border-t border-white/5">
                                  <div className="flex items-center gap-1 sm:gap-1.5">
                                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-[10px] sm:text-xs text-gray-500">
                                      {site.updated_at ? new Date(site.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}
                                    </span>
                                  </div>
                                  {stripeFullyEnabled ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/20 text-green-300 text-[10px] sm:text-xs font-semibold ring-1 ring-green-500/30">
                                      <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                      <span className="hidden xs:inline">Stripe</span>
                                    </span>
                                  ) : stripeIncomplete ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 text-[10px] sm:text-xs font-semibold ring-1 ring-yellow-500/30">
                                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                                      <span className="hidden xs:inline">Stripe</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400 text-[10px] sm:text-xs font-semibold ring-1 ring-gray-500/30">
                                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                      <span className="hidden xs:inline">No Stripe</span>
                                    </span>
                                  )}
                                </div>

                                {/* Primary actions: Edit + View */}
                                <div className="flex gap-1.5 sm:gap-2">
                                  <button 
                                    onClick={() => openEditPreview(site.handle, site.config)}
                                    className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-2.5 sm:py-2 bg-gradient-to-r from-blue-600/80 to-cyan-600/80 hover:from-blue-600 hover:to-cyan-600 active:scale-95 border border-blue-500/50 text-white rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 min-h-[44px] sm:min-h-0">
                                    <Edit className="h-3.5 w-3.5 sm:h-3.5 sm:w-3.5" />
                                    <span>Edit</span>
                                  </button>
                                  <Link 
                                    href={`/u/${site.handle}`}
                                    className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-2.5 sm:py-2 bg-gradient-to-r from-green-600/80 to-emerald-600/80 hover:from-green-600 hover:to-emerald-600 active:scale-95 border border-green-500/50 text-white rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/30 min-h-[44px] sm:min-h-0">
                                    <Eye className="h-3.5 w-3.5 sm:h-3.5 sm:w-3.5" />
                                    <span>View</span>
                                  </Link>
                                </div>

                                {/* Secondary actions: Stripe + QR + Delete */}
                                <div className="flex gap-1.5 pt-2 border-t border-white/5">
                                  <Link
                                    href={`/connect?handle=${site.handle}`}
                                    className="flex-1 flex items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-2 sm:py-1.5 bg-purple-600/20 hover:bg-purple-600/30 active:scale-95 border border-purple-500/40 text-purple-300 rounded-lg font-medium text-[10px] sm:text-xs transition-all duration-200 hover:scale-105 min-h-[44px] sm:min-h-0"
                                    title={stripeFullyEnabled ? 'Manage Stripe' : stripeIncomplete ? 'Finish Stripe setup' : 'Connect Stripe'}
                                  >
                                    <Settings className="h-3 w-3" />
                                    <span>{stripeFullyEnabled ? 'Manage' : stripeIncomplete ? 'Setup' : 'Stripe'}</span>
                                  </Link>
                                  <button 
                                    onClick={() => downloadQR(site.handle)}
                                    className="flex-1 flex items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-2 sm:py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 active:scale-95 border border-cyan-500/40 text-cyan-300 rounded-lg font-medium text-[10px] sm:text-xs transition-all duration-200 hover:scale-105 min-h-[44px] sm:min-h-0"
                                    title="Download QR Code"
                                  >
                                    <Download className="h-3 w-3" />
                                    <span>QR</span>
                                  </button>
                                  <button 
                                    onClick={() => deleteSite(site.handle)}
                                    disabled={deletingHandle === site.handle}
                                    className="flex-1 flex items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-2 sm:py-1.5 bg-red-600/20 hover:bg-red-600/30 active:scale-95 border border-red-500/40 text-red-300 rounded-lg font-medium text-[10px] sm:text-xs transition-all duration-200 disabled:opacity-50 hover:scale-105 min-h-[44px] sm:min-h-0"
                                    title="Delete Piqo"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    <span>{deletingHandle === site.handle ? '...' : 'Delete'}</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Digital Section */}
                    {digitalSites.length > 0 && (
                      <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-pink-500/20">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-pink-500/10 rounded-lg border border-pink-500/30">
                            <span className="text-lg">⚡</span>
                            <span className="text-sm font-bold text-pink-300 uppercase tracking-wider">Digital</span>
                          </div>
                          <span className="px-2 py-1 bg-pink-500/20 text-pink-300 text-xs font-bold rounded-full">{digitalSites.length}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          {digitalSites.map((site) => {
                            const color = site.config?.appearance?.accent || '#06b6d4';
                            const hasStripeAccount = !!site.stripe_account_id;
                            const stripeFullyEnabled = hasStripeAccount && site.stripe_charges_enabled && site.stripe_payouts_enabled;
                            const stripeIncomplete = hasStripeAccount && !stripeFullyEnabled;
                            const mode = site.config?.mode || 'unknown';
                            
                            return (
                              <div key={site.handle} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl hover:shadow-2xl hover:shadow-cyan-500/20 hover:border-cyan-500/30 transition-all duration-300 p-3 sm:p-4 flex flex-col gap-3 group active:scale-[0.98]">
                                {/* Header: Logo + Brand name + handle + mode badge */}
                                <div className="flex items-start gap-2.5 sm:gap-3">
                                  {/* Brand Logo */}
                                  {site.config?.brandLogo ? (
                                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center shrink-0 ring-2 ring-white/10">
                                      <img 
                                        src={site.config.brandLogo} 
                                        alt={site.config?.brandName || site.handle}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-base sm:text-lg font-bold shrink-0 ring-2 ring-white/10">
                                      {(site.config?.brandName || site.handle)[0].toUpperCase()}
                                    </div>
                                  )}
                                  {/* Brand info and mode badge */}
                                  <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <h3 className="text-sm sm:text-base font-bold text-white truncate mb-0.5" title={site.config?.brandName || site.handle}>
                                        {site.config?.brandName || site.handle}
                                      </h3>
                                      <p className="text-[11px] sm:text-xs text-gray-400 truncate">@{site.handle}</p>
                                    </div>
                                    {/* Mode badge */}
                                    <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider shrink-0 ${
                                      mode === 'services' ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30' :
                                      mode === 'products' ? 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/30' :
                                      mode === 'digital' ? 'bg-pink-500/20 text-pink-300 ring-1 ring-pink-500/30' :
                                      mode === 'booking' ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30' :
                                      'bg-gray-500/20 text-gray-300 ring-1 ring-gray-500/30'
                                    }`}>
                                      <span className="hidden sm:inline">{mode === 'services' ? '🔧' : mode === 'products' ? '🛍️' : mode === 'digital' ? '⚡' : mode === 'booking' ? '📅' : '📦'} </span>{mode}
                                    </span>
                                  </div>
                                </div>

                                {/* Metadata: Stripe status + published date */}
                                <div className="flex items-center justify-between gap-2 pt-2 sm:pt-2.5 border-t border-white/5">
                                  <div className="flex items-center gap-1 sm:gap-1.5">
                                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-[10px] sm:text-xs text-gray-500">
                                      {site.updated_at ? new Date(site.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}
                                    </span>
                                  </div>
                                  {stripeFullyEnabled ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/20 text-green-300 text-[10px] sm:text-xs font-semibold ring-1 ring-green-500/30">
                                      <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                                      <span className="hidden xs:inline">Stripe</span>
                                    </span>
                                  ) : stripeIncomplete ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 text-[10px] sm:text-xs font-semibold ring-1 ring-yellow-500/30">
                                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                                      <span className="hidden xs:inline">Stripe</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400 text-[10px] sm:text-xs font-semibold ring-1 ring-gray-500/30">
                                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                                      <span className="hidden xs:inline">No Stripe</span>
                                    </span>
                                  )}
                                </div>

                                {/* Primary actions: Edit + View */}
                                <div className="flex gap-1.5 sm:gap-2">
                                  <button 
                                    onClick={() => openEditPreview(site.handle, site.config)}
                                    className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-2.5 sm:py-2 bg-gradient-to-r from-blue-600/80 to-cyan-600/80 hover:from-blue-600 hover:to-cyan-600 active:scale-95 border border-blue-500/50 text-white rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 min-h-[44px] sm:min-h-0">
                                    <Edit className="h-3.5 w-3.5 sm:h-3.5 sm:w-3.5" />
                                    <span>Edit</span>
                                  </button>
                                  <Link 
                                    href={`/u/${site.handle}`}
                                    className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-2.5 sm:py-2 bg-gradient-to-r from-green-600/80 to-emerald-600/80 hover:from-green-600 hover:to-emerald-600 active:scale-95 border border-green-500/50 text-white rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/30 min-h-[44px] sm:min-h-0">
                                    <Eye className="h-3.5 w-3.5 sm:h-3.5 sm:w-3.5" />
                                    <span>View</span>
                                  </Link>
                                </div>

                                {/* Secondary actions: Stripe + QR + Delete */}
                                <div className="flex gap-1.5 pt-2 border-t border-white/5">
                                  <Link
                                    href={`/connect?handle=${site.handle}`}
                                    className="flex-1 flex items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-2 sm:py-1.5 bg-purple-600/20 hover:bg-purple-600/30 active:scale-95 border border-purple-500/40 text-purple-300 rounded-lg font-medium text-[10px] sm:text-xs transition-all duration-200 hover:scale-105 min-h-[44px] sm:min-h-0"
                                    title={stripeFullyEnabled ? 'Manage Stripe' : stripeIncomplete ? 'Finish Stripe setup' : 'Connect Stripe'}
                                  >
                                    <Settings className="h-3 w-3" />
                                    <span>{stripeFullyEnabled ? 'Manage' : stripeIncomplete ? 'Setup' : 'Stripe'}</span>
                                  </Link>
                                  <button 
                                    onClick={() => downloadQR(site.handle)}
                                    className="flex-1 flex items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-2 sm:py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 active:scale-95 border border-cyan-500/40 text-cyan-300 rounded-lg font-medium text-[10px] sm:text-xs transition-all duration-200 hover:scale-105 min-h-[44px] sm:min-h-0"
                                    title="Download QR Code"
                                  >
                                    <Download className="h-3 w-3" />
                                    <span>QR</span>
                                  </button>
                                  <button 
                                    onClick={() => deleteSite(site.handle)}
                                    disabled={deletingHandle === site.handle}
                                    className="flex-1 flex items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-2 sm:py-1.5 bg-red-600/20 hover:bg-red-600/30 active:scale-95 border border-red-500/40 text-red-300 rounded-lg font-medium text-[10px] sm:text-xs transition-all duration-200 disabled:opacity-50 hover:scale-105 min-h-[44px] sm:min-h-0"
                                    title="Delete Piqo"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                    <span>{deletingHandle === site.handle ? '...' : 'Delete'}</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Other/Unknown modes */}
                    {(bookingSites.length > 0 || otherSites.length > 0) && (
                      <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-500/20">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-500/10 rounded-lg border border-gray-500/30">
                            <span className="text-lg">📦</span>
                            <span className="text-sm font-bold text-gray-300 uppercase tracking-wider">Other</span>
                          </div>
                          <span className="px-2 py-1 bg-gray-500/20 text-gray-300 text-xs font-bold rounded-full">{bookingSites.length + otherSites.length}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                          {[...bookingSites, ...otherSites].map((site) => {
                            const color = site.config?.appearance?.accent || '#06b6d4';
                            const hasStripeAccount = !!site.stripe_account_id;
                            const stripeFullyEnabled = hasStripeAccount && site.stripe_charges_enabled && site.stripe_payouts_enabled;
                            const stripeIncomplete = hasStripeAccount && !stripeFullyEnabled;
                            const mode = site.config?.mode || 'unknown';
                            
                            return (
                  <div key={site.handle} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl hover:shadow-2xl hover:shadow-cyan-500/20 hover:border-cyan-500/30 transition-all duration-300 p-3 sm:p-4 flex flex-col gap-3 group active:scale-[0.98]">
                    {/* Header: Logo + Brand name + handle + mode badge */}
                    <div className="flex items-start gap-2.5 sm:gap-3">
                      {/* Brand Logo */}
                      {site.config?.brandLogo ? (
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center shrink-0 ring-2 ring-white/10">
                          <img 
                            src={site.config.brandLogo} 
                            alt={site.config?.brandName || site.handle}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-base sm:text-lg font-bold shrink-0 ring-2 ring-white/10">
                          {(site.config?.brandName || site.handle)[0].toUpperCase()}
                        </div>
                      )}
                      {/* Brand info and mode badge */}
                      <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm sm:text-base font-bold text-white truncate mb-0.5" title={site.config?.brandName || site.handle}>
                            {site.config?.brandName || site.handle}
                          </h3>
                          <p className="text-[11px] sm:text-xs text-gray-400 truncate">@{site.handle}</p>
                        </div>
                        {/* Mode badge */}
                        <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider shrink-0 ${
                          mode === 'services' ? 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-500/30' :
                          mode === 'products' ? 'bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/30' :
                          mode === 'digital' ? 'bg-pink-500/20 text-pink-300 ring-1 ring-pink-500/30' :
                          mode === 'booking' ? 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30' :
                          'bg-gray-500/20 text-gray-300 ring-1 ring-gray-500/30'
                        }`}>
                          <span className="hidden sm:inline">{mode === 'services' ? '🔧' : mode === 'products' ? '🛍️' : mode === 'digital' ? '⚡' : mode === 'booking' ? '📅' : '📦'} </span>{mode}
                        </span>
                      </div>
                    </div>

                    {/* Metadata: Stripe status + published date */}
                    <div className="flex items-center justify-between gap-2 pt-2 sm:pt-2.5 border-t border-white/5">
                      <div className="flex items-center gap-1 sm:gap-1.5">
                        <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-[10px] sm:text-xs text-gray-500">
                          {site.updated_at ? new Date(site.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Never'}
                        </span>
                      </div>
                      {stripeFullyEnabled ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/20 text-green-300 text-[10px] sm:text-xs font-semibold ring-1 ring-green-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                          <span className="hidden xs:inline">Stripe</span>
                        </span>
                      ) : stripeIncomplete ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-300 text-[10px] sm:text-xs font-semibold ring-1 ring-yellow-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                          <span className="hidden xs:inline">Stripe</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-500/20 text-gray-400 text-[10px] sm:text-xs font-semibold ring-1 ring-gray-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                          <span className="hidden xs:inline">No Stripe</span>
                        </span>
                      )}
                    </div>

                    {/* Primary actions: Edit + View */}
                    <div className="flex gap-1.5 sm:gap-2">
                      <button 
                        onClick={() => openEditPreview(site.handle, site.config)}
                        className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-2.5 sm:py-2 bg-gradient-to-r from-blue-600/80 to-cyan-600/80 hover:from-blue-600 hover:to-cyan-600 active:scale-95 border border-blue-500/50 text-white rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/30 min-h-[44px] sm:min-h-0">
                        <Edit className="h-3.5 w-3.5 sm:h-3.5 sm:w-3.5" />
                        <span>Edit</span>
                      </button>
                      <Link 
                        href={`/u/${site.handle}`}
                        className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 px-3 sm:px-3.5 py-2.5 sm:py-2 bg-gradient-to-r from-green-600/80 to-emerald-600/80 hover:from-green-600 hover:to-emerald-600 active:scale-95 border border-green-500/50 text-white rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-green-500/30 min-h-[44px] sm:min-h-0">
                        <Eye className="h-3.5 w-3.5 sm:h-3.5 sm:w-3.5" />
                        <span>View</span>
                      </Link>
                    </div>

                    {/* Secondary actions: Stripe + QR + Delete */}
                    <div className="flex gap-1.5 pt-2 border-t border-white/5">
                      <Link
                        href={`/connect?handle=${site.handle}`}
                        className="flex-1 flex items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-2 sm:py-1.5 bg-purple-600/20 hover:bg-purple-600/30 active:scale-95 border border-purple-500/40 text-purple-300 rounded-lg font-medium text-[10px] sm:text-xs transition-all duration-200 hover:scale-105 min-h-[44px] sm:min-h-0"
                        title={stripeFullyEnabled ? 'Manage Stripe' : stripeIncomplete ? 'Finish Stripe setup' : 'Connect Stripe'}
                      >
                        <Settings className="h-3 w-3" />
                        <span>{stripeFullyEnabled ? 'Manage' : stripeIncomplete ? 'Setup' : 'Stripe'}</span>
                      </Link>
                      <button 
                        onClick={() => downloadQR(site.handle)}
                        className="flex-1 flex items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-2 sm:py-1.5 bg-cyan-600/20 hover:bg-cyan-600/30 active:scale-95 border border-cyan-500/40 text-cyan-300 rounded-lg font-medium text-[10px] sm:text-xs transition-all duration-200 hover:scale-105 min-h-[44px] sm:min-h-0"
                        title="Download QR Code"
                      >
                        <Download className="h-3 w-3" />
                        <span>QR</span>
                      </button>
                      <button 
                        onClick={() => deleteSite(site.handle)}
                        disabled={deletingHandle === site.handle}
                        className="flex-1 flex items-center justify-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-2 sm:py-1.5 bg-red-600/20 hover:bg-red-600/30 active:scale-95 border border-red-500/40 text-red-300 rounded-lg font-medium text-[10px] sm:text-xs transition-all duration-200 disabled:opacity-50 hover:scale-105 min-h-[44px] sm:min-h-0"
                        title="Delete Piqo"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>{deletingHandle === site.handle ? '...' : 'Delete'}</span>
                      </button>
                    </div>
                  </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </>
          )}
        </section>

        {/* Bookings Section */}
        <section className="mb-16">
          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-6 border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur-lg opacity-60"></div>
                  <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
                    <Calendar className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Recent Bookings</h2>
                  <p className="text-gray-400 text-xs sm:text-sm font-medium mt-0.5">Live updates from your storefronts</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center bg-purple-500/20 border border-purple-500/40 rounded-xl px-6 py-3 shadow-lg">
                  <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-purple-300 to-purple-500">{bookings.length}</p>
                  <p className="text-xs text-purple-400 uppercase tracking-widest font-bold mt-1">Total</p>
                </div>
              </div>
            </div>
          </div>
          <div className="mb-6">
            {/* Week Switcher */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedWeek('last')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md ${
                  selectedWeek === 'last'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-purple-500/50'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300'
                }`}
              >
                Last Week
              </button>
              <button
                onClick={() => setSelectedWeek('this')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md ${
                  selectedWeek === 'this'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-purple-500/50'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setSelectedWeek('next')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md ${
                  selectedWeek === 'next'
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-purple-500/50'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300'
                }`}
              >
                Next Week
              </button>
              <span className="ml-2 text-xs text-gray-400 font-medium px-3 py-1.5 bg-white/5 rounded-lg">{getWeekLabel(selectedWeek)}</span>
            </div>
          </div>
          {loading ? (
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-20"></div>
              <div className="relative bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-12 text-center">
                <div className="inline-block w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400 font-medium">Loading bookings...</p>
              </div>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-20"></div>
              <div className="relative bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                  <Calendar className="h-10 w-10 text-purple-500" />
                </div>
                <p className="text-xl font-bold text-white mb-2">No bookings for {getWeekLabel(selectedWeek)}</p>
                <p className="text-gray-400 mb-6">Try selecting a different week or create a booking piqo to get started.</p>
                <Link href="/create" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg">
                  <Plus className="h-5 w-5" />
                  Create Booking Piqo
                </Link>
              </div>
            </div>
          ) : (
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-20"></div>
              <div className="relative bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  {Object.keys(groupedBookings).length === 0 ? (
                    <div className="p-12 text-center">
                      <p className="text-gray-400">No bookings found for this week</p>
                    </div>
                  ) : (
                    Object.entries(groupedBookings).map(([dateKey, dateBookings], groupIndex) => (
                      <div key={dateKey}>
                        {/* Date Header */}
                        <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 border-y border-purple-500/30 px-6 py-3">
                          <h3 className="text-sm font-bold text-purple-200 uppercase tracking-wider">{dateKey}</h3>
                        </div>
                        <table className="min-w-full">
                          <thead className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-purple-500/30">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-bold text-purple-300 uppercase tracking-widest">Customer</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-purple-300 uppercase tracking-widest">Service</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-purple-300 uppercase tracking-widest">Time</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-purple-300 uppercase tracking-widest">Status</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-purple-300 uppercase tracking-widest">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                          {(dateBookings as Booking[]).map((b: Booking, index: number) => (
                      <tr key={String(b.id) || `booking-${index}`} className="hover:bg-white/5 transition-all duration-200 group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white flex items-center justify-center text-sm font-bold shadow-lg">
                              {(b.customer_name || b.customer_email || 'U')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{b.customer_name || b.customer_email?.split('@')[0] || '—'}</p>
                              {b.team_member_name && (
                                <p className="text-xs text-gray-400 truncate">with {b.team_member_name}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-white font-medium truncate">{b.item_title || '—'}</p>
                          {b.site_brand_name && (
                            <p className="text-xs text-gray-400 truncate">{b.site_brand_name}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {b.slot_start_time ? (
                            <div>
                              <p className="font-semibold whitespace-nowrap">
                                {new Date(b.slot_start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                              </p>
                              {b.slot_end_time && (
                                <p className="text-xs text-gray-500 whitespace-nowrap">
                                  to {new Date(b.slot_end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {b.status ? (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold gap-1 whitespace-nowrap ${
                              b.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              b.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                b.status === 'confirmed' ? 'bg-green-600' :
                                b.status === 'pending' ? 'bg-yellow-600' :
                                'bg-gray-600'
                              }`}></span>
                              {b.checked_in ? 'Checked in' : b.status}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedBooking(b);
                                setBookingDetailOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/50 text-purple-300 font-semibold text-xs transition-all duration-200 hover:scale-105 hover:shadow-lg"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            {b.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() => confirmBooking(b.id, 'confirmed')}
                                  disabled={confirmingBookingId === b.id}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 text-green-300 font-semibold text-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-lg"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => confirmBooking(b.id, 'cancelled')}
                                  disabled={confirmingBookingId === b.id}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 font-semibold text-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-lg"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => deleteBooking(b.id)}
                                disabled={deletingBookingId === b.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 font-semibold text-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 hover:shadow-lg"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                          </tbody>
                        </table>
                      </div>
                    ))
                  )}
                </div>
                {filteredBookings.length > 0 && (
                  <div className="px-6 py-4 bg-white/5 border-t border-white/10 text-center">
                    <p className="text-sm text-gray-400">{filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''} for {getWeekLabel(selectedWeek)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Orders Section */}
        <section>
          <div className="bg-gradient-to-r from-pink-500/10 to-orange-500/10 rounded-2xl sm:rounded-3xl p-6 sm:p-8 mb-6 border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-orange-500 rounded-xl blur-lg opacity-60"></div>
                  <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center shadow-2xl">
                    <ShoppingCart className="h-7 w-7 text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-orange-400">Recent Orders</h2>
                  <p className="text-gray-400 text-xs sm:text-sm font-medium mt-0.5">Track purchases from your storefronts</p>
                </div>
              </div>
              <div className="text-center bg-pink-500/20 border border-pink-500/40 rounded-xl px-6 py-3 shadow-lg">
                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-pink-300 to-pink-500">{orders.length}</p>
                <p className="text-xs text-pink-400 uppercase tracking-widest font-bold mt-1">Total</p>
              </div>
            </div>
          </div>
          <div className="mb-6 space-y-3">
            {/* Show/Hide Completed Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCompletedOrders(!showCompletedOrders)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md ${
                  showCompletedOrders
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-500/50'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300'
                }`}
              >
                <Check className="h-4 w-4" />
                {showCompletedOrders ? 'Hide' : 'Show'} Completed Orders
              </button>
              {completedOrders.size > 0 && (
                <span className="text-xs text-gray-400 px-3 py-1.5 bg-white/5 rounded-lg">
                  {completedOrders.size} completed
                </span>
              )}
            </div>
            {/* Week Switcher for Orders */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedOrderWeek('last')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md ${
                  selectedOrderWeek === 'last'
                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-pink-500/50'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300'
                }`}
              >
                Last Week
              </button>
              <button
                onClick={() => setSelectedOrderWeek('this')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md ${
                  selectedOrderWeek === 'this'
                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-pink-500/50'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setSelectedOrderWeek('next')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-md ${
                  selectedOrderWeek === 'next'
                    ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-pink-500/50'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300'
                }`}
              >
                Next Week
              </button>
              <span className="ml-2 text-xs text-gray-400 font-medium px-3 py-1.5 bg-white/5 rounded-lg">{getWeekLabel(selectedOrderWeek)}</span>
            </div>
          </div>
          {loading ? (
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl blur opacity-20"></div>
              <div className="relative bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-12 text-center">
                <div className="inline-block w-16 h-16 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mb-4"></div>
                <p className="text-gray-400 font-medium">Loading orders...</p>
              </div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl blur opacity-20"></div>
              <div className="relative bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-pink-500/10 flex items-center justify-center">
                  <ShoppingCart className="h-10 w-10 text-pink-500" />
                </div>
                <p className="text-xl font-bold text-white mb-2">No orders for {getWeekLabel(selectedOrderWeek)}</p>
                <p className="text-gray-400 mb-6">Try selecting a different week or create a store to start selling.</p>
                <Link href="/create" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white font-bold rounded-xl transition-all duration-200 hover:scale-105 shadow-lg">
                  <Plus className="h-5 w-5" />
                  Create Product Piqo
                </Link>
              </div>
            </div>
          ) : (
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 to-orange-500 rounded-2xl blur opacity-20"></div>
              <div className="relative bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              <div className="overflow-x-auto">
                {Object.keys(groupedOrders).length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-gray-400">No orders found for this week</p>
                  </div>
                ) : (
                  Object.entries(groupedOrders).map(([dateKey, dateOrders]) => (
                    <div key={dateKey}>
                      {/* Date Header */}
                      <div className="bg-gradient-to-r from-pink-600/30 to-orange-600/30 border-y border-pink-500/30 px-6 py-3">
                        <h3 className="text-sm font-bold text-pink-200 uppercase tracking-wider">{dateKey}</h3>
                      </div>
                      <table className="min-w-full">
                        <thead className="bg-gradient-to-r from-pink-600/20 to-orange-600/20 border-b border-pink-500/30">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-pink-300 uppercase tracking-widest">Customer</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-pink-300 uppercase tracking-widest">Item</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-pink-300 uppercase tracking-widest">Store</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-pink-300 uppercase tracking-widest">Type</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-pink-300 uppercase tracking-widest">Price</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-pink-300 uppercase tracking-widest">Time</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-pink-300 uppercase tracking-widest">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                        {(dateOrders as Order[]).map((o: Order, index: number) => {
                          const isCompleted = completedOrders.has(String(o.id));
                          return (
                    <tr key={String(o.id) || `order-${index}`} className={`hover:bg-white/5 transition-all duration-200 group ${
                      isCompleted ? 'opacity-60 bg-green-500/5' : ''
                    }`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-pink-700 text-white flex items-center justify-center text-sm font-bold shadow-lg">
                            {(o.customer_name || o.customer_email || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{o.customer_name || o.customer_email?.split('@')[0] || '—'}</p>
                            <p className="text-xs text-gray-400">{o.customer_email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-white">
                        <div>
                          {o.order_items && Array.isArray(o.order_items) && o.order_items.length > 0 ? (
                            <>
                              {o.order_items.map((item: any, idx: number) => (
                                <p key={idx} className={`font-semibold ${idx > 0 ? 'mt-1 text-gray-300' : ''}`}>
                                  {item.quantity && item.quantity > 1 ? `${item.quantity}x ` : ''}{item.title || 'Item'}
                                </p>
                              ))}
                            </>
                          ) : (
                            <p className="font-semibold">{o.item_title || '—'}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-semibold text-white">{o.site_brand_name || o.handle || '—'}</p>
                          {o.site_brand_name && o.handle && (
                            <p className="text-xs text-gray-400">@{o.handle}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {o.mode ? (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            o.mode === 'products' ? 'bg-orange-100 text-orange-800' :
                            o.mode === 'digital' ? 'bg-pink-100 text-pink-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {o.mode === 'products' ? '🛍️ Products' : o.mode === 'digital' ? '⚡ Digital' : o.mode}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-white">
                        {o.amount_cents ? `$${(o.amount_cents / 100).toFixed(2)}` : (o.item_price || '—')}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {o.created_at ? (
                          <p className="font-semibold whitespace-nowrap">
                            {new Date(o.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </p>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          {isCompleted && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-300 border border-green-500/30">
                              <Check className="h-3 w-3" />
                              Complete
                            </span>
                          )}
                          <button
                            onClick={() => toggleOrderComplete(String(o.id))}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold text-xs transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                              isCompleted
                                ? 'bg-gray-600/20 hover:bg-gray-600/30 border-gray-500/50 text-gray-300'
                                : 'bg-green-600/20 hover:bg-green-600/30 border-green-500/50 text-green-300'
                            }`}
                            title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                          >
                            <Check className="h-3.5 w-3.5" />
                            {isCompleted ? 'Undo' : 'Complete'}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedOrder(o);
                              setOrderDetailOpen(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600/20 hover:bg-pink-600/30 border border-pink-500/50 text-pink-300 font-semibold text-xs transition-all duration-200 hover:scale-105 hover:shadow-lg"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );})}
                        </tbody>
                      </table>
                    </div>
                  ))
                )}
              </div>
              {filteredOrders.length > 0 && (
                <div className="px-6 py-4 bg-white/5 border-t border-white/10 text-center">
                  <p className="text-sm text-gray-400">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} for {getWeekLabel(selectedOrderWeek)}</p>
                </div>
              )}
            </div>
            </div>
          )}
        </section>
      </div>

      {/* Edit Preview Modal */}
      {previewOpen && editingHandle && editingConfig && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold text-white" style={{ backgroundColor: editingConfig?.appearance?.accent || '#06b6d4' }}>
                  {editingConfig?.brandName?.[0]?.toUpperCase() || editingHandle[0]?.toUpperCase() || 'P'}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{editingConfig?.brandName || editingHandle}</h2>
                  <p className="text-xs text-gray-500">@{editingHandle}</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewOpen(false)}
                className="p-1 hover:bg-gray-200 rounded-lg transition"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            {/* Modal Body - Split View */}
            <div className="flex-1 overflow-hidden flex">
              {/* Preview Section */}
              <div className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100 p-4">
                <div className="flex items-center justify-center min-h-full">
                  <PiqoLivePreview config={editingConfig} />
                </div>
              </div>

              {/* Edit Section */}
              <div className="w-80 border-l border-gray-200 bg-white p-6 overflow-y-auto flex flex-col gap-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3">Quick Info</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-600 font-medium">Brand</p>
                      <p className="text-gray-900 font-semibold">{editingConfig?.brandName || 'Unnamed'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium">Tagline</p>
                      <p className="text-gray-800">{editingConfig?.tagline || 'No tagline'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium">Mode</p>
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800 capitalize">
                        {editingConfig?.mode || 'unknown'}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-600 font-medium">Items</p>
                      <p className="text-gray-900">{editingConfig?.items?.length || 0} item{(editingConfig?.items?.length || 0) !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-3">Last updated: {new Date(editingHandle ? sites.find(s => s.handle === editingHandle)?.updated_at || new Date() : new Date()).toLocaleDateString()}</p>
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/create?handle=${encodeURIComponent(editingHandle || '')}&edit=true`}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition"
                    >
                      <Edit className="h-4 w-4" />
                      Open Editor
                    </Link>
                    <button
                      onClick={() => setPreviewOpen(false)}
                      className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {orderDetailOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-pink-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-400 to-pink-600 text-white flex items-center justify-center text-lg font-bold">
                  <ShoppingCart className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Order Details</h2>
                  <p className="text-xs text-gray-500">Order #{selectedOrder.id}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setOrderDetailOpen(false);
                  setSelectedOrder(null);
                }}
                className="p-1 hover:bg-gray-200 rounded-lg transition"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Store Info */}
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-100">
                  <p className="text-xs font-semibold text-pink-900 uppercase tracking-wider mb-2">Store</p>
                  <p className="text-lg font-bold text-gray-900">{selectedOrder.site_brand_name || selectedOrder.handle}</p>
                  {selectedOrder.site_brand_name && (
                    <p className="text-sm text-gray-600">@{selectedOrder.handle}</p>
                  )}
                </div>

                {/* Customer Info */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Customer</p>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 text-white flex items-center justify-center text-lg font-bold">
                      {(selectedOrder.customer_name || selectedOrder.customer_email || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{selectedOrder.customer_name || selectedOrder.customer_email?.split('@')[0] || 'Anonymous'}</p>
                      <p className="text-sm text-gray-600">{selectedOrder.customer_email || 'No email provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Items</p>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-200">
                    {/* Check if order has multiple items in order_items array */}
                    {selectedOrder.order_items && Array.isArray(selectedOrder.order_items) && selectedOrder.order_items.length > 0 ? (
                      // Display all items from the cart
                      selectedOrder.order_items.map((orderItem: any, idx: number) => (
                        <div key={idx} className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{orderItem.title || 'Unnamed Item'}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {idx === 0 && selectedOrder.mode && (
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                    selectedOrder.mode === 'products' ? 'bg-orange-100 text-orange-800' :
                                    selectedOrder.mode === 'digital' ? 'bg-pink-100 text-pink-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {selectedOrder.mode === 'products' ? '🛍️ Products' : selectedOrder.mode === 'digital' ? '⚡ Digital' : selectedOrder.mode}
                                  </span>
                                )}
                                <span className="text-xs text-gray-500">Qty: {orderItem.quantity || 1}</span>
                                {orderItem.note && (
                                  <span className="text-xs text-gray-400">• {orderItem.note}</span>
                                )}
                              </div>
                            </div>
                            <p className="font-bold text-gray-900">{orderItem.price || '—'}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      // Fallback to single item display (legacy orders)
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{selectedOrder.item_title || 'Unnamed Item'}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {selectedOrder.mode && (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                                  selectedOrder.mode === 'products' ? 'bg-orange-100 text-orange-800' :
                                  selectedOrder.mode === 'digital' ? 'bg-pink-100 text-pink-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {selectedOrder.mode === 'products' ? '🛍️ Products' : selectedOrder.mode === 'digital' ? '⚡ Digital' : selectedOrder.mode}
                                </span>
                              )}
                              <span className="text-xs text-gray-500">Qty: 1</span>
                            </div>
                          </div>
                          <p className="font-bold text-gray-900">{selectedOrder.item_price || '—'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price Breakdown */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Summary</p>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-900">{selectedOrder.item_price || '—'}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 flex justify-between">
                      <span className="font-bold text-gray-900">Total</span>
                      <span className="font-bold text-gray-900 text-lg">{selectedOrder.item_price || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Status & Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</p>
                    {selectedOrder.status ? (
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold gap-2 ${
                        selectedOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                        selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedOrder.status === 'refunded' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          selectedOrder.status === 'completed' ? 'bg-green-600' :
                          selectedOrder.status === 'pending' ? 'bg-yellow-600' :
                          selectedOrder.status === 'refunded' ? 'bg-red-600' :
                          'bg-gray-600'
                        }`}></span>
                        {selectedOrder.status === 'completed' && selectedOrder.mode === 'digital' ? 'Delivered' : selectedOrder.status === 'completed' ? 'Paid' : selectedOrder.status}
                      </span>
                    ) : (
                      <span className="text-gray-400">Unknown</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Order Date</p>
                    {selectedOrder.created_at ? (
                      <div>
                        <p className="font-semibold text-gray-900">{new Date(selectedOrder.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        <p className="text-sm text-gray-600">{new Date(selectedOrder.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setOrderDetailOpen(false);
                  setSelectedOrder(null);
                }}
                className="w-full px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Booking Detail Modal */}
      {bookingDetailOpen && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center text-lg font-bold">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Booking Details</h2>
                  <p className="text-xs text-gray-500">Booking #{selectedBooking.id}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setBookingDetailOpen(false);
                  setSelectedBooking(null);
                }}
                className="p-1 hover:bg-gray-200 rounded-lg transition"
              >
                <X className="h-6 w-6 text-gray-600" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Store Info */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
                  <p className="text-xs font-semibold text-purple-900 uppercase tracking-wider mb-2">Piqo</p>
                  <p className="text-lg font-bold text-gray-900">{selectedBooking.site_brand_name || selectedBooking.handle}</p>
                  {selectedBooking.site_brand_name && (
                    <p className="text-sm text-gray-600">@{selectedBooking.handle}</p>
                  )}
                </div>

                {/* Customer Info */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Customer</p>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center text-lg font-bold">
                      {(selectedBooking.customer_name || selectedBooking.customer_email || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{selectedBooking.customer_name || selectedBooking.customer_email?.split('@')[0] || 'Anonymous'}</p>
                      <p className="text-sm text-gray-600">{selectedBooking.customer_email || 'No email provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Service & Staff */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Service</p>
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      <p className="font-semibold text-gray-900">{selectedBooking.item_title || 'Unnamed Service'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Team Member</p>
                    <div className="bg-white border border-gray-200 rounded-lg p-3">
                      {selectedBooking.team_member_name ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                          {selectedBooking.team_member_name}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">Any available</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Appointment Time */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Scheduled For</p>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
                    {selectedBooking.slot_start_time ? (
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="text-lg font-bold text-gray-900">
                            {new Date(selectedBooking.slot_start_time).toLocaleDateString('en-US', { 
                              weekday: 'long',
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(selectedBooking.slot_start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                            {selectedBooking.slot_end_time && ` – ${new Date(selectedBooking.slot_end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`}
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center border-2 border-purple-200">
                          <Calendar className="h-6 w-6 text-purple-600" />
                        </div>
                      </div>
                    ) : selectedBooking.created_at ? (
                      <p className="text-sm text-gray-600">Booked {new Date(selectedBooking.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    ) : (
                      <span className="text-gray-400">No time scheduled</span>
                    )}
                  </div>
                </div>

                {/* Status & Check-in */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</p>
                    {selectedBooking.status ? (
                      <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold gap-2 ${
                        selectedBooking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        selectedBooking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedBooking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        <span className={`w-2 h-2 rounded-full ${
                          selectedBooking.status === 'confirmed' ? 'bg-green-600' :
                          selectedBooking.status === 'pending' ? 'bg-yellow-600' :
                          selectedBooking.status === 'cancelled' ? 'bg-red-600' :
                          'bg-gray-600'
                        }`}></span>
                        {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                      </span>
                    ) : (
                      <span className="text-gray-400">Unknown</span>
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Check-in</p>
                    {selectedBooking.checked_in ? (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-green-100 text-green-800 text-sm font-semibold gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-600"></span>
                        Checked in
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium gap-2">
                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                        Awaiting
                      </span>
                    )}
                  </div>
                </div>

                {/* Booking Date */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Booked On</p>
                  {selectedBooking.created_at ? (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="font-semibold text-gray-900">{new Date(selectedBooking.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      <p className="text-sm text-gray-600">{new Date(selectedBooking.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setBookingDetailOpen(false);
                  setSelectedBooking(null);
                }}
                className="w-full px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold transition"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </main>
  );
}
