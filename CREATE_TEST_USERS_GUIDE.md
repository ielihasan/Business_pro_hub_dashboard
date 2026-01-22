# Create Test Users - Complete Guide

There are 2 ways to create test users in Supabase:

---

## Method 1: Supabase Dashboard (EASIEST - 5 minutes)

### Step 1: Create Admin User in Supabase Auth

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Click **"Add user"** → **"Create new user"**
4. Fill in:
   - **Email**: `admin@test.com`
   - **Password**: `admin123`
   - **Auto Confirm User**: ✅ **CHECK THIS BOX** (Important!)
5. Click **"Create user"**
6. **Copy the UUID** that appears (you'll need it in Step 3)

### Step 2: Create Business User in Supabase Auth

1. Still in **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"** again
3. Fill in:
   - **Email**: `business@test.com`
   - **Password**: `business123`
   - **Auto Confirm User**: ✅ **CHECK THIS BOX** (Important!)
4. Click **"Create user"**
5. **Copy the UUID** that appears (you'll need it in Step 3)

### Step 3: Add User Profiles via SQL Editor

1. Go to **SQL Editor** in Supabase
2. Click **"New query"**
3. Paste this SQL and **replace the UUIDs**:

```sql
-- Add Admin Profile
INSERT INTO public.admins (
    id,
    full_name,
    email,
    role,
    is_approved,
    created_at,
    updated_at
) VALUES (
    'PASTE_ADMIN_UUID_HERE'::UUID,  -- Replace with UUID from Step 1
    'Admin User',
    'admin@test.com',
    'admin',
    true,
    NOW(),
    NOW()
);

-- Add Business Owner Profile
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
    'PASTE_BUSINESS_UUID_HERE'::UUID,  -- Replace with UUID from Step 2
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
```

4. **Replace both UUIDs** with the ones you copied
5. Click **"Run"**
6. You should see: ✅ Success. 2 rows affected.

### Step 4: Verify Users

Run this query in SQL Editor to verify:

```sql
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
```

You should see both users with their profiles!

---

## Method 2: Using Registration Page (Alternative)

If you prefer, you can use your app's registration page:

### Create Admin Account:
1. Go to `http://localhost:3001/auth/v1/register`
2. Click **"Platform Admin"** tab
3. Fill in:
   - Full Name: `Admin User`
   - Email: `admin@test.com`
   - Password: `admin123`
   - Confirm Password: `admin123`
4. Submit

### Create Business Account:
1. Go to `http://localhost:3001/auth/v1/register`
2. Stay on **"Business Owner"** tab
3. Fill in:
   - Full Name: `Joe Coffee`
   - Email: `business@test.com`
   - Password: `business123`
   - Business Name: `Joe's Coffee Shop`
   - Business Type: `Coffee Shop`
   - Business Address: `123 Main Street, Downtown`
   - Business Phone: `555-0123`
4. Submit
5. Login as admin and approve the business

---

## Final Step: Test Login

### Test Admin Login:
```
URL: http://localhost:3001/auth/v1/login
Email: admin@test.com
Password: admin123
Expected: Redirect to /admin/dashboard
```

### Test Business Login:
```
URL: http://localhost:3001/auth/v1/login
Email: business@test.com
Password: business123
Expected: Redirect to /business/dashboard
```

---

## Troubleshooting

### "Email not confirmed" error?
- Make sure you checked **"Auto Confirm User"** when creating the user
- Or manually confirm in Supabase: Auth → Users → Click user → Click "Confirm user"

### "User profile not found" error?
- Make sure you ran the INSERT queries in Step 3
- Verify the UUIDs match between auth.users and public.admins

### Still can't login?
- Check Supabase logs in Dashboard → Logs
- Verify RLS policies are enabled
- Make sure your .env.local has correct Supabase credentials

---

## Login Credentials Summary

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| Admin | admin@test.com | admin123 | /admin/dashboard |
| Business | business@test.com | business123 | /business/dashboard |

---

**Recommended**: Use **Method 1 (Supabase Dashboard)** - it's faster and more reliable!
