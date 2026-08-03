import { supabase } from '@/lib/supabase';

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  user_id: string;
  provider_id: string;
  booking_id?: string;
  created_at: string;
  updated_at: string;
  other_user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
  last_message?: Message;
  unread_count?: number;
}

export async function getConversations(userId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select(`
      *,
      user:profiles!conversations_user_id_fkey (id, full_name, avatar_url),
      provider:profiles!conversations_provider_id_fkey (id, full_name, avatar_url),
      messages (
        id,
        content,
        sender_id,
        read,
        created_at
      )
    `)
    .or(`user_id.eq.${userId},provider_id.eq.${userId}`)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    return [];
  }

  const conversations = data as any[];
  
  // Transform data to include other user info and last message
  return conversations.map(conv => {
    const isUserProvider = conv.provider_id === userId;
    const otherUser = isUserProvider ? conv.user : conv.provider;
    const messages = conv.messages || [];
    const lastMessage = messages[0];
    const unreadCount = messages.filter((m: Message) => !m.read && m.sender_id !== userId).length;

    return {
      id: conv.id,
      user_id: conv.user_id,
      provider_id: conv.provider_id,
      booking_id: conv.booking_id,
      created_at: conv.created_at,
      updated_at: conv.updated_at,
      other_user: otherUser,
      last_message: lastMessage,
      unread_count: unreadCount,
    };
  }) as Conversation[];
}

export async function getMessages(conversationId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data as Message[];
}

export async function sendMessage(conversationId: string, senderId: string, content: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      content,
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    return null;
  }

  return data as Message;
}

export async function markMessagesAsRead(conversationId: string, userId: string) {
  const { error } = await supabase
    .from('messages')
    .update({ read: true })
    .eq('conversation_id', conversationId)
    .neq('sender_id', userId);

  if (error) {
    console.error('Error marking messages as read:', error);
    return false;
  }

  return true;
}

export async function createConversation(userId: string, providerId: string, bookingId?: string) {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      provider_id: providerId,
      booking_id: bookingId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    return null;
  }

  return data as Conversation;
}

export async function getConversationByUsers(userId: string, providerId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .eq('provider_id', providerId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching conversation:', error);
    return null;
  }

  return data as Conversation;
}

export function subscribeToMessages(
  conversationId: string,
  callback: (message: Message) => void
) {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        callback(payload.new as Message);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToConversations(
  userId: string,
  callback: (conversation: Conversation) => void
) {
  const channel = supabase
    .channel('conversations')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `user_id=eq.${userId},provider_id=eq.${userId}`,
      },
      (payload) => {
        callback(payload.new as Conversation);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
