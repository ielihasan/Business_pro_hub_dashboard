-- ============================================
-- TEMPORARILY DISABLE RLS FOR TESTING
-- This will help us confirm RLS is the issue
-- ============================================

-- Disable RLS on admins table (TEMPORARY - for testing only)
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE
        WHEN rowsecurity = true THEN '🔒 RLS ENABLED (login may fail)'
        ELSE '✅ RLS DISABLED (login should work)'
    END as status
FROM pg_tables
WHERE tablename = 'admins';

-- Show the users again
SELECT
    '=== TEST: Can we see users now? ===' as info,
    id,
    email,
    full_name,
    role,
    is_approved
FROM public.admins
WHERE email IN ('admin@test.com', 'business@test.com');

SELECT '✅ RLS temporarily disabled. Try logging in now!' as result;
SELECT '⚠️ IMPORTANT: We will re-enable RLS with correct policies after login works.' as warning;
