import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const handle = searchParams.get("handle");
  
  if (!handle) {
    return NextResponse.json({ error: "Missing handle" }, { status: 400 });
  }
  
  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, serviceKey);
  
  // Get site config
  const { data: site } = await supabase
    .from("sites")
    .select("*")
    .eq("handle", handle)
    .single();
  
  // Get team members
  const { data: team } = await supabase
    .from("team_members")
    .select("*")
    .eq("creator_handle", handle);
  
  // Get slots
  const { data: slots } = await supabase
    .from("slots")
    .select("*")
    .eq("creator_handle", handle)
    .eq("is_booked", false)
    .order("start_time", { ascending: true })
    .limit(20);
  
  return NextResponse.json({
    handle,
    site: site || null,
    teamCount: team?.length || 0,
    team: team || [],
    slotsCount: slots?.length || 0,
    slots: slots?.slice(0, 5) || [], // Just first 5 for debugging
    config: site?.config || null,
  });
}
