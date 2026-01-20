'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseclient';
import PiqoLogoFull from '@/components/PiqoLogoFull';
import { motion } from 'framer-motion';

interface Site {
  handle: string;
  config: any;
  is_published: boolean;
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const handle = params?.handle as string;
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [sites, setSites] = useState<Site[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!handle) return;

    const fetchProfileData = async () => {
      try {
        setLoading(true);

        // First, get the site owner's user_id from any of their sites
        const { data: siteData, error: siteError } = await supabase
          .from('sites')
          .select('user_id, config')
          .eq('handle', handle)
          .eq('is_published', true)
          .single();

        if (siteError || !siteData) {
          // Try other tables
          const { data: scanlyData } = await supabase
            .from('scanly_sites')
            .select('user_id, config')
            .eq('handle', handle)
            .eq('is_published', true)
            .single();

          if (!scanlyData) {
            setError('Profile not found');
            setLoading(false);
            return;
          }
          
          await fetchUserProfile(scanlyData.user_id);
        } else {
          await fetchUserProfile(siteData.user_id);
        }

      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    const fetchUserProfile = async (userId: string) => {
      // Get profile info from profiles table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Get user metadata
      const { data: userData } = await supabase
        .from('auth.users')
        .select('email, raw_user_meta_data')
        .eq('id', userId)
        .single();

      setProfile({
        name: profileData?.name || userData?.raw_user_meta_data?.name || 'piqo Creator',
        bio: profileData?.bio || 'Welcome to my piqo!',
        avatar_url: profileData?.avatar_url || userData?.raw_user_meta_data?.profile_picture || '',
        created_at: profileData?.created_at,
      });

      // Fetch all published sites for this user
      const tables = ['sites', 'scanly_sites', 'site'];
      const allSites: Site[] = [];

      for (const table of tables) {
        const { data } = await supabase
          .from(table)
          .select('handle, config, is_published')
          .eq('user_id', userId)
          .eq('is_published', true);

        if (data) {
          allSites.push(...data);
        }
      }

      setSites(allSites);
    };

    fetchProfileData();
  }, [handle]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This profile does not exist or is not public.'}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl hover:shadow-lg transition-all"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => router.push('/')} className="hover:opacity-80 transition-opacity">
            <PiqoLogoFull />
          </button>
        </div>
      </header>

      {/* Profile Section */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8"
        >
          {/* Cover gradient */}
          <div className="h-32 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500"></div>
          
          {/* Profile info */}
          <div className="px-6 pb-6 -mt-16">
            <div className="flex items-start gap-6 mb-6">
              {/* Avatar */}
              <div className="relative">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.name}
                    className="w-32 h-32 rounded-full border-4 border-white shadow-xl object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white text-4xl font-black">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Name and bio */}
              <div className="flex-1 mt-16">
                <h1 className="text-3xl font-black text-gray-900 mb-2">{profile.name}</h1>
                <p className="text-gray-600 text-lg mb-4">{profile.bio}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <span className="text-lg">🎨</span> {sites.length} {sites.length === 1 ? 'piqo' : 'piqos'}
                  </span>
                  {profile.created_at && (
                    <span className="flex items-center gap-1">
                      <span className="text-lg">📅</span> Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sites Grid */}
        {sites.length > 0 && (
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-3xl">✨</span> My piqos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sites.map((site, idx) => {
                const config = site.config || {};
                const appearance = config.appearance || {};
                const social = config.social || {};
                const accentColor = appearance.accent || '#22D3EE';

                return (
                  <motion.a
                    key={`${site.handle}-${idx}`}
                    href={`/u/${site.handle}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-cyan-500"
                  >
                    {/* Banner */}
                    {appearance.bannerUrl ? (
                      <div className="h-40 w-full overflow-hidden">
                        <img
                          src={appearance.bannerUrl}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                    ) : (
                      <div
                        className="h-40 w-full"
                        style={{
                          background: `linear-gradient(135deg, ${accentColor}dd 0%, ${accentColor}88 100%)`
                        }}
                      ></div>
                    )}

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="text-xl font-black text-gray-900 mb-2 group-hover:text-cyan-600 transition-colors">
                        {config.title || site.handle}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {config.description || 'Check out my piqo!'}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-500">
                          /{site.handle}
                        </span>
                        <div className="flex items-center gap-2">
                          {social.instagram && <span className="text-sm">📷</span>}
                          {social.tiktok && <span className="text-sm">🎵</span>}
                          {social.website && <span className="text-sm">🌐</span>}
                        </div>
                      </div>
                    </div>
                  </motion.a>
                );
              })}
            </div>
          </div>
        )}

        {sites.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🎨</div>
            <h3 className="text-xl font-black text-gray-900 mb-2">No piqos yet</h3>
            <p className="text-gray-600">This creator hasn't published any piqos yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
}
