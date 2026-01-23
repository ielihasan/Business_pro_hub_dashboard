-- ============================================
-- CHECK FOR DATABASE ERRORS
-- ============================================

-- 1. Check if admins table exists and has correct structure
SELECT
    '=== ADMINS TABLE STRUCTURE ===' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'admins'
ORDER BY ordinal_position;

-- 2. Check RLS status
SELECT
    '=== RLS STATUS ===' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'admins';

-- 3. Try to select data directly (this should work in SQL editor)
SELECT
    '=== DIRECT SELECT TEST ===' as info,
    id,
    email,
    role,
    is_approved
FROM public.admins
WHERE id = 'f19efd8f-3bec-480c-a958-da59faca3373'::uuid;

-- 4. Check for any triggers that might be causing issues
SELECT
    '=== TRIGGERS ON ADMINS TABLE ===' as info,
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'admins';

-- 5. Check for foreign key issues
SELECT
    '=== FOREIGN KEYS ===' as info,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'admins'
  AND tc.constraint_type = 'FOREIGN KEY';
