"use client";
// Real-time Dashboard Page
import { useEffect, useState } from 'react';

type Booking = {
  id: string;
  customer_name?: string;
  customer_email?: string;
  status?: string;
  checked_in?: boolean;
  created_at?: string;
};
import { subscribeToBookings } from './realtime';

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBookings() {
      setLoading(true);
      const res = await fetch('/api/dashboard');
      const { bookings } = await res.json();
      setBookings((bookings as Booking[]) || []);
      setLoading(false);
    }
    fetchBookings();
    // Add realtime updates
    /**
     * Subscribes to booking updates and updates the local bookings state accordingly.
     * 
     * When a booking is updated, this subscription callback checks if the updated booking
     * already exists in the current bookings list. If it does, it replaces the existing booking
     * with the updated one. If it does not exist, it prepends the updated booking to the list.
     *
     * @param updatedBooking - The booking object received from the subscription, representing the latest state.
     * @returns A subscription object or unsubscribe function, depending on the implementation of `subscribeToBookings`.
     */
    const subscription = subscribeToBookings((updatedBooking: Booking): void => {
      setBookings(prev => {
        const idx = prev.findIndex(b => b.id === updatedBooking.id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = updatedBooking;
          return updated;
        }
        return [updatedBooking, ...prev];
      });
    });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Real-time Dashboard</h1>
      {loading ? <p>Loading...</p> : (
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Checked In</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b: Booking) => (
              <tr key={b.id}>
                <td>{b.id}</td>
                <td>{b.customer_name || b.customer_email}</td>
                <td>{b.status}</td>
                <td>{b.checked_in ? 'Yes' : 'No'}</td>
                <td>{b.created_at ? new Date(b.created_at).toLocaleString() : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
