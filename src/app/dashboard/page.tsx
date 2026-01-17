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

  // Derived stats
  const totalBookings = totalBookingsCount || bookings.length;
  const totalOrders = totalOrdersCount || orders.length;
  const totalSites = sites.length;
  const checkedInCount = bookings.filter(b => b.checked_in).length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  
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
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete piqo");
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
    <main className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center">
                <PiqoLogoFull />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 text-sm mt-0.5">Manage your piqos, bookings & orders</p>
              </div>
            </div>
            <Link
              href="/create"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white font-semibold rounded-lg transition shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              New Piqo
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Recent Activity Summary */}
        {!loading && (
          <section className="mb-8">
            <div className="bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-xl shadow-lg p-[2px]">
              <div className="bg-white rounded-[10px] p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Recent Activity
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Next Appointment */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Next Appointment</p>
                      {nextAppointment ? (
                        <div>
                          <p className="font-bold text-gray-900 text-sm truncate">{nextAppointment.customer_name || nextAppointment.customer_email?.split('@')[0] || 'Customer'}</p>
                          <p className="text-xs text-gray-600">
                            {new Date(nextAppointment.slot_start_time!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at {new Date(nextAppointment.slot_start_time!).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No upcoming appointments</p>
                      )}
                    </div>
                  </div>

                  {/* Last Order */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center flex-shrink-0">
                      <ShoppingCart className="h-5 w-5 text-pink-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Last Order</p>
                      {lastOrder ? (
                        <div>
                          <p className="font-bold text-gray-900 text-sm truncate">{lastOrder.item_title || 'Product'}</p>
                          <p className="text-xs text-gray-600">
                            {new Date(lastOrder.created_at!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {lastOrder.item_price || '$0'}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No orders yet</p>
                      )}
                    </div>
                  </div>

                  {/* Revenue (Last 7 Days) */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                      <ChevronRight className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Revenue (7 Days)</p>
                      {recentOrders.length > 0 ? (
                        <div>
                          <p className="font-bold text-gray-900 text-lg">${revenue7Days.toFixed(2)}</p>
                          <p className="text-xs text-gray-600">{recentOrders.length} order{recentOrders.length !== 1 ? 's' : ''}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No recent sales</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Stats Section */}
        <section className="mb-10 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-cyan-500">
            <p className="text-gray-600 text-sm font-medium">Published Piqos</p>
            <p className="text-4xl font-bold text-cyan-600 mt-2">{totalSites}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-purple-500">
            <p className="text-gray-600 text-sm font-medium">Total Bookings</p>
            <p className="text-4xl font-bold text-purple-600 mt-2">{totalBookings}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm font-medium">Checked In</p>
            <p className="text-4xl font-bold text-green-600 mt-2">{checkedInCount}</p>
          </div>
          <div className="bg-white rounded-xl shadow p-6 border-l-4 border-pink-500">
            <p className="text-gray-600 text-sm font-medium">Orders</p>
            <p className="text-4xl font-bold text-pink-600 mt-2">{totalOrders}</p>
          </div>
        </section>

        {/* Sites Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="h-6 w-6 text-cyan-600" />
                Your Piqos
              </h2>
              <p className="text-gray-600 text-sm mt-1">View and manage all your published stores</p>
            </div>
            <Link
              href="/create"
              className="px-4 py-2 bg-cyan-100 hover:bg-cyan-200 text-cyan-700 font-semibold rounded-lg transition"
            >
              Create New
            </Link>
          </div>
          {sites.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center">
              <p className="text-gray-600 mb-4">You haven't created any piqos yet.</p>
              <Link href="/create" className="inline-block px-6 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition">
                Create your first piqo
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sites.map((site) => {
                const color = site.config?.appearance?.accent || '#06b6d4';
                const hasStripeAccount = !!site.stripe_account_id;
                const stripeFullyEnabled = hasStripeAccount && site.stripe_charges_enabled && site.stripe_payouts_enabled;
                const stripeIncomplete = hasStripeAccount && !stripeFullyEnabled;
                
                return (
                  <div key={site.handle} className="bg-white rounded-xl shadow hover:shadow-lg transition p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold text-white" style={{ backgroundColor: color }}>
                        {site.config?.brandName?.[0]?.toUpperCase() || site.handle[0]?.toUpperCase() || 'P'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 truncate" title={site.config?.brandName || site.handle}>{site.config?.brandName || site.handle}</h3>
                        <p className="text-xs text-gray-500 truncate">{site.handle}</p>
                      </div>
                    </div>
                    
                    {/* Stripe Status Badge */}
                    <div className="pt-2 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Payments</span>
                        {stripeFullyEnabled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                            Connected
                          </span>
                        ) : stripeIncomplete ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-600"></span>
                            Setup incomplete
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                            Not connected
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/connect?handle=${site.handle}`}
                        className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-700 rounded-lg font-medium text-xs transition border border-purple-200"
                      >
                        <Settings className="h-3.5 w-3.5" />
                        {stripeFullyEnabled ? 'Manage Stripe' : stripeIncomplete ? 'Finish Stripe setup' : 'Connect Stripe'}
                      </Link>
                    </div>
                    <div className="flex flex-col gap-2 pt-2">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => openEditPreview(site.handle, site.config)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium text-sm transition">
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                        <Link href={`/u/${site.handle}`} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg font-medium text-sm transition">
                          <Eye className="h-4 w-4" />
                          View
                        </Link>
                        <button 
                          onClick={() => downloadQR(site.handle)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg font-medium text-sm transition"
                        >
                          <Download className="h-4 w-4" />
                          QR
                        </button>
                      </div>
                      <button 
                        onClick={() => deleteSite(site.handle)}
                        disabled={deletingHandle === site.handle}
                        className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg font-medium text-sm transition disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingHandle === site.handle ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                    <div className="text-xs text-gray-400 pt-2 border-t">{site.updated_at ? new Date(site.updated_at).toLocaleDateString() : 'Never'}</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Bookings Section */}
        <section className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="h-6 w-6 text-purple-600" />
                Recent Bookings
              </h2>
              <p className="text-gray-600 text-sm mt-1">Live updates from your booking pages</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-600">{bookings.length}</p>
              <p className="text-xs text-gray-500">Total bookings</p>
            </div>
          </div>
          {loading ? (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-600">Loading...</div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No bookings yet. Create a booking piqo to get started!</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-purple-50 to-purple-50 border-b border-purple-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">Customer</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">Service</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">Scheduled</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bookings.slice(0, 10).map((b: Booking, index: number) => (
                      <tr key={String(b.id) || `booking-${index}`} className="hover:bg-purple-50 transition duration-150">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center text-xs font-bold">
                              {(b.customer_name || b.customer_email || 'U')[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{b.customer_name || b.customer_email?.split('@')[0] || '—'}</p>
                              {b.team_member_name && (
                                <p className="text-xs text-gray-500 truncate">with {b.team_member_name}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-900 font-medium truncate">{b.item_title || '—'}</p>
                          {b.site_brand_name && (
                            <p className="text-xs text-gray-500 truncate">{b.site_brand_name}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {b.slot_start_time ? (
                            <div>
                              <p className="font-semibold whitespace-nowrap">{new Date(b.slot_start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                              <p className="text-xs text-gray-500 whitespace-nowrap">
                                {new Date(b.slot_start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                              </p>
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
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setSelectedBooking(b);
                                setBookingDetailOpen(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs transition"
                            >
                              <Eye className="h-3 w-3" />
                            </button>
                            {b.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() => confirmBooking(b.id, 'confirmed')}
                                  disabled={confirmingBookingId === b.id}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 font-semibold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => confirmBooking(b.id, 'cancelled')}
                                  disabled={confirmingBookingId === b.id}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => deleteBooking(b.id)}
                                disabled={deletingBookingId === b.id}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {bookings.length > 10 && (
                <div className="px-6 py-4 bg-gray-50 border-t text-center">
                  <p className="text-sm text-gray-600">Showing 10 of {bookings.length} bookings</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Orders Section */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-pink-600" />
              Recent Orders
            </h2>
            <p className="text-gray-600 text-sm mt-1">Track all purchases from your stores</p>
          </div>
          {loading ? (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-600">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center text-gray-600">No orders yet. Create a product piqo to start selling!</div>
          ) : (
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gradient-to-r from-pink-50 to-pink-50 border-b border-pink-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-pink-900 uppercase tracking-wider">Customer</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-pink-900 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-pink-900 uppercase tracking-wider">Store</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-pink-900 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-pink-900 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-pink-900 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-pink-900 uppercase tracking-wider">Ordered On</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-pink-900 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.slice(0, 10).map((o: Order, index: number) => (
                    <tr key={String(o.id) || `order-${index}`} className="hover:bg-pink-50 transition duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 text-white flex items-center justify-center text-sm font-bold">
                            {(o.customer_name || o.customer_email || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{o.customer_name || o.customer_email?.split('@')[0] || '—'}</p>
                            <p className="text-xs text-gray-500">{o.customer_email || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{o.item_title || '—'}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-semibold text-gray-900">{o.site_brand_name || o.handle || '—'}</p>
                          {o.site_brand_name && o.handle && (
                            <p className="text-xs text-gray-500">@{o.handle}</p>
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
                      <td className="px-6 py-4 text-sm font-bold text-gray-900">{o.item_price || '—'}</td>
                      <td className="px-6 py-4 text-sm">
                        {o.status ? (
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold gap-1 ${
                            o.status === 'completed' ? 'bg-green-100 text-green-800' :
                            o.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            o.status === 'refunded' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${
                              o.status === 'completed' ? 'bg-green-600' :
                              o.status === 'pending' ? 'bg-yellow-600' :
                              o.status === 'refunded' ? 'bg-red-600' :
                              'bg-gray-600'
                            }`}></span>
                            {o.status === 'completed' && o.mode === 'digital' ? 'Delivered' : o.status === 'completed' ? 'Paid' : o.status}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {o.created_at ? (
                          <div>
                            <p className="font-semibold">{new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                            <p className="text-xs text-gray-500">{new Date(o.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => {
                            setSelectedOrder(o);
                            setOrderDetailOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-100 hover:bg-pink-200 text-pink-700 font-semibold text-xs transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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
