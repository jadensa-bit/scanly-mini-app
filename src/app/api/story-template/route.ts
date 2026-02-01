/**
 * Instagram Story Template Generator
 * Creates shareable story graphics with QR codes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { handle, template = 'gradient', productImage } = body;

    if (!handle) {
      return NextResponse.json(
        { error: 'Missing handle' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get site info
    const { data: site, error: siteError } = await supabase
      .from('scanly_sites')
      .select('config')
      .eq('handle', handle)
      .single();

    if (siteError || !site) {
      return NextResponse.json(
        { error: 'Site not found' },
        { status: 404 }
      );
    }

    const brandName = site.config?.brandName || handle;
    const piqoUrl = `${process.env.NEXT_PUBLIC_APP_URL}/u/${handle}`;

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(piqoUrl, {
      width: 800,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    // Generate SVG story template
    const svg = generateStoryTemplate({
      template,
      brandName,
      handle,
      qrCodeDataUrl,
      productImage,
    });

    // Convert SVG to base64 data URL
    const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

    return NextResponse.json({
      success: true,
      dataUrl: svgDataUrl,
      downloadUrl: `/api/story-template/download?handle=${handle}&template=${template}`,
    });

  } catch (error: any) {
    console.error('Story template generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate template' },
      { status: 500 }
    );
  }
}

interface TemplateOptions {
  template: string;
  brandName: string;
  handle: string;
  qrCodeDataUrl: string;
  productImage?: string;
}

function generateStoryTemplate(options: TemplateOptions): string {
  const { template, brandName, handle, qrCodeDataUrl, productImage } = options;

  // Instagram Story dimensions: 1080x1920
  const templates: Record<string, string> = {
    gradient: `
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#8B5CF6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#EC4899;stop-opacity:1" />
          </linearGradient>
        </defs>
        
        <!-- Background -->
        <rect width="1080" height="1920" fill="url(#bg)"/>
        
        <!-- Brand Name -->
        <text x="540" y="400" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="white" text-anchor="middle">
          ${brandName}
        </text>
        
        <!-- Call to Action -->
        <text x="540" y="520" font-family="Arial, sans-serif" font-size="48" fill="white" text-anchor="middle" opacity="0.9">
          Scan to shop
        </text>
        
        <!-- QR Code -->
        <image href="${qrCodeDataUrl}" x="240" y="700" width="600" height="600"/>
        
        <!-- Handle -->
        <text x="540" y="1450" font-family="Arial, sans-serif" font-size="40" fill="white" text-anchor="middle" opacity="0.8">
          @${handle}
        </text>
        
        <!-- Footer -->
        <text x="540" y="1750" font-family="Arial, sans-serif" font-size="32" fill="white" text-anchor="middle" opacity="0.6">
          Powered by piqo
        </text>
      </svg>
    `,
    
    minimal: `
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
        <!-- Background -->
        <rect width="1080" height="1920" fill="#FFFFFF"/>
        
        <!-- Brand Name -->
        <text x="540" y="400" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="#000000" text-anchor="middle">
          ${brandName}
        </text>
        
        <!-- QR Code -->
        <image href="${qrCodeDataUrl}" x="240" y="600" width="600" height="600"/>
        
        <!-- Handle -->
        <text x="540" y="1350" font-family="Arial, sans-serif" font-size="40" fill="#666666" text-anchor="middle">
          @${handle}
        </text>
        
        <!-- Footer -->
        <text x="540" y="1750" font-family="Arial, sans-serif" font-size="28" fill="#999999" text-anchor="middle">
          Scan to shop instantly
        </text>
      </svg>
    `,
    
    dark: `
      <svg width="1080" height="1920" viewBox="0 0 1080 1920" xmlns="http://www.w3.org/2000/svg">
        <!-- Background -->
        <rect width="1080" height="1920" fill="#000000"/>
        
        <!-- Brand Name -->
        <text x="540" y="400" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="#FFFFFF" text-anchor="middle">
          ${brandName}
        </text>
        
        <!-- Neon border around QR -->
        <rect x="230" y="690" width="620" height="620" fill="none" stroke="#00FF88" stroke-width="8" rx="20"/>
        
        <!-- QR Code -->
        <image href="${qrCodeDataUrl}" x="240" y="700" width="600" height="600"/>
        
        <!-- Handle -->
        <text x="540" y="1450" font-family="Arial, sans-serif" font-size="40" fill="#00FF88" text-anchor="middle">
          @${handle}
        </text>
        
        <!-- Footer -->
        <text x="540" y="1750" font-family="Arial, sans-serif" font-size="32" fill="#FFFFFF" text-anchor="middle" opacity="0.6">
          Tap to shop 🛍️
        </text>
      </svg>
    `,
  };

  return templates[template] || templates.gradient;
}
