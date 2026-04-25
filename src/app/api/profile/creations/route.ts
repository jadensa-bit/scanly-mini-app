import { NextRequest, NextResponse } from 'next/server';
import { getUserCreations } from '@/lib/createProfile';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch creations
    const creationsResult = await getUserCreations(user.id, supabase);

    if (!creationsResult.success) {
      return NextResponse.json(
        { error: creationsResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      creations: creationsResult.data,
    });
  } catch (error) {
    console.error('Creations fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
