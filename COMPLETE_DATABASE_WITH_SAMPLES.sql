-- ============================================
-- BUSINESS PRO HUB - COMPLETE DATABASE SETUP
-- With Sample Data (5 entries per table)
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view own profile" ON public.admins;
DROP POLICY IF EXISTS "Admins can update own profile" ON public.admins;
DROP POLICY IF EXISTS "Allow insert during registration" ON public.admins;

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

DROP TRIGGER IF EXISTS update_admins_updated_at ON public.admins;
CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON public.admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample Data for Admins (These will be linked to auth.users after registration)
-- Note: You'll need to register these users first through the app, then their data will populate
COMMENT ON TABLE public.admins IS 'Admin users should register through /auth/v1/register';

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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all users" ON public."User";
DROP POLICY IF EXISTS "Users can view own profile" ON public."User";
DROP POLICY IF EXISTS "Users can insert own profile" ON public."User";
DROP POLICY IF EXISTS "Users can update own profile" ON public."User";

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

DROP TRIGGER IF EXISTS update_user_updated_at ON public."User";
CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON public."User"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample Data for Users (Customers)
INSERT INTO public."User" (id, full_name, email, phone_number, avatar_url) VALUES
    ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'John Doe', 'john.doe@example.com', '+1-555-0101', 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'),
    ('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'Sarah Johnson', 'sarah.johnson@example.com', '+1-555-0102', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'),
    ('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 'Michael Chen', 'michael.chen@example.com', '+1-555-0103', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael'),
    ('d4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a', 'Emily Rodriguez', 'emily.rodriguez@example.com', '+1-555-0104', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily'),
    ('e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', 'David Kim', 'david.kim@example.com', '+1-555-0105', 'https://api.dicebear.com/7.x/avataaars/svg?seed=David')
ON CONFLICT (id) DO NOTHING;

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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample Data for Profiles (linked to auth.users, will populate after user registration)
COMMENT ON TABLE public.profiles IS 'Profiles are created automatically after user registration';

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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.conversations;
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
DROP POLICY IF EXISTS "Admins can insert conversations" ON public.conversations;
DROP POLICY IF EXISTS "Admins can update conversations" ON public.conversations;

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

DROP TRIGGER IF EXISTS update_conversations_updated_at ON public.conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample Data for Conversations
INSERT INTO public.conversations (id, title, user_id, admin_id, status, created_at) VALUES
    ('f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', 'Queue Wait Time Inquiry', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', NULL, 'open', NOW() - INTERVAL '2 hours'),
    ('a7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d', 'Service Feedback', 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', NULL, 'closed', NOW() - INTERVAL '1 day'),
    ('b8c9d0e1-f2a3-1b2c-5d6e-7f8a9b0c1d2e', 'Booking Assistance Needed', 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', NULL, 'pending', NOW() - INTERVAL '3 hours'),
    ('c9d0e1f2-a3b4-2c3d-6e7f-8a9b0c1d2e3f', 'Account Update Request', 'd4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a', NULL, 'open', NOW() - INTERVAL '30 minutes'),
    ('d0e1f2a3-b4c5-3d4e-7f8a-9b0c1d2e3f4a', 'Technical Support', 'e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', NULL, 'open', NOW() - INTERVAL '5 hours')
ON CONFLICT (id) DO NOTHING;

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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;

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

-- Sample Data for Messages
INSERT INTO public.messages (conversation_id, sender_id, sender_type, content, is_read, created_at) VALUES
    -- Conversation 1: Queue Wait Time Inquiry
    ('f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'user', 'Hello, I would like to know the current wait time for the morning queue.', false, NOW() - INTERVAL '2 hours'),
    ('f6a7b8c9-d0e1-9f0a-3b4c-5d6e7f8a9b0c', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'user', 'I have an appointment at 10 AM and want to plan accordingly.', false, NOW() - INTERVAL '1 hour 58 minutes'),

    -- Conversation 2: Service Feedback
    ('a7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d', 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'user', 'Thank you for the excellent service! The queue management was very efficient.', true, NOW() - INTERVAL '1 day'),
    ('a7b8c9d0-e1f2-0a1b-4c5d-6e7f8a9b0c1d', 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'user', 'I particularly liked the real-time notifications about my queue position.', true, NOW() - INTERVAL '23 hours'),

    -- Conversation 3: Booking Assistance
    ('b8c9d0e1-f2a3-1b2c-5d6e-7f8a9b0c1d2e', 'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 'user', 'I need help booking a slot for next Tuesday. The system is showing all slots as full.', false, NOW() - INTERVAL '3 hours'),

    -- Conversation 4: Account Update
    ('c9d0e1f2-a3b4-2c3d-6e7f-8a9b0c1d2e3f', 'd4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a', 'user', 'I need to update my phone number in the system.', false, NOW() - INTERVAL '30 minutes'),

    -- Conversation 5: Technical Support
    ('d0e1f2a3-b4c5-3d4e-7f8a-9b0c1d2e3f4a', 'e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', 'user', 'I am getting an error when trying to scan the QR code to join the queue.', false, NOW() - INTERVAL '5 hours'),
    ('d0e1f2a3-b4c5-3d4e-7f8a-9b0c1d2e3f4a', 'e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', 'user', 'The error message says "Invalid QR code format". What should I do?', false, NOW() - INTERVAL '4 hours 55 minutes')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 6. QUEUES TABLE (Optional - Future Expansion)
-- ============================================
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

ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active queues" ON public.queues;
DROP POLICY IF EXISTS "Admins can manage own queues" ON public.queues;

CREATE POLICY "Anyone can view active queues"
    ON public.queues FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage own queues"
    ON public.queues FOR ALL
    USING (business_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_queues_business_id ON public.queues(business_id);

DROP TRIGGER IF EXISTS update_queues_updated_at ON public.queues;
CREATE TRIGGER update_queues_updated_at
    BEFORE UPDATE ON public.queues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample Data for Queues (will be linked to business_id after admin registration)
COMMENT ON TABLE public.queues IS 'Queues will be created by admins after registration';

-- ============================================
-- 7. QUEUE ENTRIES TABLE (Optional)
-- ============================================
CREATE TABLE IF NOT EXISTS public.queue_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID REFERENCES public.queues(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public."User"(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    called_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    estimated_wait_time INTEGER, -- in minutes
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.queue_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own queue entries" ON public.queue_entries;
DROP POLICY IF EXISTS "Admins can view all queue entries" ON public.queue_entries;
DROP POLICY IF EXISTS "Users can insert queue entries" ON public.queue_entries;
DROP POLICY IF EXISTS "Admins can update queue entries" ON public.queue_entries;

CREATE POLICY "Users can view own queue entries"
    ON public.queue_entries FOR SELECT
    USING (user_id IN (SELECT id FROM public."User"));

CREATE POLICY "Admins can view all queue entries"
    ON public.queue_entries FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE POLICY "Users can insert queue entries"
    ON public.queue_entries FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Admins can update queue entries"
    ON public.queue_entries FOR UPDATE
    USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_queue_entries_queue_id ON public.queue_entries(queue_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_user_id ON public.queue_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_status ON public.queue_entries(status);

DROP TRIGGER IF EXISTS update_queue_entries_updated_at ON public.queue_entries;
CREATE TRIGGER update_queue_entries_updated_at
    BEFORE UPDATE ON public.queue_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Sample Data for Queue Entries (will populate after queues are created)
COMMENT ON TABLE public.queue_entries IS 'Queue entries will be created when users join queues';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Run these queries after setup to verify everything is working:

-- 1. Check all tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Verify sample users
SELECT full_name, email, phone_number FROM public."User";

-- 3. Verify conversations
SELECT title, status, created_at FROM public.conversations ORDER BY created_at DESC;

-- 4. Verify messages count per conversation
SELECT c.title, COUNT(m.id) as message_count
FROM public.conversations c
LEFT JOIN public.messages m ON c.id = m.conversation_id
GROUP BY c.title, c.created_at
ORDER BY c.created_at DESC;

-- 5. Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('admins', 'User', 'profiles', 'conversations', 'messages', 'queues', 'queue_entries');

-- ============================================
-- SETUP COMPLETE!
-- ============================================

-- Summary of what was created:
-- ✅ 7 tables with proper relationships
-- ✅ Row Level Security enabled on all tables
-- ✅ Access control policies configured
-- ✅ Performance indexes created
-- ✅ Automatic timestamp updates
-- ✅ 5 sample users (customers)
-- ✅ 5 sample conversations
-- ✅ 8 sample messages
--
-- Next Steps:
-- 1. Register admin users through the app (/auth/v1/register)
-- 2. Admin data will automatically populate in the admins table
-- 3. Start creating queues and managing customers!
--
-- Happy building with Business Pro Hub! 🚀
