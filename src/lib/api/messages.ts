// Messaging API Functions
import { supabase, handleApiSuccess, handleApiFailure, ApiResponse } from './index';
import type { Conversation, Message } from '@/types';

export const messagesApi = {
  // Get all conversations for a user
  async getConversations(userId: string): Promise<ApiResponse<Conversation[]>> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_a.eq.${userId},participant_b.eq.${userId},user_id.eq.${userId},provider_id.eq.${userId}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return handleApiSuccess(data || []);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Get conversation by ID
  async getConversation(conversationId: string): Promise<ApiResponse<Conversation>> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Create conversation
  async createConversation(conversation: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Conversation>> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          ...conversation,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Get or create conversation between users
  async getOrCreateConversation(userAId: string, userBId: string): Promise<ApiResponse<Conversation>> {
    try {
      // First try to find existing conversation
      const { data: existing, error: findError } = await supabase
        .from('conversations')
        .select('*')
        .or(
          `and(participant_a.eq.${userAId},participant_b.eq.${userBId}),and(participant_a.eq.${userBId},participant_b.eq.${userAId}),and(user_id.eq.${userAId},provider_id.eq.${userBId}),and(user_id.eq.${userBId},provider_id.eq.${userAId})`
        )
        .maybeSingle();

      if (existing && !findError) {
        return handleApiSuccess(existing);
      }

      // If not found, create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          participant_a: userAId,
          participant_b: userBId,
          user_id: userAId,
          provider_id: userBId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Update conversation
  async updateConversation(conversationId: string, updates: Partial<Conversation>): Promise<ApiResponse<Conversation>> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Mark conversation as read
  async markConversationAsRead(conversationId: string, userId: string): Promise<ApiResponse<Conversation>> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .update({
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId)
        .select()
        .single();

      if (error) throw error;

      // Mark all messages from other user as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', userId);

      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Delete conversation
  async deleteConversation(conversationId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;
      return handleApiSuccess(null);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Get messages for a conversation
  async getMessages(conversationId: string, limit: number = 50): Promise<ApiResponse<Message[]>> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;
      return handleApiSuccess(data || []);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Send message
  async sendMessage(message: Omit<Message, 'id' | 'created_at'>): Promise<ApiResponse<Message>> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          ...message,
          created_at: new Date().toISOString(),
          read: false
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation timestamp
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', message.conversation_id);

      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Mark message as read
  async markMessageAsRead(messageId: string): Promise<ApiResponse<Message>> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Get unread message count for user
  async getUnreadCount(userId: string): Promise<ApiResponse<number>> {
    try {
      // First get user's conversations
      const { data: conversations, error: convError } = await supabase
        .from('conversations')
        .select('id')
        .or(`participant_a.eq.${userId},participant_b.eq.${userId},user_id.eq.${userId},provider_id.eq.${userId}`);

      if (convError) throw convError;

      const conversationIds = conversations?.map(c => c.id) || [];

      if (conversationIds.length === 0) {
        return handleApiSuccess(0);
      }

      // Count unread messages
      const { data, error } = await supabase
        .from('messages')
        .select('id', { count: 'exact' })
        .in('conversation_id', conversationIds)
        .eq('read', false)
        .neq('sender_id', userId);

      if (error) throw error;
      return handleApiSuccess(data?.length || 0);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Delete message
  async deleteMessage(messageId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;
      return handleApiSuccess(null);
    } catch (error) {
      return handleApiFailure(error);
    }
  }
};
