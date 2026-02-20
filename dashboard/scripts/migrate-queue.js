/**
 * Queue system migration script.
 *
 * Usage:
 *   node scripts/migrate-queue.js <database_password>
 *
 * The password is your Supabase database password from:
 *   Supabase Dashboard > Project Settings > Database > Connection string
 */

const { Client } = require("pg");

const DB_PASSWORD = process.argv[2];
if (!DB_PASSWORD) {
  console.error("Usage: node scripts/migrate-queue.js <database_password>");
  process.exit(1);
}

// Try all possible pooler regions
const REGIONS = [
  "aws-0-ap-south-1",
  "aws-0-us-east-1",
  "aws-0-us-west-1",
  "aws-0-eu-west-1",
  "aws-0-eu-central-1",
  "aws-0-ap-northeast-1",
  "aws-0-ap-southeast-2",
  "aws-0-sa-east-1",
  "aws-0-us-east-2",
  "aws-0-eu-west-2",
  "aws-0-ap-northeast-2",
  "aws-0-eu-north-1",
  "aws-0-ca-central-1",
  "aws-0-eu-west-3",
  "aws-0-eu-central-2",
];
let connectionString = null; // will be set in run()

const MIGRATION_SQL = `
-- 1. Create queue_types table
CREATE TABLE IF NOT EXISTS queue_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'users',
  estimated_service_time INT DEFAULT 5,
  max_capacity INT DEFAULT 50,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create queue_entries table
CREATE TABLE IF NOT EXISTS queue_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  user_id UUID REFERENCES "User"(id),
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  service_type TEXT,
  queue_type_id UUID REFERENCES queue_types(id),
  queue_type_name TEXT,
  ticket_number TEXT NOT NULL,
  position INT NOT NULL,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting','serving','completed','cancelled')),
  priority TEXT DEFAULT 'normal',
  notes TEXT,
  joined_via TEXT DEFAULT 'walk_in' CHECK (joined_via IN ('walk_in','qr_code','app')),
  served_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create queue_qr_codes table
CREATE TABLE IF NOT EXISTS queue_qr_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  queue_type_id UUID REFERENCES queue_types(id) ON DELETE CASCADE,
  qr_code_data TEXT NOT NULL,
  join_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(business_id, queue_type_id)
);

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_queue_entries_business_id ON queue_entries(business_id);
CREATE INDEX IF NOT EXISTS idx_queue_entries_status ON queue_entries(status);
CREATE INDEX IF NOT EXISTS idx_queue_entries_created_at ON queue_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_queue_entries_user_id ON queue_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_queue_types_business_id ON queue_types(business_id);
CREATE INDEX IF NOT EXISTS idx_queue_qr_codes_business_id ON queue_qr_codes(business_id);

-- 5. Enable RLS
ALTER TABLE queue_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE queue_qr_codes ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies (allow all via service role)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'queue_types' AND policyname = 'Service role full access') THEN
    CREATE POLICY "Service role full access" ON queue_types FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'queue_entries' AND policyname = 'Service role full access') THEN
    CREATE POLICY "Service role full access" ON queue_entries FOR ALL USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'queue_qr_codes' AND policyname = 'Service role full access') THEN
    CREATE POLICY "Service role full access" ON queue_qr_codes FOR ALL USING (true);
  END IF;
END $$;
`;

async function tryConnect(connStr, label) {
  const client = new Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });
  try {
    await client.connect();
    return client;
  } catch (err) {
    console.log(`  [${label}] Failed: ${err.message}`);
    try { await client.end(); } catch (_) {}
    return null;
  }
}

async function run() {
  const encodedPw = encodeURIComponent(DB_PASSWORD);
  let client = null;

  // Try session mode (port 5432) and transaction mode (port 6543)
  for (const port of [6543, 5432]) {
    for (const region of REGIONS) {
      const connStr = `postgresql://postgres.hjblbmmyfznxomsrxhme:${encodedPw}@${region}.pooler.supabase.com:${port}/postgres`;
      console.log(`Trying ${region}:${port}...`);
      client = await tryConnect(connStr, `${region}:${port}`);
      if (client) break;
    }
    if (client) break;
  }

  if (!client) {
    console.error("\nAll connection attempts failed. Please run the SQL manually in Supabase SQL Editor.");
    process.exit(1);
  }

  try {
    console.log("\nConnected successfully! Running migration...");
    await client.query(MIGRATION_SQL);
    console.log("Migration completed successfully!");

    const res = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('queue_types', 'queue_entries', 'queue_qr_codes')
      ORDER BY table_name;
    `);
    console.log("Verified tables:", res.rows.map((r) => r.table_name));
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
