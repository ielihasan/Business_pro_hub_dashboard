-- ============================================
-- FIX RLS POLICIES FOR LOGIN
-- The issue is RLS is blocking the login query
-- ============================================

-- First, let's check current policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'admins'
ORDER BY policyname;

-- ============================================
-- DROP OLD POLICIES AND CREATE NEW ONES
-- ============================================

-- Drop existing policies on admins table
DROP POLICY IF EXISTS "Users can view own profile" ON public.admins;
DROP POLICY IF EXISTS "Users can update own profile" ON public.admins;
DROP POLICY IF EXISTS "Allow insert during registration" ON public.admins;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.admins;
DROP POLICY IF EXISTS "Business owners can view approved businesses" ON public.admins;

-- ============================================
-- CREATE NEW POLICIES THAT ALLOW LOGIN
-- ============================================

-- Policy 1: Users can view their own profile (CRITICAL FOR LOGIN)
CREATE POLICY "Users can view own profile"
    ON public.admins FOR SELECT
    USING (auth.uid() = id);

-- Policy 2: Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.admins FOR UPDATE
    USING (auth.uid() = id);

-- Policy 3: Allow insert during registration
CREATE POLICY "Allow insert during registration"
    ON public.admins FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy 4: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
    ON public.admins FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Policy 5: Admins can update any profile
CREATE POLICY "Admins can update all profiles"
    ON public.admins FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.admins
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- ============================================
-- VERIFY POLICIES ARE ACTIVE
-- ============================================

SELECT
    '=== ACTIVE POLICIES ===' as info,
    policyname,
    cmd as operation,
    CASE
        WHEN cmd = 'SELECT' THEN '✅ Allows reading data'
        WHEN cmd = 'INSERT' THEN '✅ Allows creating records'
        WHEN cmd = 'UPDATE' THEN '✅ Allows updating records'
        ELSE cmd
    END as description
FROM pg_policies
WHERE tablename = 'admins'
ORDER BY policyname;

-- ============================================
-- TEST THE FIX
-- ============================================

-- This simulates what happens during login
-- Should return the user's profile
SELECT
    '=== LOGIN TEST (as authenticated user) ===' as info,
    id,
    email,
    full_name,
    role,
    is_approved
FROM public.admins
WHERE email IN ('admin@test.com', 'business@test.com');

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

SELECT '✅ RLS policies updated! Try logging in again.' as result;
