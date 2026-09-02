import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, MessageCircle, Star, Shield, AlertCircle, Clock, Loader2, CalendarCheck2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useI18n } from '@/context/I18nContext';
import { supabase } from '@/lib/supabase';
import type { Notification } from '@/types';

export default function NotificationsPage() {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'unread' | Notification['type']>('all');
  const [soundEnabled, setSoundEnabled] = useState(false);

  useEffect(() => {
    loadNotifications();

    // Real-time subscription for new notifications
    if (user) {
      const channel = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
          if (soundEnabled) {
            playNotificationSound();
          }
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          setNotifications(prev =>
            prev.map(n => n.id === payload.new.id ? payload.new as Notification : n)
          );
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        }, (payload) => {
          setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, soundEnabled]);

  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  };

  async function loadNotifications() {
    if (!user) return;

    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('id, user_id, type, title, body, link, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    setNotifications(data as Notification[] ?? []);
    setLoading(false);
  }

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    setNotifications(notifications.map(n => 
      n.id === notificationId ? { ...n, is_read: true } : n
    ));
  };

  const markAllAsRead = async () => {
    if (!user) return;

    setMarkingAll(true);
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    setMarkingAll(false);
  };

  const deleteNotification = async (notificationId: string) => {
    await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    setNotifications(notifications.filter(n => n.id !== notificationId));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return MessageCircle;
      case 'validation':
        return Shield;
      case 'review':
        return Star;
      case 'report':
        return AlertCircle;
      case 'booking':
        return CalendarCheck2;
      default:
        return Bell;
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'message':
        return 'text-primary-600 bg-primary-50';
      case 'validation':
        return 'text-success-600 bg-success-50';
      case 'review':
        return 'text-accent-600 bg-accent-50';
      case 'report':
        return 'text-error-600 bg-error-50';
      case 'booking':
        return 'text-amber-600 bg-amber-50';
      default:
        return 'text-neutral-600 bg-neutral-50';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const filteredNotifications = notifications.filter(n => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !n.is_read;
    return n.type === filterType;
  });

  const notificationTypes = [
    { value: 'all', label: t.common.all },
    { value: 'unread', label: t.notifications.unread },
    { value: 'message', label: t.notifications.messages },
    { value: 'review', label: t.notifications.reviews },
    { value: 'validation', label: t.notifications.validation },
    { value: 'report', label: t.notifications.reports },
    { value: 'booking', label: 'Missions' },
    { value: 'system', label: t.notifications.system },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-8">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">{t.user.notifications}</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {unreadCount > 0 ? t.notifications.unreadCount.replace('{count}', unreadCount.toString()) : t.notifications.allRead}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`btn-ghost ${soundEnabled ? 'text-primary-600' : 'text-neutral-400'}`}
            title={soundEnabled ? t.notifications.disableSound : t.notifications.enableSound}
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={markingAll}
              className="btn-secondary text-sm"
            >
              {markingAll ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <>
                  <CheckCheck size={16} className="sm:hidden" />
                  <CheckCheck size={18} className="hidden sm:inline" /> {t.notifications.markAllRead}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Filter buttons */}
      <div className="mb-4 sm:mb-6 flex flex-wrap gap-2">
        {notificationTypes.map((type) => (
          <button
            key={type.value}
            onClick={() => setFilterType(type.value as any)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              filterType === type.value
                ? 'bg-primary-600 text-white'
                : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 sm:py-20">
          <Loader2 size={28} className="sm:hidden animate-spin text-primary-500" />
          <Loader2 size={32} className="hidden sm:block animate-spin text-primary-500" />
        </div>
      ) : filteredNotifications.length > 0 ? (
        <div className="space-y-2 sm:space-y-3">
          {filteredNotifications.map((notification) => {
            const Icon = getNotificationIcon(notification.type);
            const colorClass = getNotificationColor(notification.type);

            return (
              <div
                key={notification.id}
                className={`card relative cursor-pointer transition-all hover:shadow-md ${
                  !notification.is_read ? 'border-l-4 border-l-primary-500 bg-primary-50/50' : ''
                }`}
                onClick={() => {
                  if (!notification.is_read) {
                    markAsRead(notification.id);
                  }
                  if (notification.link) {
                    navigate(notification.link);
                  }
                }}
              >
                <div className="flex gap-3 sm:gap-4">
                  <div className={`flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                    <Icon size={16} className="sm:hidden" />
                    <Icon size={20} className="hidden sm:block" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-medium text-sm sm:text-base ${!notification.is_read ? 'text-neutral-900' : 'text-neutral-700'}`}>
                        {notification.title}
                      </h3>
                      <span className="flex items-center gap-1 text-[10px] sm:text-xs text-neutral-500 whitespace-nowrap">
                        <Clock size={10} className="sm:hidden" />
                        <Clock size={12} className="hidden sm:block" />
                        {new Date(notification.created_at).toLocaleDateString(locale, {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    
                    {notification.body && (
                      <p className="mt-1 text-xs sm:text-sm text-neutral-600 line-clamp-2">
                        {notification.body}
                      </p>
                    )}
                  </div>

                  <div className="flex items-start gap-1 sm:gap-2">
                    {!notification.is_read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="p-1 text-neutral-400 hover:text-primary-600"
                        title={t.notifications.markRead}
                      >
                        <Check size={14} className="sm:hidden" />
                        <Check size={16} className="hidden sm:block" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="p-1 text-neutral-400 hover:text-error-600"
                      title={t.notifications.delete}
                    >
                      <Trash2 size={14} className="sm:hidden" />
                      <Trash2 size={16} className="hidden sm:block" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 sm:py-20 text-center">
          <Bell size={40} className="sm:hidden text-neutral-300" />
          <Bell size={48} className="hidden sm:block text-neutral-300" />
          <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-semibold text-neutral-900">
            {filterType === 'all' ? t.notifications.noNotifications : t.notifications.noNotificationsType.replace('{type}', notificationTypes.find(t => t.value === filterType)?.label || '')}
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            {filterType === 'all' ? t.notifications.noNotificationsSubtext : t.notifications.noNotificationsType}
          </p>
        </div>
      )}
    </div>
  );
}
