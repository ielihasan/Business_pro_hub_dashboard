/**
 * Database Fix Script
 * This script removes FK constraints from the admins table
 *
 * To use:
 * 1. Make sure you have your SUPABASE_SERVICE_ROLE_KEY in .env.local
 * 2. Run: node scripts/run-database-fix.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key needed for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runFix() {
  console.log('🔧 Starting database fix...\n');

  try {
    // Step 1: Drop FK constraints
    console.log('Step 1: Removing FK constraints from admins table...');
    const { data: dropResult, error: dropError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        DECLARE
            r RECORD;
        BEGIN
            FOR r IN (SELECT constraint_name
                      FROM information_schema.table_constraints
                      WHERE table_name = 'admins'
                      AND constraint_type = 'FOREIGN KEY')
            LOOP
                EXECUTE 'ALTER TABLE admins DROP CONSTRAINT IF EXISTS ' || r.constraint_name;
                RAISE NOTICE 'Dropped constraint: %', r.constraint_name;
            END LOOP;
        END $$;
      `
    });

    if (dropError) {
      console.error('❌ Error dropping constraints:', dropError);
      // Note: This might fail if exec_sql RPC doesn't exist
      console.log('\n⚠️  The RPC function might not exist. You need to run the SQL manually in Supabase SQL Editor.');
      console.log('See: database/FINAL_FIX.sql');
      return;
    }

    console.log('✅ FK constraints removed\n');

    // Step 2: Verify
    console.log('Step 2: Verifying constraints...');
    const { data: constraints, error: verifyError } = await supabase
      .from('information_schema.table_constraints')
      .select('constraint_name, constraint_type')
      .eq('table_name', 'admins')
      .eq('constraint_type', 'FOREIGN KEY');

    if (verifyError) {
      console.error('❌ Error verifying:', verifyError);
    } else {
      console.log('Remaining FK constraints:', constraints?.length || 0);
      if (constraints && constraints.length > 0) {
        console.log(constraints);
      } else {
        console.log('✅ No FK constraints remain\n');
      }
    }

    // Step 3: Check pending applications
    console.log('Step 3: Checking pending applications...');
    const { data: pending, error: pendingError } = await supabase
      .from('business_applications')
      .select('user_id, email, business_name, created_at')
      .eq('is_approved', false)
      .eq('is_rejected', false);

    if (pendingError) {
      console.error('❌ Error fetching pending:', pendingError);
    } else {
      console.log(`Found ${pending?.length || 0} pending applications:`);
      if (pending && pending.length > 0) {
        pending.forEach((app, i) => {
          console.log(`  ${i + 1}. ${app.business_name} (${app.email})`);
        });
      }
    }

    console.log('\n✅ Database fix complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Try approving a business in /admin/businesses/pending');
    console.log('2. Check the browser console for any errors');

  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

runFix();
