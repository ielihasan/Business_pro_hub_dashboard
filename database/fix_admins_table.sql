-- Fix admins table - Remove ALL foreign key constraints to prevent issues
-- Run this in Supabase SQL Editor

-- First, drop all existing FK constraints on admins table
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT constraint_name
              FROM information_schema.table_constraints
              WHERE table_name = 'admins'
              AND constraint_type = 'FOREIGN KEY')
    LOOP
        EXECUTE 'ALTER TABLE admins DROP CONSTRAINT ' || r.constraint_name;
    END LOOP;
END $$;

-- Verify no FK constraints remain
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS foreign_table,
    a.attname AS column_name,
    af.attname AS foreign_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.conrelid = 'admins'::regclass AND c.contype = 'f';

-- This should return no rows if all FK constraints are removed
