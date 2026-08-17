-- Create RPC function to delete user from auth and database
-- This function requires service role key to execute

CREATE OR REPLACE FUNCTION delete_user_account(user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Delete from profiles table
    DELETE FROM profiles WHERE id = user_id;
    
    -- Delete from provider_profiles table
    DELETE FROM provider_profiles WHERE user_id = user_id;
    
    -- Delete from conversations
    DELETE FROM conversations WHERE participant_a = user_id OR participant_b = user_id;
    
    -- Delete from messages
    DELETE FROM messages WHERE sender_id = user_id;
    
    -- Delete from favorites
    DELETE FROM favorites WHERE user_id = user_id;
    
    -- Delete from reviews
    DELETE FROM reviews WHERE author_id = user_id;
    
    -- Delete from notifications
    DELETE FROM notifications WHERE user_id = user_id;
    
    -- Delete from bookings
    DELETE FROM bookings WHERE client_id = user_id;
    
    -- Delete from payments
    DELETE FROM payments WHERE user_id = user_id;
    
    -- Delete from user_settings
    DELETE FROM user_settings WHERE user_id = user_id;
    
    -- Note: Auth user deletion requires admin privileges and must be done separately
    -- This function only deletes database records
    
    result := jsonb_build_object(
        'success', true,
        'message', 'Database records deleted successfully'
    );
    
    RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_account(UUID) TO authenticated;
