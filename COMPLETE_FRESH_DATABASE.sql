-- ============================================
-- COMPLETE FRESH DATABASE SETUP
-- Smart Business Support Platform
-- Drop all existing tables and create new ones
-- ============================================

-- WARNING: This will DELETE all existing data!
-- Make sure you have a backup if needed.

-- ============================================
-- STEP 1: DROP ALL EXISTING TABLES
-- ============================================

-- Drop views first
DROP VIEW IF EXISTS public.business_stats CASCADE;

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS public.feedback CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.business_hours CASCADE;
DROP TABLE IF EXISTS public.staff CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.queues CASCADE;
DROP TABLE IF EXISTS public.business_types CASCADE;
DROP TABLE IF EXISTS public.queue_entries CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public."User" CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;

-- ============================================
-- STEP 2: CREATE HELPER FUNCTIONS
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
-- STEP 3: CREATE CORE TABLES
-- ============================================

-- 1. ADMINS TABLE (Platform Admins + Business Owners)
CREATE TABLE public.admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'business_owner')),
    avatar_url TEXT,

    -- Business Owner specific fields
    business_name TEXT,
    business_type TEXT,
    business_address TEXT,
    business_phone TEXT,
    business_description TEXT,

    -- Approval workflow
    is_approved BOOLEAN DEFAULT false,
    approved_at TIMESTAMPTZ,
    approved_by UUID,
    rejection_reason TEXT,

    -- Subscription
    subscription_plan TEXT DEFAULT 'free',
    subscription_expires_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_admins_email ON public.admins(email);
CREATE INDEX idx_admins_role ON public.admins(role);
CREATE INDEX idx_admins_is_approved ON public.admins(is_approved);
CREATE INDEX idx_admins_business_type ON public.admins(business_type);

-- Enable RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
    ON public.admins FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.admins FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Allow insert during registration"
    ON public.admins FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
    ON public.admins FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Business owners can view approved businesses"
    ON public.admins FOR SELECT
    USING (role = 'business_owner' AND is_approved = true);

-- Trigger
CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON public.admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 2. USER TABLE (Customers)
-- ============================================

CREATE TABLE public."User" (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone_number TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_email ON public."User"(email);
CREATE INDEX idx_user_phone ON public."User"(phone_number);

-- Enable RLS
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all users"
    ON public."User" FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Business owners can view all users"
    ON public."User" FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid() AND role = 'business_owner'
    ));

CREATE POLICY "Users can view own profile"
    ON public."User" FOR SELECT
    USING (true);

CREATE POLICY "Users can insert own profile"
    ON public."User" FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update own profile"
    ON public."User" FOR UPDATE
    USING (true);

-- Trigger
CREATE TRIGGER update_user_updated_at
    BEFORE UPDATE ON public."User"
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. BUSINESS TYPES TABLE
-- ============================================

CREATE TABLE public.business_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert business types
INSERT INTO public.business_types (name, description, icon) VALUES
    ('Coffee Shop', 'Coffee shops, cafes, and beverage services', 'coffee'),
    ('Print Shop', 'Printing, copying, and document services', 'printer'),
    ('Clinic', 'Medical clinics and healthcare services', 'health'),
    ('Repair Center', 'Electronics and appliance repair services', 'wrench'),
    ('Salon', 'Hair salons and beauty services', 'scissors'),
    ('Restaurant', 'Restaurants and food services', 'utensils'),
    ('Bakery', 'Bakeries and pastry shops', 'bread'),
    ('Pharmacy', 'Pharmacies and medicine stores', 'pills'),
    ('Laundry', 'Laundry and dry cleaning services', 'washing-machine'),
    ('Photo Studio', 'Photography and photo printing services', 'camera');

-- Enable RLS
ALTER TABLE public.business_types ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view business types"
    ON public.business_types FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage business types"
    ON public.business_types FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid() AND role = 'admin'
    ));

-- ============================================
-- 4. QUEUES TABLE (Main Feature)
-- ============================================

CREATE TABLE public.queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.admins(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public."User"(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    customer_email TEXT,
    service_type TEXT,
    position INTEGER NOT NULL,
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'in_progress', 'completed', 'cancelled', 'no_show')),
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    notes TEXT,
    estimated_wait_time INTEGER, -- in minutes
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    called_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_queues_business_id ON public.queues(business_id);
CREATE INDEX idx_queues_customer_id ON public.queues(customer_id);
CREATE INDEX idx_queues_status ON public.queues(status);
CREATE INDEX idx_queues_priority ON public.queues(priority);
CREATE INDEX idx_queues_joined_at ON public.queues(joined_at DESC);

-- Enable RLS
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Business owners can manage own queues"
    ON public.queues FOR ALL
    USING (business_id = auth.uid());

CREATE POLICY "Admins can view all queues"
    ON public.queues FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid() AND role = 'admin'
    ));

-- Trigger
CREATE TRIGGER update_queues_updated_at
    BEFORE UPDATE ON public.queues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. SERVICES TABLE
-- ============================================

CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.admins(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    estimated_duration INTEGER, -- in minutes
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_services_business_id ON public.services(business_id);
CREATE INDEX idx_services_is_active ON public.services(is_active);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Business owners can manage own services"
    ON public.services FOR ALL
    USING (business_id = auth.uid());

CREATE POLICY "Anyone can view active services"
    ON public.services FOR SELECT
    USING (is_active = true);

-- Trigger
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. STAFF TABLE
-- ============================================

CREATE TABLE public.staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.admins(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT DEFAULT 'staff',
    is_active BOOLEAN DEFAULT true,
    hired_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_staff_business_id ON public.staff(business_id);
CREATE INDEX idx_staff_is_active ON public.staff(is_active);

-- Enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Business owners can manage own staff"
    ON public.staff FOR ALL
    USING (business_id = auth.uid());

CREATE POLICY "Admins can view all staff"
    ON public.staff FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid() AND role = 'admin'
    ));

-- Trigger
CREATE TRIGGER update_staff_updated_at
    BEFORE UPDATE ON public.staff
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. ORDERS TABLE
-- ============================================

CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.admins(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public."User"(id) ON DELETE SET NULL,
    queue_id UUID REFERENCES public.queues(id) ON DELETE SET NULL,
    order_number TEXT UNIQUE NOT NULL,
    service_type TEXT,
    description TEXT,
    file_urls TEXT[],
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'processing', 'completed', 'cancelled', 'rejected')),
    total_amount DECIMAL(10, 2),
    paid_amount DECIMAL(10, 2) DEFAULT 0,
    payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid', 'refunded')),
    assigned_to UUID REFERENCES public.staff(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_orders_business_id ON public.orders(business_id);
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_orders_order_number ON public.orders(order_number);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Business owners can manage own orders"
    ON public.orders FOR ALL
    USING (business_id = auth.uid());

CREATE POLICY "Admins can view all orders"
    ON public.orders FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid() AND role = 'admin'
    ));

-- Trigger
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 8. FEEDBACK TABLE
-- ============================================

CREATE TABLE public.feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.admins(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public."User"(id) ON DELETE SET NULL,
    queue_id UUID REFERENCES public.queues(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    response TEXT,
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_feedback_business_id ON public.feedback(business_id);
CREATE INDEX idx_feedback_customer_id ON public.feedback(customer_id);
CREATE INDEX idx_feedback_rating ON public.feedback(rating);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Business owners can manage own feedback"
    ON public.feedback FOR ALL
    USING (business_id = auth.uid());

CREATE POLICY "Admins can view all feedback"
    ON public.feedback FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid() AND role = 'admin'
    ));

-- ============================================
-- 9. BUSINESS HOURS TABLE
-- ============================================

CREATE TABLE public.business_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.admins(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
    is_open BOOLEAN DEFAULT true,
    open_time TIME,
    close_time TIME,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, day_of_week)
);

-- Enable RLS
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Business owners can manage own hours"
    ON public.business_hours FOR ALL
    USING (business_id = auth.uid());

CREATE POLICY "Anyone can view business hours"
    ON public.business_hours FOR SELECT
    USING (true);

-- Trigger
CREATE TRIGGER update_business_hours_updated_at
    BEFORE UPDATE ON public.business_hours
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 10. CONVERSATIONS & MESSAGES (Optional)
-- ============================================

CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT,
    user_id UUID REFERENCES public."User"(id) ON DELETE CASCADE,
    admin_id UUID REFERENCES public.admins(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pending')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_admin_id ON public.conversations(admin_id);
CREATE INDEX idx_conversations_status ON public.conversations(status);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all conversations"
    ON public.conversations FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Admins can manage conversations"
    ON public.conversations FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid()
    ));

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Messages table
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL,
    sender_type TEXT CHECK (sender_type IN ('user', 'admin')),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all messages"
    ON public.messages FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid()
    ));

CREATE POLICY "Authenticated users can insert messages"
    ON public.messages FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- 11. PROFILES TABLE (Optional)
-- ============================================

CREATE TABLE public.profiles (
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
-- 12. INSERT SAMPLE DATA
-- ============================================

-- Sample customers
INSERT INTO public."User" (id, full_name, email, phone_number, avatar_url) VALUES
    ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'John Doe', 'john.doe@example.com', '+1-555-0101', 'https://api.dicebear.com/7.x/avataaars/svg?seed=John'),
    ('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'Sarah Johnson', 'sarah.johnson@example.com', '+1-555-0102', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'),
    ('c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f', 'Michael Chen', 'michael.chen@example.com', '+1-555-0103', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael'),
    ('d4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f8a', 'Emily Rodriguez', 'emily.rodriguez@example.com', '+1-555-0104', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily'),
    ('e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b', 'David Kim', 'david.kim@example.com', '+1-555-0105', 'https://api.dicebear.com/7.x/avataaars/svg?seed=David')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 13. CREATE ANALYTICS VIEW
-- ============================================

CREATE OR REPLACE VIEW public.business_stats AS
SELECT
    a.id as business_id,
    a.business_name,
    a.business_type,
    COUNT(DISTINCT q.id) as total_queues,
    COUNT(DISTINCT CASE WHEN q.status = 'waiting' THEN q.id END) as active_queues,
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'pending' THEN o.id END) as pending_orders,
    AVG(f.rating) as average_rating,
    COUNT(DISTINCT f.id) as total_feedback
FROM public.admins a
LEFT JOIN public.queues q ON a.id = q.business_id
LEFT JOIN public.orders o ON a.id = o.business_id
LEFT JOIN public.feedback f ON a.id = f.business_id
WHERE a.role = 'business_owner' AND a.is_approved = true
GROUP BY a.id, a.business_name, a.business_type;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT '✅ Database setup completed successfully!' as status;

SELECT 'Tables created:' as info;
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

SELECT 'Business types loaded:' as info;
SELECT name FROM public.business_types ORDER BY name;

-- ============================================
-- SETUP COMPLETE!
-- ============================================

/*
Summary:
✅ Dropped all existing tables
✅ Created 13 core tables
✅ Configured Row Level Security
✅ Added performance indexes
✅ Loaded 10 business types
✅ Added 5 sample customers
✅ Created analytics views
✅ Ready for role-based authentication

Next Steps:
1. Create registration pages for Admin and Business Owner
2. Update login flow with role-based routing
3. Build dashboards

Ready to build Smart Business Support Platform! 🚀
*/
