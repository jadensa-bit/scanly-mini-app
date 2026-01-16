import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("📡 POST /api/auth/sync called");
    
    const { session } = await req.json();
    
    if (!session) {
      console.log("⚠️ No session provided");
      return NextResponse.json({ ok: false, error: "No session" }, { status: 400 });
    }

    const response = NextResponse.json({ ok: true, message: "Session synced" });
    
    // Set the session tokens as cookies
    if (session.access_token) {
      response.cookies.set("sb-access-token", session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: "/",
      });
      console.log("✅ Set access token cookie");
    }
    
    if (session.refresh_token) {
      response.cookies.set("sb-refresh-token", session.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: "/",
      });
      console.log("✅ Set refresh token cookie");
    }
    
    return response;
  } catch (error) {
    console.error("❌ Session sync error:", error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
