-- ============================================
-- ROLE-BASED AUTHENTICATION UPDATE
-- Smart Business Support Platform
-- ============================================

-- This script updates the existing database to support:
-- 1. Admin role
-- 2. Business Owner role
-- 3. Business-specific information
-- 4. Approval workflow

-- ============================================
-- 1. UPDATE ADMINS TABLE FOR ROLE-BASED AUTH
-- ============================================

-- Add new columns for business owners
ALTER TABLE public.admins
  ADD COLUMN IF NOT EXISTS business_name TEXT,
  ADD COLUMN IF NOT EXISTS business_type TEXT,
  ADD COLUMN IF NOT EXISTS business_address TEXT,
  ADD COLUMN IF NOT EXISTS business_phone TEXT,
  ADD COLUMN IF NOT EXISTS business_description TEXT,
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.admins(id),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Update role constraint to allow both admin and business_owner
ALTER TABLE public.admins DROP CONSTRAINT IF EXISTS admins_role_check;
ALTER TABLE public.admins
  ADD CONSTRAINT admins_role_check CHECK (role IN ('admin', 'business_owner'));

-- Create index for faster role-based queries
CREATE INDEX IF NOT EXISTS idx_admins_role ON public.admins(role);
CREATE INDEX IF NOT EXISTS idx_admins_is_approved ON public.admins(is_approved);
CREATE INDEX IF NOT EXISTS idx_admins_business_type ON public.admins(business_type);

-- Update RLS policies for role-based access
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.admins;
CREATE POLICY "Admins can view all profiles"
    ON public.admins FOR SELECT
    USING (
      auth.uid() = id OR
      EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "Business owners can view approved business profiles" ON public.admins;
CREATE POLICY "Business owners can view approved business profiles"
    ON public.admins FOR SELECT
    USING (
      role = 'business_owner' AND is_approved = true
    );

-- ============================================
-- 2. CREATE BUSINESS_TYPES LOOKUP TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.business_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    icon TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert common business types
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
    ('Photo Studio', 'Photography and photo printing services', 'camera')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE public.business_types ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view business types
CREATE POLICY "Anyone can view business types"
    ON public.business_types FOR SELECT
    USING (is_active = true);

-- Only admins can manage business types
CREATE POLICY "Admins can manage business types"
    ON public.business_types FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid() AND role = 'admin'
    ));

-- ============================================
-- 3. CREATE QUEUES TABLE (MAIN FEATURE)
-- ============================================

CREATE TABLE IF NOT EXISTS public.queues (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_queues_business_id ON public.queues(business_id);
CREATE INDEX IF NOT EXISTS idx_queues_customer_id ON public.queues(customer_id);
CREATE INDEX IF NOT EXISTS idx_queues_status ON public.queues(status);
CREATE INDEX IF NOT EXISTS idx_queues_priority ON public.queues(priority);
CREATE INDEX IF NOT EXISTS idx_queues_joined_at ON public.queues(joined_at DESC);

-- Enable RLS
ALTER TABLE public.queues ENABLE ROW LEVEL SECURITY;

-- Business owners can manage their own queues
CREATE POLICY "Business owners can manage own queues"
    ON public.queues FOR ALL
    USING (business_id IN (
        SELECT id FROM public.admins WHERE id = auth.uid() AND role = 'business_owner'
    ));

-- Customers can view their own queue entries
CREATE POLICY "Customers can view own queue entries"
    ON public.queues FOR SELECT
    USING (customer_id IN (
        SELECT id FROM public."User"
    ));

-- Admins can view all queues
CREATE POLICY "Admins can view all queues"
    ON public.queues FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE id = auth.uid() AND role = 'admin'
    ));

-- Create trigger for updated_at
CREATE TRIGGER update_queues_updated_at
    BEFORE UPDATE ON public.queues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. CREATE SERVICES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.services (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_services_business_id ON public.services(business_id);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Business owners can manage their own services
CREATE POLICY "Business owners can manage own services"
    ON public.services FOR ALL
    USING (business_id = auth.uid());

-- Everyone can view active services
CREATE POLICY "Anyone can view active services"
    ON public.services FOR SELECT
    USING (is_active = true);

-- Create trigger
CREATE TRIGGER update_services_updated_at
    BEFORE UPDATE ON public.services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. CREATE STAFF TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.staff (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_staff_business_id ON public.staff(business_id);
CREATE INDEX IF NOT EXISTS idx_staff_is_active ON public.staff(is_active);

-- Enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

-- Business owners can manage their own staff
CREATE POLICY "Business owners can manage own staff"
    ON public.staff FOR ALL
    USING (business_id = auth.uid());

-- Create trigger
CREATE TRIGGER update_staff_updated_at
    BEFORE UPDATE ON public.staff
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. CREATE ORDERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.admins(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public."User"(id) ON DELETE SET NULL,
    queue_id UUID REFERENCES public.queues(id) ON DELETE SET NULL,
    order_number TEXT UNIQUE NOT NULL,
    service_type TEXT,
    description TEXT,
    file_urls TEXT[], -- Array of file URLs
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_business_id ON public.orders(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Business owners can manage their own orders
CREATE POLICY "Business owners can manage own orders"
    ON public.orders FOR ALL
    USING (business_id = auth.uid());

-- Customers can view their own orders
CREATE POLICY "Customers can view own orders"
    ON public.orders FOR SELECT
    USING (customer_id IN (
        SELECT id FROM public."User"
    ));

-- Create trigger
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. CREATE FEEDBACK TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.feedback (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_feedback_business_id ON public.feedback(business_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON public.feedback(rating);

-- Enable RLS
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Business owners can view and respond to their feedback
CREATE POLICY "Business owners can manage own feedback"
    ON public.feedback FOR ALL
    USING (business_id = auth.uid());

-- Customers can create and view their own feedback
CREATE POLICY "Customers can manage own feedback"
    ON public.feedback FOR ALL
    USING (customer_id IN (
        SELECT id FROM public."User"
    ));

-- ============================================
-- 8. CREATE BUSINESS_HOURS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.business_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.admins(id) ON DELETE CASCADE,
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
    is_open BOOLEAN DEFAULT true,
    open_time TIME,
    close_time TIME,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, day_of_week)
);

-- Enable RLS
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

-- Business owners can manage their own hours
CREATE POLICY "Business owners can manage own hours"
    ON public.business_hours FOR ALL
    USING (business_id = auth.uid());

-- Everyone can view business hours
CREATE POLICY "Anyone can view business hours"
    ON public.business_hours FOR SELECT
    USING (true);

-- ============================================
-- 9. CREATE ANALYTICS/STATS VIEWS
-- ============================================

-- Business summary view
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
-- 10. INSERT SAMPLE DATA FOR TESTING
-- ============================================

-- Note: Admin users will be created through registration
-- This is just to show the structure

COMMENT ON TABLE public.admins IS 'Stores both platform admins and business owners with role-based access';
COMMENT ON TABLE public.queues IS 'Active and historical queue entries for all businesses';
COMMENT ON TABLE public.services IS 'Services offered by each business with pricing and duration';
COMMENT ON TABLE public.staff IS 'Staff members for each business';
COMMENT ON TABLE public.orders IS 'Customer orders with status tracking and file submissions';
COMMENT ON TABLE public.feedback IS 'Customer feedback and ratings for businesses';
COMMENT ON TABLE public.business_hours IS 'Operating hours for each business';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all tables
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('admins', 'queues', 'services', 'staff', 'orders', 'feedback', 'business_hours', 'business_types')
ORDER BY tablename;

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('admins', 'queues', 'services', 'staff', 'orders', 'feedback', 'business_hours', 'business_types');

-- Check business types
SELECT name, description FROM public.business_types ORDER BY name;

-- ============================================
-- SETUP COMPLETE!
-- ============================================

-- Summary:
-- ✅ Updated admins table for role-based access (admin, business_owner)
-- ✅ Created business_types lookup table
-- ✅ Created queues table for queue management
-- ✅ Created services table for business services
-- ✅ Created staff table for employee management
-- ✅ Created orders table for order processing
-- ✅ Created feedback table for customer reviews
-- ✅ Created business_hours table for operating hours
-- ✅ Added comprehensive indexes for performance
-- ✅ Configured Row Level Security policies
-- ✅ Created analytics views
--
-- Next Steps:
-- 1. Update registration to support business owner signup
-- 2. Update login to check role and redirect accordingly
-- 3. Build admin approval workflow
-- 4. Create role-specific dashboards
--
-- Ready to build Smart Business Support Platform! 🚀
