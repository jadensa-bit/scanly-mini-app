import { createBrowserClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Browser client for client-side usage only
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export const supabase = (() => {
  if (typeof window === 'undefined') {
    // Should not be used on server - use createServerSupabaseClient() instead
    console.warn('⚠️ Browser supabase client imported on server. Use createServerSupabaseClient() in API routes.');
    return {} as any;
  }
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return supabaseClient;
})();

// Server-side client for API routes and server actions
let serverSupabaseClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createServerSupabaseClient() {
  if (serverSupabaseClient) {
    return serverSupabaseClient;
  }
  
  serverSupabaseClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  return serverSupabaseClient;
}

// Function to create browser client - only call this in client components
export function createBrowserSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Legacy export for compatibility
export { createClient } from "@supabase/supabase-js";
