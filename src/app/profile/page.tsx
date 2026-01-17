
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
  const [profilePicture, setProfilePicture] = useState('');
  const [uploadingPic, setUploadingPic] = useState(false);
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
        setProfilePicture(user.user_metadata?.profile_picture || '');
        
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

  const handleProfilePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    try {
      setUploadingPic(true);
      setError('');

      // Upload to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { profile_picture: publicUrl }
      });

      if (updateError) throw updateError;

      setProfilePicture(publicUrl);
      setMessage('Profile picture updated successfully!');
      
      // Re-fetch user to ensure latest metadata
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      setUser(updatedUser);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload profile picture');
    } finally {
      setUploadingPic(false);
    }
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
    router.refresh();
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
      </div>
      <div className="relative">
        <div className="inline-block w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
        <p className="text-lg font-semibold text-cyan-400">Loading your profile...</p>
      </div>
    </div>
  );

  const createdAt = user?.created_at ? new Date(user.created_at) : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-black to-black relative overflow-x-hidden p-3 sm:p-4 lg:p-8">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Page Header with Decorative Background */}
        <div className="relative mb-6 sm:mb-8 lg:mb-10 overflow-hidden rounded-2xl sm:rounded-3xl group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl sm:rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
          <div className="relative bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-5 sm:p-8 lg:p-10">
            <div className="flex items-center gap-2.5 sm:gap-4 mb-2 sm:mb-3">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-500 rounded-lg sm:rounded-xl blur-md opacity-50"></div>
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 tracking-tight">Account Settings</h1>
              </div>
            </div>
            <p className="text-gray-400 text-xs sm:text-sm ml-12 sm:ml-16 font-medium">Manage your profile, preferences, and account security</p>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-5">
          {/* Account Identity Section */}
          <section className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl sm:rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
            <div className="relative bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border border-cyan-500/30 rounded-xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 lg:p-8 hover:border-cyan-400/50 transition-all duration-300">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500 rounded-lg sm:rounded-xl blur-md opacity-50"></div>
                  <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 uppercase tracking-wider">Account Identity</h2>
              </div>
            
            <div className="space-y-4 sm:space-y-5">
              {/* Profile Picture with upload */}
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-cyan-500/30 ring-4 ring-white/10">
                    {profilePicture ? (
                      <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span>{(name || email)?.[0]?.toUpperCase() || 'U'}</span>
                    )}
                  </div>
                  {/* Online dot (purely visual) */}
                  <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900 shadow-lg"></div>
                  {/* Upload button overlay */}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                      disabled={uploadingPic}
                    />
                  </label>
                  {uploadingPic && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-full">
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white">{name || 'User'}</h3>
                  <p className="text-sm text-gray-400 mt-0.5">{email}</p>
                  {createdAt && (
                    <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Member since {createdAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                  )}
                  <p className="text-xs text-cyan-400 mt-2">Hover over photo to change</p>
                </div>
              </div>

              {/* Update Name */}
              <div className="pt-5 border-t border-white/5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Display Name</label>
                <form onSubmit={handleUpdateName} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 hover:border-white/30"
                    placeholder="Your Name"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 sm:px-5 py-3 sm:py-2.5 rounded-lg sm:rounded-xl bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white text-sm font-semibold transition-all duration-200 disabled:opacity-50 hover:shadow-lg hover:shadow-cyan-500/30 hover:scale-105 min-h-[48px] sm:min-h-0"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </form>
              </div>
            </div>
            </div>
          </section>

          {/* Account Status Section */}
          <section className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl sm:rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
            <div className="relative bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border border-green-500/30 rounded-xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 lg:p-8 hover:border-green-400/50 transition-all duration-300">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-green-500 rounded-lg sm:rounded-xl blur-md opacity-50"></div>
                  <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 uppercase tracking-wider">Account Status</h2>
              </div>
            
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-green-500/30 transition-all duration-200 hover:bg-white/10 group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email Status</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-semibold ring-1 ring-green-500/30">
                    Verified
                  </span>
                </div>
                <p className="text-xs text-gray-500">Your email is confirmed</p>
              </div>
              
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-gray-500/30 transition-all duration-200 hover:bg-white/10 group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Stripe Connection</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-500/20 text-gray-400 text-xs font-semibold ring-1 ring-gray-500/30">
                    Optional
                  </span>
                </div>
                <p className="text-xs text-gray-500">Connect from Dashboard when ready</p>
              </div>
            </div>
            </div>
          </section>

          {/* Your Piqos */}
          {sites.length > 0 && (
            <section className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl sm:rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border border-purple-500/30 rounded-xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 lg:p-8 hover:border-purple-400/50 transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-purple-500 rounded-lg sm:rounded-xl blur-md opacity-50"></div>
                      <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 uppercase tracking-wider">Your Piqos</h2>
                    <span className="text-xs sm:text-sm font-bold text-purple-400 bg-purple-500/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full ring-1 ring-purple-500/30">({sites.length})</span>
                  </div>
                <a
                  href="/create"
                  className="px-4 py-2.5 sm:py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 active:scale-95 text-white text-sm rounded-lg sm:rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105 text-center min-h-[44px] sm:min-h-0 flex items-center justify-center"
                >
                  + New Piqo
                </a>
              </div>
              
              <div className="space-y-2">
                {sites.map((site: any) => (
                  <div key={site.handle} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/30 transition-all duration-200 hover:bg-white/10 group">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">{site.config?.brandName || site.handle}</h3>
                        <p className="text-sm text-gray-400 truncate">@{site.handle}</p>
                      </div>
                      <div className="flex gap-2 flex-wrap justify-end">
                        <a
                          href={`/create?handle=${encodeURIComponent(site.handle)}`}
                          className="px-3 py-1.5 text-xs bg-blue-600/80 hover:bg-blue-600 text-white rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105 font-medium"
                        >
                          Edit
                        </a>
                        <a
                          href={`/u/${site.handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs bg-green-600/80 hover:bg-green-600 text-white rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105 font-medium"
                        >
                          View
                        </a>
                        <button
                          onClick={() => downloadQR(site.handle)}
                          className="px-3 py-2 sm:py-1.5 text-xs bg-cyan-600/80 hover:bg-cyan-600 active:scale-95 text-white rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105 font-medium min-h-[44px] sm:min-h-0"
                        >
                          QR
                        </button>
                        <button
                          onClick={() => deleteSite(site.handle)}
                          className="px-3 py-2 sm:py-1.5 text-xs bg-red-600/60 hover:bg-red-600/80 active:scale-95 text-white rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105 font-medium min-h-[44px] sm:min-h-0"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </section>
          )}

          {/* Activity Summary */}
          {activity && (
            <section className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl sm:rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
              <div className="relative bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border border-yellow-500/30 rounded-xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 lg:p-8 hover:border-yellow-400/50 transition-all duration-300">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-yellow-500 rounded-lg sm:rounded-xl blur-md opacity-50"></div>
                    <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400 uppercase tracking-wider">Recent Activity</h2>
                </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-all duration-200 hover:bg-white/10 group">
                  <div className="text-3xl font-bold text-cyan-400 group-hover:scale-110 transition-transform duration-200">{activity.bookings?.length ?? 0}</div>
                  <div className="text-xs text-gray-400 mt-1.5 uppercase tracking-wider font-semibold">Bookings</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10 hover:border-green-500/30 transition-all duration-200 hover:bg-white/10 group">
                  <div className="text-3xl font-bold text-green-400 group-hover:scale-110 transition-transform duration-200">{activity.orders?.length ?? 0}</div>
                  <div className="text-xs text-gray-400 mt-1.5 uppercase tracking-wider font-semibold">Orders</div>
                </div>
                <div className="text-center p-4 bg-white/5 rounded-xl border border-white/10 hover:border-purple-500/30 transition-all duration-200 hover:bg-white/10 group">
                  <div className="text-3xl font-bold text-purple-400 group-hover:scale-110 transition-transform duration-200">{activity.checkins?.length ?? 0}</div>
                  <div className="text-xs text-gray-400 mt-1.5 uppercase tracking-wider font-semibold">Check-ins</div>
                </div>
              </div>
            </div>
            </section>
          )}

          {/* Security Settings */}
          <section className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-amber-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
            <div className="relative bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border border-orange-500/30 rounded-2xl shadow-2xl p-8 hover:border-orange-400/50 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-orange-500 rounded-xl blur-md opacity-50"></div>
                  <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400 uppercase tracking-wider">Security</h2>
              </div>
            
            <div className="space-y-5">
              {/* Update Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                <form onSubmit={handleUpdateEmail} className="space-y-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 hover:border-white/30"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-3 sm:py-2.5 rounded-lg sm:rounded-xl bg-cyan-600 hover:bg-cyan-700 active:scale-[0.98] text-white text-sm font-semibold transition-all duration-200 disabled:opacity-50 hover:shadow-lg hover:shadow-cyan-500/30 hover:scale-[1.02] min-h-[48px] sm:min-h-0"
                  >
                    {loading ? 'Updating...' : 'Update Email'}
                  </button>
                  <p className="text-xs text-gray-500 italic">You'll need to confirm your new email</p>
                </form>
              </div>

              {/* Change Password */}
              <div className="pt-5 border-t border-white/5">
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Change Password</label>
                <form onSubmit={handleUpdatePassword} className="space-y-2">
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 hover:border-white/30"
                    placeholder="New Password"
                  />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 hover:border-white/30"
                    placeholder="Confirm New Password"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-4 py-3 sm:py-2.5 rounded-lg sm:rounded-xl bg-cyan-600 hover:bg-cyan-700 active:scale-[0.98] text-white text-sm font-semibold transition-all duration-200 disabled:opacity-50 hover:shadow-lg hover:shadow-cyan-500/30 hover:scale-[1.02] min-h-[48px] sm:min-h-0"
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-red-600 rounded-xl sm:rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
            <div className="relative bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border border-red-500/30 rounded-xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 lg:p-8 hover:border-red-500/50 transition-all duration-300">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-red-500 rounded-lg sm:rounded-xl blur-md opacity-50"></div>
                  <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-500 uppercase tracking-wider">Danger Zone</h2>
              </div>
            
            <div className="space-y-3">
              <button
                onClick={async () => { await supabase.auth.signOut(); router.push('/'); router.refresh(); }}
                className="w-full px-4 py-3 sm:py-2.5 rounded-lg sm:rounded-xl bg-white/5 hover:bg-white/10 active:scale-[0.98] border border-white/20 text-white text-sm font-semibold transition-all duration-200 hover:scale-[1.02] min-h-[48px] sm:min-h-0"
              >
                Log Out
              </button>
              
              <div className="pt-3 border-t border-red-500/20">
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="w-full px-4 py-3 sm:py-2.5 rounded-lg sm:rounded-xl bg-red-600/10 hover:bg-red-600/20 active:scale-[0.98] border border-red-500/30 hover:border-red-500/50 text-red-400 text-sm font-semibold transition-all duration-200 disabled:opacity-50 hover:shadow-lg hover:shadow-red-500/20 min-h-[48px] sm:min-h-0"
                >
                  Delete Account
                </button>
                <p className="text-xs text-red-400/60 text-center mt-2 italic">
                  Account deletion is permanent and cannot be undone
                </p>
              </div>
            </div>
            </div>
          </section>

          {/* Messages */}
          {message && (
            <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl text-sm">
              {message}
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}