-- Migration: Add email verification columns to business_applications table
-- Run this migration in your Supabase SQL editor

-- Add email verification columns
ALTER TABLE business_applications
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS verification_token_expires_at TIMESTAMPTZ;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_business_applications_verification_token
ON business_applications(verification_token)
WHERE verification_token IS NOT NULL;

-- Create index for email verified status
CREATE INDEX IF NOT EXISTS idx_business_applications_email_verified
ON business_applications(email_verified);

-- Comment explaining the columns
COMMENT ON COLUMN business_applications.email_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN business_applications.email_verified_at IS 'Timestamp when email was verified';
COMMENT ON COLUMN business_applications.verification_token IS 'Token sent via email for verification (cleared after use)';
COMMENT ON COLUMN business_applications.verification_token_expires_at IS 'Expiration time for the verification token (24 hours from creation)';
