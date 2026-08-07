import { useEffect, useState } from 'react';
import { Bell, X, Check, CheckCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getNotifications, markAsRead, markAllAsRead, subscribeToNotifications, type Notification } from '@/services/notificationService';

export default function NotificationsPanel() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    loadNotifications();

    // Subscribe to new notifications
    const unsubscribe = subscribeToNotifications(user.id, (newNotification) => {
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => unsubscribe();
  }, [user]);

  async function loadNotifications() {
    if (!user) return;

    setLoading(true);
    const data = await getNotifications(user.id, 20);
    setNotifications(data);
    setUnreadCount(data.filter(n => !n.read).length);
    setLoading(false);
  }

  async function handleMarkAsRead(id: string) {
    const success = await markAsRead(id);
    if (success) {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  }

  async function handleMarkAllAsRead() {
    const success = await markAllAsRead(user!.id);
    if (success) {
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-neutral-100 transition-colors"
      >
        <Bell size={20} className="text-neutral-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 bg-error-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-xl border border-neutral-200 z-50 max-h-[500px] flex flex-col">
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
              <h3 className="font-semibold text-neutral-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1"
                  >
                    <CheckCheck size={14} />
                    Tout marquer comme lu
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-neutral-100 rounded-full"
                >
                  <X size={16} className="text-neutral-400" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={24} className="animate-spin text-primary-500" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Bell size={48} className="text-neutral-300 mb-3" />
                  <p className="text-sm text-neutral-500">Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-neutral-50 transition-colors ${
                        !notification.read ? 'bg-primary-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-neutral-900">
                            {notification.title}
                          </p>
                          <p className="text-sm text-neutral-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-neutral-400 mt-2">
                            {new Date(notification.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-1 hover:bg-neutral-200 rounded-full flex-shrink-0"
                            title="Marquer comme lu"
                          >
                            <Check size={16} className="text-neutral-400" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
