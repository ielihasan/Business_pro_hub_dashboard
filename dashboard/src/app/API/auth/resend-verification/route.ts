import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendVerificationEmail } from '@/lib/email/resend';
import { generateVerificationToken, getTokenExpirationDate } from '@/lib/utils/verification-token';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find application by email
    const { data: application, error: findError } = await supabaseAdmin
      .from('business_applications')
      .select('*')
      .eq('email', email)
      .eq('is_approved', false)
      .eq('is_rejected', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (findError || !application) {
      return NextResponse.json(
        { error: 'No pending application found for this email' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (application.email_verified) {
      return NextResponse.json(
        { error: 'Email is already verified' },
        { status: 400 }
      );
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const expiresAt = getTokenExpirationDate();

    // Update application with new verification token
    const { error: updateError } = await supabaseAdmin
      .from('business_applications')
      .update({
        verification_token: verificationToken,
        verification_token_expires: expiresAt.toISOString(),
      })
      .eq('id', application.id);

    if (updateError) {
      console.error('Failed to update verification token:', updateError);
      return NextResponse.json(
        { error: 'Failed to generate new verification token' },
        { status: 500 }
      );
    }

    // Send verification email
    const emailResult = await sendVerificationEmail({
      to: application.email,
      fullName: application.full_name,
      verificationToken,
      businessName: application.business_name,
    });

    if (!emailResult.success) {
      return NextResponse.json(
        { error: emailResult.error || 'Failed to send verification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error: any) {
    console.error('Error in resend-verification route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
