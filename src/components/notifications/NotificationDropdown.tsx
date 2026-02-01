'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from './NotificationItem';
import { Check, Bell, Loader2 } from 'lucide-react';

export function NotificationDropdown() {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAllAsRead,
    hasUnread,
  } = useNotifications();

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border-2 border-warm-200 bg-white shadow-soft-xl sm:w-96">
      <div className="flex items-center justify-between border-b border-warm-200 bg-gradient-to-r from-warm-50 to-white px-4 py-3">
        <div>
          <h3 className="font-semibold text-warm-900">Notificações</h3>
          {hasUnread && (
            <p className="text-xs text-warm-500">
              {unreadCount} não {unreadCount === 1 ? 'lida' : 'lidas'}
            </p>
          )}
        </div>

        {hasUnread && (
          <button
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-sage-600 transition-colors hover:bg-sage-50"
            title="Marcar todas como lidas"
          >
            <Check className="h-3.5 w-3.5" />
            Marcar todas
          </button>
        )}
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-warm-400" />
          </div>
        ) : error ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-rose-600">{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-warm-100">
              <Bell className="h-6 w-6 text-warm-400" />
            </div>
            <p className="text-sm font-medium text-warm-700">
              Nenhuma notificação
            </p>
            <p className="mt-1 text-xs text-warm-500">
              Você será notificado sobre novidades aqui
            </p>
          </div>
        ) : (
          <div className="divide-y divide-warm-100">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
