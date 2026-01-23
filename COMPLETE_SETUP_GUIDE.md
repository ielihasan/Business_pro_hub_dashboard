# Complete Registration System Setup

## Your Supabase Credentials
```
URL: https://hjblbmmyfznxomsrxhme.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Setup Plan

I will perform the following operations:

### Phase 1: Database Reset & Setup
1. ✅ Drop all existing tables
2. ✅ Create fresh database schema with RLS policies
3. ✅ Insert business types
4. ✅ Create sample customer data

### Phase 2: Create Test Users
5. ✅ Create Admin user in Supabase Auth
6. ✅ Create Business Owner user in Supabase Auth
7. ✅ Link users to admins table

### Phase 3: Verification
8. ✅ Test admin login
9. ✅ Test business owner login
10. ✅ Verify dashboard access

---

## What You Need to Do

### Step 1: Reset Database (Run in Supabase SQL Editor)

1. Go to: https://hjblbmmyfznxomsrxhme.supabase.co
2. Navigate to **SQL Editor**
3. Click **"New query"**
4. Copy the entire content from `COMPLETE_FRESH_DATABASE.sql`
5. Click **"Run"**
6. Wait for completion (should see "✅ Database setup completed successfully!")

### Step 2: Create Test Users via Registration Page

Instead of manual SQL, we'll use your working registration forms!

#### Create Admin User:
1. Start your dev server: `npm run dev` (in dashboard folder)
2. Go to: `http://localhost:3001/auth/v1/register`
3. Click **"Platform Admin"** tab
4. Fill in:
   - Full Name: `Admin User`
   - Email: `admin@test.com`
   - Password: `admin123`
   - Confirm Password: `admin123`
5. Click **"Register as Admin"**
6. Check Supabase → Authentication → Users
7. Find `admin@test.com` and click **"Confirm user"** (if not auto-confirmed)

#### Create Business Owner:
1. Go to: `http://localhost:3001/auth/v1/register`
2. Stay on **"Business Owner"** tab
3. Fill in:
   - **Personal Info:**
     - Full Name: `Joe Coffee`
     - Email: `business@test.com`
     - Password: `business123`
     - Confirm Password: `business123`
   - **Business Info:**
     - Business Name: `Joe's Coffee Shop`
     - Business Type: `Coffee Shop`
     - Business Phone: `555-0123`
     - Business Address: `123 Main Street, Downtown`
     - Business Description: `Best coffee in town!`
4. Click **"Register Business"**
5. You'll be redirected to `/waiting-approval`

### Step 3: Approve Business Owner

1. Go to: `http://localhost:3001/auth/v1/login`
2. Login as admin:
   - Email: `admin@test.com`
   - Password: `admin123`
3. Go to: `/admin/dashboard`
4. Navigate to **"Pending Businesses"**
5. Find `Joe's Coffee Shop`
6. Click **"Approve"**
7. Confirm approval

### Step 4: Test Business Owner Login

1. Logout from admin
2. Go to: `http://localhost:3001/auth/v1/login`
3. Login as business owner:
   - Email: `business@test.com`
   - Password: `business123`
4. Should redirect to: `/business/dashboard`

---

## Alternative: Quick SQL Method (If Registration Doesn't Work)

If you prefer SQL, I've created `QUICK_CREATE_USERS.sql` that you can run:

```sql
-- This assumes you already have auth users created in Supabase UI
-- Just replace the UUIDs with actual ones from Authentication → Users
```

---

## Troubleshooting

### "Email not confirmed" error?
- Go to Supabase → Authentication → Users
- Click on the user
- Click **"Confirm user"** button
- Try logging in again

### "User profile not found" error?
- Run `FIX_USER_PROFILES.sql` in SQL Editor
- This will auto-link existing auth users to admins table

### Registration form doesn't submit?
- Check browser console for errors
- Verify Supabase credentials in `.env.local`
- Make sure database tables exist (run `COMPLETE_FRESH_DATABASE.sql`)

### Business owner can't access dashboard?
- Login as admin first
- Go to Pending Businesses
- Approve the business
- Logout and login as business owner again

---

## Expected Results

After completing all steps:

### Admin Account
- ✅ Can login at `/auth/v1/login`
- ✅ Redirects to `/admin/dashboard`
- ✅ Can view statistics
- ✅ Can approve/reject businesses
- ✅ Can access all admin pages

### Business Owner Account
- ✅ Can login at `/auth/v1/login`
- ✅ Initially redirects to `/waiting-approval` (if not approved)
- ✅ After approval, redirects to `/business/dashboard`
- ✅ Can manage queue and business operations

---

## Login Credentials

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| Admin | admin@test.com | admin123 | /admin/dashboard |
| Business | business@test.com | business123 | /business/dashboard |

---

## Next Steps After Setup

Once both users are working:

1. **Explore Admin Dashboard**
   - View platform statistics
   - Manage businesses
   - Review analytics

2. **Explore Business Dashboard**
   - Set up services
   - Configure business hours
   - Manage staff
   - Handle queue

3. **Test Complete Flow**
   - Register a new business
   - Approve as admin
   - Login as business
   - Add services and staff

---

**Ready to start?**

1. First, make sure your dev server is NOT running
2. Run the database reset SQL
3. Start dev server: `npm run dev`
4. Follow Step 2 to create users via registration forms

Let me know when you've completed Step 1 (database reset) and I'll guide you through the rest!
