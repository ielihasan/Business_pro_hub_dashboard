-- ============================================
-- FIX USER PROFILES - Automatic Solution
-- This will automatically link existing auth users to admins table
-- ============================================

-- Step 1: First, let's see what users exist in auth.users
SELECT
    id,
    email,
    created_at,
    email_confirmed_at,
    'Auth user exists' as status
FROM auth.users
WHERE email IN ('admin@test.com', 'business@test.com')
ORDER BY email;

-- Step 2: Check if they have profiles in admins table
SELECT
    a.id,
    a.email,
    a.role,
    'Profile exists in admins table' as status
FROM public.admins a
WHERE a.email IN ('admin@test.com', 'business@test.com');

-- ============================================
-- AUTOMATIC FIX: Run this to create missing profiles
-- ============================================

-- This will automatically create admin profile if auth user exists
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
    u.email,
    'admin',
    true,
    NOW(),
    NOW()
FROM auth.users u
WHERE u.email = 'admin@test.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.admins WHERE id = u.id
  );

-- This will automatically create business profile if auth user exists
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
    u.email,
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
    SELECT 1 FROM public.admins WHERE id = u.id
  );

-- ============================================
-- VERIFICATION: Run this to confirm everything is linked
-- ============================================

SELECT
    u.id,
    u.email,
    u.email_confirmed_at,
    a.full_name,
    a.role,
    a.business_name,
    a.is_approved,
    CASE
        WHEN a.id IS NULL THEN '❌ Missing profile'
        WHEN u.email_confirmed_at IS NULL THEN '⚠️ Email not confirmed'
        WHEN a.is_approved = false THEN '⚠️ Not approved'
        ELSE '✅ Ready to login'
    END as status
FROM auth.users u
LEFT JOIN public.admins a ON u.id = a.id
WHERE u.email IN ('admin@test.com', 'business@test.com')
ORDER BY u.email;

-- ============================================
-- SUMMARY
-- ============================================

/*
What this script does:
1. Shows existing auth users
2. Shows existing admin profiles
3. Automatically creates missing profiles
4. Verifies everything is connected

After running this, you should be able to login with:
- admin@test.com / admin123
- business@test.com / business123

If users don't exist in auth.users yet, create them in Supabase:
Authentication → Users → Add user → Create new user
(Make sure to check "Auto Confirm User")
*/
