-- ============================================
-- VERIFY DATABASE SETUP
-- Run this AFTER running COMPLETE_FRESH_DATABASE.sql
-- ============================================

-- Check all tables exist
SELECT
    '📊 TABLES CHECK' as section,
    COUNT(*) as total_tables,
    STRING_AGG(tablename, ', ' ORDER BY tablename) as tables
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT LIKE 'pg_%'
AND tablename NOT LIKE 'sql_%';

-- Check RLS is enabled
SELECT
    '🔒 ROW LEVEL SECURITY CHECK' as section,
    tablename,
    CASE WHEN rowsecurity THEN '✅ Enabled' ELSE '❌ Disabled' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('admins', 'User', 'queues', 'services', 'staff', 'orders', 'feedback', 'business_hours')
ORDER BY tablename;

-- Check business types
SELECT
    '🏢 BUSINESS TYPES CHECK' as section,
    COUNT(*) as total_types,
    STRING_AGG(name, ', ' ORDER BY name) as types
FROM public.business_types;

-- Check sample customers
SELECT
    '👥 SAMPLE CUSTOMERS CHECK' as section,
    COUNT(*) as total_customers,
    STRING_AGG(full_name, ', ' ORDER BY full_name) as customers
FROM public."User";

-- Check indexes
SELECT
    '⚡ INDEXES CHECK' as section,
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('admins', 'queues', 'orders', 'services')
ORDER BY tablename, indexname;

-- Check triggers
SELECT
    '🔔 TRIGGERS CHECK' as section,
    event_object_table as table_name,
    trigger_name,
    event_manipulation as event,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('admins', 'queues', 'orders', 'services', 'staff', 'feedback', 'business_hours')
ORDER BY event_object_table;

-- Final summary
SELECT '✅ VERIFICATION COMPLETE!' as status;

-- Expected results:
SELECT
    '📊 EXPECTED RESULTS:' as info,
    '13 tables' as tables,
    '10 business types' as business_types,
    '5 sample customers' as customers,
    'RLS enabled on all tables' as security,
    '20+ indexes for performance' as indexes,
    '7+ triggers for auto-updates' as triggers;
