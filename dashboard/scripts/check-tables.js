const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://hjblbmmyfznxomsrxhme.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqYmxibW15ZnpueG9tc3J4aG1lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODk4OTQwOCwiZXhwIjoyMDg0NTY1NDA4fQ.y5Pujuy6foMlFgZGxOsn11A4sDAFF3SjxombxDFPGTg"
);

async function check() {
  const tables = ["queue_types", "queue_entries", "queue_qr_codes", "admins", "User"];

  for (const table of tables) {
    const { data, error } = await supabase.from(table).select("*").limit(1);
    console.log(`\n${table}:`);
    if (error) {
      console.log(`  Error: ${error.message}`);
      console.log(`  Code: ${error.code}`);
      console.log(`  Details: ${error.details}`);
    } else {
      console.log(`  EXISTS - rows returned: ${data?.length || 0}`);
      if (data && data.length > 0) {
        console.log(`  Columns: ${Object.keys(data[0]).join(", ")}`);
      }
    }
  }
}

check();
