'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function ConditionalHeader() {
  const pathname = usePathname();
  
  // Hide header on published piqo pages (/u/handle)
  // Check for null/undefined pathname to avoid issues during SSR/hydration
  if (!pathname) {
    return <Header />;
  }
  
  const isPublicPiqo = pathname.startsWith('/u/');
  
  if (isPublicPiqo) {
    return null;
  }
  
  return <Header />;
}
