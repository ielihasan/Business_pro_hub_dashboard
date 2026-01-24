-- Fix admins table to allow multiple roles per user
-- This fixes the "duplicate key value violates unique constraint admins_pkey" error

-- Step 1: Check current primary key
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'admins'::regclass AND contype = 'p';

-- Step 2: Drop the existing primary key constraint on 'id'
ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_pkey;
ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_id_key;

-- Step 3: Add a new auto-incrementing primary key column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'admins' AND column_name = 'record_id') THEN
        ALTER TABLE admins ADD COLUMN record_id SERIAL;
    END IF;
END $$;

-- Step 4: Set the new primary key
ALTER TABLE admins ADD PRIMARY KEY (record_id);

-- Step 5: Create unique constraint on (id, role) to prevent duplicate roles
-- This allows same user to have BOTH admin AND business_owner roles
-- But prevents duplicate admin or duplicate business_owner
ALTER TABLE admins DROP CONSTRAINT IF EXISTS unique_user_role;
ALTER TABLE admins ADD CONSTRAINT unique_user_role UNIQUE (id, role);

-- Step 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON admins(id);
CREATE INDEX IF NOT EXISTS idx_admins_role ON admins(role);

-- Step 7: Verify the changes
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'admins'
ORDER BY ordinal_position;

-- Step 8: Check constraints
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
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'The admins table now supports multiple roles per user.';
    RAISE NOTICE 'Same user can have both admin AND business_owner roles.';
END $$;
