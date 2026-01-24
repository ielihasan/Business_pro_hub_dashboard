-- Business Applications Table
-- This table stores business registration applications before they are approved

CREATE TABLE IF NOT EXISTS business_applications (
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

-- Note: We don't add foreign key constraints on user_id to avoid timing issues
-- The user_id will be validated when creating the admin record on approval

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_business_applications_user_id ON business_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_business_applications_is_approved ON business_applications(is_approved);
CREATE INDEX IF NOT EXISTS idx_business_applications_is_rejected ON business_applications(is_rejected);
CREATE INDEX IF NOT EXISTS idx_business_applications_email ON business_applications(email);

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
COMMENT ON COLUMN business_applications.user_id IS 'Reference to the auth user who submitted the application';
COMMENT ON COLUMN business_applications.is_approved IS 'Whether the application has been approved by an admin';
COMMENT ON COLUMN business_applications.is_rejected IS 'Whether the application has been rejected by an admin';
COMMENT ON COLUMN business_applications.approved_by IS 'Admin user who approved the application';
COMMENT ON COLUMN business_applications.rejected_by IS 'Admin user who rejected the application';
