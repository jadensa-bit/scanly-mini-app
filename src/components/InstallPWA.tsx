'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsStandalone(true);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Chrome/Edge - use native prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // Show instructions for Safari/other browsers
      setShowInstructions(true);
    }
  };

  // Don't show if already installed as standalone app
  if (isStandalone) return null;

  return (
    <>
      <button
        onClick={handleInstall}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-cyan-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl active:scale-95 animate-pulse hover:animate-none"
        title="Download piqo-builder to your device"
      >
        <svg 
          className="w-5 h-5" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2.5} 
            d="M12 4v16m0 0l-4-4m4 4l4-4"
          />
        </svg>
        <span className="hidden sm:inline">Download App</span>
        <span className="sm:hidden">Download</span>
      </button>

      {showInstructions && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4" 
          onClick={() => setShowInstructions(false)}
        >
          <div 
            className="bg-gradient-to-br from-white to-gray-50 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-200" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Safe icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m0 0l-4-4m4 4l4-4" />
                </svg>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-center mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Add piqo-builder to Home Screen
            </h3>
            
            <p className="text-center text-gray-600 mb-6 text-sm">
              Install this app for quick access and a better experience
            </p>

            {/* Badge showing it's safe */}
            <div className="flex items-center justify-center gap-2 mb-6 px-4 py-2 bg-green-50 border border-green-200 rounded-full mx-auto w-fit">
              <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-xs font-semibold text-green-700">Safe & Secure</span>
            </div>

            <div className="space-y-4 text-sm text-gray-600 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  iPhone/iPad (Safari):
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-700">
                  <li>Tap the Share button (square with arrow)</li>
                  <li>Scroll down and tap "Add to Home Screen"</li>
                  <li>Tap "Add" to install</li>
                </ol>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                  </svg>
                  Android (Chrome):
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-700">
                  <li>Tap the menu (3 dots in top right)</li>
                  <li>Tap "Install app" or "Add to Home screen"</li>
                  <li>Tap "Install" to confirm</li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => setShowInstructions(false)}
              className="w-full px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-xl font-semibold hover:from-cyan-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
