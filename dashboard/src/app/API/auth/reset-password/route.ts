import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const PASSWORD_RULES = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,72}$/;

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token: string = (body.token || '').trim();
    const password: string = body.password || '';

    if (!token) {
      return NextResponse.json({ error: 'Reset token is required.' }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: 'New password is required.' }, { status: 400 });
    }

    if (!PASSWORD_RULES.test(password)) {
      return NextResponse.json({
        error: 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.',
      }, { status: 400 });
    }

    const supabaseAdmin = getAdminClient();

    // Hash the incoming token and look it up
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { data: record, error: lookupError } = await supabaseAdmin
      .from('password_reset_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .eq('used', false)
      .maybeSingle();

    if (lookupError || !record) {
      return NextResponse.json({ error: 'Invalid or already-used reset link.' }, { status: 400 });
    }

    // Check expiry
    if (new Date(record.expires_at) < new Date()) {
      return NextResponse.json({
        error: 'This reset link has expired. Please request a new one.',
      }, { status: 400 });
    }

    // Update password via Supabase Auth Admin
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      record.user_id,
      { password }
    );

    if (updateError) {
      console.error('Supabase password update error:', updateError);
      return NextResponse.json({ error: 'Failed to update password. Please try again.' }, { status: 500 });
    }

    // Mark token as used (one-time use)
    await supabaseAdmin
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('token_hash', tokenHash);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Reset password error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
