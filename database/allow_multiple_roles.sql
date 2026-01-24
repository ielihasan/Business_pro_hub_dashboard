-- Migration: Allow users to have multiple roles (admin AND business_owner)
-- This changes the admins table structure to support one user having multiple role records

-- Step 1: Drop the primary key constraint on 'id' column
ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_pkey;

-- Step 2: Add a new auto-incrementing primary key column
ALTER TABLE admins ADD COLUMN record_id SERIAL PRIMARY KEY;

-- Step 3: Create a unique constraint on (id, role) to prevent duplicate role assignments
-- This ensures a user can't have duplicate admin or duplicate business_owner roles
-- But ALLOWS the same user to have BOTH admin AND business_owner roles
ALTER TABLE admins ADD CONSTRAINT unique_user_role UNIQUE (id, role);

-- Step 4: Add index on id for faster lookups
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(id);

-- Step 5: Add index on role for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);

-- Step 6: Verify the new structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'admins'
ORDER BY ordinal_position;

-- Step 7: Check constraints
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'admins'
ORDER BY tc.constraint_type, tc.constraint_name;

COMMENT ON TABLE admins IS 'Admin and business owner records. Users can have multiple roles (both admin and business_owner).';
COMMENT ON COLUMN admins.id IS 'User ID - matches auth.users.id. Same user can appear multiple times with different roles.';
COMMENT ON COLUMN admins.record_id IS 'Auto-incrementing primary key for each role assignment.';
COMMENT ON COLUMN admins.role IS 'Role type: admin or business_owner. Unique per user via (id, role) constraint.';
