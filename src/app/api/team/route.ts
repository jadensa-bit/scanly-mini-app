import { createClient } from "@/lib/supabase/server";
export async function GET(req: Request) {
  const supabase = await createClient();

  const { searchParams } = new URL(req.url);
  const handle = searchParams.get("handle");

  if (!handle) {
    return Response.json({ team: [] }, { status: 200 });
  }

  console.log(`📋 Fetching team members for handle: ${handle}`);

  const { data, error } = await supabase
    .from("team_members")
    .select("id,name")
    .eq("creator_handle", handle);

  if (error) {
    console.error(`❌ Error fetching team members for ${handle}:`, error.message);
    return Response.json({ error: error.message }, { status: 400 });
  }

  console.log(`✅ Found ${data?.length || 0} team members for ${handle}:`, data);
  return Response.json({ team: data ?? [] }, { status: 200 });
}
