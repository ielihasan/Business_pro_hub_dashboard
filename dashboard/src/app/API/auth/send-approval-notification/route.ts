import { NextRequest, NextResponse } from 'next/server';
import { sendApprovalNotificationEmail } from '@/lib/email/resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, fullName, businessName, isApproved, rejectionReason } = body;

    if (!to || !fullName || typeof isApproved !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: to, fullName, isApproved' },
        { status: 400 }
      );
    }

    // Send approval/rejection notification email
    const emailResult = await sendApprovalNotificationEmail({
      to,
      fullName,
      businessName,
      isApproved,
      rejectionReason,
    });

    if (!emailResult.success) {
      console.error('Failed to send approval notification:', emailResult.error);
      return NextResponse.json(
        { error: emailResult.error || 'Failed to send notification email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${isApproved ? 'Approval' : 'Rejection'} notification sent successfully`,
    });
  } catch (error: any) {
    console.error('Error in send-approval-notification route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
