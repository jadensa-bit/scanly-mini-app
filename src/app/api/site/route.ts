export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse, NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

function noStoreJson(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache",
    },
  });
}

function jsonError(message: string, status = 400, extra?: any) {
  return noStoreJson({ ok: false, error: message, ...(extra ?? {}) }, status);
}

function safeProjectRef(url: string) {
  try {
    const u = new URL(url);
    return u.hostname.split(".")[0] || "unknown";
  } catch {
    return "unknown";
  }
}

// ✅ MUST match your builder + stripe routes (allow dash + underscore)
function normalizeHandle(input: unknown) {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("Environment check - SUPABASE_URL:", url ? "present" : "MISSING");
  console.log("Environment check - SUPABASE_SERVICE_ROLE_KEY:", serviceKey ? "present" : "MISSING");

  if (!url) throw new Error("Missing SUPABASE_URL in .env.local");
  if (!serviceKey) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in .env.local");

  // SAFE debug (no secrets)
  console.log("✅ /api/site using SUPABASE project ref:", safeProjectRef(url));

  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

/**
 * Preferred: one table called "sites" with columns:
 * - handle (text, unique)
 * - config (jsonb)
 * - owner_email (text, nullable)   ✅ optional
 * - stripe_account_id (text, nullable) ✅ optional
 * - updated_at (timestamptz)
 */
const TABLE_CANDIDATES = ["scanly_sites", "sites", "site"];

async function findSiteByHandle(supabase: any, handle: string) {
  for (const table of TABLE_CANDIDATES) {
    const { data, error } = await supabase.from(table).select("*").eq("handle", handle).maybeSingle();

    const msg = String(error?.message || "").toLowerCase();

    // Table doesn't exist → try next
    if (error && (msg.includes("does not exist") || msg.includes("relation") || msg.includes("schema cache"))) {
      continue;
    }

    // Any other error is real
    if (error) return { table, data: null, error };

    if (data) return { table, data, error: null };
  }

  return { table: null, data: null, error: null };
}

function extractOwnerEmail(config: any) {
  // Your builder has both ownerEmail (legacy) and notifications.email (new)
  const a = String(config?.notifications?.email ?? "").trim();
  const b = String(config?.ownerEmail ?? "").trim();
  const c = String(config?.owner_email ?? "").trim();
  return a || b || c || null;
}

async function upsertSite(supabase: any, handle: string, config: any, userId?: string, saveAsDraft = false, isExisting = false) {
  const owner_email = extractOwnerEmail(config);

  // For editing existing sites with draft mode, we only update draft_config, not config
  // For new sites, we set config directly
  const payload: any = {
    handle,
    ...(saveAsDraft ? { draft_config: config } : { config }),
    ...(owner_email ? { owner_email } : {}),
    ...(userId ? { user_id: userId } : {}),
    updated_at: new Date().toISOString(),
  };

  console.log("📝 upsertSite - payload user_id:", payload.user_id || "NOT SET", "handle:", handle, "saveAsDraft:", saveAsDraft, "isExisting:", isExisting);

  // ✅ CRITICAL FIX: First, find which table (if any) already contains this handle
  // This prevents creating duplicate entries across multiple tables
  let targetTable: string | null = null;
  
  if (isExisting) {
    console.log(`🔍 Searching for existing site with handle: ${handle}`);
    const existingSite = await findSiteByHandle(supabase, handle);
    if (existingSite.data && existingSite.table) {
      targetTable = existingSite.table;
      console.log(`✅ Found existing site in table: ${targetTable}`);
    }
  }
  
  // If not found or it's a new site, use the first available table
  const tablesToTry = targetTable ? [targetTable] : TABLE_CANDIDATES;
  console.log(`📋 Will try tables in order:`, tablesToTry);

  for (const table of tablesToTry) {
    console.log(`🔄 Trying table: ${table}`);
    
    // preserve existing stripe_account_id if present on the existing row
    try {
      const { data: existing, error: selErr } = await supabase.from(table).select("stripe_account_id").eq("handle", handle).maybeSingle();
      if (!selErr && existing && existing.stripe_account_id) {
        payload.stripe_account_id = existing.stripe_account_id;
        console.log(`✅ Preserved stripe_account_id from ${table}`);
      }
    } catch {}
    
    let data, error;
    
    // Use UPDATE for existing sites in draft mode to avoid overwriting config
    if (isExisting && saveAsDraft) {
      console.log(`🔄 Using UPDATE for existing site (draft mode)`);
      const updatePayload: any = {
        draft_config: config,
        updated_at: new Date().toISOString(),
      };
      
      // Ensure user_id is set even on updates (in case it was missing before)
      if (userId) {
        updatePayload.user_id = userId;
      }
      
      const updateResult = await supabase
        .from(table)
        .update(updatePayload)
        .eq("handle", handle)
        .select("handle")
        .maybeSingle();
      data = updateResult.data;
      error = updateResult.error;
    } else {
      // Use UPSERT for new sites or when publishing
      console.log(`🔄 Using UPSERT for ${isExisting ? 'existing site (publish mode)' : 'new site'}`);
      console.log(`📋 UPSERT payload for ${handle}:`, { 
        has_user_id: !!payload.user_id, 
        user_id: payload.user_id,
        has_config: !!payload.config,
        has_draft_config: !!payload.draft_config 
      });
      
      const upsertResult = await supabase
        .from(table)
        .upsert(payload, { onConflict: "handle" })
        .select("handle, user_id")
        .maybeSingle();
      data = upsertResult.data;
      error = upsertResult.error;
      
      if (data) {
        console.log(`📊 UPSERT result for ${handle}:`, { handle: data.handle, user_id: data.user_id });
      }
    }

    const msg = String(error?.message || "").toLowerCase();
    console.log(`📊 Table ${table} response:`, { success: !error, error: error?.message, handle: data?.handle });

    // Table/column mismatch → try next
    if (
      error &&
      (msg.includes("does not exist") ||
        msg.includes("relation") ||
        msg.includes("schema cache") ||
        msg.includes("column") ||
        msg.includes("not found"))
    ) {
      console.log(`⏭️ Skipping ${table} - table doesn't exist or missing column`);
      continue;
    }

    if (error) {
      console.error(`❌ Error in ${table}:`, error);
      return { table, data: null, error };
    }
    if (data?.handle) {
      console.log(`✅ Successfully upserted to ${table} with user_id: ${userId}`);
      return { table, data, error: null };
    }
  }

  console.error(`❌ Could not upsert into any table: ${TABLE_CANDIDATES.join(", ")}`);
  return {
    table: null,
    data: null,
    error: new Error(`Could not upsert into any table: ${TABLE_CANDIDATES.join(", ")}`),
  };
}

// GET /api/site?handle=yourname
export async function GET(req: Request) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(req.url);

    const handleRaw = searchParams.get("handle");
    const handle = normalizeHandle(handleRaw);
    const editMode = searchParams.get("edit") === "true";

    console.log("GET /api/site handle:", handle, "editMode:", editMode);

    if (!handle) return jsonError("Missing handle", 400);

    // If in edit mode, verify ownership
    let userId: string | undefined;
    if (editMode) {
      const supabaseAuth = await createServerClient();
      const { data: { user }, error } = await supabaseAuth.auth.getUser();
      
      if (!user) {
        console.error("GET /api/site: User not authenticated for edit mode");
        return jsonError("Unauthorized: Please log in to edit", 401);
      }
      
      userId = user.id;
      console.log("✅ User authenticated for edit:", userId);
    }

    // Demo handles: return hardcoded demo data instead of querying DB
    const DEMO_CONFIGS: Record<string, any> = {
      'demo-barber': {
        user_id: 'demo',
        handle: 'demo-barber',
        owner_email: 'demo@piqo.app',
        stripe_connect_id: null, // Demo mode - no real payments
        config: {
          brandName: 'FreshCuts Studio',
          tagline: '✂️ Premium Cuts, Premium Vibes',
          businessDescription: 'Award-winning barbershop serving the community since 2019. Book your cut now!',
          items: [
            { 
              type: 'service',
              title: 'Classic Cut', 
              price: '$35', 
              note: 'Precision scissor cut with styling • 30 min',
              buttonText: 'Book Now'
            },
            { 
              type: 'service',
              title: 'Cut + Beard Trim', 
              price: '$50', 
              note: 'Full service grooming experience • 45 min',
              badge: 'POPULAR',
              buttonText: 'Book Now'
            },
            { 
              type: 'service',
              title: 'Hot Towel Shave', 
              price: '$40', 
              note: 'Traditional straight razor shave • 30 min',
              buttonText: 'Book Now'
            },
            { 
              type: 'addon',
              title: 'Beard Oil Treatment', 
              price: '$10', 
              note: 'Premium conditioning treatment',
              buttonText: 'Add On'
            }
          ],
          social: {
            phone: '(555) 123-4567',
            address: '123 Main St, Downtown',
            instagram: '@freshcuts',
            bio: 'Mon-Sat: 9AM-7PM • Walk-ins welcome'
          },
          appearance: {
            accent: '#d4af37',
            radius: 12,
            ctaStyle: 'solid',
            layout: 'cards',
            showSocials: true,
            specialMessage: '🎉 THIS IS A DEMO - Test the booking flow!'
          },
          availability: {
            days: {
              monday: { enabled: true, start: '09:00', end: '19:00' },
              tuesday: { enabled: true, start: '09:00', end: '19:00' },
              wednesday: { enabled: true, start: '09:00', end: '19:00' },
              thursday: { enabled: true, start: '09:00', end: '19:00' },
              friday: { enabled: true, start: '09:00', end: '19:00' },
              saturday: { enabled: true, start: '09:00', end: '19:00' },
              sunday: { enabled: false }
            },
            slotMinutes: 30,
            advanceDays: 14
          },
          payments: {
            enabled: false, // Demo mode - no real payments
            depositRequired: false,
            depositPercentage: 0,
            currencyCode: 'USD'
          }
        }
      },
      'demo-products': {
        user_id: 'demo',
        handle: 'demo-products',
        owner_email: 'demo@piqo.app',
        stripe_connect_id: null,
        config: {
          brandName: 'VibeCo',
          tagline: '👕 Streetwear That Speaks',
          businessDescription: 'Curated drops. Limited quantities. Don\'t sleep on these fits.',
          items: [
            { 
              type: 'product',
              title: 'Midnight Hoodie', 
              price: '$68', 
              note: 'Heavyweight cotton blend • Embroidered logo • Sizes S-XXL',
              badge: 'LIMITED',
              buttonText: 'Add to Cart'
            },
            { 
              type: 'product',
              title: 'Acid Wash Tee', 
              price: '$35', 
              note: 'Hand-dyed • No two alike • Unisex fit',
              badge: 'BEST SELLER',
              buttonText: 'Add to Cart'
            },
            { 
              type: 'product',
              title: 'Utility Cargo Pants', 
              price: '$85', 
              note: 'Ripstop fabric • 6 pockets • Adjustable waist',
              buttonText: 'Add to Cart'
            },
            { 
              type: 'product',
              title: 'VibeCo Cap', 
              price: '$28', 
              note: 'Embroidered logo • Adjustable strap • One size',
              buttonText: 'Add to Cart'
            }
          ],
          social: {
            instagram: '@vibeco',
            email: 'hello@vibeco.shop',
            bio: '🚀 New drops every Friday • Free shipping over $100'
          },
          appearance: {
            accent: '#ff6b35',
            radius: 8,
            ctaStyle: 'gradient',
            layout: 'tiles',
            showSocials: true,
            specialMessage: '🛒 DEMO MODE - Test checkout with any product!'
          },
          payments: {
            enabled: false,
            depositRequired: false,
            depositPercentage: 0,
            currencyCode: 'USD'
          },
          delivery: {
            enabled: true,
            fee: 5,
            freeAbove: 100,
            estimatedTime: '30-45 min',
            zones: ['Downtown', 'Midtown', 'Uptown']
          }
        }
      },
      'demo-digital': {
        user_id: 'demo',
        handle: 'demo-digital',
        owner_email: 'demo@piqo.app',
        stripe_connect_id: null,
        config: {
          brandName: 'FitFlow',
          tagline: '💪 Your Digital Fitness Coach',
          businessDescription: 'Personalized workout plans and nutrition guides. Start your transformation today.',
          items: [
            { 
              type: 'product',
              title: '30-Day Shred Program', 
              price: '$47', 
              note: 'Complete workout plan + meal guide PDF • Instant download',
              badge: 'BESTSELLER',
              buttonText: 'Get Instant Access'
            },
            { 
              type: 'product',
              title: 'Macro Calculator Tool', 
              price: '$19', 
              note: 'Custom nutrition calculator • Excel spreadsheet • Lifetime updates',
              buttonText: 'Download Now'
            },
            { 
              type: 'service',
              title: '1-on-1 Coaching Call', 
              price: '$97', 
              note: '60-min video consultation • Custom plan • Follow-up included',
              buttonText: 'Book Session'
            },
            { 
              type: 'product',
              title: 'Recipe eBook Bundle', 
              price: '$29', 
              note: '100+ healthy recipes • Meal prep guide • Shopping lists',
              buttonText: 'Get eBook'
            }
          ],
          social: {
            email: 'coach@fitflow.fit',
            website: 'fitflow.fit',
            instagram: '@fitflow',
            bio: '🔥 10k+ transformations • Results guaranteed'
          },
          appearance: {
            accent: '#00c9a7',
            accentMode: 'gradient',
            accentGradient: { c1: '#00c9a7', c2: '#845ec2', angle: 135 },
            radius: 16,
            ctaStyle: 'gradient',
            ctaShine: true,
            layout: 'cards',
            showSocials: true,
            specialMessage: '📱 DEMO - Try adding products to cart!'
          },
          payments: {
            enabled: false,
            depositRequired: false,
            depositPercentage: 0,
            currencyCode: 'USD'
          },
          delivery: {
            enabled: true,
            fee: 0,
            freeAbove: 0,
            estimatedTime: 'Instant digital delivery',
            zones: []
          }
        }
      }
    };

    // Check if this is a demo handle
    if (DEMO_CONFIGS[handle]) {
      console.log(`✅ Serving demo config for: ${handle}`);
      return noStoreJson({
        ok: true,
        site: DEMO_CONFIGS[handle],
        config: DEMO_CONFIGS[handle].config,
        hasDraft: false,
        table: 'demo'
      });
    }

    const out = await findSiteByHandle(supabase, handle);

    if (out.error) {
      console.error("GET /api/site supabase error:", out.error);
      return jsonError("Supabase error", 500, { detail: out.error.message, table: out.table });
    }

    if (!out.data) {
      return jsonError("Not found", 404, { handle, triedTables: TABLE_CANDIDATES });
    }

    // Verify ownership in edit mode
    if (editMode && userId && out.data.user_id !== userId) {
      console.error("GET /api/site: User", userId, "attempted to edit site owned by", out.data.user_id);
      return jsonError("Unauthorized: You don't own this Piqo", 403);
    }

    // ✅ In edit mode, return draft_config if it exists, otherwise fallback to config
    // ✅ In view mode, always return the published config only
    const configToReturn = editMode 
      ? (out.data.draft_config ?? out.data.config)  // Edit mode: prefer draft
      : out.data.config;  // View mode: use published config only
    
    console.log("GET /api/site returning config:", { 
      editMode, 
      hasDraft: !!out.data.draft_config, 
      returningDraft: editMode && !!out.data.draft_config 
    });

    // ✅ Return the config cleanly (but keep site row too for stripe fields etc.)
    return noStoreJson({
      ok: true,
      site: out.data,
      config: configToReturn ?? null,
      hasDraft: !!out.data.draft_config,  // Let client know if there's a draft
      table: out.table,
    });
  } catch (e: any) {
    console.error("GET /api/site server error:", e);
    return jsonError("Server error", 500, { detail: e?.message || String(e) });
  }
}

// POST /api/site
export async function POST(req: NextRequest) {
  try {
    console.log("POST /api/site called");

    // Get user from session (first try cookies, then try Bearer token)
    let user = null;
    let userId: string | undefined;
    
    const supabaseAuth = await createServerClient();
    console.log("✅ Server client created");
    const { data: { user: cookieUser }, error } = await supabaseAuth.auth.getUser();
    console.log("👤 getUser from cookies result:", { user: cookieUser?.id || "null", error: error?.message });
    
    if (cookieUser) {
      user = cookieUser;
      userId = cookieUser.id;
    } else {
      // Try to extract user from Bearer token in Authorization header
      console.log("🔐 Checking Authorization header...");
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        console.log("📌 Bearer token found, verifying with Supabase...");
        
        const supabase = getSupabase();
        try {
          const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
          console.log("👤 getUser from token result:", { user: tokenUser?.id || "null", error: tokenError?.message });
          
          if (tokenUser) {
            user = tokenUser;
            userId = tokenUser.id;
          }
        } catch (tokenErr) {
          console.error("❌ Token verification failed:", tokenErr);
        }
      }
    }

    // ✅ CRITICAL: Verify user is authenticated before proceeding
    if (!user || !userId) {
      console.error("POST /api/site: User not authenticated");
      return jsonError("Unauthorized: Please log in first", 401);
    }

    console.log("✅ User authenticated:", userId);
    
    const supabase = getSupabase();
    console.log("Supabase client created successfully");

    const body = await req.json().catch((error) => {
      console.error("Failed to parse JSON body:", error);
      return null;
    });
    if (!body) {
      console.error("Invalid JSON body received");
      return jsonError("Invalid JSON body", 400);
    }

    console.log("Request body received:", { handle: body?.handle, brandName: body?.brandName });

    const handle = normalizeHandle(body?.handle);
    const brandName = String(body?.brandName || "").trim();

    if (!handle) {
      console.error("Handle is required but missing");
      return jsonError("handle is required", 400);
    }
    if (!brandName) {
      console.error("BrandName is required but missing");
      return jsonError("brandName is required", 400);
    }

    // ✅ Ensure stored config uses normalized handle + trimmed brandName
    const config = { ...(body || {}), handle, brandName };
    console.log("POST /api/site handle:", handle, "brandName:", brandName, "mode:", config.mode, "config keys:", Object.keys(config));
    console.log("📋 Services config:", {
      mode: config.mode,
      hasAvailability: !!config.availability,
      availability: config.availability,
      hasStaffProfiles: !!config.staffProfiles,
      staffCount: config.staffProfiles?.length || 0,
    });
    
    // 🔍 DEBUG: Log complete availability structure being saved
    if (config.mode === 'services' && config.availability) {
      console.log("🔍 SAVING AVAILABILITY - Full structure:", JSON.stringify(config.availability, null, 2));
      console.log("🔍 AVAILABILITY.DAYS:", JSON.stringify(config.availability.days, null, 2));
    }

    // Check if site already exists to determine if this is an edit (save as draft) or new creation (save as live)
    const existingSite = await findSiteByHandle(supabase, handle);
    const isEditing = !!existingSite.data;
    const saveAsDraft = isEditing; // Save as draft only when editing existing site
    
    console.log("📝 POST /api/site mode:", isEditing ? "EDITING (save as draft)" : "CREATING (save as live)", "handle:", handle);
    console.log("📊 Existing site found:", !!existingSite.data, "table:", existingSite.table);
    if (existingSite.data) {
      console.log("📊 Existing site has draft:", !!existingSite.data.draft_config);
    }

    // 🚨 SUBSCRIPTION CHECK: Block creation of new piqos if user has reached their limit
    if (!isEditing) {
      console.log("🔒 Checking subscription limits for new piqo creation...");
      
      // Get user's profile and subscription info
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('subscription_tier, piqo_limit')
        .eq('id', userId)
        .single();

      const tier = profile?.subscription_tier || 'free';
      const limit = profile?.piqo_limit || 1;

      console.log("👤 User subscription:", { tier, limit });

      // Count existing piqos
      let existingCount = 0;
      for (const table of TABLE_CANDIDATES) {
        try {
          const { count } = await supabase
            .from(table)
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId);
          if (count) existingCount += count;
        } catch (e) {
          // Table might not exist, continue
        }
      }

      console.log("📊 User has", existingCount, "existing piqo(s), limit is", limit);

      // Block if they've reached their limit (free tier = 1 piqo)
      if (tier === 'free' && existingCount >= limit) {
        console.error("🚫 User has reached piqo limit:", existingCount, ">=", limit);
        return jsonError(
          "Piqo limit reached. Upgrade to Pro to create unlimited piqos.",
          403,
          { 
            tier, 
            limit, 
            current: existingCount,
            upgradeUrl: "/pricing"
          }
        );
      }
    }

    // ✅ Pass both saveAsDraft and isEditing flags
    const out = await upsertSite(supabase, handle, config, userId, saveAsDraft, isEditing);

    if (out.error) {
      console.error("POST /api/site supabase error:", out.error);
      return jsonError("Supabase error", 500, {
        detail: String((out.error as any)?.message || out.error),
        triedTables: TABLE_CANDIDATES,
      });
    }

    // ✅ Save team members from staffProfiles
    if (body?.staffProfiles && Array.isArray(body.staffProfiles) && body.staffProfiles.length > 0) {
      try {
        console.log(`📋 Processing ${body.staffProfiles.length} staff profiles for ${handle}`);
        
        // First, delete old team members for this handle
        const { error: deleteError } = await supabase.from("team_members").delete().eq("creator_handle", handle);
        if (deleteError) {
          console.warn("⚠️ Failed to delete old team members:", deleteError.message);
        }

        // Then insert new ones
        const teamMembers = body.staffProfiles.map((staff: any, idx: number) => ({
          name: (staff.name || "Staff").trim(),
          creator_handle: handle,
          created_at: new Date().toISOString(),
        }));

        console.log(`📝 Inserting team members:`, teamMembers);

        const { data, error: teamError } = await supabase
          .from("team_members")
          .insert(teamMembers)
          .select();

        if (teamError) {
          console.error("❌ Failed to save team members:", teamError.message);
        } else {
          console.log(`✅ Saved ${data?.length || teamMembers.length} team members for ${handle}:`, data);
        }
      } catch (teamErr: any) {
        console.warn("⚠️ Team member save failed (non-critical):", teamErr.message);
      }
    }

    console.log("POST /api/site success for handle:", handle);
    return noStoreJson({ ok: true, handle: out.data.handle, table: out.table });
  } catch (e: any) {
    console.error("POST /api/site server error:", e);
    return jsonError("Server error", 500, { detail: e?.message || String(e) });
  }
}
