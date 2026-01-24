# Google OAuth Login Setup Guide

## Overview
This guide explains the Google OAuth login flow and how it handles users with multiple roles (admin + business owner).

## Changes Made

### 1. Created Login Callback Handler
**File:** `src/app/(main)/auth/login-callback/page.tsx`

This page handles the OAuth callback from Google and:
- Checks if the user exists in the `admins` table
- If user has **multiple roles** (both admin and business_owner), redirects to role selection page
- If user has **single role**, redirects to appropriate dashboard
- If user has **pending applications**, redirects to waiting page
- If user **not registered**, prompts them to register first

### 2. Updated Login Pages
**Files:**
- `src/app/(main)/auth/v1/login/page.tsx`
- `src/app/(main)/auth/v2/login/page.tsx`

Changed redirect URL from `/dashboard` to `/auth/login-callback`

### 3. Role Selection Page
**File:** `src/app/(main)/auth/select-role/page.tsx` (already created)

Shows cards for each role when user has multiple roles approved.

## OAuth Flow Diagrams

### Scenario 1: User with Multiple Roles (Admin + Business)

```
User clicks "Continue with Google"
         ↓
Google Sign-In
         ↓
Redirect to: /auth/login-callback
         ↓
Check admins table for user_id
         ↓
Found 2 records:
  - id: abc-123, role: admin
  - id: abc-123, role: business_owner
         ↓
Store roles in sessionStorage
         ↓
Redirect to: /auth/select-role
         ↓
User sees 2 cards:
  [Platform Admin] [My Coffee Shop]
         ↓
User clicks "Platform Admin"
         ↓
Redirect to: /admin/dashboard
```

### Scenario 2: User with Single Role (Business Only)

```
User clicks "Continue with Google"
         ↓
Google Sign-In
         ↓
Redirect to: /auth/login-callback
         ↓
Check admins table for user_id
         ↓
Found 1 record:
  - id: abc-123, role: business_owner
         ↓
Redirect to: /business/dashboard
```

### Scenario 3: User with Pending Application

```
User clicks "Continue with Google"
         ↓
Google Sign-In
         ↓
Redirect to: /auth/login-callback
         ↓
Check admins table → Not found
         ↓
Check business_applications table
         ↓
Found application:
  - business_type: "Admin"
  - is_approved: false
         ↓
Redirect to: /auth/waiting-approval-admin
```

### Scenario 4: User Not Registered

```
User clicks "Continue with Google"
         ↓
Google Sign-In
         ↓
Redirect to: /auth/login-callback
         ↓
Check admins table → Not found
Check applications table → Not found
         ↓
Show error: "No account found"
Sign out user
         ↓
Redirect to: /auth/v1/register
```

## Supabase Configuration

### Required Redirect URLs

Add these URLs to your Supabase project:

1. Go to Supabase Dashboard
2. Navigate to: Authentication → URL Configuration
3. Add to "Redirect URLs":
   ```
   http://localhost:3001/auth/login-callback
   http://localhost:3001/auth/oauth-callback
   https://your-production-domain.com/auth/login-callback
   https://your-production-domain.com/auth/oauth-callback
   ```

### Google OAuth Provider Setup

1. In Supabase Dashboard: Authentication → Providers
2. Enable "Google" provider
3. Configure:
   - Client ID: (from Google Cloud Console)
   - Client Secret: (from Google Cloud Console)

## Testing

### Test 1: New User Login
1. Click "Continue with Google" on login page
2. Sign in with Google account that's NOT registered
3. Should see: "No account found. Please register first."
4. Should redirect to registration page

### Test 2: Single Role User
1. Register as Business Owner and get approved
2. Click "Continue with Google" on login page
3. Sign in with same Google account
4. Should redirect directly to Business Dashboard

### Test 3: Multiple Roles User
1. Register as Business Owner → Get approved
2. Register as Admin with SAME email → Get approved
3. Click "Continue with Google" on login page
4. Sign in with that Google account
5. Should see Role Selection page with 2 options
6. Click on one → redirects to appropriate dashboard

### Test 4: Pending Application
1. Register as Business Owner (not yet approved)
2. Click "Continue with Google" on login page
3. Sign in with same Google account
4. Should see: "Your business application is awaiting approval"
5. Should redirect to waiting page

## Troubleshooting

### Issue: "Redirect URL not allowed"
**Solution:** Add the callback URL to Supabase allowed redirect URLs
```
http://localhost:3001/auth/login-callback
```

### Issue: Still redirects to /dashboard/default#
**Problem:** Old redirect URL still cached
**Solution:**
1. Clear browser cache
2. Sign out completely from Google
3. Try again

### Issue: Role selection page doesn't show
**Problem:** User doesn't have multiple approved roles
**Solution:**
1. Check `admins` table - should have 2+ records with same `id`
2. Ensure `record_id` column exists (from migration)
3. Ensure both applications are approved

### Issue: "No account found" even though registered
**Problem:** Database migration not run yet
**Solution:**
1. Run `database/allow_multiple_roles.sql` in Supabase SQL Editor
2. This creates the `record_id` primary key and allows multiple roles

## Important Notes

1. **Registration vs Login:**
   - Registration OAuth: `/auth/oauth-callback` - for NEW registrations
   - Login OAuth: `/auth/login-callback` - for existing users logging in

2. **Role Selection:**
   - Only shown when user has 2+ approved roles
   - Uses sessionStorage to pass role data
   - User must choose role each time they log in

3. **Security:**
   - Google OAuth tokens are handled by Supabase
   - User can only access dashboards for approved roles
   - Pending applications redirect to waiting pages

## Files Modified Summary

1. ✅ `src/app/(main)/auth/login-callback/page.tsx` - NEW: Login OAuth handler
2. ✅ `src/app/(main)/auth/select-role/page.tsx` - NEW: Role selection UI
3. ✅ `src/app/(main)/auth/v1/login/page.tsx` - Updated redirect URL
4. ✅ `src/app/(main)/auth/v2/login/page.tsx` - Updated redirect URL
5. ✅ `src/app/(main)/auth/oauth-callback/page.tsx` - Registration OAuth handler
6. ✅ `src/actions/auth/register.ts` - Allows multiple roles
7. ✅ `src/app/(main)/auth/_components/login-form.tsx` - Handles multiple roles
8. ✅ `database/allow_multiple_roles.sql` - Database migration

## Next Steps

1. **Run Database Migration:**
   ```sql
   -- Execute database/allow_multiple_roles.sql in Supabase SQL Editor
   ```

2. **Configure Supabase:**
   - Add redirect URLs to Supabase project
   - Verify Google OAuth provider is enabled

3. **Test All Scenarios:**
   - New user login (should ask to register)
   - Single role login (direct to dashboard)
   - Multiple roles login (show selection)
   - Pending application (show waiting page)

4. **Deploy to Production:**
   - Update redirect URLs with production domain
   - Test OAuth flow in production environment
