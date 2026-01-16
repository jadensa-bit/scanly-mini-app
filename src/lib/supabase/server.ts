
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  console.log("🍪 Available cookies:", allCookies.map(c => c.name).join(", ") || "(none)");

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          const cookies = cookieStore.getAll().map(cookie => ({
            name: cookie.name,
            value: cookie.value,
          }));
          console.log("🍪 getAll() returning cookies:", cookies.map(c => c.name).join(", ") || "(none)");
          return cookies;
        },
        async setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              await cookieStore.set(name, value, options);
            }
          } catch {
            // ignore
          }
        },
      },
    }
  );
}
