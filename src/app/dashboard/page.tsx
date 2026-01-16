"use client";
// Real-time Dashboard Page
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Calendar, ShoppingCart, Eye, Settings, Edit, Trash2, Download, Check, X, ChevronRight } from 'lucide-react';
import QRCode from 'qrcode';
import PiqoLivePreview from '@/components/PiqoLivePreview';

type Booking = {
  id: string;
  customer_name?: string;
  customer_email?: string;
  status?: string;
  checked_in?: boolean;
  created_at?: string;
  item_title?: string;
  team_member_id?: string;
  team_member_name?: string;
};

type Order = {
  id: string;
  handle: string;
  mode?: string;
  item_title?: string;
  item_price?: string;
  created_at?: string;
};

type Site = {
  handle: string;
  config: any;
  updated_at: string;
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

  // Derived stats
  const totalBookings = totalBookingsCount || bookings.length;
  const totalOrders = totalOrdersCount || orders.length;
  const totalSites = sites.length;
  const checkedInCount = bookings.filter(b => b.checked_in).length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;

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
                      <th className="px-6 py-4 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">Customer</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">Service</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">Team Member</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">Check-in</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-purple-900 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bookings.slice(0, 10).map((b: Booking, index: number) => (
                      <tr key={String(b.id) || `booking-${index}`} className="hover:bg-purple-50 transition duration-150">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 text-white flex items-center justify-center text-sm font-bold">
                              {(b.customer_name || b.customer_email || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{b.customer_name || b.customer_email?.split('@')[0] || '—'}</p>
                              <p className="text-xs text-gray-500">{b.customer_email || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 font-medium">{b.item_title || '—'}</td>
                        <td className="px-6 py-4 text-sm">
                          {b.team_member_name ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
                              {b.team_member_name}
                            </span>
                          ) : (
                            <span className="text-gray-500 text-xs">Any available</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {b.status ? (
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold gap-1 ${
                              b.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                              b.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              <span className={`w-2 h-2 rounded-full ${
                                b.status === 'confirmed' ? 'bg-green-600' :
                                b.status === 'pending' ? 'bg-yellow-600' :
                                'bg-gray-600'
                              }`}></span>
                              {b.status}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {b.checked_in ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold gap-1">
                              <span className="w-2 h-2 rounded-full bg-green-600"></span>
                              Checked in
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium gap-1">
                              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                              Awaiting
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {b.created_at ? (
                            <span className="font-medium">{new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {b.status === 'pending' ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => confirmBooking(b.id, 'confirmed')}
                                disabled={confirmingBookingId === b.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 font-semibold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Confirm
                              </button>
                              <button
                                onClick={() => confirmBooking(b.id, 'cancelled')}
                                disabled={confirmingBookingId === b.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-semibold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <X className="h-3.5 w-3.5" />
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => deleteBooking(b.id)}
                              disabled={deletingBookingId === b.id}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {deletingBookingId === b.id ? 'Deleting...' : 'Delete'}
                            </button>
                          )}
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
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Item</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Store</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.slice(0, 10).map((o: Order, index: number) => (
                    <tr key={String(o.id) || `order-${index}`} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-900">{o.item_title || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{o.handle}</td>
                      <td className="px-6 py-4 text-sm">
                        {o.mode ? (
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            o.mode === 'products' ? 'bg-orange-100 text-orange-800' :
                            o.mode === 'digital' ? 'bg-pink-100 text-pink-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>{o.mode}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{o.item_price ? `$${o.item_price}` : '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{o.created_at ? new Date(o.created_at).toLocaleDateString() : '—'}</td>
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
                      href={`/create?handle=${encodeURIComponent(editingHandle || '')}`}
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
    </main>
  );
}
