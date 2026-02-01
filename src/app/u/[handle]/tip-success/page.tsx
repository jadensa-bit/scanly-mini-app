'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, Heart } from 'lucide-react';
import Link from 'next/link';

export default function TipSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const handle = params.handle as string;
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Thank You!
            </h1>
            <p className="text-gray-600">
              Your tip has been sent to @{handle}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-pink-600">
            <Heart className="w-6 h-6 fill-pink-600" />
            <span className="font-medium">Your support means the world!</span>
          </div>

          {sessionId && (
            <p className="text-xs text-gray-500">
              Transaction ID: {sessionId.slice(-12)}
            </p>
          )}

          <div className="pt-4 space-y-3">
            <Link
              href={`/u/${handle}`}
              className="block w-full py-3 bg-pink-600 text-white font-semibold rounded-xl hover:bg-pink-700 transition-colors"
            >
              Back to {handle}'s Page
            </Link>
            
            <Link
              href="/"
              className="block w-full py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
            >
              Create Your Own piqo
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
