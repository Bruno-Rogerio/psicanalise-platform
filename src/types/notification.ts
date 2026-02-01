export type NotificationType =
  | 'appointment_new'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'payment_pix_validated'
  | 'credits_released'
  | 'session_reminder'
  | 'chat_message'
  | 'system';

export interface NotificationMetadata {
  appointment_id?: string;
  order_id?: string;
  credits_added?: number;
  chat_appointment_id?: string;
  sender_name?: string;
  session_start_at?: string;
  link?: string;
  [key: string]: unknown;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata: NotificationMetadata;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationInsert {
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: NotificationMetadata;
}

export const NOTIFICATION_CONFIG: Record<
  NotificationType,
  {
    icon: string;
    color: string;
    bgColor: string;
  }
> = {
  appointment_new: {
    icon: 'Calendar',
    color: 'text-sage-600',
    bgColor: 'bg-sage-100',
  },
  appointment_cancelled: {
    icon: 'CalendarX',
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
  },
  appointment_rescheduled: {
    icon: 'CalendarClock',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  payment_pix_validated: {
    icon: 'CheckCircle',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  credits_released: {
    icon: 'Coins',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  session_reminder: {
    icon: 'Bell',
    color: 'text-soft-600',
    bgColor: 'bg-soft-100',
  },
  chat_message: {
    icon: 'MessageCircle',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  system: {
    icon: 'Info',
    color: 'text-warm-600',
    bgColor: 'bg-warm-100',
  },
};
