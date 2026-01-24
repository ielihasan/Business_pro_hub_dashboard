-- FINAL FIX for Business Approval System
-- This script removes all FK constraints from admins table to allow approval workflow
-- Run this in Supabase SQL Editor

-- Step 1: Remove ALL foreign key constraints from admins table
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT constraint_name
              FROM information_schema.table_constraints
              WHERE table_name = 'admins'
              AND constraint_type = 'FOREIGN KEY')
    LOOP
        EXECUTE 'ALTER TABLE admins DROP CONSTRAINT IF EXISTS ' || r.constraint_name;
        RAISE NOTICE 'Dropped constraint: %', r.constraint_name;
    END LOOP;
END $$;

-- Step 2: Verify the admins table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'admins'
ORDER BY ordinal_position;

-- Step 3: Check remaining constraints (should show no FK constraints)
SELECT
    tc.constraint_name,
    tc.constraint_type,
    tc.table_name,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.table_name = 'admins'
ORDER BY tc.constraint_type, tc.constraint_name;

-- Step 4: Clean up any orphaned data from previous attempts
-- Delete any admin records where the user_id doesn't exist in auth.users
DELETE FROM admins
WHERE id NOT IN (SELECT id FROM auth.users)
  AND role = 'business_owner';

-- Step 5: Verify RLS policies allow the insert
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'admins';

COMMENT ON TABLE admins IS 'Admin and business owner records. No FK constraint on id to allow flexible approval workflow.';
COMMENT ON COLUMN admins.id IS 'User ID - matches auth.users.id but without FK constraint to avoid timing issues';
