# Simple User Setup - Step by Step

Follow these exact steps to create test users:

---

## Step 1: Check if users already exist

1. Open **Supabase Dashboard**
2. Go to **SQL Editor**
3. Run this query:

```sql
SELECT id, email, email_confirmed_at
FROM auth.users
WHERE email IN ('admin@test.com', 'business@test.com');
```

**If you see results**: Users already exist! Skip to Step 3.
**If empty**: Continue to Step 2.

---

## Step 2: Create users in Supabase Auth UI

### Create Admin User:

1. Go to **Authentication** → **Users** in Supabase Dashboard
2. Click **"Add user"** (top right)
3. Click **"Create new user"**
4. Enter:
   ```
   Email: admin@test.com
   Password: admin123
   ```
5. ✅ **IMPORTANT**: Check the box "Auto Confirm User"
6. Click **"Create user"**
7. You'll see the new user in the list - **DO NOT close this page yet!**

### Create Business User:

8. Click **"Add user"** again
9. Click **"Create new user"**
10. Enter:
    ```
    Email: business@test.com
    Password: business123
    ```
11. ✅ **IMPORTANT**: Check the box "Auto Confirm User"
12. Click **"Create user"**

---

## Step 3: Get the User IDs

1. Still in **Authentication** → **Users**
2. You should see both users in the list
3. Click on **admin@test.com** - a panel will open on the right
4. Look for "UID" or "User UID" - it's a long string like `a1b2c3d4-e5f6-...`
5. **Copy this UUID** and save it somewhere (notepad)
6. Go back and click on **business@test.com**
7. **Copy this UUID** too

---

## Step 4: Add profiles to database

1. Go to **SQL Editor** in Supabase
2. Copy and paste the query below
3. **Replace the two UUID placeholders** with the UUIDs you copied in Step 3
4. Run the query

```sql
-- ============================================
-- Add Admin Profile
-- ============================================
INSERT INTO public.admins (
    id,
    full_name,
    email,
    role,
    is_approved,
    created_at,
    updated_at
) VALUES (
    'REPLACE_WITH_ADMIN_UUID'::UUID,  -- ← Paste admin@test.com UUID here
    'Admin User',
    'admin@test.com',
    'admin',
    true,
    NOW(),
    NOW()
);

-- ============================================
-- Add Business Owner Profile
-- ============================================
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
    'REPLACE_WITH_BUSINESS_UUID'::UUID,  -- ← Paste business@test.com UUID here
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

**Expected result**: ✅ Success. 2 rows affected.

---

## Step 5: Verify everything works

Run this query in SQL Editor:

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
JOIN public.admins a ON u.id = a.id
WHERE u.email IN ('admin@test.com', 'business@test.com')
ORDER BY a.role;
```

You should see 2 rows with all information filled in!

---

## Step 6: Test Login

1. Open your app: `http://localhost:3001/auth/v1/login`

### Test Admin:
```
Email: admin@test.com
Password: admin123
```
Should redirect to: `/admin/dashboard`

### Test Business:
```
Email: business@test.com
Password: business123
```
Should redirect to: `/business/dashboard`

---

## Troubleshooting

### "Invalid UUID" error when running Step 4?
- You need to replace `REPLACE_WITH_ADMIN_UUID` with the actual UUID
- UUIDs look like: `a1b2c3d4-e5f6-1234-5678-abcdef123456`
- Make sure you don't include any extra quotes or spaces

### "User not found" when logging in?
- Go back to Step 5 and run the verification query
- Make sure both users show `email_confirmed_at` is not null
- If null, go to Auth → Users → Click user → Click "Confirm user"

### "User profile not found" error?
- Step 4 didn't complete successfully
- Check if records exist: `SELECT * FROM public.admins WHERE email IN ('admin@test.com', 'business@test.com');`
- If empty, run Step 4 again with correct UUIDs

---

## Example (with fake UUIDs)

Here's what Step 4 should look like after you replace the placeholders:

```sql
-- EXAMPLE ONLY - Use your actual UUIDs!
INSERT INTO public.admins (id, full_name, email, role, is_approved, created_at, updated_at)
VALUES ('a1b2c3d4-e5f6-1234-5678-abcdef123456'::UUID, 'Admin User', 'admin@test.com', 'admin', true, NOW(), NOW());

INSERT INTO public.admins (id, full_name, email, role, business_name, business_type, business_address, business_phone, business_description, is_approved, approved_at, created_at, updated_at)
VALUES ('b2c3d4e5-f6a7-5678-9012-bcdef234567'::UUID, 'Joe Coffee', 'business@test.com', 'business_owner', 'Joe''s Coffee Shop', 'Coffee Shop', '123 Main Street, Downtown', '555-0123', 'Best coffee in town!', true, NOW(), NOW(), NOW());
```

Notice the UUIDs are real UUIDs, not placeholders!

---

**Need help?** Let me know which step you're stuck on!
