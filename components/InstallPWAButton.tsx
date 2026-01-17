"use client";

import { useEffect, useState } from "react";

export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const ios =
      /iphone|ipad|ipod/.test(ua) && !(window as any).MSStream;
    setIsIOS(ios);

    // Detect already installed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone
    ) {
      setIsInstalled(true);
    }

    // Listen for install prompt (Android)
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  if (isInstalled) return null;

  // ANDROID / CHROME
  if (deferredPrompt && !isIOS) {
    return (
      <button
        onClick={async () => {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === "accepted") {
            setDeferredPrompt(null);
          }
        }}
        className="fixed bottom-6 right-6 z-50 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-5 py-3 text-sm font-semibold text-black shadow-xl backdrop-blur-md"
      >
        ➕ Install App
      </button>
    );
  }

  // IOS SAFARI
  if (isIOS) {
    return (
      <button
        onClick={() =>
          alert(
            "To add Piqo to your Home Screen:\n\n1. Tap the Share icon\n2. Tap 'Add to Home Screen'\n3. Tap Add"
          )
        }
        className="fixed bottom-6 right-6 z-50 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 px-5 py-3 text-sm font-semibold text-black shadow-xl backdrop-blur-md"
      >
        ➕ Add to Home Screen
      </button>
    );
  }

  return null;
}
