'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseclient';

export default function StandaloneRedirect() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Check if app is running in standalone mode (installed PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');
    
    if (!isStandalone) return;

    // Pages that should not redirect
    const allowedPages = ['/dashboard', '/create', '/profile', '/u/'];
    const isAllowedPage = allowedPages.some(page => pathname.startsWith(page));
    
    // If already on an allowed page, don't redirect
    if (isAllowedPage) return;

    // Check if user is logged in and redirect to dashboard
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        // Logged in users always go to dashboard when opening the app
        router.replace('/dashboard');
      } else if (pathname === '/' || pathname === '/login' || pathname === '/signup') {
        // Non-logged in users on homepage/auth pages go to create
        router.replace('/create');
      }
    });
  }, [pathname, router]);

  return null;
}
