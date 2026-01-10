"use client";
// QR Check-in Page
import { useState } from 'react';

export default function CheckinPage() {
  const [bookingId, setBookingId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [result, setResult] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCheckin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    const res = await fetch('/api/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, qrCode })
    });
    const data = await res.json();
    setLoading(false);
    if (data.success) {
      setResult('Checked in successfully!');
    } else {
      setResult(data.error || 'Check-in failed');
    }
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">QR Check-in</h1>
      <form onSubmit={handleCheckin} className="space-y-4">
        <input
          type="text"
          placeholder="Booking ID"
          value={bookingId}
          onChange={e => setBookingId(e.target.value)}
          className="border p-2 w-full"
          required
        />
        <input
          type="text"
          placeholder="QR Code Value"
          value={qrCode}
          onChange={e => setQrCode(e.target.value)}
          className="border p-2 w-full"
          required
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
          {loading ? 'Checking in...' : 'Check In'}
        </button>
      </form>
      {result && <p className="mt-4">{result}</p>}
    </main>
  );
}
