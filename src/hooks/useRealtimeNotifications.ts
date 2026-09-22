import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Notification {
  id: string;
  type: 'payment' | 'milestone' | 'certification' | 'escrow' | 'system';
  title: string;
  message: string;
  user_id?: string;
  read: boolean;
  created_at: string;
  data?: any;
}

export function useRealtimeNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
    setupRealtimeSubscription();

    return () => {
      cleanupRealtimeSubscription();
    };
  }, [userId]);

  const loadNotifications = async () => {
    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: userId ? `user_id=eq.${userId}` : undefined
        },
        (payload) => {
          handleRealtimeEvent(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleRealtimeEvent = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      const newNotification = payload.new as Notification;
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if permitted
      showBrowserNotification(newNotification);
    } else if (payload.eventType === 'UPDATE') {
      setNotifications(prev =>
        prev.map(n => n.id === payload.new.id ? payload.new : n)
      );
      setUnreadCount(prev =>
        prev + (payload.new.read ? -1 : 1)
      );
    } else if (payload.eventType === 'DELETE') {
      setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
      if (!payload.old.read) {
        setUnreadCount(prev => prev - 1);
      }
    }
  };

  const showBrowserNotification = (notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new notification.title, {
        body: notification.message,
        icon: '/images/servio-logo.png',
        badge: '/images/servio-logo.png',
      });
    }
  };

  const cleanupRealtimeSubscription = () => {
    supabase.channel('notifications-channel').unsubscribe();
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false);

      if (userId) {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('user_id', userId);
      }

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    requestNotificationPermission,
    refresh: loadNotifications
  };
}
