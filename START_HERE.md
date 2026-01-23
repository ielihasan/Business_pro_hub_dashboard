# 🚀 START HERE - Complete Setup in 10 Minutes

## Your Supabase Project
**URL**: https://hjblbmmyfznxomsrxhme.supabase.co

---

## ⚡ Quick Setup (3 Steps)

### STEP 1: Reset Database (2 minutes)

1. Open your Supabase Dashboard: https://hjblbmmyfznxomsrxhme.supabase.co
2. Go to **SQL Editor** (left sidebar)
3. Click **"New query"**
4. Copy ALL content from `COMPLETE_FRESH_DATABASE.sql`
5. Paste and click **"Run"**
6. Wait for: ✅ "Database setup completed successfully!"

**What this does**: Creates all tables, RLS policies, business types, and sample data.

---

### STEP 2: Create Test Users (3 minutes)

#### Option A: Via Supabase UI (Recommended - Faster)

1. In Supabase Dashboard, go to **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**

**Create Admin User:**
```
Email: admin@test.com
Password: admin123
✅ Check "Auto Confirm User"
```
Click "Create user"

**Create Business User:**
```
Email: business@test.com
Password: business123
✅ Check "Auto Confirm User"
```
Click "Create user"

3. Go back to **SQL Editor**
4. Copy ALL content from `AUTOMATED_USER_SETUP.sql`
5. Paste and click **"Run"**
6. You should see: ✅ Created profiles for both users

#### Option B: Via Registration Forms (Takes longer)

1. Start dev server: `cd dashboard && npm run dev`
2. Go to: http://localhost:3001/auth/v1/register
3. Register admin and business accounts manually
4. Confirm emails in Supabase UI if needed

---

### STEP 3: Test Login (2 minutes)

1. Go to: http://localhost:3001/auth/v1/login

**Test Admin:**
```
Email: admin@test.com
Password: admin123
```
Should redirect to: `/admin/dashboard` ✅

**Test Business:**
```
Email: business@test.com
Password: business123
```
Should redirect to: `/business/dashboard` ✅

---

## 🎯 That's It!

You now have:
- ✅ Complete database with all tables
- ✅ Admin account ready
- ✅ Business account ready and approved
- ✅ Registration system working
- ✅ Role-based authentication working

---

## 🐛 Troubleshooting

### "User profile not found"
**Fix**: Run `AUTOMATED_USER_SETUP.sql` again in SQL Editor

### "Email not confirmed"
**Fix**: Go to Authentication → Users → Click user → "Confirm user"

### "Business not approved"
**Fix**: Login as admin → Go to Pending Businesses → Approve

### Can't login at all?
**Fix**: Run this in SQL Editor:
```sql
-- Verify users exist
SELECT u.id, u.email, a.role, a.is_approved
FROM auth.users u
LEFT JOIN public.admins a ON u.id = a.id
WHERE u.email IN ('admin@test.com', 'business@test.com');
```

If you see NULL values, run `AUTOMATED_USER_SETUP.sql`

---

## 📁 Files Reference

- `COMPLETE_FRESH_DATABASE.sql` - Database reset script (Step 1)
- `AUTOMATED_USER_SETUP.sql` - Auto-create user profiles (Step 2)
- `COMPLETE_SETUP_GUIDE.md` - Detailed documentation
- `FIX_USER_PROFILES.sql` - Quick fix for missing profiles
- `CHECK_EXISTING_USERS.sql` - Diagnostic queries

---

## 🔐 Login Credentials

| Role | Email | Password | Dashboard |
|------|-------|----------|-----------|
| **Admin** | admin@test.com | admin123 | /admin/dashboard |
| **Business** | business@test.com | business123 | /business/dashboard |

---

## ✨ What to Do Next

1. **Explore Admin Dashboard**
   - View statistics
   - Manage businesses
   - Review pending approvals

2. **Explore Business Dashboard**
   - Set up services
   - Configure hours
   - Manage staff

3. **Test Registration Flow**
   - Register new business
   - Approve as admin
   - Login as business

---

**Need help?** Let me know which step you're stuck on!

**Quick Links:**
- Supabase Dashboard: https://hjblbmmyfznxomsrxhme.supabase.co
- SQL Editor: https://hjblbmmyfznxomsrxhme.supabase.co/project/_/sql
- Auth Users: https://hjblbmmyfznxomsrxhme.supabase.co/project/_/auth/users
- Local App: http://localhost:3001
