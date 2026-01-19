import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl;
  
  // Extract base domain from environment or default to current host
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'piqo.app';
  
  // Check if this is a subdomain request (e.g., coffeeshop.piqo.app)
  // Exclude www and the main domain itself
  const isSubdomain = hostname.endsWith(`.${baseDomain}`) && 
                      !hostname.startsWith('www.') && 
                      hostname !== baseDomain;
  
  if (isSubdomain) {
    // Extract handle from subdomain (e.g., "coffeeshop" from "coffeeshop.piqo.app")
    const handle = hostname.replace(`.${baseDomain}`, '');
    
    // Rewrite to /u/[handle] path
    const rewriteUrl = url.clone();
    rewriteUrl.pathname = `/u/${handle}${url.pathname === '/' ? '' : url.pathname}`;
    
    console.log(`Subdomain routing: ${hostname} -> ${rewriteUrl.pathname}`);
    
    return NextResponse.rewrite(rewriteUrl);
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Try to get user, but don't fail on refresh token errors
  let user = null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (!error) {
      user = data.user;
    }
  } catch (error) {
    // Silently handle auth errors - user will be treated as not authenticated
    console.log('Auth check failed:', error);
  }

  // Protect these routes (but NOT public storefronts)
  const protectedPaths = ['/dashboard', '/create', '/profile'];
  
  // Specific protected routes under /u/[handle]
  const protectedHandleRoutes = ['/manage-slots', '/manage-items', '/confirmed'];

  const isProtected = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path)) ||
    protectedHandleRoutes.some(route => request.nextUrl.pathname.includes(route));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    // Preserve the original path as redirect parameter
    url.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }

  // Allow visiting login/signup even when authenticated (no forced redirect)

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};