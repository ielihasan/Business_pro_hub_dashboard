-- Script to completely delete a user from the system
-- Replace 'user@example.com' with the actual email you want to delete

-- Step 1: Find the user_id from auth.users
-- Copy the id from the result
SELECT id, email FROM auth.users WHERE email = 'user@example.com';

-- Step 2: Delete from business_applications (if exists)
DELETE FROM business_applications WHERE email = 'user@example.com';
-- OR using user_id:
-- DELETE FROM business_applications WHERE user_id = 'USER_ID_HERE';

-- Step 3: Delete from admins (if exists)
DELETE FROM admins WHERE email = 'user@example.com';
-- OR using user_id:
-- DELETE FROM admins WHERE id = 'USER_ID_HERE';

-- Step 4: Delete from auth.users (this is the critical step!)
-- You need to use Supabase Admin API or the dashboard for this
-- OR if you have the right permissions:
DELETE FROM auth.users WHERE email = 'user@example.com';


-- ====================================
-- ALTERNATIVE: Delete by user_id
-- ====================================
-- If you have the user_id, you can delete all at once:

DO $$
DECLARE
    v_user_id uuid := 'PASTE_USER_ID_HERE'; -- Replace with actual user ID
BEGIN
    -- Delete from business_applications
    DELETE FROM business_applications WHERE user_id = v_user_id;

    -- Delete from admins
    DELETE FROM admins WHERE id = v_user_id;

    -- Delete from auth.users
    DELETE FROM auth.users WHERE id = v_user_id;

    RAISE NOTICE 'User % deleted successfully', v_user_id;
END $$;


-- ====================================
-- BULK DELETE: Delete multiple users by email
-- ====================================
DO $$
DECLARE
    v_email text[] := ARRAY['user1@example.com', 'user2@example.com']; -- Add emails here
    v_user_id uuid;
BEGIN
    FOR i IN 1..array_length(v_email, 1) LOOP
        -- Get user_id
        SELECT id INTO v_user_id FROM auth.users WHERE email = v_email[i];

        IF v_user_id IS NOT NULL THEN
            -- Delete from all tables
            DELETE FROM business_applications WHERE user_id = v_user_id;
            DELETE FROM admins WHERE id = v_user_id;
            DELETE FROM auth.users WHERE id = v_user_id;

            RAISE NOTICE 'Deleted user: %', v_email[i];
        ELSE
            RAISE NOTICE 'User not found: %', v_email[i];
        END IF;
    END LOOP;
END $$;
