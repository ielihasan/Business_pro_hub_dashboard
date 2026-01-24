# Business Applications Database Setup

## Overview
This directory contains the SQL schema for the business applications approval system.

## How It Works

### 1. Registration Flow
When a business owner registers:
1. User account is created in `auth.users` via Supabase Auth
2. Application is stored in `business_applications` table with `is_approved: false`
3. User is redirected to `/waiting-approval` page

### 2. Admin Approval Flow
When an admin approves an application:
1. A record is created in the `admins` table with full business details
2. The application in `business_applications` is marked as `is_approved: true`
3. The business owner can now log in and access their dashboard

### 3. Admin Rejection Flow
When an admin rejects an application:
1. The application in `business_applications` is marked as `is_rejected: true`
2. A `rejection_reason` is stored for future reference
3. No record is created in the `admins` table

## Tables

### `business_applications`
Stores pending business registration applications.

**Key Columns:**
- `id`: Primary key (UUID)
- `user_id`: Reference to auth.users
- `full_name`: Business owner's full name
- `email`: Business owner's email
- `business_name`: Name of the business
- `business_type`: Type/category of business
- `business_address`: Physical address
- `business_phone`: Contact phone number
- `business_description`: Optional description
- `is_approved`: Approval status (default: false)
- `is_rejected`: Rejection status (default: false)
- `rejection_reason`: Reason if rejected
- `approved_at`: Timestamp when approved
- `approved_by`: Admin who approved
- `rejected_at`: Timestamp when rejected
- `rejected_by`: Admin who rejected
- `created_at`: Registration timestamp
- `updated_at`: Last update timestamp

### `admins`
Stores approved admins and business owners.

**Key Columns:**
- `id`: Primary key (references auth.users.id)
- `full_name`: User's full name
- `email`: User's email
- `role`: Either "admin" or "business_owner"
- `business_name`: Business name (for business_owner role)
- `business_type`: Business type (for business_owner role)
- `business_address`: Business address (for business_owner role)
- `business_phone`: Business phone (for business_owner role)
- `business_description`: Business description (for business_owner role)
- `is_approved`: Always true for records in this table
- `approved_at`: When the user was approved
- `approved_by`: Admin who approved (for business_owner role)

## Setup Instructions

### 1. Run the SQL Schema
Execute the SQL file in your Supabase database:

```sql
-- In Supabase SQL Editor, run:
\i /path/to/business_applications.sql
```

Or copy and paste the contents of `business_applications.sql` into the Supabase SQL Editor.

### 2. Set Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE business_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own applications
CREATE POLICY "Users can view own applications"
ON business_applications FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Admins can view all applications
CREATE POLICY "Admins can view all applications"
ON business_applications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.id = auth.uid()
    AND admins.role = 'admin'
    AND admins.is_approved = true
  )
);

-- Policy: Admins can update applications (approve/reject)
CREATE POLICY "Admins can update applications"
ON business_applications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM admins
    WHERE admins.id = auth.uid()
    AND admins.role = 'admin'
    AND admins.is_approved = true
  )
);

-- Policy: Anyone can insert (for registration)
CREATE POLICY "Anyone can create applications"
ON business_applications FOR INSERT
WITH CHECK (true);
```

### 3. Verify Setup

1. Test business registration:
   - Go to `/auth/v1/register`
   - Register as a business owner
   - Check that a record appears in `business_applications`

2. Test admin approval:
   - Login as admin
   - Go to `/admin/businesses/pending`
   - Approve a pending business
   - Check that:
     - Record is created in `admins` table
     - Application is marked as approved in `business_applications`

3. Test login:
   - Approved business owner should be able to log in
   - They should be redirected to their dashboard

## Queries for Testing

```sql
-- View all pending applications
SELECT * FROM business_applications
WHERE is_approved = false AND is_rejected = false
ORDER BY created_at DESC;

-- View all approved businesses
SELECT * FROM admins
WHERE role = 'business_owner' AND is_approved = true
ORDER BY approved_at DESC;

-- View all rejected applications
SELECT * FROM business_applications
WHERE is_rejected = true
ORDER BY rejected_at DESC;
```

## Troubleshooting

### Business not appearing in pending list
1. Check if record was created in `business_applications`:
   ```sql
   SELECT * FROM business_applications WHERE email = 'user@example.com';
   ```

2. Verify RLS policies are set correctly

3. Check browser console for any errors

### Approval fails
1. Verify admin has correct role and is_approved status
2. Check for foreign key constraint errors
3. Ensure `user_id` from application exists in `auth.users`

### User can't login after approval
1. Check if record exists in `admins` table
2. Verify `is_approved = true` in admins table
3. Check if email is confirmed in Supabase Auth
