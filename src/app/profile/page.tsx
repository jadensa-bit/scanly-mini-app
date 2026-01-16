
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseclient';
import { useRouter } from 'next/navigation';
import PiqoLogo from '@/components/PiqoLogo';
import { getProfile, updateProfile } from '@/lib/updateProfile';
import QRCode from 'qrcode';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [activity, setActivity] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const getUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setEmail(user.email || '');
        setName(user.user_metadata?.name || '');
        
        // Get Bearer token for API calls
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;
        const headers: any = {};
        if (accessToken) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }
        
        // Fetch recent activity (bookings, check-ins, orders)
        try {
          const res = await fetch('/api/dashboard', { headers, credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            setActivity(data);
          }
        } catch {}
        // Fetch published sites from dashboard (which gets user's sites by user_id)
        try {
          const res = await fetch('/api/dashboard', { headers, credentials: 'include' });
          if (res.ok) {
            const data = await res.json();
            setSites(Array.isArray(data.sites) ? data.sites : []);
          }
        } catch {}
      } else {
        router.push('/login');
      }
    };
    getUserAndProfile();
  }, [router]);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const { error } = await supabase.auth.updateUser({ email });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Email update initiated. Check your email to confirm the change.');
    }
    setLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Password updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };
  // Define handleUpdateName in the main component scope
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    const { error } = await supabase.auth.updateUser({ data: { name } });
    if (error) {
      setError(error.message);
    } else {
      // Re-fetch user to ensure latest metadata
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      setUser(updatedUser);
      setMessage('Name updated successfully.');
    }
    setLoading(false);
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

  const deleteSite = async (handle: string) => {
    if (!confirm(`Are you sure you want to delete the "${handle}" piqo? This cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
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
        setMessage(`Piqo "${handle}" deleted successfully.`);
        // Refresh sites list
        const dashRes = await fetch("/api/dashboard", { headers, credentials: "include" });
        if (dashRes.ok) {
          const data = await dashRes.json();
          setSites(Array.isArray(data.sites) ? data.sites : []);
        }
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete piqo");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete piqo");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');

    // Note: Deleting user requires admin privileges in Supabase
    // For now, we'll sign them out and note that account deletion needs manual handling
    await supabase.auth.signOut();
    setMessage('Account deletion requested. Please contact support to complete the process.');
    setLoading(false);
    router.push('/');
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-purple-50"><div className="text-lg text-cyan-700">Loading...</div></div>;

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-purple-50 p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8 flex flex-col gap-8">
        <div className="flex flex-col items-center gap-2">
          {/* Logo already rendered above, remove duplicate */}
          <h1 className="text-2xl font-bold text-cyan-800 text-center">{name ? name : 'Your Profile'}</h1>
          <p className="text-center text-gray-500 text-sm">Manage your piqo account, update your info, and view your recent activity.</p>
          
          {/* New Piqo Button */}
          <a
            href="/create"
            className="mt-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white rounded-lg font-semibold transition"
          >
            + New Piqo
          </a>
        </div>

        {/* Activity Summary */}
        {activity && (
          <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4 mb-2">
            <h2 className="text-lg font-semibold text-cyan-700 mb-2">Recent Activity</h2>
            <ul className="text-sm text-gray-700 space-y-1">
              <li><span className="font-medium">Bookings:</span> {activity.bookings?.length ?? 0}</li>
              <li><span className="font-medium">QR Check-ins:</span> {activity.checkins?.length ?? 0}</li>
              <li><span className="font-medium">Orders:</span> {activity.orders?.length ?? 0}</li>
            </ul>
          </div>
        )}

        {/* Published Sites */}
        {sites.length > 0 && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <h2 className="text-lg font-semibold text-green-700 mb-3">Your Published Piqos</h2>
            <div className="space-y-3">
              {sites.map((site: any) => (
                <div key={site.handle} className="bg-white p-3 rounded-lg border border-green-200 flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{site.config?.brandName || site.handle}</p>
                    <p className="text-xs text-gray-500">{site.handle}</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`/create?handle=${encodeURIComponent(site.handle)}`}
                      className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                    >
                      Edit
                    </a>
                    <a
                      href={`/u/${site.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                    >
                      View Live
                    </a>
                    <button
                      onClick={() => downloadQR(site.handle)}
                      className="px-3 py-1.5 text-xs bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition"
                    >
                      Download QR
                    </button>
                    <button
                      onClick={() => deleteSite(site.handle)}
                      className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Update Name */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Update Name</h2>
          <form onSubmit={handleUpdateName} className="space-y-3 flex flex-row gap-2 items-center">
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border p-3 rounded-lg flex-1 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Your Name"
            />
            <button
              type="submit"
              disabled={loading}
              className="py-2 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </form>
        </div>

        {/* Activity Summary */}
        {activity && (
          <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-4 mb-2">
            <h2 className="text-lg font-semibold text-cyan-700 mb-2">Recent Activity</h2>
            <ul className="text-sm text-gray-700 space-y-1">
              <li><span className="font-medium">Bookings:</span> {activity.bookings?.length ?? 0}</li>
              <li><span className="font-medium">QR Check-ins:</span> {activity.checkins?.length ?? 0}</li>
              <li><span className="font-medium">Orders:</span> {activity.orders?.length ?? 0}</li>
            </ul>
          </div>
        )}

        {/* Update Email */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Update Email</h2>
          <form onSubmit={handleUpdateEmail} className="space-y-3">
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Email'}
            </button>
          </form>
        </div>

        {/* Update Password */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Change Password</h2>
          <form onSubmit={handleUpdatePassword} className="space-y-3">
            <input
              id="newPassword"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="border p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="New Password"
            />
            <input
              id="confirmPassword"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="border p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Confirm New Password"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Account Actions */}
        <div className="border-t pt-6 flex flex-col gap-3">
          <h2 className="text-lg font-semibold mb-2">Account Actions</h2>
          <button
            onClick={handleDeleteAccount}
            disabled={loading}
            className="w-full py-2 rounded-lg border border-red-300 text-red-700 bg-white hover:bg-red-50 font-semibold transition disabled:opacity-50"
          >
            Delete Account
          </button>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/'); }}
            className="w-full py-2 rounded-lg bg-cyan-100 text-cyan-700 hover:bg-cyan-200 font-semibold transition"
          >
            Log Out
          </button>
        </div>

        {/* Messages */}
        {message && (
          <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded text-center">
            {message}
          </div>
        )}
        {error && (
          <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded text-center">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}