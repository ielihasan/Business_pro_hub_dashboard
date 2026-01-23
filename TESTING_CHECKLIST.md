# ✅ Testing Checklist - Verify Your Setup

## Server Status: ✅ RUNNING
```
Local:   http://localhost:3001
Network: http://192.168.203.34:3001
```

---

## 🧪 Test 1: Admin Login

### Steps:
1. Open browser: http://localhost:3001/auth/v1/login
2. Enter credentials:
   ```
   Email: admin@test.com
   Password: admin123
   ```
3. Click "Login"

### Expected Results:
- ✅ No errors shown
- ✅ Toast message: "Welcome, Admin!"
- ✅ Redirects to: `/admin/dashboard`
- ✅ See dashboard with statistics
- ✅ See sidebar navigation (Pending Businesses, Approved Businesses, etc.)

### If It Fails:
- **"User profile not found"** → Run `AUTOMATED_USER_SETUP.sql` again
- **"Invalid credentials"** → Check Supabase Auth → Users → Verify user exists
- **"Email not confirmed"** → Supabase Auth → Click user → "Confirm user"

---

## 🧪 Test 2: Business Owner Login

### Steps:
1. Logout from admin (if logged in)
2. Go to: http://localhost:3001/auth/v1/login
3. Enter credentials:
   ```
   Email: business@test.com
   Password: business123
   ```
4. Click "Login"

### Expected Results:
- ✅ No errors shown
- ✅ Toast message: "Welcome back, Joe's Coffee Shop!"
- ✅ Redirects to: `/business/dashboard`
- ✅ See business dashboard

### If It Fails:
- **Redirects to `/waiting-approval`** → Business not approved yet
  - Solution: Login as admin → Approve business → Try again
- **"User profile not found"** → Run `AUTOMATED_USER_SETUP.sql` again
- **"Invalid credentials"** → Check Supabase Auth → Users → Verify user exists

---

## 🧪 Test 3: Admin Dashboard Features

### While logged in as Admin (admin@test.com):

1. **View Dashboard**
   - ✅ See total businesses count
   - ✅ See pending businesses count
   - ✅ See statistics cards

2. **Pending Businesses Page**
   - Go to: `/admin/businesses/pending`
   - ✅ Should see list (might be empty if no pending businesses)
   - ✅ Can approve/reject businesses

3. **Approved Businesses Page**
   - Go to: `/admin/businesses/approved`
   - ✅ Should see "Joe's Coffee Shop" if approved
   - ✅ Can view business details

4. **Navigation**
   - ✅ Sidebar works
   - ✅ Can navigate between pages
   - ✅ Logout works

---

## 🧪 Test 4: Business Dashboard Features

### While logged in as Business (business@test.com):

1. **View Dashboard**
   - ✅ See business name: "Joe's Coffee Shop"
   - ✅ See business statistics
   - ✅ Navigation sidebar present

2. **Business Pages** (Phase 4 - may be placeholders)
   - ✅ Can access `/business/dashboard`
   - ✅ Sidebar navigation works
   - ✅ Logout works

---

## 🧪 Test 5: Registration Flow (Optional)

### Test New Business Registration:

1. Logout from all accounts
2. Go to: http://localhost:3001/auth/v1/register
3. Stay on "Business Owner" tab
4. Fill in a new test business:
   ```
   Full Name: Test Owner
   Email: testbiz@test.com
   Password: test123
   Business Name: Test Bakery
   Business Type: Bakery
   Phone: 555-9999
   Address: 456 Test Street
   ```
5. Click "Register Business"

### Expected:
- ✅ Success message: "Business registration submitted!"
- ✅ Redirects to: `/waiting-approval`
- ✅ See waiting page with auto-refresh

### Then Test Approval:
1. Logout
2. Login as admin (admin@test.com / admin123)
3. Go to "Pending Businesses"
4. ✅ See "Test Bakery" in list
5. Click "Approve"
6. ✅ Business approved successfully
7. Logout
8. Login as testbiz@test.com / test123
9. ✅ Redirects to `/business/dashboard`

---

## 🧪 Test 6: Security & RLS

### Test Row Level Security:

1. While logged in as business owner
2. Try to access: http://localhost:3001/admin/dashboard
3. ✅ Should redirect to `/business/dashboard` or show error
4. ✅ Business owners can't access admin pages

---

## 📊 Verification Queries (Run in Supabase SQL Editor)

### Check Users Status:
```sql
SELECT
    u.id,
    u.email,
    u.email_confirmed_at,
    a.full_name,
    a.role,
    a.business_name,
    a.is_approved,
    CASE
        WHEN a.id IS NULL THEN '❌ No profile'
        WHEN u.email_confirmed_at IS NULL THEN '⚠️ Email not confirmed'
        WHEN a.is_approved = false THEN '⏳ Pending approval'
        ELSE '✅ Ready'
    END as status
FROM auth.users u
LEFT JOIN public.admins a ON u.id = a.id
WHERE u.email IN ('admin@test.com', 'business@test.com')
ORDER BY u.email;
```

### Check Business Types:
```sql
SELECT COUNT(*) as count, 'business_types' as table_name
FROM public.business_types
WHERE is_active = true;
-- Expected: 10 types
```

### Check Sample Customers:
```sql
SELECT COUNT(*) as count, 'sample_customers' as table_name
FROM public."User";
-- Expected: 5 customers
```

---

## ✅ Success Criteria

Your setup is complete when:

- [x] Dev server running on http://localhost:3001
- [ ] Admin can login and access `/admin/dashboard`
- [ ] Business can login and access `/business/dashboard`
- [ ] Registration form works for new businesses
- [ ] Admin can approve/reject businesses
- [ ] Business types load in registration dropdown
- [ ] No console errors in browser
- [ ] No RLS policy errors

---

## 🎯 What You Should Have Now

1. ✅ **Complete Database**
   - All tables created
   - RLS policies active
   - 10 business types
   - 5 sample customers

2. ✅ **Admin Account**
   - Email: admin@test.com
   - Password: admin123
   - Access: /admin/dashboard

3. ✅ **Business Account**
   - Email: business@test.com
   - Password: business123
   - Business: Joe's Coffee Shop
   - Access: /business/dashboard

4. ✅ **Working Features**
   - Registration for both roles
   - Login with role-based routing
   - Admin approval workflow
   - Dashboard access control

---

## 🐛 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "User profile not found" | Run `AUTOMATED_USER_SETUP.sql` |
| "Email not confirmed" | Confirm user in Supabase UI |
| "Business not approved" | Login as admin → Approve |
| Empty dropdown in registration | Run `COMPLETE_FRESH_DATABASE.sql` |
| Can't access admin pages | Check role in admins table |

---

## 🚀 Next Steps After Testing

Once all tests pass:

1. **Explore the codebase**
   - Review admin dashboard components
   - Check business dashboard structure
   - Understand RLS policies

2. **Start Phase 4 Development**
   - Build business queue management
   - Add service configuration
   - Implement staff management

3. **Customize**
   - Update branding
   - Modify business types
   - Add more features

---

**Ready to test?**

Start with Test 1 (Admin Login) and let me know if you encounter any issues!

Current server: ✅ Running on http://localhost:3001
