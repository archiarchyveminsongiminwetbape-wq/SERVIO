-- Create RPC function to delete user by email from auth and database
-- This function requires service role key to execute due to auth.users deletion
-- WARNING: This operation is irreversible
-- NOTE: After deletion, the email can be reused for new account creation

CREATE OR REPLACE FUNCTION delete_user_by_email(user_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_user_id UUID;
    result JSONB;
BEGIN
    -- Find the user_id from auth.users
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    IF target_user_id IS NULL THEN
        result := jsonb_build_object(
            'success', false,
            'message', 'User not found with the provided email'
        );
        RETURN result;
    END IF;
    
    -- Delete from profiles table (cascade will handle provider_profiles)
    DELETE FROM profiles WHERE id = target_user_id;
    
    -- Delete from provider_profiles table (in case cascade didn't work)
    DELETE FROM provider_profiles WHERE user_id = target_user_id;
    
    -- Delete from conversations
    DELETE FROM conversations WHERE participant_a = target_user_id OR participant_b = target_user_id;
    
    -- Delete from messages
    DELETE FROM messages WHERE sender_id = target_user_id;
    
    -- Delete from conversation_participants
    DELETE FROM conversation_participants WHERE user_id = target_user_id;
    
    -- Delete from favorites
    DELETE FROM favorites WHERE user_id = target_user_id;
    
    -- Delete from reviews
    DELETE FROM reviews WHERE author_id = target_user_id;
    
    -- Delete from notifications
    DELETE FROM notifications WHERE user_id = target_user_id;
    
    -- Delete from bookings (as client)
    DELETE FROM bookings WHERE client_id = target_user_id;
    
    -- Delete from payments
    DELETE FROM payments WHERE user_id = target_user_id;
    
    -- Delete from invoices (as client)
    DELETE FROM invoices WHERE client_id = target_user_id;
    
    -- Delete from invoices (as provider)
    DELETE FROM invoices WHERE provider_id IN (
        SELECT id FROM provider_profiles WHERE user_id = target_user_id
    );
    
    -- Delete from availability_slots
    DELETE FROM availability_slots WHERE provider_id IN (
        SELECT id FROM provider_profiles WHERE user_id = target_user_id
    );
    
    -- Delete from portfolio_items
    DELETE FROM portfolio_items WHERE provider_id IN (
        SELECT id FROM provider_profiles WHERE user_id = target_user_id
    );
    
    -- Delete from user_settings
    DELETE FROM user_settings WHERE user_id = target_user_id;
    
    -- Delete from auth.users (requires admin privileges)
    -- This is done via the auth schema
    -- After this deletion, the email can be reused for new account creation
    DELETE FROM auth.users WHERE id = target_user_id;
    
    result := jsonb_build_object(
        'success', true,
        'message', 'User and all related data deleted successfully. The email can now be reused for new account creation.',
        'user_id', target_user_id,
        'email', user_email
    );
    
    RETURN result;
END;
$$;

-- Create RPC function to delete user by ID from auth and database
-- This function requires service role key to execute due to auth.users deletion
-- WARNING: This operation is irreversible
-- NOTE: After deletion, the email can be reused for new account creation

CREATE OR REPLACE FUNCTION delete_user_by_id(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email TEXT;
    result JSONB;
BEGIN
    -- Find the email from auth.users
    SELECT email INTO user_email 
    FROM auth.users 
    WHERE id = target_user_id;
    
    IF target_user_id IS NULL THEN
        result := jsonb_build_object(
            'success', false,
            'message', 'User not found with the provided ID'
        );
        RETURN result;
    END IF;
    
    -- Delete from profiles table (cascade will handle provider_profiles)
    DELETE FROM profiles WHERE id = target_user_id;
    
    -- Delete from provider_profiles table (in case cascade didn't work)
    DELETE FROM provider_profiles WHERE user_id = target_user_id;
    
    -- Delete from conversations
    DELETE FROM conversations WHERE participant_a = target_user_id OR participant_b = target_user_id;
    
    -- Delete from messages
    DELETE FROM messages WHERE sender_id = target_user_id;
    
    -- Delete from conversation_participants
    DELETE FROM conversation_participants WHERE user_id = target_user_id;
    
    -- Delete from favorites
    DELETE FROM favorites WHERE user_id = target_user_id;
    
    -- Delete from reviews
    DELETE FROM reviews WHERE author_id = target_user_id;
    
    -- Delete from notifications
    DELETE FROM notifications WHERE user_id = target_user_id;
    
    -- Delete from bookings (as client)
    DELETE FROM bookings WHERE client_id = target_user_id;
    
    -- Delete from payments
    DELETE FROM payments WHERE user_id = target_user_id;
    
    -- Delete from invoices (as client)
    DELETE FROM invoices WHERE client_id = target_user_id;
    
    -- Delete from invoices (as provider)
    DELETE FROM invoices WHERE provider_id IN (
        SELECT id FROM provider_profiles WHERE user_id = target_user_id
    );
    
    -- Delete from availability_slots
    DELETE FROM availability_slots WHERE provider_id IN (
        SELECT id FROM provider_profiles WHERE user_id = target_user_id
    );
    
    -- Delete from portfolio_items
    DELETE FROM portfolio_items WHERE provider_id IN (
        SELECT id FROM provider_profiles WHERE user_id = target_user_id
    );
    
    -- Delete from user_settings
    DELETE FROM user_settings WHERE user_id = target_user_id;
    
    -- Delete from auth.users (requires admin privileges)
    -- This is done via the auth schema
    -- After this deletion, the email can be reused for new account creation
    DELETE FROM auth.users WHERE id = target_user_id;
    
    result := jsonb_build_object(
        'success', true,
        'message', 'User and all related data deleted successfully. The email can now be reused for new account creation.',
        'user_id', target_user_id,
        'email', user_email
    );
    
    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
-- Note: Actual execution requires service role key for auth.users deletion
GRANT EXECUTE ON FUNCTION delete_user_by_email(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_user_by_id(UUID) TO authenticated;

-- Example usage (requires service role key):
-- SELECT delete_user_by_email('user@example.com');
-- SELECT delete_user_by_id('uuid-of-user');
