-- ============================================================
-- Professional Fix: Create businesses table as canonical source
-- of truth for business identity.
--
-- Design principle:
--   businesses.id = auth.users.id  (the owner's user UUID)
--
-- This means all existing queues.business_id values already
-- match — zero data migration needed on the queues table.
-- ============================================================

-- ── 1. Create the businesses table ──────────────────────────
CREATE TABLE IF NOT EXISTS public.businesses (
  id                   UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name            TEXT        NOT NULL,
  email                TEXT        UNIQUE NOT NULL,
  business_name        TEXT        NOT NULL,
  business_type        TEXT,
  business_address     TEXT,
  business_phone       TEXT,
  business_description TEXT,
  is_active            BOOLEAN     NOT NULL DEFAULT true,
  subscription_plan    TEXT        NOT NULL DEFAULT 'free',
  subscription_status  TEXT        NOT NULL DEFAULT 'active',
  subscription_expires_at TIMESTAMPTZ,
  approved_at          TIMESTAMPTZ,
  approved_by          UUID,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.businesses IS
  'Canonical business profile table. id = auth.users.id of the business owner.
   This is the single source of truth for all business identity — referenced
   by queues, services, subscriptions, and payments tables.';

-- ── 2. Populate from existing admins rows ───────────────────
-- Migrate all approved business_owner rows from admins → businesses.
-- Safe to run multiple times (ON CONFLICT DO NOTHING).
INSERT INTO public.businesses (
  id, full_name, email, business_name, business_type,
  business_address, business_phone, business_description,
  is_active, subscription_plan, subscription_status, subscription_expires_at,
  approved_at, approved_by, created_at, updated_at
)
SELECT
  a.id,
  a.full_name,
  a.email,
  COALESCE(a.business_name, 'Unnamed Business'),
  a.business_type,
  a.business_address,
  a.business_phone,
  a.business_description,
  true,
  COALESCE(a.subscription_plan, 'free'),
  COALESCE(a.subscription_status, 'active'),
  a.subscription_expires_at,
  a.approved_at,
  a.approved_by,
  COALESCE(a.created_at, NOW()),
  COALESCE(a.updated_at, NOW())
FROM public.admins a
WHERE a.role = 'business_owner'
  AND a.is_approved = true
  AND a.id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- ── 3. Fix the queues table FK ───────────────────────────────
-- Drop the broken FK that referenced the non-existent "Business" table.
ALTER TABLE public.queues
  DROP CONSTRAINT IF EXISTS queues_business_id_fkey;

-- Add the correct FK referencing businesses.id
ALTER TABLE public.queues
  ADD CONSTRAINT queues_business_id_fkey
  FOREIGN KEY (business_id)
  REFERENCES public.businesses(id)
  ON DELETE CASCADE;

-- ── 4. Fix services table FK (if it exists) ─────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'services'
  ) THEN
    ALTER TABLE public.services
      DROP CONSTRAINT IF EXISTS services_business_id_fkey;

    ALTER TABLE public.services
      ADD CONSTRAINT services_business_id_fkey
      FOREIGN KEY (business_id)
      REFERENCES public.businesses(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- ── 5. Fix subscriptions table FK (if it exists) ────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'subscriptions'
  ) THEN
    ALTER TABLE public.subscriptions
      DROP CONSTRAINT IF EXISTS subscriptions_business_id_fkey;

    ALTER TABLE public.subscriptions
      ADD CONSTRAINT subscriptions_business_id_fkey
      FOREIGN KEY (business_id)
      REFERENCES public.businesses(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- ── 6. Fix payments table FK (if it exists) ─────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'payments'
  ) THEN
    ALTER TABLE public.payments
      DROP CONSTRAINT IF EXISTS payments_business_id_fkey;

    ALTER TABLE public.payments
      ADD CONSTRAINT payments_business_id_fkey
      FOREIGN KEY (business_id)
      REFERENCES public.businesses(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- ── 7. Trigger: keep businesses in sync when admins is updated ─
CREATE OR REPLACE FUNCTION public.sync_business_from_admins()
RETURNS TRIGGER AS $$
BEGIN
  -- Only act on business_owner rows
  IF NEW.role = 'business_owner' AND NEW.is_approved = true THEN
    INSERT INTO public.businesses (
      id, full_name, email, business_name, business_type,
      business_address, business_phone, business_description,
      subscription_plan, subscription_status, subscription_expires_at,
      approved_at, approved_by, updated_at
    )
    VALUES (
      NEW.id,
      NEW.full_name,
      NEW.email,
      COALESCE(NEW.business_name, 'Unnamed Business'),
      NEW.business_type,
      NEW.business_address,
      NEW.business_phone,
      NEW.business_description,
      COALESCE(NEW.subscription_plan, 'free'),
      COALESCE(NEW.subscription_status, 'active'),
      NEW.subscription_expires_at,
      NEW.approved_at,
      NEW.approved_by,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name            = EXCLUDED.full_name,
      email                = EXCLUDED.email,
      business_name        = EXCLUDED.business_name,
      business_type        = EXCLUDED.business_type,
      business_address     = EXCLUDED.business_address,
      business_phone       = EXCLUDED.business_phone,
      business_description = EXCLUDED.business_description,
      subscription_plan    = EXCLUDED.subscription_plan,
      subscription_status  = EXCLUDED.subscription_status,
      subscription_expires_at = EXCLUDED.subscription_expires_at,
      approved_at          = EXCLUDED.approved_at,
      approved_by          = EXCLUDED.approved_by,
      updated_at           = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_business_from_admins ON public.admins;

CREATE TRIGGER trg_sync_business_from_admins
  AFTER INSERT OR UPDATE ON public.admins
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_business_from_admins();

-- ── 8. updated_at trigger for businesses table ───────────────
CREATE OR REPLACE FUNCTION public.update_businesses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_businesses_updated_at ON public.businesses;

CREATE TRIGGER trg_businesses_updated_at
  BEFORE UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_businesses_updated_at();

-- ── 9. Row Level Security ─────────────────────────────────────
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Business owners can read their own row
DROP POLICY IF EXISTS "businesses_select_own" ON public.businesses;
CREATE POLICY "businesses_select_own"
  ON public.businesses FOR SELECT
  USING (auth.uid() = id);

-- Anyone can read active businesses (for join-queue page)
DROP POLICY IF EXISTS "businesses_select_active_public" ON public.businesses;
CREATE POLICY "businesses_select_active_public"
  ON public.businesses FOR SELECT
  USING (is_active = true);

-- Business owner can update their own row
DROP POLICY IF EXISTS "businesses_update_own" ON public.businesses;
CREATE POLICY "businesses_update_own"
  ON public.businesses FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role (API) can do everything
DROP POLICY IF EXISTS "businesses_service_role_all" ON public.businesses;
CREATE POLICY "businesses_service_role_all"
  ON public.businesses FOR ALL
  USING (true) WITH CHECK (true);

-- ── 10. Indexes ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_businesses_email
  ON public.businesses(email);

CREATE INDEX IF NOT EXISTS idx_businesses_business_type
  ON public.businesses(business_type);

CREATE INDEX IF NOT EXISTS idx_businesses_is_active
  ON public.businesses(is_active);

CREATE INDEX IF NOT EXISTS idx_businesses_subscription_plan
  ON public.businesses(subscription_plan);

-- ── Verification ─────────────────────────────────────────────
DO $$
DECLARE
  biz_count  INTEGER;
  queue_fk   TEXT;
BEGIN
  SELECT COUNT(*) INTO biz_count FROM public.businesses;
  RAISE NOTICE '✓ businesses table created with % rows migrated', biz_count;

  SELECT constraint_name INTO queue_fk
  FROM information_schema.referential_constraints
  WHERE constraint_name = 'queues_business_id_fkey';

  IF queue_fk IS NOT NULL THEN
    RAISE NOTICE '✓ queues.business_id now correctly references businesses(id)';
  ELSE
    RAISE WARNING '✗ queues FK not created — check for errors above';
  END IF;
END $$;
