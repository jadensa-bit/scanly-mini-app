'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, DollarSign, MessageCircle } from 'lucide-react';

const PRESET_AMOUNTS = [5, 10, 20, 50];

export default function TipJarPage() {
  const params = useParams();
  const router = useRouter();
  const handle = params.handle as string;

  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [tipperName, setTipperName] = useState('');
  const [tipperEmail, setTipperEmail] = useState('');
  const [tipperPhone, setTipperPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const amount = customAmount ? parseFloat(customAmount) : selectedAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || amount <= 0) {
      alert('Please select or enter a tip amount');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/tips/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handle,
          amount,
          tipperName,
          tipperEmail,
          tipperPhone,
          message,
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to process tip');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Tip submission error:', error);
      alert('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-12 px-4">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
            <Heart className="w-8 h-8 text-pink-600 fill-pink-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Leave a Tip
          </h1>
          <p className="text-gray-600">
            @{handle}
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl p-6 space-y-6"
        >
          {/* Preset Amounts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Amount
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_AMOUNTS.map((presetAmount) => (
                <button
                  key={presetAmount}
                  type="button"
                  onClick={() => {
                    setSelectedAmount(presetAmount);
                    setCustomAmount('');
                  }}
                  className={`
                    py-3 rounded-xl font-semibold transition-all
                    ${
                      selectedAmount === presetAmount && !customAmount
                        ? 'bg-pink-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  ${presetAmount}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or Enter Custom Amount
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                step="0.01"
                min="1"
                placeholder="0.00"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setSelectedAmount(null);
                }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Tipper Info */}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Your name (optional)"
              value={tipperName}
              onChange={(e) => setTipperName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            
            <input
              type="email"
              placeholder="Email for receipt (optional)"
              value={tipperEmail}
              onChange={(e) => setTipperEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />

            <input
              type="tel"
              placeholder="Phone (optional)"
              value={tipperPhone}
              onChange={(e) => setTipperPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageCircle className="inline w-4 h-4 mr-1" />
              Add a message (optional)
            </label>
            <textarea
              placeholder="Say something nice..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!amount || amount <= 0 || isSubmitting}
            className="w-full py-4 bg-gradient-to-r from-pink-600 to-pink-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Heart className="w-5 h-5 fill-white" />
                Send ${amount?.toFixed(2) || '0.00'} Tip
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Powered by piqo • Secure payment via Stripe
          </p>
        </motion.form>
      </div>
    </div>
  );
}
