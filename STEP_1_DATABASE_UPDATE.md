# 📊 Step 1: Database Update for Role-Based Authentication

## 🎯 What This Update Does

This SQL script transforms your database to support the Smart Business Support Platform with:

✅ **Role-Based Authentication** (Admin + Business Owner)
✅ **Queue Management System**
✅ **Business Services & Staff Management**
✅ **Order Processing System**
✅ **Customer Feedback & Ratings**
✅ **Business Hours Configuration**

---

## 🚀 **How to Apply the Update**

### **Step 1: Backup Current Database (Optional but Recommended)**

Go to Supabase Dashboard → Settings → Database → Create Backup

### **Step 2: Run the Update Script**

1. **Open Supabase Dashboard:**
   https://supabase.com/project/hjblbmmyfznxomsrxhme

2. **Go to SQL Editor:**
   Click "SQL Editor" in the left sidebar

3. **Open the Update Script:**
   Open file: `DATABASE_ROLE_BASED_UPDATE.sql`

4. **Copy All Content:**
   Select all (Ctrl+A) and copy (Ctrl+C)

5. **Paste in SQL Editor:**
   Paste the complete script

6. **Click "RUN":**
   Execute the script - this will take ~10 seconds

7. **Check for Success:**
   You should see "Success. No rows returned" message

### **Step 3: Verify the Update**

Run this verification query in SQL Editor:

```sql
-- Check new tables exist
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('queues', 'services', 'staff', 'orders', 'feedback', 'business_hours', 'business_types')
ORDER BY tablename;

-- Should return 7 tables
```

---

## 📋 **What Was Added/Updated**

### **1. Updated `admins` Table**

**New Columns Added:**
- `business_name` - Name of the business
- `business_type` - Type of business (Coffee Shop, Print Shop, etc.)
- `business_address` - Physical address
- `business_phone` - Contact number
- `business_description` - Business description
- `is_approved` - Approval status (default: false)
- `approved_at` - Timestamp of approval
- `approved_by` - Admin who approved
- `rejection_reason` - Reason if rejected
- `subscription_plan` - free/basic/premium
- `subscription_expires_at` - Subscription expiry

**Role Constraint Updated:**
- Now supports: `'admin'` and `'business_owner'`

---

### **2. New Table: `business_types`**

Lookup table for business categories:

| Name | Description |
|------|-------------|
| Coffee Shop | Coffee shops, cafes, beverage services |
| Print Shop | Printing, copying, document services |
| Clinic | Medical clinics, healthcare services |
| Repair Center | Electronics/appliance repair |
| Salon | Hair salons, beauty services |
| Restaurant | Restaurants and food services |
| Bakery | Bakeries and pastry shops |
| Pharmacy | Pharmacies and medicine stores |
| Laundry | Laundry and dry cleaning |
| Photo Studio | Photography services |

---

### **3. New Table: `queues`**

**Main queue management table:**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| business_id | UUID | Business reference |
| customer_id | UUID | Customer reference (optional) |
| customer_name | TEXT | Customer name |
| customer_phone | TEXT | Contact number |
| service_type | TEXT | Service requested |
| position | INTEGER | Queue position |
| status | ENUM | waiting/called/in_progress/completed/cancelled/no_show |
| priority | ENUM | low/normal/high/urgent |
| estimated_wait_time | INTEGER | In minutes |
| joined_at | TIMESTAMP | When joined queue |
| called_at | TIMESTAMP | When called |
| completed_at | TIMESTAMP | When completed |

---

### **4. New Table: `services`**

Business services offered:

| Column | Description |
|--------|-------------|
| id | Service ID |
| business_id | Business reference |
| name | Service name |
| description | Service details |
| price | Service price |
| estimated_duration | Time in minutes |
| is_active | Active status |

---

### **5. New Table: `staff`**

Staff management:

| Column | Description |
|--------|-------------|
| id | Staff ID |
| business_id | Business reference |
| full_name | Staff name |
| email | Contact email |
| phone | Contact phone |
| role | Staff role |
| is_active | Active status |
| hired_date | Date of hiring |

---

### **6. New Table: `orders`**

Order processing:

| Column | Description |
|--------|-------------|
| id | Order ID |
| business_id | Business reference |
| customer_id | Customer reference |
| order_number | Unique order number |
| service_type | Service requested |
| description | Order details |
| file_urls | Array of file URLs |
| status | pending/accepted/processing/completed/cancelled/rejected |
| total_amount | Total price |
| paid_amount | Amount paid |
| payment_status | unpaid/partial/paid/refunded |
| assigned_to | Staff member |

---

### **7. New Table: `feedback`**

Customer feedback:

| Column | Description |
|--------|-------------|
| id | Feedback ID |
| business_id | Business reference |
| customer_id | Customer reference |
| rating | 1-5 stars |
| comment | Text feedback |
| response | Business response |
| responded_at | Response timestamp |

---

### **8. New Table: `business_hours`**

Operating hours:

| Column | Description |
|--------|-------------|
| id | Record ID |
| business_id | Business reference |
| day_of_week | 0-6 (Sunday-Saturday) |
| is_open | Open status |
| open_time | Opening time |
| close_time | Closing time |

---

## 🔐 **Row Level Security (RLS) Policies**

All tables have RLS enabled with proper access control:

**Admin Access:**
- ✅ View all businesses, queues, orders, feedback
- ✅ Approve/reject business registrations
- ✅ Full platform management

**Business Owner Access:**
- ✅ Manage own business data
- ✅ Manage own queues, orders, staff
- ✅ View own feedback and analytics
- ❌ Cannot access other businesses' data

**Customer Access:**
- ✅ View own queue entries
- ✅ View own orders
- ✅ Submit feedback
- ❌ Cannot access business management

---

## 📊 **Database Structure**

```
admins (role: admin | business_owner)
  ├── Admin → Full platform access
  └── Business Owner → Own business management
      ├── queues → Queue management
      ├── services → Services offered
      ├── staff → Staff management
      ├── orders → Order processing
      ├── feedback → Customer feedback
      └── business_hours → Operating hours

User (customers)
  ├── Queue entries
  ├── Orders
  └── Feedback
```

---

## ✅ **Verification Checklist**

After running the script, verify:

- [ ] `admins` table has new columns (business_name, business_type, etc.)
- [ ] `business_types` table exists with 10 entries
- [ ] `queues` table created
- [ ] `services` table created
- [ ] `staff` table created
- [ ] `orders` table created
- [ ] `feedback` table created
- [ ] `business_hours` table created
- [ ] All tables have RLS enabled
- [ ] Indexes created for performance

---

## 🎯 **Next Steps**

After database update is complete:

1. ✅ Update registration page to support business owner signup
2. ✅ Update login flow to check role and redirect
3. ✅ Create admin approval workflow
4. ✅ Build admin dashboard
5. ✅ Build business owner dashboard

---

## 🆘 **Troubleshooting**

### **Error: Column already exists**
This means the update was already applied. Safe to ignore.

### **Error: Permission denied**
Ensure you're using the correct Supabase project with admin access.

### **Error: Relation does not exist**
Run the `COMPLETE_DATABASE_WITH_SAMPLES.sql` first to create base tables.

---

## 📞 **Ready for Next Step?**

Once database update is complete, we'll proceed to:
- Update registration pages
- Update login flow
- Build dashboards

**Database update complete? Let me know and I'll continue with registration pages!** 🚀
