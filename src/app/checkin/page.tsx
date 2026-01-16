
"use client";
// QR Check-in Page
import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import QRScanner to avoid SSR issues
const QrScanner = dynamic(() => import('react-qr-scanner'), { ssr: false });

export default function CheckinPage() {
  const [bookingId, setBookingId] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [result, setResult] = useState<string|null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(true);

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

  function handleScan(data: any) {
    if (data && data.text) {
      setQrCode(data.text);
      setScanning(false);
    }
  }

  function handleError(err: any) {
    setResult('Camera error: ' + (err?.message || 'Unknown error'));
    setScanning(false);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 to-purple-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-cyan-800 mb-2 text-center">QR Check-in</h1>
        <p className="text-center text-gray-500 mb-2">Scan a customer's QR code to check them in for their appointment. You can also enter the code manually if needed.</p>

        {scanning && (
          <div className="mb-4 rounded-xl overflow-hidden border border-cyan-200 bg-cyan-50">
            <QrScanner
              delay={300}
              onError={handleError}
              onScan={handleScan}
              style={{ width: '100%' }}
              constraints={{ facingMode: 'environment' }}
            />
            <div className="text-xs text-gray-400 text-center py-2">Point your camera at the QR code</div>
          </div>
        )}

        <form onSubmit={handleCheckin} className="space-y-4">
          <input
            type="text"
            placeholder="Booking ID"
            value={bookingId}
            onChange={e => setBookingId(e.target.value)}
            className="border p-2 w-full rounded"
            required
          />
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="QR Code Value"
              value={qrCode}
              onChange={e => setQrCode(e.target.value)}
              className="border p-2 w-full rounded"
              required
              readOnly={scanning}
            />
            {qrCode && (
              <button type="button" className="text-xs text-cyan-600 underline" onClick={() => { setQrCode(''); setScanning(true); }}>Rescan</button>
            )}
          </div>
          <button type="submit" className="bg-cyan-600 text-white px-4 py-2 rounded w-full font-semibold" disabled={loading}>
            {loading ? 'Checking in...' : 'Check In'}
          </button>
        </form>
        {result && <div className={`mt-4 text-center font-semibold ${result.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{result}</div>}
      </div>
    </main>
  );
}
