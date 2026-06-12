'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Profile {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface Creations {
  bookings: any[];
}

export default function DashboardOverview() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [creations, setCreations] = useState<Creations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch profile
        const profileRes = await fetch('/api/profile');
        const profileData = await profileRes.json();
        
        if (profileData.success) {
          setProfile(profileData.profile);
        }

        // Fetch creations
        const creationsRes = await fetch('/api/profile/creations');
        const creationsData = await creationsRes.json();
        
        if (creationsData.success) {
          setCreations(creationsData.creations);
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  const totalBookings = creations?.bookings?.length ?? 0;
  const recent = creations?.bookings ? [...creations.bookings].sort((a,b) => +new Date(b.created_at) - +new Date(a.created_at)).slice(0,5) : [];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold mb-1">Welcome back, {profile?.name || 'Creator'} ✨</h1>
          <p className="text-gray-400">A tidy overview of your account and recent activity</p>
        </div>
        <div className="flex gap-3">
          <Link href="/create/booking" className="px-4 py-2 bg-cyan-600 text-white rounded-lg shadow hover:brightness-105 transition">+ New Booking</Link>
          <Link href="/create/storefront" className="px-4 py-2 border border-gray-700 text-white rounded-lg hover:bg-white/5 transition">New Storefront</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="md:col-span-1 bg-gradient-to-br from-gray-900 to-gray-800 p-5 rounded-xl shadow-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-300">Profile</p>
              <p className="text-xl font-semibold mt-1">{profile?.name ?? '—'}</p>
              <p className="text-xs text-gray-400">{profile?.email ?? ''}</p>
            </div>
            <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 15c2.761 0 5.29.792 7.879 2.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
          </div>
        </div>

        <div className="bg-white/5 p-5 rounded-xl shadow border border-white/5 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-600/10 rounded-lg text-cyan-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6a3 3 0 016 0v6M5 21h14"/></svg>
            </div>
            <div>
              <p className="text-sm text-gray-300">Total Bookings</p>
              <p className="text-2xl font-bold">{totalBookings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 p-5 rounded-xl shadow border border-white/5 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600/10 rounded-lg text-purple-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18"/></svg>
            </div>
            <div>
              <p className="text-sm text-gray-300">Storefronts</p>
              <p className="text-2xl font-bold">—</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 p-5 rounded-xl shadow border border-white/5 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-500/10 rounded-lg text-green-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.567-3 3.5S10.343 15 12 15s3-1.567 3-3.5S13.657 8 12 8z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1"/></svg>
            </div>
            <div>
              <p className="text-sm text-gray-300">Active Today</p>
              <p className="text-2xl font-bold">—</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white/5 rounded-xl p-6 shadow border border-white/5">
          <h3 className="text-lg font-semibold mb-4">Recent Bookings</h3>
          {recent.length === 0 ? (
            <div className="text-gray-400">No recent bookings — create one to get started.</div>
          ) : (
            <div className="space-y-3">
              {recent.map((b:any) => (
                <div key={b.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-white/3 to-white/2 rounded-lg">
                  <div>
                    <p className="font-medium text-white">{b.name || 'Untitled Booking'}</p>
                    <p className="text-xs text-gray-400">{new Date(b.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <Link href={`/bookings/${b.id}`} className="text-cyan-400 hover:underline text-sm">Open</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="bg-white/5 rounded-xl p-6 shadow border border-white/5">
          <h4 className="text-md font-semibold mb-3">Quick Actions</h4>
          <div className="flex flex-col gap-3">
            <Link href="/create/booking" className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm">Create Booking</Link>
            <Link href="/create/storefront" className="px-4 py-2 border border-gray-700 rounded-lg text-sm">Create Storefront</Link>
            <Link href="/dashboard/bookings" className="px-4 py-2 bg-white/5 rounded-lg text-sm">Manage Bookings</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
