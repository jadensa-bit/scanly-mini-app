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
  const [isInstalling, setIsInstalling] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

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

    // Detect iOS devices
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = () => {
    // Immediate UI feedback
    setIsInstalling(true);
    
    // Defer async work to next tick
    setTimeout(() => {
      if (deferredPrompt) {
        // Chrome/Edge - use native prompt
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(({ outcome }) => {
          if (outcome === 'accepted') {
            setDeferredPrompt(null);
          }
          setIsInstalling(false);
        });
      } else {
        // Show instructions for Safari/other browsers
        setShowInstructions(true);
        setIsInstalling(false);
      }
    }, 0);
  };

  // Don't show if already installed as standalone app
  if (isStandalone) return null;

  return (
    <>
      <button
        onClick={handleInstall}
        disabled={isInstalling}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-cyan-600 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl active:scale-95 animate-pulse hover:animate-none disabled:opacity-75 disabled:cursor-wait"
        title={isIOS ? 'Get installation instructions' : 'Download MyScanly to your device'}
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
        <span className="hidden sm:inline">
          {isInstalling ? 'Installing...' : (isIOS ? 'Install App' : 'Download App')}
        </span>
        <span className="sm:hidden">{isInstalling ? '...' : (isIOS ? 'Install' : 'Download')}</span>
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
              Add MyScanly to Home Screen
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
              {/* Show iOS instructions first if on iOS, or always show them prominently */}
              <div className={`${isIOS ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-400' : 'bg-blue-50 border-blue-200 text-gray-700'} border rounded-xl p-4`}>
                <p className={`font-semibold mb-3 flex items-center gap-2 ${isIOS ? 'text-white' : 'text-blue-900'}`}>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                  </svg>
                  iPhone/iPad (Safari):
                </p>
                <ol className={`space-y-2 ${isIOS ? 'text-blue-50' : 'text-gray-700'}`}>
                  <li className="flex items-start gap-2">
                    <span className={`font-bold ${isIOS ? 'text-white' : 'text-blue-600'}`}>1.</span>
                    <span>Tap the <strong>Share</strong> button 
                      <svg className="inline-block w-4 h-4 mx-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                      </svg> 
                      at the bottom of your screen</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className={`font-bold ${isIOS ? 'text-white' : 'text-blue-600'}`}>2.</span>
                    <span>Scroll down and tap <strong>"Add to Home Screen"</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className={`font-bold ${isIOS ? 'text-white' : 'text-blue-600'}`}>3.</span>
                    <span>Tap <strong>"Add"</strong> in the top right corner</span>
                  </li>
                </ol>
                {isIOS && (
                  <div className="mt-3 pt-3 border-t border-blue-400 text-xs text-blue-100">
                    💡 The app icon will appear on your home screen
                  </div>
                )}
              </div>
              
              {!isIOS && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clipRule="evenodd" />
                    </svg>
                    Android (Chrome):
                  </p>
                  <ol className="space-y-1.5 text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-green-600">1.</span>
                      <span>Tap the menu (3 dots) in the top right</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-green-600">2.</span>
                      <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="font-bold text-green-600">3.</span>
                      <span>Tap <strong>"Install"</strong> to confirm</span>
                    </li>
                  </ol>
                </div>
              )}
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
