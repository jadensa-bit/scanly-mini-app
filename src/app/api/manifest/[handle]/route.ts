import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseclient';

export async function GET(
  request: NextRequest,
  { params }: { params: { handle: string } }
) {
  const handle = params.handle;

  try {
    // Fetch the site configuration
    const { data: site, error } = await supabase
      .from('sites')
      .select('config, handle')
      .eq('handle', handle)
      .eq('draft', false)
      .single();

    if (error || !site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    const config = site.config;
    const brandName = config?.brandName || handle;
    const brandLogo = config?.brandLogo || config?.profilePic;
    const tagline = config?.tagline || 'QR Storefront';
    const accentColor = config?.appearance?.accent || '#06b6d4';

    // Create dynamic manifest
    const manifest = {
      name: brandName,
      short_name: brandName.length > 12 ? brandName.substring(0, 12) : brandName,
      description: tagline,
      start_url: `/u/${handle}`,
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: accentColor,
      orientation: 'portrait-primary',
      icons: brandLogo
        ? [
            {
              src: brandLogo,
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: brandLogo,
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ]
        : [
            {
              src: '/icon-192.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
            {
              src: '/icon-512.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
          ],
      categories: ['business', 'shopping'],
    };

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error generating manifest:', error);
    return NextResponse.json(
      { error: 'Failed to generate manifest' },
      { status: 500 }
    );
  }
}
