import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists first
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    const user = userData?.users?.find(u => u.email === email);

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email address' },
        { status: 404 }
      );
    }

    // Check if already confirmed
    if (user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'This email is already confirmed. Try logging in.' },
        { status: 400 }
      );
    }

    // Resend confirmation email using Supabase
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      console.error('Resend confirmation error:', error);
      
      // Check if it's an SMTP configuration issue
      if (error.message?.includes('SMTP') || error.message?.includes('email')) {
        return NextResponse.json(
          { 
            error: 'Email service not configured. Please contact support or use a different email provider.',
            detail: 'SMTP_NOT_CONFIGURED'
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: error.message || 'Failed to resend confirmation email' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Confirmation email sent! Check your inbox (including spam folder).',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Resend confirmation error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}
