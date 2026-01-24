-- Fix admins table foreign key constraint
-- Run this in Supabase SQL Editor

-- Drop the existing foreign key constraint
ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_id_fkey;

-- Add the correct foreign key constraint pointing to auth.users
ALTER TABLE admins
ADD CONSTRAINT admins_id_fkey
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Verify the constraint was added
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
