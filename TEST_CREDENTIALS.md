# 🔑 Test Credentials & Authentication Guide

## ⚠️ Important Authentication Notes

### Sample Users vs Admin Users

**Sample Users (Customers):**
- The 5 sample users in the `User` table are **NOT authenticated users**
- They represent **customers/end-users** in the queue management system
- They do **NOT have login credentials**
- They are used for **CRM and conversation data only**

**Admin Users:**
- Admin users are created through **Supabase Authentication**
- They must **register through the app** at `/auth/v1/register`
- Their data syncs to the `admins` table automatically
- These are the users who **login to the dashboard**

---

## 🎯 How Authentication Works

### For Dashboard Access (Admin Users)

```
1. Visit: http://localhost:3001/auth/v1/register
2. Fill in registration form:
   - Full Name: Your Name
   - Email: your-email@example.com
   - Password: YourSecurePassword123
3. Confirm email from Supabase
4. Login at: http://localhost:3001/auth/v1/login
```

**No pre-created admin passwords exist** - you create them during registration!

---

## 📊 Sample Data Users (Read-Only Display Data)

These users appear in your CRM/dashboard but **cannot login**:

| Name | Email | Phone | Use Case |
|------|-------|-------|----------|
| John Doe | john.doe@example.com | +1-555-0101 | Sample customer #1 |
| Sarah Johnson | sarah.johnson@example.com | +1-555-0102 | Sample customer #2 |
| Michael Chen | michael.chen@example.com | +1-555-0103 | Sample customer #3 |
| Emily Rodriguez | emily.rodriguez@example.com | +1-555-0104 | Sample customer #4 |
| David Kim | david.kim@example.com | +1-555-0105 | Sample customer #5 |

**These are for display/testing only** - they show up in:
- CRM customer listings
- Conversation participants
- Queue entries (when implemented)
- User profiles

---

## 🔐 Creating Test Admin Accounts

### Option 1: Register Through UI (Recommended)

1. **Start the dashboard:**
   ```bash
   cd Business_pro_hub/dashboard
   npm run dev
   ```

2. **Visit registration page:**
   ```
   http://localhost:3001/auth/v1/register
   ```

3. **Register with test credentials:**
   ```
   Full Name: Admin Test User
   Email: admin@test.com
   Password: TestAdmin123!
   Confirm Password: TestAdmin123!
   ```

4. **Check your email** for confirmation link

5. **Login at:**
   ```
   http://localhost:3001/auth/v1/login
   Email: admin@test.com
   Password: TestAdmin123!
   ```

### Option 2: Create Multiple Test Admins

Create several test admin accounts for different scenarios:

**Admin Account #1 - Primary Admin**
```
Full Name: John Admin
Email: john.admin@businesshub.com
Password: Admin123!Secure
Role: Primary Administrator
```

**Admin Account #2 - Support Admin**
```
Full Name: Sarah Support
Email: sarah.support@businesshub.com
Password: Support123!Secure
Role: Support Administrator
```

**Admin Account #3 - Manager**
```
Full Name: Mike Manager
Email: mike.manager@businesshub.com
Password: Manager123!Secure
Role: Business Manager
```

---

## 🧪 Testing Different Scenarios

### Scenario 1: New Admin Registration
```
1. Go to /auth/v1/register
2. Create account with new credentials
3. Verify email confirmation works
4. Test login with new credentials
5. Check admin profile appears in admins table
```

### Scenario 2: Admin Viewing Customer Data
```
1. Login as admin
2. Navigate to CRM section
3. View the 5 sample customers
4. Check customer details load correctly
5. View conversations linked to customers
```

### Scenario 3: Multiple Admin Users
```
1. Register 2-3 different admin accounts
2. Login with each account separately
3. Verify each admin sees their own profile
4. Test admin-specific features
```

---

## 🔄 Password Reset Testing

To test password reset functionality:

```
1. Go to login page
2. Click "Forgot Password" (if implemented)
3. Enter registered email
4. Check email for reset link
5. Create new password
6. Test login with new password
```

**Note:** Password reset flow depends on Supabase email configuration.

---

## 📝 Recommended Test Passwords

For development/testing, use these password patterns:

**Strong passwords:**
```
TestAdmin123!
DevAdmin2024!
BusinessHub123!
QueueManager2024!
```

**Password requirements:**
- Minimum 6 characters (Supabase default)
- Recommended: Mix of uppercase, lowercase, numbers, special chars

---

## 🔒 Security Best Practices

### For Development:
- ✅ Use distinct passwords for each test account
- ✅ Don't use real personal emails
- ✅ Keep test credentials in secure notes
- ✅ Use password manager for tracking

### For Production:
- ⚠️ **Never use test credentials in production**
- ⚠️ Require strong passwords (8+ chars, complexity)
- ⚠️ Enable email verification
- ⚠️ Consider 2FA for admin accounts
- ⚠️ Rotate passwords regularly

---

## 🛠️ Supabase Authentication Settings

### Current Configuration:

**Email Provider:**
- ✅ Enabled in Supabase
- Sends confirmation emails
- Sends password reset emails

**Password Policy:**
- Minimum length: 6 characters (default)
- Can be customized in Supabase settings

**To Change Settings:**
1. Go to Supabase Dashboard
2. Navigate to: **Authentication** → **Settings**
3. Modify:
   - Minimum password length
   - Email confirmation requirement
   - Password reset settings

---

## 🔍 Verifying Admin Registration

After registering, verify in Supabase:

### Check Authentication Users:
```
1. Go to Supabase Dashboard
2. Click: Authentication → Users
3. You should see your registered admin user
4. Status should be "Confirmed" after email verification
```

### Check Admins Table:
```sql
-- Run in Supabase SQL Editor
SELECT id, full_name, email, role, created_at
FROM public.admins
ORDER BY created_at DESC;
```

Should show your registered admin with matching email.

---

## 🚨 Troubleshooting Authentication

### "Email not confirmed"
- Check your email inbox (and spam)
- Resend confirmation email from Supabase Dashboard
- Manually confirm user in Supabase: Authentication → Users → Click user → Confirm

### "Invalid login credentials"
- Verify email is correct
- Check password (case-sensitive)
- Ensure user is confirmed
- Try password reset

### "User not found in admins table"
- Check if registration completed fully
- Verify admins table has INSERT policy
- Check Supabase logs for errors

### Sample users appearing in login
- Sample users in `User` table are NOT for login
- Only users in Supabase Authentication + `admins` table can login
- Sample users are display data only

---

## 📊 Quick Reference

| User Type | Table | Can Login? | Purpose |
|-----------|-------|------------|---------|
| **Admin Users** | `admins` + `auth.users` | ✅ Yes | Dashboard access |
| **Sample Customers** | `User` | ❌ No | Display data only |
| **Profiles** | `profiles` | ✅ Yes | Extended user info |

---

## 🎯 Getting Started Checklist

- [ ] Run SQL script with sample data
- [ ] Start dashboard server
- [ ] Navigate to registration page
- [ ] Create first admin account
- [ ] Confirm email
- [ ] Login to dashboard
- [ ] Verify sample customers visible in CRM
- [ ] Check conversations load correctly
- [ ] Test admin profile features

---

## 💡 Pro Tips

1. **Use a test email service** like:
   - Mailinator.com (public, temporary emails)
   - TempMail.org (disposable emails)
   - Gmail with + aliases (yourname+test1@gmail.com)

2. **Create admin test matrix:**
   ```
   Admin 1: Full access, primary owner
   Admin 2: Support role, limited features
   Admin 3: Read-only access (future feature)
   ```

3. **Keep credentials organized:**
   ```
   Test Account 1:
   Email: test1@example.com
   Password: TestPass123!
   Role: Primary Admin
   Created: 2024-01-22
   ```

---

## 🔐 Summary

**For Dashboard Login:**
- ✅ Register new admin accounts through the app
- ✅ No pre-created admin passwords exist
- ✅ Create your own secure credentials

**Sample Customer Data:**
- ❌ Cannot be used for login
- ✅ Display in CRM and conversations
- ✅ Used for testing dashboard features

**Ready to start? Register your first admin account!** 🚀

Visit: http://localhost:3001/auth/v1/register
