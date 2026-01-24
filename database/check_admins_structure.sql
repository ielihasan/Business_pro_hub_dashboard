-- Check the current structure of admins table
-- Run this BEFORE the migration to see what needs to be fixed

-- 1. Show all columns
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'admins'
ORDER BY ordinal_position;

-- 2. Show all constraints
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'admins'
ORDER BY tc.constraint_type, tc.constraint_name;

-- 3. Show sample data
SELECT id, role, full_name, email, business_name
FROM admins
LIMIT 5;

-- 4. Check if any user has multiple roles (this will fail with current structure)
SELECT id, COUNT(*) as role_count, array_agg(role) as roles
FROM admins
GROUP BY id
HAVING COUNT(*) > 1;
