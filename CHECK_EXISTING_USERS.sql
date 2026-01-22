-- ============================================
-- CHECK EXISTING USERS
-- Run this first to see if users already exist
-- ============================================

-- Check all users in auth.users
SELECT
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- Check users in admins table
SELECT
    id,
    email,
    full_name,
    role,
    business_name,
    is_approved
FROM public.admins
ORDER BY created_at DESC;

-- Check if our test users already exist
SELECT
    u.id,
    u.email,
    u.email_confirmed_at,
    a.full_name,
    a.role,
    a.business_name,
    a.is_approved
FROM auth.users u
LEFT JOIN public.admins a ON u.id = a.id
WHERE u.email IN ('admin@test.com', 'business@test.com');
