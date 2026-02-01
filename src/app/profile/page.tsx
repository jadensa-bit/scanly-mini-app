
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
        
        // Try to get profile picture from profiles table first, fallback to user metadata
        const { data: profileData } = await supabase
          .from('profiles')
          .select('avatar_url')
          .eq('id', user.id)
          .single();
        
        const profilePic = profileData?.avatar_url || user.user_metadata?.profile_picture || '';
        setProfilePicture(profilePic);
        
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

      // Also update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (profileError) {
        console.error('Failed to update profile table:', profileError);
        // Continue anyway since auth metadata was updated
      }

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
    if (!confirm(`Are you sure you want to delete the "${handle}" store? This cannot be undone.`)) {
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
        setMessage(`Store "${handle}" deleted successfully.`);
        // Refresh sites list
        const dashRes = await fetch("/api/dashboard", { headers, credentials: "include" });
        if (dashRes.ok) {
          const data = await dashRes.json();
          setSites(Array.isArray(data.sites) ? data.sites : []);
        }
      } else {
        const data = await res.json();
        setError(data.error || "Failed to delete store");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      setError("Failed to delete store");
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

      <div className="max-w-5xl mx-auto relative z-10">
        {/* Page Header with Enhanced Styling */}
        <div className="relative mb-8 sm:mb-10 lg:mb-12 overflow-hidden rounded-3xl group">
          <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-3xl blur-lg opacity-40 group-hover:opacity-60 transition duration-300 animate-pulse"></div>
          <div className="relative bg-gradient-to-br from-gray-900/98 via-black/98 to-gray-900/98 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 sm:p-10 lg:p-12">
            <div className="flex items-start sm:items-center gap-4 sm:gap-6">
              {/* Profile Picture Large */}
              <div className="relative group/pic flex-shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl sm:text-4xl font-black shadow-2xl shadow-cyan-500/40 ring-4 ring-white/20">
                  {profilePicture ? (
                    <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span>{(name || email)?.[0]?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-4 border-gray-900 shadow-xl flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 tracking-tight mb-2">
                  {name || 'User'}
                </h1>
                <p className="text-base sm:text-lg text-gray-400 mb-3">{email}</p>
                {createdAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Member since {createdAt.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href="/dashboard" className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white text-sm font-bold rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-xl shadow-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                    Dashboard
                  </a>
                  <a href="/create" className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-semibold rounded-xl transition-all duration-200 hover:scale-105">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Store
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {/* Account Identity Section */}
          <section className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl sm:rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 hover:border-cyan-400/50 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl blur-md opacity-60"></div>
                  <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">Profile Settings</h2>
              </div>
            
            <div className="space-y-6">
              {/* Profile Picture Upload */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <label className="block text-sm font-bold text-gray-300 mb-4">Profile Picture</label>
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="relative group/upload">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold shadow-xl shadow-cyan-500/30 ring-4 ring-white/10">
                      {profilePicture ? (
                        <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span>{(name || email)?.[0]?.toUpperCase() || 'U'}</span>
                      )}
                    </div>
                    {/* Upload button overlay */}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-2xl opacity-0 group-hover/upload:opacity-100 transition-opacity cursor-pointer">
                      <div className="text-center">
                        <svg className="w-8 h-8 text-white mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-xs text-white font-semibold">Change</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureUpload}
                        className="hidden"
                        disabled={uploadingPic}
                      />
                    </label>
                    {uploadingPic && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/90 rounded-2xl">
                        <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-sm text-gray-300 mb-2">Upload a photo to personalize your account</p>
                    <p className="text-xs text-gray-500">Max 5MB • JPG, PNG, or GIF</p>
                  </div>
                </div>
              </div>

              {/* Update Name */}
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <label className="block text-sm font-bold text-gray-300 mb-3">Display Name</label>
                <form onSubmit={handleUpdateName} className="flex gap-3">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 hover:border-white/30"
                    placeholder="Your Name"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 active:scale-95 text-white text-sm font-bold transition-all duration-200 disabled:opacity-50 hover:shadow-lg hover:shadow-cyan-500/40 min-h-[48px] sm:min-h-0"
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
            <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl sm:rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border border-green-500/30 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 hover:border-green-400/50 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur-md opacity-60"></div>
                  <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400">Account Status</h2>
              </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/20 p-5 hover:border-green-500/40 transition-all duration-200 group/card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm font-bold text-gray-300">Email Verified</span>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-bold ring-1 ring-green-500/40">
                    ✓ Active
                  </span>
                </div>
                <p className="text-xs text-gray-400">Your email address is confirmed and ready to use</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20 p-5 hover:border-purple-500/40 transition-all duration-200 group/card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className="text-sm font-bold text-gray-300">Payment Setup</span>
                  </div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-500/20 text-gray-400 text-xs font-bold ring-1 ring-gray-500/40">
                    Optional
                  </span>
                </div>
                <p className="text-xs text-gray-400">Connect Stripe from Dashboard when you're ready to sell</p>
              </div>
            </div>
            </div>
          </section>

          {/* Your Stores */}
          {sites.length > 0 && (
            <section className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-2xl sm:rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-300 animate-glow-pulse"></div>
              <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border-2 border-purple-500/30 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 hover:border-purple-400/50 transition-all duration-300">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur-md opacity-60"></div>
                      <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Your Stores</h2>
                      <p className="text-xs text-gray-400 mt-0.5">{sites.length} active {sites.length !== 1 ? 'storefronts' : 'storefront'}</p>
                    </div>
                  </div>
                <a
                  href="/create"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 active:scale-95 text-white text-sm font-bold rounded-xl transition-all duration-200 hover:shadow-2xl hover:shadow-purple-500/50 shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New Store
                </a>
              </div>
              
              <div className="space-y-3">
                {sites.map((site: any) => (
                  <div key={site.handle} className="bg-gradient-to-r from-white/5 to-white/[0.02] rounded-xl border border-white/10 hover:border-purple-500/30 transition-all duration-200 hover:bg-white/10 p-4 group/card">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {site.config?.brandLogo ? (
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center shrink-0 ring-2 ring-white/10">
                            <img src={site.config.brandLogo} alt={site.config?.brandName || site.handle} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg font-bold shrink-0 ring-2 ring-white/10">
                            {(site.config?.brandName || site.handle)[0].toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white truncate text-base">{site.config?.brandName || site.handle}</h3>
                          <p className="text-sm text-gray-400 truncate">piqo.app/u/{site.handle}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <a
                          href={`/create?handle=${encodeURIComponent(site.handle)}`}
                          className="px-4 py-2 text-xs bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg transition-all duration-200 hover:shadow-lg font-semibold"
                        >
                          Edit
                        </a>
                        <a
                          href={`/u/${site.handle}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 text-xs bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg transition-all duration-200 hover:shadow-lg font-semibold"
                        >
                          View
                        </a>
                        <button
                          onClick={() => downloadQR(site.handle)}
                          className="px-4 py-2 text-xs bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-lg transition-all duration-200 hover:shadow-lg font-semibold"
                        >
                          QR
                        </button>
                        <button
                          onClick={() => deleteSite(site.handle)}
                          className="px-4 py-2 text-xs bg-gradient-to-r from-red-500/80 to-red-600/80 hover:from-red-600 hover:to-red-700 text-white rounded-lg transition-all duration-200 hover:shadow-lg font-semibold"
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
              <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl sm:rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
              <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 hover:border-cyan-400/50 transition-all duration-300">
                <div className="flex items-center gap-3 mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl blur-md opacity-60"></div>
                    <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Recent Activity</h2>
                </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl border border-cyan-500/20 p-6 hover:border-cyan-500/40 transition-all duration-200 group/card">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 group-hover/card:scale-110 transition-transform duration-200">{activity.bookings?.length ?? 0}</div>
                  <div className="text-xs text-gray-400 mt-2 uppercase tracking-wider font-bold">Bookings</div>
                </div>
                <div className="text-center bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl border border-green-500/20 p-6 hover:border-green-500/40 transition-all duration-200 group/card">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 group-hover/card:scale-110 transition-transform duration-200">{activity.orders?.length ?? 0}</div>
                  <div className="text-xs text-gray-400 mt-2 uppercase tracking-wider font-bold">Orders</div>
                </div>
                <div className="text-center bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/20 p-6 hover:border-purple-500/40 transition-all duration-200 group/card">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-3">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 group-hover/card:scale-110 transition-transform duration-200">{activity.checkins?.length ?? 0}</div>
                  <div className="text-xs text-gray-400 mt-2 uppercase tracking-wider font-bold">Check-ins</div>
                </div>
              </div>
            </div>
            </section>
          )}

          {/* Security Settings */}
          <section className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl sm:rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border border-orange-500/30 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 hover:border-orange-400/50 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl blur-md opacity-60"></div>
                  <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">Security</h2>
              </div>
            
            <div className="space-y-6">
              {/* Update Email */}
              <div className="bg-gradient-to-br from-orange-500/5 to-yellow-500/5 rounded-2xl border border-orange-500/20 p-6 hover:border-orange-500/30 transition-all duration-200">
                <h3 className="text-base font-bold text-white mb-1">Email Address</h3>
                <p className="text-xs text-gray-400 mb-4">Update your account email - verification required</p>
                <form onSubmit={handleUpdateEmail} className="space-y-3">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200 hover:border-white/20"
                    placeholder="your.email@example.com"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white text-sm font-bold transition-all duration-200 hover:shadow-2xl hover:shadow-orange-500/50 shadow-lg active:scale-95"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </span>
                    ) : (
                      'Update Email'
                    )}
                  </button>
                </form>
              </div>

              {/* Change Password */}
              <div className="bg-gradient-to-br from-orange-500/5 to-yellow-500/5 rounded-2xl border border-orange-500/20 p-6 hover:border-orange-500/30 transition-all duration-200">
                <h3 className="text-base font-bold text-white mb-1">Change Password</h3>
                <p className="text-xs text-gray-400 mb-4">Keep your account secure with a strong password</p>
                <form onSubmit={handleUpdatePassword} className="space-y-3">
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200 hover:border-white/20"
                    placeholder="New Password"
                  />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-200 hover:border-white/20"
                    placeholder="Confirm New Password"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white text-sm font-bold transition-all duration-200 hover:shadow-2xl hover:shadow-orange-500/50 shadow-lg active:scale-95"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </span>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </form>
              </div>
            </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500 to-rose-500 rounded-2xl sm:rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative bg-gradient-to-br from-gray-900/95 to-black/95 backdrop-blur-2xl border border-red-500/30 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 hover:border-red-400/50 transition-all duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl blur-md opacity-60"></div>
                  <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-400">Danger Zone</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Irreversible actions - proceed with caution</p>
                </div>
              </div>
            
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 p-5 hover:border-white/20 transition-all duration-200">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Log Out</h3>
                      <p className="text-xs text-gray-400">Sign out of your account</p>
                    </div>
                  </div>
                  <button
                    onClick={async () => { await supabase.auth.signOut(); router.push('/'); router.refresh(); }}
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white text-sm font-bold transition-all duration-200 active:scale-95 hover:shadow-lg"
                  >
                    Log Out
                  </button>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-red-500/5 to-rose-500/5 rounded-2xl border border-red-500/30 p-6 hover:border-red-500/40 transition-all duration-200">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-red-300 mb-2">Delete Account Permanently</h3>
                    <p className="text-sm text-gray-400 mb-4">Permanently remove your account and all associated data. This action cannot be undone and all your stores, orders, and bookings will be lost forever.</p>
                    
                    <button
                      onClick={handleDeleteAccount}
                      disabled={loading}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white text-sm font-bold transition-all duration-200 hover:shadow-2xl hover:shadow-red-500/50 shadow-lg active:scale-95"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Deleting Account...
                        </span>
                      ) : (
                        'Delete My Account'
                      )}
                    </button>
                  </div>
                </div>
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