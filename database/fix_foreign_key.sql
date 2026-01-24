-- Fix Foreign Key Constraint Issue
-- Run this SQL in Supabase SQL Editor to remove the foreign key constraint

-- Drop the existing table if it exists
DROP TABLE IF EXISTS business_applications CASCADE;

-- Recreate the table without foreign key constraints
CREATE TABLE business_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(100) NOT NULL,
  business_address TEXT NOT NULL,
  business_phone VARCHAR(50) NOT NULL,
  business_description TEXT,
  is_approved BOOLEAN DEFAULT false,
  is_rejected BOOLEAN DEFAULT false,
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  rejected_at TIMESTAMPTZ,
  rejected_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for faster queries
CREATE INDEX idx_business_applications_user_id ON business_applications(user_id);
CREATE INDEX idx_business_applications_is_approved ON business_applications(is_approved);
CREATE INDEX idx_business_applications_is_rejected ON business_applications(is_rejected);
CREATE INDEX idx_business_applications_email ON business_applications(email);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_business_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER business_applications_updated_at
  BEFORE UPDATE ON business_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_business_applications_updated_at();

-- Add comments for documentation
COMMENT ON TABLE business_applications IS 'Stores business owner registration applications pending admin approval';
COMMENT ON COLUMN business_applications.user_id IS 'Reference to the auth user who submitted the application (no FK constraint to avoid timing issues)';
COMMENT ON COLUMN business_applications.is_approved IS 'Whether the application has been approved by an admin';
COMMENT ON COLUMN business_applications.is_rejected IS 'Whether the application has been rejected by an admin';
COMMENT ON COLUMN business_applications.approved_by IS 'Admin user who approved the application';
COMMENT ON COLUMN business_applications.rejected_by IS 'Admin user who rejected the application';

-- Enable RLS
ALTER TABLE business_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own applications
CREATE POLICY "Users can view own applications"
ON business_applications FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Admins can view all applications
CREATE POLICY "Admins can view all applications"
ON business_applications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.id = auth.uid()
    AND admins.role = 'admin'
    AND admins.is_approved = true
  )
);

-- Policy: Admins can update applications (approve/reject)
CREATE POLICY "Admins can update applications"
ON business_applications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.id = auth.uid()
    AND admins.role = 'admin'
    AND admins.is_approved = true
  )
);

-- Policy: Anyone can insert (for registration)
CREATE POLICY "Anyone can create applications"
ON business_applications FOR INSERT
WITH CHECK (true);
