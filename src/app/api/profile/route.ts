import { NextRequest, NextResponse } from 'next/server';
import { getUserProfile } from '@/lib/createProfile';
import { supabase } from '@/lib/supabaseclient';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch profile
    const profileResult = await getUserProfile(user.id);

    if (!profileResult.success) {
      return NextResponse.json(
        { error: profileResult.error },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: profileResult.data,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
