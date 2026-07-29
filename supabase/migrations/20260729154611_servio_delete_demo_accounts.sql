/*
# SERVIO — Delete all demo/test accounts

## What this does
Removes all 9 demo provider accounts and their cascading data (provider_profiles,
portfolio_items, reviews, conversations, messages, favorites, identities).
Only the admin account (admin@servio.com) is preserved.
*/

DO $$
DECLARE
  admin_id uuid;
  demo_user RECORD;
BEGIN
  SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@servio.com';

  FOR demo_user IN SELECT id FROM auth.users WHERE email != 'admin@servio.com'
  LOOP
    -- Cascade deletes handle: provider_profiles, portfolio_items, reviews,
    -- conversations (participant), messages (sender), favorites, profiles
    DELETE FROM auth.identities WHERE user_id = demo_user.id;
    DELETE FROM auth.users WHERE id = demo_user.id;
  END LOOP;

  RAISE NOTICE 'Deleted all demo accounts. Admin preserved: %', admin_id;
END $$;

-- Also clean up any reviews or favorites referencing deleted data
DELETE FROM public.reviews WHERE author_id NOT IN (SELECT id FROM auth.users);
DELETE FROM public.favorites WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Verify
SELECT count(*) as remaining_users FROM auth.users;
SELECT count(*) as remaining_profiles FROM public.profiles;
SELECT count(*) as remaining_providers FROM public.provider_profiles;
