-- Fix "duplicate key value violates unique constraint admins_email_key" error
-- This removes the unique constraint on email to allow same email with multiple roles

-- Step 1: Check all unique constraints on admins table
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'admins'
  AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.constraint_name;

-- Step 2: Drop the unique constraint on email
ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_email_key;
ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_email_unique;

-- Step 3: Drop unique constraint on id if it exists
ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_id_key;
ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_id_unique;

-- Step 4: Drop the primary key on id if it exists
ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_pkey CASCADE;

-- Step 5: Add record_id column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'admins' AND column_name = 'record_id') THEN
        ALTER TABLE admins ADD COLUMN record_id SERIAL;
    END IF;
END $$;

-- Step 6: Make record_id the primary key
ALTER TABLE admins ADD PRIMARY KEY (record_id);

-- Step 7: Create unique constraint on (id, role) to prevent duplicate roles
-- This allows same user (id) to have multiple roles (admin + business_owner)
-- But prevents same user from having duplicate admin or duplicate business_owner
ALTER TABLE admins DROP CONSTRAINT IF EXISTS unique_user_role;
ALTER TABLE admins ADD CONSTRAINT unique_user_role UNIQUE (id, role);

-- Step 8: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(id);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Step 9: Verify the changes
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'admins'
ORDER BY ordinal_position;

-- Step 10: Check all constraints (should show NO unique constraint on email or id)
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'admins'
ORDER BY tc.constraint_type, tc.constraint_name;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '✅ Removed unique constraint on email column';
    RAISE NOTICE '✅ The admins table now supports multiple roles per email';
    RAISE NOTICE '✅ Same email can have both admin AND business_owner roles';
    RAISE NOTICE '';
    RAISE NOTICE 'New structure:';
    RAISE NOTICE '- Primary Key: record_id (auto-increment)';
    RAISE NOTICE '- Unique Constraint: (id, role) - prevents duplicate roles';
    RAISE NOTICE '- No constraint on email - allows multiple roles';
END $$;
