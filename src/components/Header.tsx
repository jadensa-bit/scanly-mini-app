'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseclient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh();
  };

  return (
    <header className="bg-black/80 backdrop-blur-sm border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link href="/" className="text-white font-bold text-xl">
            piqo
          </Link>
          <nav className="flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/dashboard" className="text-white hover:text-gray-300">
                  Dashboard
                </Link>
                <Link href="/create" className="text-white hover:text-gray-300">
                  Create
                </Link>
                <Link href="/profile" className="text-white hover:text-gray-300">
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-white hover:text-gray-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-white hover:text-gray-300">
                  Login
                </Link>
                <Link href="/signup" className="text-white hover:text-gray-300">
                  Sign Up
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}