-- ============================================
-- CREATE TEST USERS FOR LOGIN
-- Smart Business Support Platform
-- Run this AFTER creating users in Supabase Auth UI
-- ============================================

-- IMPORTANT: You CANNOT directly insert into auth.users via SQL
-- Instead, follow these steps:

-- ============================================
-- OPTION 1: Use Supabase Dashboard (RECOMMENDED)
-- ============================================

/*
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"

ADMIN USER:
- Email: admin@test.com
- Password: admin123
- Auto Confirm User: YES (check this box)
- Click "Create user"
- Copy the UUID that appears

BUSINESS USER:
- Email: business@test.com
- Password: business123
- Auto Confirm User: YES (check this box)
- Click "Create user"
- Copy the UUID that appears

3. Then come back and run STEP 2 below with the UUIDs
*/

-- ============================================
-- STEP 2: Add User Profiles to admins table
-- ============================================

-- Replace 'PASTE_ADMIN_UUID_HERE' with the actual UUID from Supabase Auth UI
INSERT INTO public.admins (
    id,
    full_name,
    email,
    role,
    is_approved,
    created_at,
    updated_at
) VALUES (
    'PASTE_ADMIN_UUID_HERE'::UUID,  -- Replace with actual UUID from Step 1
    'Admin User',
    'admin@test.com',
    'admin',
    true,
    NOW(),
    NOW()
);

-- Replace 'PASTE_BUSINESS_UUID_HERE' with the actual UUID from Supabase Auth UI
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
    'PASTE_BUSINESS_UUID_HERE'::UUID,  -- Replace with actual UUID from Step 1
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
);


-- ============================================
-- STEP 3: Verify Created Users
-- ============================================

-- Run this to verify both users are created correctly
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
WHERE u.email IN ('admin@test.com', 'business@test.com')
ORDER BY a.role;


-- ============================================
-- CREDENTIALS SUMMARY
-- ============================================

-- Copy these credentials:

/*

👨‍💼 ADMIN LOGIN
Email: admin@test.com
Password: admin123
Access: /admin/dashboard

🏪 BUSINESS OWNER LOGIN
Email: business@test.com
Password: business123
Business: Joe's Coffee Shop
Access: /business/dashboard (after approval)

🔗 LOGIN URL
http://localhost:3001/auth/v1/login

*/
