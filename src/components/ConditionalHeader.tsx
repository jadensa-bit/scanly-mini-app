'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function ConditionalHeader() {
  const pathname = usePathname();
  
  // Hide header on published piqo pages (/u/handle)
  const isPublicPiqo = pathname?.startsWith('/u/');
  
  if (isPublicPiqo) {
    return null;
  }
  
  return <Header />;
}
