import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email: string = (body.email || '').trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    // Use Supabase's built-in password reset email (same SMTP that sends
    // signup verification emails — guaranteed delivery, no custom domain needed)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';
    const redirectTo = `${appUrl}/auth/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

    if (error) {
      console.error('Supabase resetPasswordForEmail error:', error.message);
      // Still return success — never reveal whether the email is registered
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ success: true }); // always succeed to prevent enumeration
  }
}
