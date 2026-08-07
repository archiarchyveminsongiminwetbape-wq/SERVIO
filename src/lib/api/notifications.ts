// Notifications API Functions
import { supabase, handleApiSuccess, handleApiFailure, ApiResponse } from './index';
import type { Notification } from '@/types';

export const notificationsApi = {
  // Get user's notifications
  async getUserNotifications(userId: string, limit: number = 20): Promise<ApiResponse<Notification[]>> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return handleApiSuccess(data || []);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Get unread notifications for user
  async getUnreadNotifications(userId: string): Promise<ApiResponse<Notification[]>> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return handleApiSuccess(data || []);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Get notification by ID
  async getNotification(notificationId: string): Promise<ApiResponse<Notification>> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .single();

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Create notification
  async createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Promise<ApiResponse<Notification>> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...notification,
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

  // Get unread count for user
  async getUnreadCount(userId: string): Promise<ApiResponse<number>> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return handleApiSuccess(data?.length || 0);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<ApiResponse<Notification>> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;
      return handleApiSuccess(data);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Mark all notifications as read for user
  async markAllAsRead(userId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return handleApiSuccess(null);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Delete notification
  async deleteNotification(notificationId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return handleApiSuccess(null);
    } catch (error) {
      return handleApiFailure(error);
    }
  },

  // Create notification helpers
  async notifyNewMessage(userId: string, conversationId: string, senderName: string): Promise<ApiResponse<Notification>> {
    return this.createNotification({
      user_id: userId,
      type: 'message',
      title: 'Nouveau message',
      body: `${senderName} vous a envoyé un message`,
      link: `/messages`,
      is_read: false
    });
  },

  async notifyNewReview(userId: string, providerId: string, reviewerName: string, rating: number): Promise<ApiResponse<Notification>> {
    return this.createNotification({
      user_id: userId,
      type: 'review',
      title: 'Nouvel avis',
      body: `${reviewerName} a noté votre service ${rating}/5`,
      link: `/provider/${providerId}`,
      is_read: false
    });
  },

  async notifyBookingRequest(userId: string, clientId: string, clientName: string): Promise<ApiResponse<Notification>> {
    return this.createNotification({
      user_id: userId,
      type: 'system',
      title: 'Nouvelle demande',
      body: `${clientName} souhaite réserver vos services`,
      link: `/messages`,
      is_read: false
    });
  }
};
