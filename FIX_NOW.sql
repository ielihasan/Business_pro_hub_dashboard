-- ============================================
-- EMERGENCY FIX - Link Auth Users to Profiles
-- Run this NOW in Supabase SQL Editor
-- ============================================

-- Step 1: Check what we have
SELECT
    '=== Current Auth Users ===' as info,
    u.id,
    u.email,
    u.email_confirmed_at
FROM auth.users u
WHERE u.email IN ('admin@test.com', 'business@test.com')
ORDER BY u.email;

-- Step 2: Check existing profiles
SELECT
    '=== Current Profiles ===' as info,
    a.id,
    a.email,
    a.role
FROM public.admins a
WHERE a.email IN ('admin@test.com', 'business@test.com');

-- Step 3: AUTO-FIX - Create missing profiles
-- This will NOT create duplicates (uses INSERT ... WHERE NOT EXISTS)

-- Fix Admin Profile
INSERT INTO public.admins (
    id,
    full_name,
    email,
    role,
    is_approved,
    created_at,
    updated_at
)
SELECT
    u.id,
    'Admin User',
    'admin@test.com',
    'admin',
    true,
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email = 'admin@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.admins WHERE email = 'admin@test.com'
  );

-- Fix Business Profile
INSERT INTO public.admins (
    id,
    full_name,
    email,
    role,
    business_name,
    business_type,
    business_address,
    business_phone,
    business_description,
    is_approved,
    approved_at,
    created_at,
    updated_at
)
SELECT
    u.id,
    'Joe Coffee',
    'business@test.com',
    'business_owner',
    'Joe''s Coffee Shop',
    'Coffee Shop',
    '123 Main Street, Downtown',
    '555-0123',
    'Best coffee in town! Serving artisanal coffee and fresh pastries.',
    true,
    NOW(),
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email = 'business@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.admins WHERE email = 'business@test.com'
  );

-- Step 4: Verify the fix
SELECT
    '=== VERIFICATION - Should see 2 users ready ===' as info,
    u.id,
    u.email,
    a.full_name,
    a.role,
    a.business_name,
    a.is_approved,
    CASE
        WHEN a.id IS NULL THEN '❌ STILL MISSING PROFILE'
        WHEN u.email_confirmed_at IS NULL THEN '⚠️ EMAIL NOT CONFIRMED'
        ELSE '✅ READY TO LOGIN'
    END as status
FROM auth.users u
LEFT JOIN public.admins a ON u.id = a.id
WHERE u.email IN ('admin@test.com', 'business@test.com')
ORDER BY u.email;

-- If you still see "STILL MISSING PROFILE", it means the auth user wasn't created
-- Go to Supabase → Authentication → Users → Create the users first!
