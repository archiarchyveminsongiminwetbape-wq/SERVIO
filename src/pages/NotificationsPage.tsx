import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash2, MessageCircle, Star, Shield, AlertCircle, Clock, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Notification } from '@/types';

export default function NotificationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, [user]);

  async function loadNotifications() {
    if (!user) return;

    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*')
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
      default:
        return 'text-neutral-600 bg-neutral-50';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Notifications</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {unreadCount > 0 ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes les notifications sont lues'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            disabled={markingAll}
            className="btn-secondary"
          >
            {markingAll ? <span className="animate-spin">⏳</span> : <><CheckCheck size={18} /> Tout marquer comme lu</>}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary-500" />
        </div>
      ) : notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => {
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
                <div className="flex gap-4">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                    <Icon size={20} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className={`font-medium ${!notification.is_read ? 'text-neutral-900' : 'text-neutral-700'}`}>
                        {notification.title}
                      </h3>
                      <span className="flex items-center gap-1 text-xs text-neutral-500 whitespace-nowrap">
                        <Clock size={12} />
                        {new Date(notification.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    
                    {notification.body && (
                      <p className="mt-1 text-sm text-neutral-600 line-clamp-2">
                        {notification.body}
                      </p>
                    )}
                  </div>

                  <div className="flex items-start gap-2">
                    {!notification.is_read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                        className="p-1 text-neutral-400 hover:text-primary-600"
                        title="Marquer comme lu"
                      >
                        <Check size={16} />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="p-1 text-neutral-400 hover:text-error-600"
                      title="Supprimer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bell size={48} className="text-neutral-300" />
          <h3 className="mt-4 text-lg font-semibold text-neutral-900">Aucune notification</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Vous n'avez pas encore de notifications.
          </p>
        </div>
      )}
    </div>
  );
}
