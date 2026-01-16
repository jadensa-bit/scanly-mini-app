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

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome, {profile?.name}!</h1>
        <p className="text-gray-600">Manage your piqo account</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Link 
          href="/create/booking"
          className="p-6 border rounded-lg hover:border-blue-500 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold mb-2">Create Booking</h2>
          <p className="text-gray-600">Set up a new booking experience</p>
        </Link>

        <Link 
          href="/create/storefront"
          className="p-6 border rounded-lg hover:border-blue-500 hover:shadow-lg transition"
        >
          <h2 className="text-xl font-semibold mb-2">Create Storefront</h2>
          <p className="text-gray-600">Launch a new QR storefront</p>
        </Link>
      </div>

      <div className="border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Your Creations</h2>
        
        {creations?.bookings && creations.bookings.length > 0 ? (
          <div>
            <h3 className="text-lg font-semibold mb-3">Bookings ({creations.bookings.length})</h3>
            <div className="space-y-2">
              {creations.bookings.map((booking) => (
                <div key={booking.id} className="p-4 bg-gray-50 rounded">
                  <p className="font-medium">{booking.name || 'Booking'}</p>
                  <p className="text-sm text-gray-600">
                    Created: {new Date(booking.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-600">No creations yet. Start by creating a booking or storefront!</p>
        )}
      </div>
    </div>
  );
}
