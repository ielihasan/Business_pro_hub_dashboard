# Fix "duplicate key value violates unique constraint" Errors

## Problem
When trying to approve the second role for the same user (e.g., approving admin after business is already approved), you get one of these errors:
```
duplicate key value violates unique constraint "admins_pkey"
duplicate key value violates unique constraint "admins_email_key"
```

## Root Cause
The `admins` table has multiple unique constraints that prevent the same user from having multiple roles:
1. `admins_pkey` - Primary key on `id` column (only one record per user ID)
2. `admins_email_key` - Unique constraint on `email` column (only one record per email)

## Solution
Run the database migration to restructure the table to support multiple roles per user.

## Step-by-Step Fix

### Step 1: Check Current Structure (Optional)
Open Supabase SQL Editor and run:
```sql
-- File: database/check_admins_structure.sql
```
This shows you the current table structure before making changes.

### Step 2: Run the Migration
In Supabase SQL Editor, run:
```sql
-- File: database/fix_email_constraint.sql
```

Copy and paste the entire contents of this file into the SQL Editor and execute it.

**This migration will:**
- Remove unique constraint on `email` column
- Remove primary key constraint on `id` column
- Add new `record_id` auto-incrementing primary key
- Add unique constraint on `(id, role)` to prevent duplicate roles

### Step 3: Verify the Migration
After running the migration, you should see:
```
✅ Migration completed successfully!
✅ Removed unique constraint on email column
✅ The admins table now supports multiple roles per email
✅ Same email can have both admin AND business_owner roles

New structure:
- Primary Key: record_id (auto-increment)
- Unique Constraint: (id, role) - prevents duplicate roles
- No constraint on email - allows multiple roles
```

### Step 4: Test Approving Both Roles
1. Go to Admin Dashboard → Pending Approvals
2. You should see both applications for the same user:
   - Application 1: Business Type = "My Coffee Shop" (or whatever business)
   - Application 2: Business Type = "Admin"
3. Approve the first one (e.g., Business) - should work ✅
4. Approve the second one (Admin) - should now work ✅ (no more error)

### Step 5: Verify Multiple Roles
Run this query in Supabase SQL Editor to see users with multiple roles:
```sql
SELECT id, role, full_name, business_name
FROM admins
ORDER BY id, role;
```

You should see something like:
```
id          | role           | full_name    | business_name
------------|----------------|--------------|---------------
abc-123     | admin          | John Doe     | NULL
abc-123     | business_owner | John Doe     | My Coffee Shop
```

## What the Migration Does

### Before Migration:
```sql
CREATE TABLE admins (
  id UUID PRIMARY KEY,           -- ❌ Only one record per user ID
  email TEXT UNIQUE,             -- ❌ Only one record per email
  role TEXT,
  ...
);
```

### After Migration:
```sql
CREATE TABLE admins (
  record_id SERIAL PRIMARY KEY,  -- ✅ Auto-incrementing ID
  id UUID,                        -- ✅ Can appear multiple times
  email TEXT,                     -- ✅ Can appear multiple times
  role TEXT,
  ...
  CONSTRAINT unique_user_role UNIQUE (id, role)  -- ✅ Prevents duplicate roles
);
```

## How It Works Now

### Constraint: `unique_user_role (id, role)`
This ensures:
- ✅ Same user CAN have: admin + business_owner (different roles)
- ❌ Same user CANNOT have: admin + admin (duplicate role)
- ❌ Same user CANNOT have: business_owner + business_owner (duplicate role)

### Example Data After Migration:
```sql
record_id | id      | email               | role           | business_name
----------|---------|---------------------|----------------|---------------
1         | abc-123 | user@example.com    | business_owner | My Coffee Shop
2         | abc-123 | user@example.com    | admin          | NULL
3         | def-456 | admin@test.com      | business_owner | Pizza Palace
4         | ghi-789 | multi@example.com   | admin          | NULL
5         | ghi-789 | multi@example.com   | business_owner | Tech Store
```

Note: Same `id` AND same `email` can appear multiple times! ✅
- User `abc-123` (user@example.com) has 2 roles ✅
- User `def-456` (admin@test.com) has 1 role ✅
- User `ghi-789` (multi@example.com) has 2 roles ✅

## Testing After Migration

### Test 1: Approve Both Roles for Same Email
1. Register with email `test@example.com` as Business Owner
2. Register with SAME email as Admin
3. Approve Business application - should work ✅
4. Approve Admin application - should work ✅ (no error)
5. Query admins table - should see 2 records with same `id`

### Test 2: Login with Multiple Roles
1. Login with `test@example.com`
2. Should see Role Selection page
3. Shows 2 cards:
   - [Platform Admin]
   - [Business Name]
4. Click on one - redirects to appropriate dashboard

### Test 3: Prevent Duplicate Roles
1. Try to approve same Business application twice
2. Should fail with: `duplicate key value violates unique constraint "unique_user_role"`
3. This is expected - prevents duplicate roles

## Rollback (If Needed)

If you need to rollback the changes:
```sql
-- WARNING: This will delete users with multiple roles!
-- Only run if you absolutely need to revert

-- Remove the new primary key
ALTER TABLE admins DROP CONSTRAINT admins_pkey;

-- Drop the record_id column
ALTER TABLE admins DROP COLUMN record_id;

-- Restore old primary key (will fail if users have multiple roles)
ALTER TABLE admins ADD PRIMARY KEY (id);

-- Remove unique constraint
ALTER TABLE admins DROP CONSTRAINT unique_user_role;
```

## Troubleshooting

### Error: "cannot drop constraint admins_pkey because other objects depend on it"
**Solution:** There might be foreign key references. Run:
```sql
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'admins';
```

Drop those foreign keys first, then run the migration.

### Error: "column record_id already exists"
**Solution:** The migration already ran. Check:
```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'admins' AND column_name = 'record_id';
```

If it exists, the migration is complete.

### Users still can't approve second role
**Solution:** Check if the unique constraint exists:
```sql
SELECT constraint_name
FROM information_schema.table_constraints
WHERE table_name = 'admins' AND constraint_name = 'unique_user_role';
```

If it doesn't exist, run:
```sql
ALTER TABLE admins ADD CONSTRAINT unique_user_role UNIQUE (id, role);
```

## Summary

1. **Run Migration:** `database/fix_email_constraint.sql`
2. **Test Approval:** Approve both Business and Admin for same email
3. **Test Login:** Login should show role selection
4. **Verify Data:** Check admins table for multiple records per email

After running the migration, you'll be able to approve both applications for the same user/email without errors!

## Important Notes

The migration removes BOTH constraints:
- ❌ No more `admins_pkey` on `id`
- ❌ No more `admins_email_key` on `email`
- ✅ New primary key: `record_id` (auto-increment)
- ✅ New unique constraint: `(id, role)` - prevents duplicate roles only

This allows the same email to have multiple roles while preventing duplicate role assignments.
