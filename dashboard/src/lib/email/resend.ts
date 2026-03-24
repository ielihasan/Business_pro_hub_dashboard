import { Resend } from 'resend';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'BusinessHub Pro <noreply@businessprohub.me>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3003';

export interface SendVerificationEmailParams {
  to: string;
  fullName: string;
  verificationToken: string;
  businessName?: string;
}

export async function sendVerificationEmail({
  to,
  fullName,
  verificationToken,
  businessName,
}: SendVerificationEmailParams) {
  const verificationLink = `${APP_URL}/auth/verify-email?token=${verificationToken}`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: 'Verify Your Email - BusinessHub Pro',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #111827 0%, #1f2937 100%); padding: 40px 40px 30px; text-align: center;">
                      <div style="width: 60px; height: 60px; background-color: #ffffff; border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 28px; color: #111827; font-weight: bold;">B</span>
                      </div>
                      <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">BusinessHub Pro</h1>
                      <p style="color: #9ca3af; margin: 8px 0 0; font-size: 14px;">Smart Queue Management</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px;">
                      <h2 style="color: #111827; margin: 0 0 16px; font-size: 22px; font-weight: 600;">
                        Verify Your Email Address
                      </h2>

                      <p style="color: #4b5563; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">
                        Hi <strong>${fullName}</strong>,
                      </p>

                      <p style="color: #4b5563; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">
                        Thank you for registering${businessName ? ` <strong>${businessName}</strong>` : ''} with BusinessHub Pro!
                        To complete your registration and submit your application for admin review, please verify your email address.
                      </p>

                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 16px 0 32px;">
                            <a href="${verificationLink}"
                               style="display: inline-block; background: linear-gradient(135deg, #111827 0%, #374151 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(17, 24, 39, 0.3);">
                              Verify Email Address
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="color: #6b7280; margin: 0 0 16px; font-size: 14px; line-height: 1.6;">
                        Or copy and paste this link into your browser:
                      </p>

                      <p style="color: #3b82f6; margin: 0 0 32px; font-size: 14px; word-break: break-all; background-color: #f3f4f6; padding: 12px; border-radius: 8px;">
                        ${verificationLink}
                      </p>

                      <div style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
                        <p style="color: #9ca3af; margin: 0; font-size: 13px; line-height: 1.6;">
                          <strong>What happens next?</strong><br>
                          After verification, your application will be reviewed by our admin team.
                          You'll receive another email once your account is approved.
                        </p>
                      </div>

                      <div style="margin-top: 24px; padding: 16px; background-color: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b;">
                        <p style="color: #92400e; margin: 0; font-size: 13px;">
                          <strong>Note:</strong> This verification link expires in 24 hours.
                          If you didn't create this account, please ignore this email.
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; margin: 0 0 8px; font-size: 12px;">
                        &copy; ${new Date().getFullYear()} BusinessHub Pro. All rights reserved.
                      </p>
                      <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                        Smart Queue Management Platform
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      text: `
        Verify Your Email Address - BusinessHub Pro

        Hi ${fullName},

        Thank you for registering${businessName ? ` ${businessName}` : ''} with BusinessHub Pro!
        To complete your registration, please verify your email address by clicking the link below:

        ${verificationLink}

        What happens next?
        After verification, your application will be reviewed by our admin team.
        You'll receive another email once your account is approved.

        Note: This verification link expires in 24 hours.
        If you didn't create this account, please ignore this email.

        © ${new Date().getFullYear()} BusinessHub Pro. All rights reserved.
      `,
    });

    if (error) {
      console.error('Failed to send verification email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error sending verification email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

// ─── Password Reset ───────────────────────────────────────────────────────────

export async function sendPasswordResetEmail({
  to,
  token,
}: {
  to: string;
  token: string;
}) {
  const PROD_URL = process.env.NEXT_PUBLIC_PRODUCTION_URL || APP_URL;

  const prodLink  = `${PROD_URL}/auth/reset-password?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: 'Reset Your Password - BusinessHub Pro',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f4f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
            <tr><td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                <!-- Header -->
                <tr>
                  <td style="background:linear-gradient(135deg,#111827 0%,#1f2937 100%);padding:40px 40px 30px;text-align:center;">
                    <div style="width:60px;height:60px;background-color:#ffffff;border-radius:16px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
                      <span style="font-size:28px;color:#111827;font-weight:bold;">B</span>
                    </div>
                    <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:600;">BusinessHub Pro</h1>
                    <p style="color:#9ca3af;margin:8px 0 0;font-size:14px;">Smart Queue Management</p>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding:40px;">
                    <h2 style="color:#111827;margin:0 0 16px;font-size:22px;font-weight:600;">Reset Your Password</h2>
                    <p style="color:#4b5563;margin:0 0 24px;font-size:16px;line-height:1.6;">
                      We received a request to reset the password for your account associated with this email address.
                      Click the button below to choose a new password. This link expires in <strong>15 minutes</strong>.
                    </p>

                    <!-- Primary Button (Production) -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding:8px 0 24px;">
                          <a href="${prodLink}"
                             style="display:inline-block;background:linear-gradient(135deg,#3D4127 0%,#636B2F 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:600;box-shadow:0 4px 14px rgba(61,65,39,0.4);">
                            Reset My Password
                          </a>
                        </td>
                      </tr>
                    </table>


                    <p style="color:#6b7280;margin:0 0 8px;font-size:14px;line-height:1.6;">
                      Or copy and paste this link into your browser:
                    </p>
                    <p style="color:#3b82f6;margin:0 0 32px;font-size:13px;word-break:break-all;background-color:#f3f4f6;padding:12px;border-radius:8px;">
                      ${prodLink}
                    </p>

                    <div style="margin-top:8px;padding:16px;background-color:#fef3c7;border-radius:8px;border-left:4px solid #f59e0b;">
                      <p style="color:#92400e;margin:0;font-size:13px;line-height:1.6;">
                        <strong>Security Notice:</strong> This link expires in 15 minutes and can only be used once.
                        If you did not request a password reset, you can safely ignore this email — your password will not change.
                      </p>
                    </div>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color:#f9fafb;padding:24px 40px;text-align:center;border-top:1px solid #e5e7eb;">
                    <p style="color:#9ca3af;margin:0 0 8px;font-size:12px;">
                      &copy; ${new Date().getFullYear()} BusinessHub Pro. All rights reserved.
                    </p>
                    <p style="color:#9ca3af;margin:0;font-size:12px;">Smart Queue Management Platform</p>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
      text: `
Reset Your Password - BusinessHub Pro

We received a request to reset your password. Click the link below (expires in 15 minutes):

${prodLink}

If you did not request this, ignore this email — your password will not change.

© ${new Date().getFullYear()} BusinessHub Pro. All rights reserved.
      `,
    });

    if (error) {
      console.error('Failed to send password reset email:', error);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    console.error('Error sending password reset email:', err);
    return { success: false, error: err.message || 'Failed to send email' };
  }
}

// ─── Approval Notification ────────────────────────────────────────────────────

export interface SendApprovalNotificationParams {
  to: string;
  fullName: string;
  businessName?: string;
  isApproved: boolean;
  rejectionReason?: string;
}

export async function sendApprovalNotificationEmail({
  to,
  fullName,
  businessName,
  isApproved,
  rejectionReason,
}: SendApprovalNotificationParams) {
  const loginLink = `${APP_URL}/auth/v1/login`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: isApproved
        ? 'Your Account Has Been Approved - BusinessHub Pro'
        : 'Application Status Update - BusinessHub Pro',
      html: isApproved
        ? `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <tr>
                      <td style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 40px; text-align: center;">
                        <div style="width: 80px; height: 80px; background-color: #ffffff; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                          <span style="font-size: 40px;">&#10003;</span>
                        </div>
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">Account Approved!</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px;">
                        <p style="color: #4b5563; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">
                          Hi <strong>${fullName}</strong>,
                        </p>
                        <p style="color: #4b5563; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">
                          Great news! Your${businessName ? ` <strong>${businessName}</strong>` : ''} account has been approved.
                          You can now log in and start using BusinessHub Pro.
                        </p>
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td align="center" style="padding: 16px 0;">
                              <a href="${loginLink}"
                                 style="display: inline-block; background: linear-gradient(135deg, #111827 0%, #374151 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                                Log In Now
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `
        : `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <tr>
                      <td style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 40px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Application Not Approved</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px;">
                        <p style="color: #4b5563; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">
                          Hi <strong>${fullName}</strong>,
                        </p>
                        <p style="color: #4b5563; margin: 0 0 24px; font-size: 16px; line-height: 1.6;">
                          Unfortunately, your application for${businessName ? ` <strong>${businessName}</strong>` : ''} was not approved.
                        </p>
                        ${rejectionReason ? `
                          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 24px 0; border-radius: 0 8px 8px 0;">
                            <p style="color: #991b1b; margin: 0; font-size: 14px;">
                              <strong>Reason:</strong> ${rejectionReason}
                            </p>
                          </div>
                        ` : ''}
                        <p style="color: #6b7280; margin: 24px 0 0; font-size: 14px;">
                          If you believe this was a mistake or have questions, please contact our support team.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
    });

    if (error) {
      console.error('Failed to send approval notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('Error sending approval notification:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}
