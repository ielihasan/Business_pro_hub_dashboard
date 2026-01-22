# 📊 Database Sample Data Information

## Overview

The `COMPLETE_DATABASE_WITH_SAMPLES.sql` file creates all required tables AND populates them with sample data for testing and demonstration purposes.

---

## 📋 Sample Data Summary

### 1. **Users Table** - 5 Sample Customers

| Full Name | Email | Phone | Avatar |
|-----------|-------|-------|--------|
| John Doe | john.doe@example.com | +1-555-0101 | ✅ |
| Sarah Johnson | sarah.johnson@example.com | +1-555-0102 | ✅ |
| Michael Chen | michael.chen@example.com | +1-555-0103 | ✅ |
| Emily Rodriguez | emily.rodriguez@example.com | +1-555-0104 | ✅ |
| David Kim | david.kim@example.com | +1-555-0105 | ✅ |

**Note:** Avatars use DiceBear API for automatic avatar generation

---

### 2. **Conversations Table** - 5 Sample Conversations

| Title | User | Status | Created |
|-------|------|--------|---------|
| Queue Wait Time Inquiry | John Doe | Open | 2 hours ago |
| Service Feedback | Sarah Johnson | Closed | 1 day ago |
| Booking Assistance Needed | Michael Chen | Pending | 3 hours ago |
| Account Update Request | Emily Rodriguez | Open | 30 minutes ago |
| Technical Support | David Kim | Open | 5 hours ago |

---

### 3. **Messages Table** - 8 Sample Messages

#### Conversation 1: Queue Wait Time Inquiry (2 messages)
- "Hello, I would like to know the current wait time for the morning queue."
- "I have an appointment at 10 AM and want to plan accordingly."

#### Conversation 2: Service Feedback (2 messages)
- "Thank you for the excellent service! The queue management was very efficient."
- "I particularly liked the real-time notifications about my queue position."

#### Conversation 3: Booking Assistance (1 message)
- "I need help booking a slot for next Tuesday. The system is showing all slots as full."

#### Conversation 4: Account Update (1 message)
- "I need to update my phone number in the system."

#### Conversation 5: Technical Support (2 messages)
- "I am getting an error when trying to scan the QR code to join the queue."
- "The error message says 'Invalid QR code format'. What should I do?"

---

## 🔒 Security Features Included

All tables have:
- ✅ **Row Level Security (RLS)** enabled
- ✅ **Access control policies** configured
- ✅ **Foreign key relationships** enforced
- ✅ **Data validation** with CHECK constraints
- ✅ **Automatic timestamps** (created_at, updated_at)
- ✅ **Performance indexes** on key columns

---

## 📊 Database Structure

```
admins (Admin users - populated after registration)
  ├── id (UUID, references auth.users)
  ├── full_name
  ├── email
  ├── role
  └── avatar_url

User (Customers - 5 SAMPLES)
  ├── id (UUID)
  ├── full_name
  ├── email
  ├── phone_number
  └── avatar_url

profiles (Extended profiles - populated after registration)
  ├── id (UUID, references auth.users)
  ├── full_name
  ├── bio
  └── website

conversations (Chat conversations - 5 SAMPLES)
  ├── id (UUID)
  ├── title
  ├── user_id → references User
  ├── admin_id → references admins
  └── status (open/closed/pending)

messages (Chat messages - 8 SAMPLES)
  ├── id (UUID)
  ├── conversation_id → references conversations
  ├── sender_id
  ├── sender_type (user/admin)
  ├── content
  └── is_read

queues (Queue definitions - created by admins)
  ├── id (UUID)
  ├── business_id → references admins
  ├── name
  ├── max_capacity
  └── is_active

queue_entries (Queue positions - created when users join)
  ├── id (UUID)
  ├── queue_id → references queues
  ├── user_id → references User
  ├── position
  ├── status (waiting/in_progress/completed/cancelled)
  └── estimated_wait_time
```

---

## 🚀 How to Use the Sample Data

### Step 1: Run the SQL Script

1. Open Supabase Dashboard → SQL Editor
2. Open `COMPLETE_DATABASE_WITH_SAMPLES.sql`
3. Copy entire content
4. Paste into SQL Editor
5. Click "Run"

### Step 2: Verify Sample Data

Run these verification queries in SQL Editor:

```sql
-- Check sample users
SELECT full_name, email, phone_number FROM public."User";

-- Check conversations with message counts
SELECT
    c.title,
    c.status,
    COUNT(m.id) as message_count
FROM public.conversations c
LEFT JOIN public.messages m ON c.id = m.conversation_id
GROUP BY c.id, c.title, c.status, c.created_at
ORDER BY c.created_at DESC;

-- Check all messages
SELECT
    c.title as conversation,
    m.sender_type,
    m.content,
    m.created_at
FROM public.messages m
JOIN public.conversations c ON m.conversation_id = c.id
ORDER BY m.created_at ASC;
```

### Step 3: View in Dashboard

After registering as an admin and logging in:

1. **CRM Section** → View all 5 sample users
2. **Messages/Chat Section** → View 5 conversations with messages
3. **User Profiles** → See customer details with avatars

---

## 🎯 Sample Data Use Cases

### For Testing:
- ✅ Test user listing and filtering
- ✅ Test conversation management
- ✅ Test message display and threading
- ✅ Test search functionality
- ✅ Test data relationships

### For Demos:
- ✅ Show realistic customer data
- ✅ Demonstrate chat/support features
- ✅ Display active conversations
- ✅ Present user management capabilities
- ✅ Showcase real-time features

### For Development:
- ✅ Build UI components with real data
- ✅ Test pagination and sorting
- ✅ Validate data relationships
- ✅ Debug query performance
- ✅ Test edge cases

---

## 🔄 Resetting Sample Data

To reset and reload sample data:

```sql
-- Delete existing sample data (keeps table structure)
TRUNCATE public.messages CASCADE;
TRUNCATE public.conversations CASCADE;
TRUNCATE public."User" CASCADE;

-- Then re-run the INSERT statements from COMPLETE_DATABASE_WITH_SAMPLES.sql
```

---

## ⚠️ Important Notes

### Admin Users
- **Admin data is NOT pre-populated** in sample data
- Admin users must **register through the app** at `/auth/v1/register`
- After registration, admin data automatically syncs to `admins` table
- This ensures proper authentication flow

### Sample vs Real Data
- Sample user IDs are **fixed UUIDs** for consistency
- Real users will have **random UUIDs**
- Sample data is for **testing only**
- Remove or modify before production deployment

### Foreign Key Relationships
- Messages link to conversations (conversation_id)
- Conversations link to users (user_id)
- Conversations link to admins (admin_id) - NULL initially
- Queue entries link to queues and users
- Queues link to admin business_id

---

## 📈 Next Steps After Loading Sample Data

1. **Register as Admin**
   - Go to http://localhost:3001/auth/v1/register
   - Create your admin account
   - Confirm email

2. **Login to Dashboard**
   - Access http://localhost:3001/auth/v1/login
   - Login with your credentials

3. **Explore Sample Data**
   - Navigate to CRM → See 5 sample users
   - Check conversations → See 5 active chats
   - View messages → Read customer inquiries

4. **Test Features**
   - Reply to conversations
   - Update user information
   - Change conversation status
   - Search and filter data

5. **Build New Features**
   - Create queues for your business
   - Add queue management logic
   - Implement real-time notifications
   - Add analytics and reporting

---

## 🆘 Troubleshooting

### "Foreign key violation" errors
- Ensure you run the complete script in order
- Tables must be created before sample data inserts

### "Duplicate key value" errors
- Sample data IDs are fixed
- Re-running insert statements may cause conflicts
- Use `ON CONFLICT DO NOTHING` clauses (already included)

### Sample data not visible in dashboard
- Verify you're logged in as an admin
- Check RLS policies are working correctly
- Confirm tables were created successfully

### Cannot see conversations/messages
- Check that conversations reference valid user_ids
- Verify messages reference valid conversation_ids
- Ensure foreign key relationships are intact

---

## 📞 Support

For issues with sample data:
1. Check Supabase Table Editor to verify data exists
2. Review browser console for API errors
3. Verify RLS policies allow data access
4. Check that relationships between tables are correct

---

**Sample data is ready to use! Just run the SQL script and start exploring! 🚀**
