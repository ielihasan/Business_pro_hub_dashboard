# Multiple Roles Per Email - Setup Guide

## Overview
This guide explains how to allow a single email address to register for both **businessman** (business_owner) and **admin** accounts.

## Problem
The original system prevented the same email from having multiple roles because:
1. Supabase `auth.users` table has unique email constraint
2. The `admins` table used `id` as primary key (one record per user)

## Solution
We've implemented changes to allow one user (email) to have multiple role records:

### Database Changes

**Run this SQL migration in Supabase SQL Editor:**
```sql
-- File: database/allow_multiple_roles.sql
```

This migration:
1. Removes the primary key constraint on `id` column
2. Adds a new `record_id` auto-incrementing primary key
3. Creates unique constraint on `(id, role)` - prevents duplicate roles but allows different roles
4. Adds indexes for performance

### Application Logic Changes

**1. Registration (`src/actions/auth/register.ts`)**
- Now checks if user already exists before creating auth account
- If user exists, reuses the same user ID
- Prevents duplicate applications for the same role
- Allows creating applications for different roles

**2. Login (`src/app/(main)/auth/_components/login-form.tsx`)**
- Queries for ALL admin records instead of single record
- If user has multiple roles, redirects to role selection page
- If user has single role, proceeds with normal login

**3. Role Selection (`src/app/(main)/auth/select-role/page.tsx`)**
- New page that shows all roles a user has
- User selects which role to use for this session
- Displays different cards for admin vs business roles

**4. OAuth Callback (`src/app/(main)/auth/oauth-callback/page.tsx`)**
- Checks for existing roles before creating new applications
- Allows same Google account to register as both admin and business
- Prevents duplicate applications for roles already registered

## How It Works

### Registration Flow
1. User registers with email (e.g., user@example.com) as **Business Owner**
   - If email doesn't exist: Creates new auth user
   - If email exists: Reuses existing user ID
   - Creates application in `business_applications` table
   - Application type determined by business_type field

2. Same user registers with same email as **Admin**
   - Finds existing auth user by email
   - Checks if they already have admin application (prevents duplicate)
   - Creates new admin application with `business_type: "Admin"`
   - Both applications exist for the same user ID

### Approval Flow
1. Admin approves business application
   - Creates record in `admins` table with `role: "business_owner"`
   - User ID: abc-123, Role: business_owner

2. Admin approves admin application
   - Creates another record in `admins` table with `role: "admin"`
   - User ID: abc-123, Role: admin

Now the user has TWO records in `admins` table:
```
record_id | id (user_id) | role           | business_name
----------|--------------|----------------|---------------
1         | abc-123      | business_owner | My Coffee Shop
2         | abc-123      | admin          | NULL
```

### Login Flow
1. User logs in with user@example.com
2. System queries `admins` table for all records with their user ID
3. Finds 2 records (admin + business_owner)
4. Redirects to role selection page
5. User chooses which role to use
6. Redirected to appropriate dashboard

## Testing

### Test Scenario 1: Register as Business, Then as Admin
1. Go to registration page
2. Click "Business Owner" tab
3. Fill form with email: test@example.com
4. Submit - should create business application
5. Go to registration page again
6. Click "Platform Admin" tab
7. Fill form with SAME email: test@example.com
8. Submit - should create admin application (no "email already registered" error)
9. Admin approves both applications
10. Login with test@example.com
11. Should see role selection page with both options

### Test Scenario 2: Google OAuth for Both Roles
1. Click "Continue with Google" on Business Owner tab
2. Complete Google sign-in
3. Fill business information form
4. Submit application
5. Sign out
6. Go to registration page
7. Click "Continue with Google" on Platform Admin tab
8. Sign in with SAME Google account
9. Should create admin application (no form needed for admin)
10. Admin approves both
11. Login - should see role selection

## Database Schema

### Before Migration
```sql
CREATE TABLE admins (
  id UUID PRIMARY KEY,  -- One record per user
  role TEXT,
  ...
);
```

### After Migration
```sql
CREATE TABLE admins (
  record_id SERIAL PRIMARY KEY,  -- Auto-incrementing
  id UUID,  -- Can appear multiple times
  role TEXT,
  ...
  UNIQUE (id, role)  -- Same user can't have duplicate roles
);
```

## Important Notes

1. **Unique Constraint**: The `(id, role)` constraint ensures:
   - ✅ One user CAN have both admin AND business_owner roles
   - ❌ One user CANNOT have two admin roles
   - ❌ One user CANNOT have two business_owner roles

2. **Application Tracking**: Applications are tracked separately:
   - Admin applications: `business_type = "Admin"`
   - Business applications: `business_type = actual business type (e.g., "Restaurant")`

3. **Password**: Same email = same password for both roles
   - User logs in once, then selects role
   - Not two separate accounts with different passwords

4. **Approval**: Each role requires separate approval:
   - Business application must be approved
   - Admin application must be approved
   - User only gets access to approved roles

## Files Modified

1. `database/allow_multiple_roles.sql` - Database migration
2. `src/actions/auth/register.ts` - Registration logic
3. `src/app/(main)/auth/_components/login-form.tsx` - Login logic
4. `src/app/(main)/auth/select-role/page.tsx` - NEW: Role selection page
5. `src/app/(main)/auth/oauth-callback/page.tsx` - OAuth handling

## Migration Steps

1. **Run Database Migration**
   ```sql
   -- Run database/allow_multiple_roles.sql in Supabase SQL Editor
   ```

2. **Deploy Application Changes**
   - All code changes are already in place
   - No additional deployment needed

3. **Test the Flow**
   - Follow test scenarios above
   - Verify role selection works
   - Verify both dashboards are accessible

## Troubleshooting

**Error: "You already have a pending application for this role"**
- User already submitted an application for that specific role
- Wait for approval or contact admin

**Error: "You already have an approved account for this role"**
- User is already approved for that role
- Just login and select that role

**Role selection page doesn't show multiple roles**
- Check if both applications were approved
- Check `admins` table for multiple records with same user ID

**Can't find role selection page**
- Verify route exists: `/auth/select-role`
- Check that user actually has multiple approved roles
