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
    const { applicationId, email, fullName, businessName } = body;

    if (!applicationId || !email || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields: applicationId, email, fullName' },
        { status: 400 }
      );
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const expiresAt = getTokenExpirationDate();

    // Update application with verification token
    const { error: updateError } = await supabaseAdmin
      .from('business_applications')
      .update({
        verification_token: verificationToken,
        verification_token_expires: expiresAt.toISOString(),
        email_verified: false,
      })
      .eq('id', applicationId);

    if (updateError) {
      console.error('Failed to update application with token:', updateError);
      return NextResponse.json(
        { error: 'Failed to generate verification token' },
        { status: 500 }
      );
    }

    // Send verification email
    const emailResult = await sendVerificationEmail({
      to: email,
      fullName,
      verificationToken,
      businessName,
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
    console.error('Error in send-verification route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
