import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = createClient();

  const { searchParams } = new URL(req.url);
  const handle = searchParams.get("handle");

  if (!handle) {
    return Response.json({ team: [] }, { status: 200 });
  }

  const { data, error } = await supabase
    .from("team_members")
    .select("id,name")
    .eq("creator_handle", handle);

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json({ team: data ?? [] }, { status: 200 });
}
