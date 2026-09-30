import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, Star, Shield, Flag, Info, CheckCheck, Calendar, DollarSign, Users, AlertTriangle, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Notification } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

const typeIcons: Record<string, typeof Bell> = {
  message: MessageSquare,
  review: Star,
  validation: Shield,
  report: Flag,
  system: Info,
  booking: Calendar,
  payment: DollarSign,
  user: Users,
  alert: AlertTriangle,
};

const typeColors: Record<string, string> = {
  message: 'text-primary-600 bg-primary-50',
  review: 'text-accent-600 bg-accent-50',
  validation: 'text-success-600 bg-success-50',
  report: 'text-error-600 bg-error-50',
  system: 'text-neutral-600 bg-neutral-100',
  booking: 'text-blue-600 bg-blue-50',
  payment: 'text-green-600 bg-green-50',
  user: 'text-purple-600 bg-purple-50',
  alert: 'text-orange-600 bg-orange-50',
};

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    loadNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        // Play notification sound if browser supports it
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('SERVIO', {
            body: payload.new.title,
            icon: '/favicon.ico',
          });
        }
        loadNotifications();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  async function loadNotifications() {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        console.error('Error loading notifications:', error);
        return;
      }
      
      const notifs = data as Notification[] ?? [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n) => !n.is_read).length);
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    if (!user) return;
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
      loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  async function markAsRead(id: string) {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      loadNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  }

  async function deleteNotification(id: string) {
    try {
      await supabase.from('notifications').delete().eq('id', id);
      loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }

  async function handleClick(n: Notification) {
    if (!n.is_read) {
      await markAsRead(n.id);
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  }

  if (!user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 animate-slide-down overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <span className="text-sm font-semibold text-neutral-900">Notifications</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700">
                  <CheckCheck size={14} />
                  Tout marquer lu
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-600">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell size={32} className="text-neutral-300" />
                <p className="mt-2 text-sm text-neutral-500">Aucune notification</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = typeIcons[n.type] ?? Bell;
                return (
                  <div
                    key={n.id}
                    className={`relative flex w-full items-start gap-3 border-b border-neutral-50 px-4 py-3 text-left transition-colors hover:bg-neutral-50 ${
                      !n.is_read ? 'bg-primary-50/40' : ''
                    }`}
                  >
                    <button
                      onClick={() => handleClick(n)}
                      className="flex items-start gap-3 flex-1 text-left"
                    >
                      <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${typeColors[n.type] ?? typeColors.system}`}>
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-neutral-900">{n.title}</p>
                        {n.body && <p className="mt-0.5 text-xs text-neutral-500 line-clamp-2">{n.body}</p>}
                        <p className="mt-1 text-xs text-neutral-400">{formatRelativeTime(n.created_at)}</p>
                      </div>
                    </button>
                    <button
                      onClick={() => deleteNotification(n.id)}
                      className="flex-shrink-0 text-neutral-400 hover:text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={14} />
                    </button>
                    {!n.is_read && <span className="absolute top-4 right-16 h-2 w-2 flex-shrink-0 rounded-full bg-primary-500" />}
                  </div>
                );
              })
            )}
          </div>
          
          {notifications.length > 0 && (
            <div className="border-t border-neutral-100 px-4 py-3">
              <button
                onClick={() => navigate('/notifications')}
                className="w-full text-sm text-center text-primary-600 hover:text-primary-700 font-medium"
              >
                Voir toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
