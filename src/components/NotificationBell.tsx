import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, MessageSquare, Star, Shield, Flag, Info, CheckCheck } from 'lucide-react';
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
};

const typeColors: Record<string, string> = {
  message: 'text-primary-600 bg-primary-50',
  review: 'text-accent-600 bg-accent-50',
  validation: 'text-success-600 bg-success-50',
  report: 'text-error-600 bg-error-50',
  system: 'text-neutral-600 bg-neutral-100',
};

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
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
      }, () => {
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

  async function loadNotifications() {
    if (!user) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);
    const notifs = data as Notification[] ?? [];
    setNotifications(notifs);
    setUnreadCount(notifs.filter((n) => !n.is_read).length);
  }

  async function markAllRead() {
    if (!user) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    loadNotifications();
  }

  async function handleClick(n: Notification) {
    if (!n.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
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
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 animate-slide-down overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <span className="text-sm font-semibold text-neutral-900">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700">
                <CheckCheck size={14} />
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell size={32} className="text-neutral-300" />
                <p className="mt-2 text-sm text-neutral-500">Aucune notification</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = typeIcons[n.type] ?? Bell;
                return (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`flex w-full items-start gap-3 border-b border-neutral-50 px-4 py-3 text-left transition-colors hover:bg-neutral-50 ${
                      !n.is_read ? 'bg-primary-50/40' : ''
                    }`}
                  >
                    <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${typeColors[n.type] ?? typeColors.system}`}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-900">{n.title}</p>
                      {n.body && <p className="mt-0.5 text-xs text-neutral-500 line-clamp-2">{n.body}</p>}
                      <p className="mt-1 text-xs text-neutral-400">{formatRelativeTime(n.created_at)}</p>
                    </div>
                    {!n.is_read && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary-500" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
