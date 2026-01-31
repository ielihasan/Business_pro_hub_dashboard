-- ================================================
-- Subscriptions & Payments Tables for BusinessHub Pro
-- Run this migration to enable pricing & plans functionality
-- ================================================

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    plan_id TEXT NOT NULL DEFAULT 'free',
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL,
    plan_id TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'PKR',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    payment_method TEXT NOT NULL DEFAULT 'card',
    description TEXT,
    transaction_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add subscription_plan column to admins table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'admins' AND column_name = 'subscription_plan'
    ) THEN
        ALTER TABLE admins ADD COLUMN subscription_plan TEXT DEFAULT 'free';
    END IF;
END $$;

-- Add subscription_status column to admins table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'admins' AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE admins ADD COLUMN subscription_status TEXT DEFAULT 'active';
    END IF;
END $$;

-- Add subscription_expires_at column to admins table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'admins' AND column_name = 'subscription_expires_at'
    ) THEN
        ALTER TABLE admins ADD COLUMN subscription_expires_at TIMESTAMPTZ;
    END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_business_id ON subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id ON subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_payments_business_id ON payments(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admins_subscription_plan ON admins(subscription_plan);

-- Create trigger to update updated_at on subscriptions
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trigger_update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscriptions_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = business_id);

DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON subscriptions;
CREATE POLICY "Users can insert their own subscriptions" ON subscriptions
    FOR INSERT WITH CHECK (auth.uid() = business_id);

DROP POLICY IF EXISTS "Users can update their own subscriptions" ON subscriptions;
CREATE POLICY "Users can update their own subscriptions" ON subscriptions
    FOR UPDATE USING (auth.uid() = business_id);

-- RLS Policies for payments
DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
CREATE POLICY "Users can view their own payments" ON payments
    FOR SELECT USING (auth.uid() = business_id);

DROP POLICY IF EXISTS "Users can insert their own payments" ON payments;
CREATE POLICY "Users can insert their own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = business_id);

-- Service role bypass for API operations
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON subscriptions;
CREATE POLICY "Service role can manage subscriptions" ON subscriptions
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage payments" ON payments;
CREATE POLICY "Service role can manage payments" ON payments
    FOR ALL USING (true) WITH CHECK (true);

-- ================================================
-- Verification queries (run these to verify setup)
-- ================================================
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'subscriptions';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'payments';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'admins' AND column_name LIKE 'subscription%';
