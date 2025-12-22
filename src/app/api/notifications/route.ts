export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const handle = (url.searchParams.get("handle") || "").trim().toLowerCase();

    if (!handle) {
      return NextResponse.json(
        { error: "Missing handle parameter" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRole) {
      return NextResponse.json(
        { error: "Missing Supabase env vars" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRole, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("handle", handle)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Notifications fetch error:", error);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      handle,
      count: data.length,
      notifications: data,
    });
  } catch (err) {
    console.error("Notifications route error:", err);
    return NextResponse.json(
      { error: "Unexpected error" },
      { status: 500 }
    );
  }
}
