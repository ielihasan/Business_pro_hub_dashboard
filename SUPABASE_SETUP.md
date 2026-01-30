# Supabase Setup Guide for Business Pro Hub

This guide will help you set up the required Supabase tables and configurations for the Business Pro Hub application.

## Prerequisites

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - Anon/Public Key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## Environment Configuration

### Dashboard Environment Setup

Create a `.env.local` file in the `dashboard/` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

Replace `your_supabase_project_url` and `your_supabase_anon_key` with your actual Supabase credentials.

## Database Tables Schema

Execute the following SQL commands in your Supabase SQL Editor to create all required tables.

### 1. Admins Table

This table stores admin user information for dashboard access.

```sql
-- Create admins table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'admin',
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view own profile"
    ON public.admins
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Admins can update own profile"
    ON public.admins
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Allow insert during registration"
    ON public.admins
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON public.admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 2. Users Table (Customers/Queue Users)

This table stores end-user information for customers using the queue management system.

```sql
-- Create User table (customers)
CREATE TABLE IF NOT EXISTS public."User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- Create policies for User table
CREATE POLICY "Admins can view all users"
    ON public."User"
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid()
    ));

CREATE POLICY "Users can view own profile"
    ON public."User"
    FOR SELECT
    USING (true);

CREATE POLICY "Users can insert own profile"
    ON public."User"
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update own profile"
    ON public."User"
    FOR UPDATE
    USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_email ON public."User"(email);
CREATE INDEX IF NOT EXISTS idx_user_phone ON public."User"(phone_number);

-- Create updated_at trigger for User table
CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON public."User"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 3. Profiles Table

Alternative user profile storage (if needed for additional features).

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles
    FOR SELECT
    USING (true);

CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Create updated_at trigger
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 4. Conversations Table (Chat/Support)

For managing customer support conversations.

```sql
-- Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    user_id UUID REFERENCES public."User"(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all conversations"
    ON public.conversations
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid()
    ));

CREATE POLICY "Users can view own conversations"
    ON public.conversations
    FOR SELECT
    USING (user_id IN (
        SELECT id FROM public."User" WHERE id = user_id
    ));

CREATE POLICY "Admins can insert conversations"
    ON public.conversations
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid()
    ));

CREATE POLICY "Admins can update conversations"
    ON public.conversations
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid()
    ));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_admin_id ON public.conversations(admin_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.conversations(status);

-- Create updated_at trigger
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 5. Messages Table (Chat Messages)

For storing conversation messages.

```sql
-- Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_type TEXT CHECK (sender_type IN ('user', 'admin')),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view all messages"
    ON public.messages
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid()
    ));

CREATE POLICY "Users can view messages in their conversations"
    ON public.messages
    FOR SELECT
    USING (conversation_id IN (
        SELECT id FROM public.conversations
        WHERE user_id IN (SELECT id FROM public."User")
    ));

CREATE POLICY "Authenticated users can insert messages"
    ON public.messages
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own messages"
    ON public.messages
    FOR UPDATE
    USING (sender_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
```

### 6. Queue Types Table (For Multi-Queue Management)

This table allows businesses to create multiple queue types (e.g., "Haircut Queue", "Consultation Queue"):

```sql
-- Create queue_types table
CREATE TABLE IF NOT EXISTS public.queue_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'users',
    estimated_service_time INTEGER DEFAULT 5,
    max_capacity INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.queue_types ENABLE ROW LEVEL SECURITY;

-- Create policies for queue_types
CREATE POLICY "Anyone can view active queue types"
    ON public.queue_types
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Business owners can manage own queue types"
    ON public.queue_types
    FOR ALL
    USING (business_id::text = auth.uid()::text);

CREATE POLICY "Allow insert for authenticated users"
    ON public.queue_types
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_queue_types_business_id ON public.queue_types(business_id);

-- Create trigger for updated_at
CREATE TRIGGER update_queue_types_updated_at
    BEFORE UPDATE ON public.queue_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 7. Queue Entries Table (Queue Management)

This table stores queue entries for customers joining queues:

```sql
-- Create queue_entries table
CREATE TABLE IF NOT EXISTS public.queue_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    queue_type_id UUID REFERENCES public.queue_types(id) ON DELETE SET NULL,
    queue_type_name TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    service_type TEXT,
    notes TEXT,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'high', 'vip')),
    position INTEGER NOT NULL,
    ticket_number TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'serving', 'completed', 'cancelled', 'no_show')),
    joined_via TEXT DEFAULT 'walk_in' CHECK (joined_via IN ('walk_in', 'qr_code', 'app', 'web')),
    served_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for queue_entries
CREATE POLICY "Anyone can view queue entries"
    ON public.queue_entries
    FOR SELECT
    USING (true);

CREATE POLICY "Anyone can insert queue entries"
    ON public.queue_entries
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Business owners can update queue entries"
    ON public.queue_entries
    FOR UPDATE
    USING (business_id::text = auth.uid()::text);

CREATE POLICY "Business owners can delete queue entries"
    ON public.queue_entries
    FOR DELETE
    USING (business_id::text = auth.uid()::text);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_queue_entries_business_id ON public.queue_entries(business_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_queue_type_id ON public.queue_entries(queue_type_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_status ON public.queue_entries(status);
CREATE INDEX IF NOT EXISTS idx_queue_entries_ticket_number ON public.queue_entries(ticket_number);
CREATE INDEX IF NOT EXISTS idx_queue_entries_created_at ON public.queue_entries(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_queue_entries_updated_at
    BEFORE UPDATE ON public.queue_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### 8. Legacy Queue Tables (Optional - for backward compatibility)

These tables can be used for the legacy queue system:

```sql
-- Create queues table
CREATE TABLE IF NOT EXISTS public.queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.admins(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    max_capacity INTEGER,
    estimated_service_time INTEGER, -- in minutes
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for queues
CREATE POLICY "Anyone can view active queues"
    ON public.queues
    FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage own queues"
    ON public.queues
    FOR ALL
    USING (business_id = auth.uid());

-- Create policies for queue_entries
CREATE POLICY "Users can view own queue entries"
    ON public.queue_entries
    FOR SELECT
    USING (user_id IN (SELECT id FROM public."User"));

CREATE POLICY "Admins can view all queue entries"
    ON public.queue_entries
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid()
    ));

CREATE POLICY "Users can insert queue entries"
    ON public.queue_entries
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can update queue entries"
    ON public.queue_entries
    FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid()
    ));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_queues_business_id ON public.queues(business_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_queue_id ON public.queue_entries(queue_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_user_id ON public.queue_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_status ON public.queue_entries(status);

-- Create triggers
CREATE TRIGGER update_queues_updated_at
    BEFORE UPDATE ON public.queues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_queue_entries_updated_at
    BEFORE UPDATE ON public.queue_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## Authentication Setup

### Enable Email Authentication

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers**
3. Enable **Email** provider
4. Configure email templates (optional)

### Enable Google OAuth (Optional)

1. Navigate to **Authentication** → **Providers**
2. Enable **Google** provider
3. Add your Google OAuth credentials:
   - Client ID
   - Client Secret
4. Add authorized redirect URL: `https://your-project.supabase.co/auth/v1/callback`

## Testing the Setup

After creating the tables, test your setup:

1. Start the dashboard:
   ```bash
   cd Business_pro_hub/dashboard
   npm run dev
   ```

2. Visit `http://localhost:3001/auth/v1/register`
3. Register a new admin account
4. Check your email for confirmation
5. Login at `http://localhost:3001/auth/v1/login`

## Verification Checklist

- [ ] All environment variables are set in `dashboard/.env.local`
- [ ] All 5 core tables are created: `admins`, `User`, `profiles`, `conversations`, `messages`
- [ ] Row Level Security (RLS) is enabled on all tables
- [ ] Policies are created for proper access control
- [ ] Indexes are created for performance
- [ ] Email authentication is enabled
- [ ] Test registration works
- [ ] Test login works
- [ ] Dashboard loads successfully after login

## Troubleshooting

### Cannot insert into admins table
- Check if RLS policies allow INSERT for authenticated users
- Verify the user ID matches the auth.users ID

### Login redirects to error page
- Verify Supabase URL and Anon Key are correct
- Check browser console for error messages
- Ensure email confirmation is completed

### Tables not found
- Verify tables exist in Supabase Table Editor
- Check table names match exactly (case-sensitive)
- Ensure you're connected to the correct project

## Next Steps

After completing the setup:

1. Run the landing page: `cd landing-page && npm run dev` (port 3000)
2. Run the dashboard: `cd dashboard && npm run dev` (port 3001)
3. Click "Get Started" on the landing page to access the login page
4. Register and start using Business Pro Hub!

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Review error messages in browser console
- Verify all environment variables are correct
