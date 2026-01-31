import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isTokenExpired } from '@/lib/utils/verification-token';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Find application with this token
    const { data: application, error: findError } = await supabaseAdmin
      .from('business_applications')
      .select('*')
      .eq('verification_token', token)
      .single();

    if (findError || !application) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      );
    }

    // Check if already verified
    if (application.email_verified) {
      return NextResponse.json({
        success: true,
        message: 'Email already verified',
        alreadyVerified: true,
      });
    }

    // Check if token has expired
    if (application.verification_token_expires && isTokenExpired(application.verification_token_expires)) {
      return NextResponse.json(
        { error: 'Verification token has expired. Please request a new verification email.' },
        { status: 400 }
      );
    }

    // Mark email as verified
    const { error: updateError } = await supabaseAdmin
      .from('business_applications')
      .update({
        email_verified: true,
        email_verified_at: new Date().toISOString(),
        verification_token: null, // Clear the token after use
        verification_token_expires: null,
      })
      .eq('id', application.id);

    if (updateError) {
      console.error('Failed to update email verification status:', updateError);
      return NextResponse.json(
        { error: 'Failed to verify email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully',
      applicationId: application.id,
      email: application.email,
      businessName: application.business_name,
      businessType: application.business_type,
      isAdminApplication: application.business_type === 'Admin',
    });
  } catch (error: any) {
    console.error('Error in verify-email route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Alternative POST endpoint for verification
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    // Redirect to GET handler logic
    const url = new URL(request.url);
    url.searchParams.set('token', token);

    const getRequest = new NextRequest(url, { method: 'GET' });
    return GET(getRequest);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
