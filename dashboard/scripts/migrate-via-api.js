/**
 * Run migration via Supabase REST API using the service role key.
 * This uses the supabase-js client to call rpc or direct table operations.
 *
 * Since Supabase REST API doesn't support raw DDL, this script uses
 * the Supabase Management API instead.
 */

const SUPABASE_URL = "https://hjblbmmyfznxomsrxhme.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqYmxibW15ZnpueG9tc3J4aG1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODk4OTQwOCwiZXhwIjoyMDg0NTY1NDA4fQ.y5Pujuy6foMlFgZGxOsn11A4sDAFF3SjxombxDFPGTg";

const MIGRATION_STATEMENTS = [
  // 1. Create queue_types table
  `CREATE TABLE IF NOT EXISTS queue_types (
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
  )`,

  // 2. Create queue_entries table
  `CREATE TABLE IF NOT EXISTS queue_entries (
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
  )`,

  // 3. Create queue_qr_codes table
  `CREATE TABLE IF NOT EXISTS queue_qr_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    queue_type_id UUID REFERENCES queue_types(id) ON DELETE CASCADE,
    qr_code_data TEXT NOT NULL,
    join_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(business_id, queue_type_id)
  )`,

  // 4. Indexes
  `CREATE INDEX IF NOT EXISTS idx_queue_entries_business_id ON queue_entries(business_id)`,
  `CREATE INDEX IF NOT EXISTS idx_queue_entries_status ON queue_entries(status)`,
  `CREATE INDEX IF NOT EXISTS idx_queue_entries_created_at ON queue_entries(created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_queue_entries_user_id ON queue_entries(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_queue_types_business_id ON queue_types(business_id)`,
  `CREATE INDEX IF NOT EXISTS idx_queue_qr_codes_business_id ON queue_qr_codes(business_id)`,

  // 5. Enable RLS
  `ALTER TABLE queue_types ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE queue_entries ENABLE ROW LEVEL SECURITY`,
  `ALTER TABLE queue_qr_codes ENABLE ROW LEVEL SECURITY`,

  // 6. RLS Policies
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'queue_types' AND policyname = 'Service role full access') THEN
      CREATE POLICY "Service role full access" ON queue_types FOR ALL USING (true);
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'queue_entries' AND policyname = 'Service role full access') THEN
      CREATE POLICY "Service role full access" ON queue_entries FOR ALL USING (true);
    END IF;
  END $$`,
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'queue_qr_codes' AND policyname = 'Service role full access') THEN
      CREATE POLICY "Service role full access" ON queue_qr_codes FOR ALL USING (true);
    END IF;
  END $$`,
];

async function executeSql(sql) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  return response.json();
}

async function run() {
  // First check if exec_sql function exists, if not we need another approach
  console.log("Checking if exec_sql RPC function exists...");
  try {
    await executeSql("SELECT 1");
    console.log("exec_sql function exists! Running migration...");

    for (let i = 0; i < MIGRATION_STATEMENTS.length; i++) {
      const sql = MIGRATION_STATEMENTS[i];
      const label = sql.substring(0, 60).replace(/\n/g, " ").trim();
      console.log(`  [${i + 1}/${MIGRATION_STATEMENTS.length}] ${label}...`);
      await executeSql(sql);
    }
    console.log("\nMigration completed successfully!");
  } catch (err) {
    if (err.message.includes("404") || err.message.includes("Could not find")) {
      console.log("exec_sql RPC not available. Trying query endpoint...");
      // Try the /pg/query endpoint (available on some Supabase versions)
      await tryQueryEndpoint();
    } else {
      console.error("Error:", err.message);
      console.log("\nTrying alternative SQL execution approach...");
      await tryQueryEndpoint();
    }
  }
}

async function tryQueryEndpoint() {
  // Try the SQL query endpoint that some Supabase instances expose
  const endpoints = [
    "/pg/query",
    "/rest/v1/rpc/",
  ];

  // Try creating the exec_sql function first via pg_net or similar
  console.log("Attempting to use pg_catalog approach...");

  // Use the Supabase client to check what tables exist
  const { createClient } = require("@supabase/supabase-js");
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // Check if tables already exist
  console.log("\nChecking existing tables...");
  const { data: queueTypes, error: qtErr } = await supabase.from("queue_types").select("id").limit(1);
  const { data: queueEntries, error: qeErr } = await supabase.from("queue_entries").select("id").limit(1);
  const { data: qrCodes, error: qrErr } = await supabase.from("queue_qr_codes").select("id").limit(1);

  const qtExists = !qtErr || !qtErr.message?.includes("does not exist");
  const qeExists = !qeErr || !qeErr.message?.includes("does not exist");
  const qrExists = !qrErr || !qrErr.message?.includes("does not exist");

  console.log(`  queue_types: ${qtExists ? "EXISTS" : "MISSING"} ${qtErr ? `(${qtErr.message?.substring(0, 80)})` : ""}`);
  console.log(`  queue_entries: ${qeExists ? "EXISTS" : "MISSING"} ${qeErr ? `(${qeErr.message?.substring(0, 80)})` : ""}`);
  console.log(`  queue_qr_codes: ${qrExists ? "EXISTS" : "MISSING"} ${qrErr ? `(${qrErr.message?.substring(0, 80)})` : ""}`);

  if (qtExists && qeExists && qrExists) {
    console.log("\nAll tables already exist! No migration needed.");
    return;
  }

  console.log("\nTables are missing. Cannot run DDL via REST API.");
  console.log("Please run the migration SQL in the Supabase SQL Editor.");
  console.log("Go to: https://supabase.com/dashboard/project/hjblbmmyfznxomsrxhme/sql");
  process.exit(1);
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
