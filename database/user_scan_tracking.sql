-- ================================================================
-- User Scan Tracking: Mobile App User Table + Queue Integration
-- ================================================================
-- Run this in the Supabase SQL Editor for project hjblbmmyfznxomsrxhme
-- ================================================================

-- ── 1. "User" table — mobile app users who scan QR codes ────────
-- Uses Supabase auth.users as the identity provider.
-- `id` = auth.users.id so Supabase Auth tokens work directly.

CREATE TABLE IF NOT EXISTS "User" (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      TEXT,
  email          TEXT,
  phone_number   TEXT,
  avatar_url     TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_user_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_updated_at ON "User";
CREATE TRIGGER user_updated_at
  BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION update_user_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);

-- RLS: users can only read/write their own row; service role bypasses
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON "User";
CREATE POLICY "Users can view own profile" ON "User"
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON "User";
CREATE POLICY "Users can update own profile" ON "User"
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON "User";
CREATE POLICY "Users can insert own profile" ON "User"
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role (dashboard server) full access — already bypasses RLS
-- No extra policy needed for service role.

-- ── 2. Ensure queues table has customer_id column ───────────────
-- customer_id stores the User.id of the app user who scanned the QR.
-- It is NULL for walk-ins added manually by the business.

ALTER TABLE queues
  ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES "User"(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_queues_customer_id ON queues(customer_id);

-- ── 3. Confirm existing columns (informational) ─────────────────
-- The queues table should already have:
--   business_id, customer_name, customer_phone, customer_email,
--   service_type, notes, priority, position, status,
--   joined_at, started_at, completed_at, cancelled_at,
--   created_at, updated_at
-- ================================================================
