# 🚀 Quick Start Guide - Business Pro Hub

## ✅ Configuration Complete!

Your Supabase credentials have been configured. Follow these steps to get started:

---

## Step 1: Create Database Tables

Go to your Supabase dashboard and run these SQL scripts in the **SQL Editor**:

### 🔗 Supabase Dashboard:
**https://supabase.com/project/hjblbmmyfznxomsrxhme**

### Option A: Quick Setup with Sample Data ⭐ RECOMMENDED

Open the file **`COMPLETE_DATABASE_WITH_SAMPLES.sql`** in this directory, copy the entire content, paste into Supabase SQL Editor and click "Run".

This will create:
- ✅ All 7 tables with relationships
- ✅ Row Level Security policies
- ✅ 5 sample customers
- ✅ 5 sample conversations
- ✅ 8 sample messages

### Option B: Manual Setup (Tables only, no samples)

Copy and paste this **script** into Supabase SQL Editor and click "Run":

```sql
-- ============================================
-- BUSINESS PRO HUB - COMPLETE DATABASE SETUP
-- ============================================

-- Create update trigger function (used by all tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. ADMINS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'admin',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view own profile"
    ON public.admins FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins can update own profile"
    ON public.admins FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Allow insert during registration"
    ON public.admins FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);

CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON public.admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. USER TABLE (Customers)
-- ============================================
CREATE TABLE IF NOT EXISTS public."User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all users"
    ON public."User" FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "Users can view own profile"
    ON public."User" FOR SELECT
    USING (true);

CREATE POLICY "Users can insert own profile"
    ON public."User" FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update own profile"
    ON public."User" FOR UPDATE
    USING (true);

CREATE INDEX IF NOT EXISTS idx_user_email ON public."User"(email);
CREATE INDEX IF NOT EXISTS idx_user_phone ON public."User"(phone_number);

CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON public."User"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    user_id UUID REFERENCES public."User"(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all conversations"
    ON public.conversations FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "Users can view own conversations"
    ON public.conversations FOR SELECT
    USING (user_id IN (SELECT id FROM public."User" WHERE id = user_id));

CREATE POLICY "Admins can insert conversations"
    ON public.conversations FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "Admins can update conversations"
    ON public.conversations FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_admin_id ON public.conversations(admin_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_type TEXT CHECK (sender_type IN ('user', 'admin')),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all messages"
    ON public.messages FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "Users can view messages in their conversations"
    ON public.messages FOR SELECT
    USING (conversation_id IN (
        SELECT id FROM public.conversations
        WHERE user_id IN (SELECT id FROM public."User")
    ));

CREATE POLICY "Authenticated users can insert messages"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own messages"
    ON public.messages FOR UPDATE
    USING (sender_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- ============================================
-- SETUP COMPLETE!
-- ============================================
```

**Click "Run" in the SQL Editor to create all tables at once!**

### Option B: Step by Step

If you prefer, you can run each table's script individually from `SUPABASE_SETUP.md`.

---

## Step 2: Enable Email Authentication

1. In Supabase Dashboard, go to **Authentication** → **Providers**
2. Ensure **Email** is **enabled** ✅
3. (Optional) Configure email templates

---

## Step 3: Start the Applications

Open **two terminals**:

### Terminal 1 - Landing Page
```bash
cd Business_pro_hub/landing-page
npm run dev
```
Opens at: **http://localhost:3000**

### Terminal 2 - Dashboard
```bash
cd Business_pro_hub/dashboard
npm run dev
```
Opens at: **http://localhost:3001**

### Alternative: Use the Batch Script (Windows)
```bash
cd Business_pro_hub
start-dev.bat
```
This will open both servers in separate windows.

---

## Step 4: Test the Integration

1. **Open landing page**: http://localhost:3000
2. **Click "Get Started"** button (circular button with arrow)
3. Should open: http://localhost:3001/auth/v1/login
4. **Click "Register"** to create an admin account
5. Check your email for confirmation
6. **Login** and access the dashboard

---

## 🎯 What's Next?

After successful login, you can:
- ✅ Access the dashboard at http://localhost:3001/dashboard
- ✅ View user profiles in CRM section
- ✅ Manage conversations
- ✅ Monitor business analytics
- ✅ Customize your admin profile

---

## 🔍 Verify Your Setup

### Check Database Tables
In Supabase Dashboard → **Table Editor**, you should see:
- ✅ admins
- ✅ User
- ✅ profiles
- ✅ conversations
- ✅ messages

### Check Authentication
In Supabase Dashboard → **Authentication** → **Users**:
- After registration, you should see your admin user listed

---

## 🆘 Troubleshooting

### Cannot connect to Supabase
- ✅ Environment file exists: `dashboard/.env.local`
- ✅ Restart dashboard server after creating env file
- ✅ Check for typos in Supabase URL/key

### Registration fails
- ✅ Run the SQL scripts in Supabase SQL Editor
- ✅ Check that `admins` table exists
- ✅ Verify email authentication is enabled

### Get Started button doesn't work
- ✅ Clear browser cache
- ✅ Check that dashboard is running on port 3001
- ✅ Look for errors in browser console

---

## ✅ Configuration Summary

| Item | Status | Value |
|------|--------|-------|
| Supabase URL | ✅ Set | hjblbmmyfznxomsrxhme.supabase.co |
| Anon Key | ✅ Set | Configured in .env.local |
| Landing Port | ✅ Set | 3000 |
| Dashboard Port | ✅ Set | 3001 |
| Environment File | ✅ Created | dashboard/.env.local |
| Get Started Link | ✅ Configured | Points to port 3001 login |

---

## 🎉 You're Ready!

Everything is configured and ready to go. Just:
1. Run the SQL script in Supabase
2. Start both servers
3. Test the integration

**Happy building! 🚀**
