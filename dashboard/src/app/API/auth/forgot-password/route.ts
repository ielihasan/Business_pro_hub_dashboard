import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { sendPasswordResetEmail } from '@/lib/email/resend';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email: string = (body.email || '').trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    // Find user across admins and business_applications tables
    let userId: string | null = null;

    const { data: adminUser } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (adminUser?.id) {
      userId = adminUser.id;
    } else {
      const { data: appUser } = await supabaseAdmin
        .from('business_applications')
        .select('user_id')
        .eq('email', email)
        .maybeSingle();

      if (appUser?.user_id) userId = appUser.user_id;
    }

    // Always return success — never reveal whether email is registered
    if (!userId) {
      return NextResponse.json({ success: true });
    }

    // Generate secure random token (64-char hex)
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min

    // Invalidate all previous unused tokens for this email
    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('email', email)
      .eq('used', false);

    // Insert the new token
    const { error: insertError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({ user_id: userId, email, token_hash: tokenHash, expires_at: expiresAt });

    if (insertError) {
      console.error('Token insert error:', insertError);
      return NextResponse.json({ error: 'Failed to generate reset token.' }, { status: 500 });
    }

    // Send email (fire-and-forget style — don't fail request if email fails)
    sendPasswordResetEmail({ to: email, token }).catch(err =>
      console.error('Password reset email send error:', err)
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Forgot password error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
