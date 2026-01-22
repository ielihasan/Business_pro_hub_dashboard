# 🔐 Sample Login Credentials

## Test Accounts for Smart Business Support Platform

---

## 👨‍💼 **Admin Account**

Use this to access the Admin Dashboard:

```
Email:    admin@test.com
Password: admin123
```

**Access:**
- Admin Dashboard at `/admin/dashboard`
- Can approve/reject business registrations
- View all platform statistics
- Manage all businesses and users

**Direct Login URL:**
```
http://localhost:3001/auth/v1/login
```

---

## 🏪 **Business Owner Accounts**

### **Option 1: Create Your Own**

1. Go to: `http://localhost:3001/auth/v1/register`
2. Stay on "Business Owner" tab (default)
3. Fill in:
   - **Personal Info:**
     - Full Name: Your Name
     - Email: business@test.com
     - Password: business123
     - Confirm Password: business123

   - **Business Info:**
     - Business Name: Test Coffee Shop
     - Business Type: Coffee Shop (select from dropdown)
     - Business Address: 123 Main Street, City
     - Business Phone: 555-1234
     - Business Description: (optional)

4. Submit → Redirected to `/waiting-approval`
5. Login as **admin** and approve the business
6. Logout and login as business owner
7. Access Business Dashboard at `/business/dashboard`

---

## 🧪 **Testing Workflow**

### **Test 1: Admin Login**
```bash
1. Go to http://localhost:3001/auth/v1/login
2. Enter:
   Email: admin@test.com
   Password: admin123
3. Click "Login"
4. Should redirect to /admin/dashboard
5. See statistics and navigation sidebar
```

### **Test 2: Business Registration & Approval**
```bash
1. Go to http://localhost:3001/auth/v1/register
2. Register a new business (see "Option 1" above)
3. Submit → See waiting approval page
4. Open new tab, login as admin
5. Go to "Pending Businesses"
6. See your business registration
7. Click "Approve"
8. Confirm approval
9. Go back to business owner tab
10. Logout and login with business credentials
11. Should redirect to /business/dashboard (Phase 4)
```

### **Test 3: Business Rejection**
```bash
1. Register another test business
2. Login as admin
3. Go to "Pending Businesses"
4. Click "Reject" on the business
5. Enter rejection reason: "Incomplete information"
6. Confirm rejection
7. Business removed from pending list
```

---

## 📊 **Current Database State**

After running `COMPLETE_FRESH_DATABASE.sql`, you have:

- ✅ **1 Admin Account** (if you created one)
- ✅ **10 Business Types** (Coffee Shop, Print Shop, Clinic, etc.)
- ✅ **5 Sample Customers** in the User table
- ✅ **All Required Tables** (admins, queues, orders, services, etc.)

---

## 🔑 **Creating Admin Account**

If you haven't created the admin account yet:

### **Method 1: Via Registration Page**
```bash
1. Go to http://localhost:3001/auth/v1/register
2. Click "Platform Admin" tab
3. Fill in:
   Full Name: Admin User
   Email: admin@test.com
   Password: admin123
   Confirm Password: admin123
4. Submit
5. Confirm email (check Supabase email settings)
6. Login with credentials above
```

### **Method 2: Via Supabase Dashboard**
```sql
-- Run in Supabase SQL Editor after creating auth user

-- First create auth user in Supabase Auth UI
-- Then insert admin record:

INSERT INTO public.admins (id, full_name, email, role, is_approved, created_at)
VALUES (
  'YOUR_AUTH_USER_ID_HERE',
  'Admin User',
  'admin@test.com',
  'admin',
  true,
  NOW()
);
```

---

## 🚀 **Quick Start Testing**

### **Fastest Way to Test Everything:**

1. **Create Admin Account:**
   ```
   Register → Platform Admin tab
   Email: admin@test.com
   Password: admin123
   ```

2. **Login as Admin:**
   ```
   Login → See dashboard with stats
   Navigate through sidebar
   ```

3. **Register Business:**
   ```
   Logout → Register → Business Owner tab
   Email: coffee@test.com
   Password: coffee123
   Business: "Joe's Coffee Shop"
   Type: Coffee Shop
   ```

4. **Approve Business:**
   ```
   Login as admin
   Pending Businesses → Approve "Joe's Coffee Shop"
   ```

5. **Login as Business:**
   ```
   Logout → Login as coffee@test.com
   Should see business dashboard (Phase 4 - coming next)
   ```

---

## 📞 **Troubleshooting**

### **Can't Login?**
- Make sure you confirmed your email in Supabase
- Check Supabase Authentication tab for user
- Verify email/password are correct

### **Business Owner Can't Access Dashboard?**
- Check if business is approved in database
- Login as admin and approve the business
- Logout and login again as business owner

### **Admin Not Redirecting to Dashboard?**
- Verify `role = 'admin'` in admins table
- Check `is_approved = true` in admins table
- Clear browser cache and cookies

---

## 🎯 **What Each Role Can Access**

### **Admin:**
- ✅ `/admin/dashboard` - Overview and statistics
- ✅ `/admin/businesses/pending` - Approve/reject businesses
- ✅ `/admin/businesses/approved` - View all businesses
- ✅ `/admin/users` - User management (placeholder)
- ✅ `/admin/analytics` - Platform analytics (placeholder)
- ✅ `/admin/settings` - Platform settings (placeholder)

### **Business Owner (Approved):**
- ✅ `/business/dashboard` - Business overview (Phase 4)
- ✅ `/business/queue/active` - Queue management (Phase 4)
- ✅ `/business/orders` - Order processing (Phase 4)
- ✅ `/business/staff` - Staff management (Phase 4)
- ✅ `/business/customers` - Customer database (Phase 4)
- ✅ `/business/analytics` - Business analytics (Phase 4)
- ✅ `/business/settings` - Business settings (Phase 4)

### **Business Owner (Not Approved):**
- ❌ No dashboard access
- ✅ Only `/waiting-approval` page
- ⏱️ Auto-refreshes every 30 seconds
- 🔔 Redirects to dashboard once approved

---

## ✅ **Ready to Test!**

Use the credentials above to test the complete authentication and admin dashboard system.

**Questions?** Let me know if you need help creating accounts or testing specific features!
