-- ============================================
-- DIAGNOSE THE PROBLEM
-- Run this to see what's actually in the database
-- ============================================

-- 1. Show ALL auth users (not just test ones)
SELECT
    '=== ALL AUTH USERS ===' as section,
    id,
    email,
    email_confirmed_at,
    created_at,
    CASE
        WHEN email_confirmed_at IS NULL THEN '⚠️ NOT CONFIRMED'
        ELSE '✅ CONFIRMED'
    END as status
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 2. Show ALL admin profiles
SELECT
    '=== ALL ADMIN PROFILES ===' as section,
    id,
    email,
    full_name,
    role,
    is_approved
FROM public.admins
ORDER BY created_at DESC
LIMIT 10;

-- 3. Find orphaned auth users (users without profiles)
SELECT
    '=== ORPHANED AUTH USERS (Have auth but no profile) ===' as section,
    u.id as user_id,
    u.email,
    u.email_confirmed_at
FROM auth.users u
LEFT JOIN public.admins a ON u.id = a.id
WHERE a.id IS NULL
ORDER BY u.created_at DESC;

-- 4. Find orphaned profiles (profiles without auth)
SELECT
    '=== ORPHANED PROFILES (Have profile but no auth) ===' as section,
    a.id as admin_id,
    a.email,
    a.role
FROM public.admins a
LEFT JOIN auth.users u ON a.id = u.id
WHERE u.id IS NULL;

-- 5. Show matched users (working correctly)
SELECT
    '=== CORRECTLY MATCHED USERS ===' as section,
    u.id,
    u.email,
    a.full_name,
    a.role,
    a.is_approved
FROM auth.users u
INNER JOIN public.admins a ON u.id = a.id
ORDER BY u.created_at DESC;

-- ============================================
-- EXPECTED OUTPUT:
-- - Section 1: Should show admin@test.com and business@test.com
-- - Section 2: Should show matching profiles
-- - Section 3: Should be EMPTY (no orphaned auth users)
-- - Section 4: Should be EMPTY (no orphaned profiles)
-- - Section 5: Should show 2 matched users
-- ============================================
