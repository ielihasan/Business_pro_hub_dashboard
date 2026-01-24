-- Diagnostic queries to identify the FK constraint issue
-- Run these queries one by one in Supabase SQL Editor

-- 1. Check if the user exists in auth.users
SELECT id, email, created_at
FROM auth.users
WHERE id = 'e155c475-22ce-4e64-bfcd-a99b64b279cf';

-- 2. Check current FK constraints on admins table
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'admins';

-- 3. Alternative way to check FK constraints
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS foreign_table,
    a.attname AS column_name,
    af.attname AS foreign_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.conrelid = 'admins'::regclass AND c.contype = 'f';

-- 4. Check if there's a public.users table
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_name = 'users';

-- 5. List all users from business_applications
SELECT user_id, email, business_name
FROM business_applications
WHERE is_approved = false AND is_rejected = false;
