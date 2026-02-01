'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  CalendarX,
  CalendarClock,
  CheckCircle,
  Coins,
  Bell,
  MessageCircle,
  Info,
  X,
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import type { Notification, NotificationType } from '@/types/notification';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationItemProps {
  notification: Notification;
}

const ICON_MAP: Record<
  NotificationType,
  React.ComponentType<{ className?: string }>
> = {
  appointment_new: Calendar,
  appointment_cancelled: CalendarX,
  appointment_rescheduled: CalendarClock,
  payment_pix_validated: CheckCircle,
  credits_released: Coins,
  session_reminder: Bell,
  chat_message: MessageCircle,
  system: Info,
};

const COLOR_MAP: Record<NotificationType, { icon: string; bg: string }> = {
  appointment_new: { icon: 'text-sage-600', bg: 'bg-sage-100' },
  appointment_cancelled: { icon: 'text-rose-600', bg: 'bg-rose-100' },
  appointment_rescheduled: { icon: 'text-amber-600', bg: 'bg-amber-100' },
  payment_pix_validated: { icon: 'text-emerald-600', bg: 'bg-emerald-100' },
  credits_released: { icon: 'text-emerald-600', bg: 'bg-emerald-100' },
  session_reminder: { icon: 'text-soft-600', bg: 'bg-soft-100' },
  chat_message: { icon: 'text-blue-600', bg: 'bg-blue-100' },
  system: { icon: 'text-warm-600', bg: 'bg-warm-100' },
};

export function NotificationItem({ notification }: NotificationItemProps) {
  const router = useRouter();
  const { markAsRead, deleteNotification, closeDropdown } = useNotifications();

  const Icon = ICON_MAP[notification.type] || Info;
  const colors = COLOR_MAP[notification.type] || COLOR_MAP.system;

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  const handleClick = useCallback(async () => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    const link = notification.metadata?.link;
    if (link && typeof link === 'string') {
      closeDropdown();
      router.push(link);
    }
  }, [notification, markAsRead, closeDropdown, router]);

  const handleDelete = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation();
      await deleteNotification(notification.id);
    },
    [notification.id, deleteNotification]
  );

  return (
    <div
      onClick={handleClick}
      className={`group relative flex cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-warm-50 ${
        !notification.is_read ? 'bg-sage-50/50' : ''
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      {!notification.is_read && (
        <div className="absolute left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-sage-500" />
      )}

      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colors.bg}`}
      >
        <Icon className={`h-5 w-5 ${colors.icon}`} />
      </div>

      <div className="min-w-0 flex-1">
        <p
          className={`text-sm ${
            notification.is_read
              ? 'font-medium text-warm-700'
              : 'font-semibold text-warm-900'
          }`}
        >
          {notification.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-warm-500">
          {notification.message}
        </p>
        <p className="mt-1 text-[10px] text-warm-400">{timeAgo}</p>
      </div>

      <button
        onClick={handleDelete}
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-lg opacity-0 transition-opacity hover:bg-warm-200 group-hover:opacity-100"
        aria-label="Remover notificação"
      >
        <X className="h-3.5 w-3.5 text-warm-500" />
      </button>
    </div>
  );
}
