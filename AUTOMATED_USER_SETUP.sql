-- ============================================
-- AUTOMATED USER SETUP
-- Smart Business Support Platform
-- ============================================

-- This script automatically links existing auth users to the admins table
-- Run this AFTER you've created users in Supabase Authentication UI

-- ============================================
-- STEP 1: Check Current State
-- ============================================

-- Show all existing auth users
SELECT
    '=== AUTH USERS ===' as section,
    id,
    email,
    created_at,
    email_confirmed_at,
    CASE
        WHEN email_confirmed_at IS NULL THEN '⚠️ NOT CONFIRMED'
        ELSE '✅ CONFIRMED'
    END as email_status
FROM auth.users
ORDER BY created_at DESC;

-- Show all existing admin profiles
SELECT
    '=== ADMIN PROFILES ===' as section,
    id,
    email,
    full_name,
    role,
    business_name,
    is_approved,
    CASE
        WHEN is_approved THEN '✅ APPROVED'
        ELSE '⏳ PENDING'
    END as approval_status
FROM public.admins
ORDER BY created_at DESC;

-- Show orphaned auth users (users without profiles)
SELECT
    '=== ORPHANED AUTH USERS (Need Profiles) ===' as section,
    u.id,
    u.email,
    u.email_confirmed_at
FROM auth.users u
LEFT JOIN public.admins a ON u.id = a.id
WHERE a.id IS NULL;

-- ============================================
-- STEP 2: Auto-Create Missing Profiles
-- ============================================

-- Auto-create admin profile for admin@test.com if exists
DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'admin@test.com';
BEGIN
    -- Check if auth user exists
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email;

    IF v_user_id IS NOT NULL THEN
        -- Check if profile already exists
        IF NOT EXISTS (SELECT 1 FROM public.admins WHERE id = v_user_id) THEN
            -- Create admin profile
            INSERT INTO public.admins (
                id,
                full_name,
                email,
                role,
                is_approved,
                created_at,
                updated_at
            ) VALUES (
                v_user_id,
                'Admin User',
                v_email,
                'admin',
                true,
                NOW(),
                NOW()
            );
            RAISE NOTICE '✅ Created admin profile for %', v_email;
        ELSE
            RAISE NOTICE 'ℹ️ Admin profile already exists for %', v_email;
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Auth user not found for %. Create in Supabase UI first.', v_email;
    END IF;
END $$;

-- Auto-create business profile for business@test.com if exists
DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'business@test.com';
BEGIN
    -- Check if auth user exists
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_email;

    IF v_user_id IS NOT NULL THEN
        -- Check if profile already exists
        IF NOT EXISTS (SELECT 1 FROM public.admins WHERE id = v_user_id) THEN
            -- Create business profile
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
            ) VALUES (
                v_user_id,
                'Joe Coffee',
                v_email,
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
            );
            RAISE NOTICE '✅ Created business profile for %', v_email;
        ELSE
            RAISE NOTICE 'ℹ️ Business profile already exists for %', v_email;
        END IF;
    ELSE
        RAISE NOTICE '⚠️ Auth user not found for %. Create in Supabase UI first.', v_email;
    END IF;
END $$;

-- ============================================
-- STEP 3: Verify Setup
-- ============================================

-- Show final state with detailed status
SELECT
    '=== FINAL VERIFICATION ===' as section,
    u.id,
    u.email,
    a.full_name,
    a.role,
    a.business_name,
    u.email_confirmed_at,
    a.is_approved,
    CASE
        WHEN a.id IS NULL THEN '❌ NO PROFILE - Run Step 2 again'
        WHEN u.email_confirmed_at IS NULL THEN '⚠️ EMAIL NOT CONFIRMED - Confirm in Supabase UI'
        WHEN a.role = 'business_owner' AND a.is_approved = false THEN '⏳ BUSINESS PENDING APPROVAL'
        ELSE '✅ READY TO LOGIN'
    END as status,
    CASE
        WHEN a.role = 'admin' THEN '/admin/dashboard'
        WHEN a.role = 'business_owner' AND a.is_approved THEN '/business/dashboard'
        WHEN a.role = 'business_owner' AND NOT a.is_approved THEN '/waiting-approval'
        ELSE 'N/A'
    END as expected_redirect
FROM auth.users u
LEFT JOIN public.admins a ON u.id = a.id
WHERE u.email IN ('admin@test.com', 'business@test.com')
ORDER BY u.email;

-- ============================================
-- TROUBLESHOOTING QUERIES
-- ============================================

-- If users still can't login, run these:

-- 1. Manually confirm email (if needed)
-- UPDATE auth.users
-- SET email_confirmed_at = NOW()
-- WHERE email IN ('admin@test.com', 'business@test.com')
-- AND email_confirmed_at IS NULL;

-- 2. Manually approve business (if needed)
-- UPDATE public.admins
-- SET is_approved = true, approved_at = NOW()
-- WHERE email = 'business@test.com'
-- AND is_approved = false;

-- 3. Check if business types exist (required for registration)
-- SELECT COUNT(*) as business_types_count
-- FROM public.business_types
-- WHERE is_active = true;
-- Expected: At least 10 types

-- ============================================
-- SUMMARY
-- ============================================

/*

✅ What this script does:
1. Shows current state of auth users and profiles
2. Automatically creates missing profiles for test users
3. Verifies everything is connected properly
4. Provides troubleshooting queries

📋 Expected Login Credentials After Running:

Admin:
- Email: admin@test.com
- Password: admin123
- Dashboard: /admin/dashboard

Business:
- Email: business@test.com
- Password: business123
- Dashboard: /business/dashboard (if approved)

⚠️ IMPORTANT:
- Auth users must be created in Supabase UI FIRST
- Go to: Authentication → Users → "Add user"
- Check "Auto Confirm User" when creating
- Then run this script to create profiles

🔗 Create Users Here:
https://hjblbmmyfznxomsrxhme.supabase.co/project/_/auth/users

*/
