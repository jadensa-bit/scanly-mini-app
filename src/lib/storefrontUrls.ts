/**
 * Utility functions for generating storefront URLs
 * Supports both subdomain and path-based formats
 */

/**
 * Build the public URL for a storefront
 * @param handle - The storefront handle (e.g., "coffeeshop")
 * @param options - Optional configuration
 * @returns The full public URL for the storefront
 * 
 * @example
 * // With subdomain (default)
 * buildStorefrontUrl("coffeeshop") // https://coffeeshop.piqo.app
 * 
 * // Path-based format
 * buildStorefrontUrl("coffeeshop", { useSubdomain: false }) // https://piqo.app/u/coffeeshop
 * 
 * // With custom path
 * buildStorefrontUrl("coffeeshop", { path: "/checkout" }) // https://coffeeshop.piqo.app/checkout
 */
export function buildStorefrontUrl(
  handle: string,
  options: {
    useSubdomain?: boolean;
    path?: string;
    protocol?: 'https' | 'http';
  } = {}
): string {
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'piqo.app';
  const useSubdomain = options.useSubdomain ?? 
                       (process.env.NEXT_PUBLIC_USE_SUBDOMAIN !== 'false');
  const protocol = options.protocol || 'https';
  const path = options.path || '';
  
  if (useSubdomain) {
    return `${protocol}://${handle}.${baseDomain}${path}`;
  }
  
  return `${protocol}://${baseDomain}/u/${handle}${path}`;
}

/**
 * Get the current storefront URL from the browser
 * @returns The current page URL
 */
export function getCurrentStorefrontUrl(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.location.href;
}

/**
 * Check if the current request is from a subdomain
 * @param hostname - The request hostname
 * @returns True if accessing via subdomain
 */
export function isSubdomainRequest(hostname: string): boolean {
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'piqo.app';
  return hostname.endsWith(`.${baseDomain}`) && 
         !hostname.startsWith('www.') && 
         hostname !== baseDomain;
}

/**
 * Extract handle from a subdomain
 * @param hostname - The request hostname (e.g., "coffeeshop.piqo.app")
 * @returns The handle or null if not a valid subdomain
 * 
 * @example
 * extractHandleFromSubdomain("coffeeshop.piqo.app") // "coffeeshop"
 * extractHandleFromSubdomain("piqo.app") // null
 */
export function extractHandleFromSubdomain(hostname: string): string | null {
  if (!isSubdomainRequest(hostname)) {
    return null;
  }
  
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'piqo.app';
  return hostname.replace(`.${baseDomain}`, '');
}

/**
 * Generate a QR code URL for a storefront
 * @param handle - The storefront handle
 * @param size - QR code size in pixels (default: 520)
 * @returns QR code image URL
 */
export function buildQRCodeUrl(handle: string, size: number = 520): string {
  const storefrontUrl = buildStorefrontUrl(handle);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(storefrontUrl)}`;
}

/**
 * Build a shareable text for a storefront
 * @param handle - The storefront handle
 * @param brandName - The brand name
 * @returns Shareable text with URL
 */
export function buildShareText(handle: string, brandName: string): string {
  const url = buildStorefrontUrl(handle);
  return `Check out ${brandName}! ${url}`;
}

/**
 * Normalize a handle to be URL-safe
 * @param input - Raw handle input
 * @returns Normalized handle
 */
export function normalizeHandle(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-_]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}
