import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("Missing Supabase credentials");
  return createServiceClient(url, serviceKey, { auth: { persistSession: false } });
}

const TABLE_CANDIDATES = ["sites", "scanly_sites", "site"];

async function findSiteByHandle(supabase: any, handle: string) {
  for (const table of TABLE_CANDIDATES) {
    const { data, error } = await supabase.from(table).select("*").eq("handle", handle).maybeSingle();
    const msg = String(error?.message || "").toLowerCase();
    if (error && (msg.includes("does not exist") || msg.includes("relation"))) continue;
    if (error) return { table, data: null, error };
    if (data) return { table, data, error: null };
  }
  return { table: null, data: null, error: null };
}

export async function GET(req: Request) {
  const supabase = await createClient();

  const { searchParams } = new URL(req.url);
  const handle = searchParams.get("handle");

  if (!handle) {
    return Response.json({ team: [] }, { status: 200 });
  }

  console.log(`📋 Fetching team members for handle: ${handle}`);

  // First try to get staff from the Piqo config (servicesConfig.staff / staffProfiles)
  try {
    const adminSupabase = getSupabase();
    const siteResult = await findSiteByHandle(adminSupabase, handle);
    
    if (siteResult.data?.config?.staffProfiles && Array.isArray(siteResult.data.config.staffProfiles)) {
      const staffFromConfig = siteResult.data.config.staffProfiles.map((staff: any, idx: number) => ({
        id: `config-${idx}`,
        name: staff.name || `Staff ${idx + 1}`,
      }));
      console.log(`✅ Found ${staffFromConfig.length} staff from Piqo config:`, staffFromConfig);
      return Response.json({ team: staffFromConfig }, { status: 200 });
    }
  } catch (err) {
    console.warn("⚠️ Failed to read staff from Piqo config:", err);
  }

  // Fallback to team_members table
  const { data, error } = await supabase
    .from("team_members")
    .select("id,name")
    .eq("creator_handle", handle);

  if (error) {
    console.error(`❌ Error fetching team members for ${handle}:`, error.message);
    return Response.json({ error: error.message }, { status: 400 });
  }

  console.log(`✅ Found ${data?.length || 0} team members from table for ${handle}:`, data);
  return Response.json({ team: data ?? [] }, { status: 200 });
}
