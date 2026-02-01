import { supabase } from '@/lib/supabase-browser';
import type { Notification } from '@/types/notification';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';

/**
 * Busca notificações do usuário atual
 */
export async function listNotifications(options?: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
}): Promise<Notification[]> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) return [];

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', auth.user.id)
    .order('created_at', { ascending: false });

  if (options?.unreadOnly) {
    query = query.eq('is_read', false);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(
      options.offset,
      options.offset + (options.limit || 20) - 1
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }

  return (data || []) as Notification[];
}

/**
 * Conta notificações não lidas
 */
export async function getUnreadCount(): Promise<number> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', auth.user.id)
    .eq('is_read', false);

  if (error) {
    console.error('Error counting unread notifications:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Marca notificação como lida
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (error) throw error;
}

/**
 * Marca todas as notificações como lidas
 */
export async function markAllAsRead(): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) throw new Error('Não autenticado');

  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('user_id', auth.user.id)
    .eq('is_read', false);

  if (error) throw error;
}

/**
 * Deleta uma notificação
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) throw error;
}

/**
 * Deleta todas as notificações lidas
 */
export async function deleteAllRead(): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.id) throw new Error('Não autenticado');

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', auth.user.id)
    .eq('is_read', true);

  if (error) throw error;
}

// ========== REALTIME ==========

type NotificationCallback = (notification: Notification) => void;

/**
 * Inscreve para receber notificações em tempo real
 */
export function subscribeToNotifications(
  userId: string,
  onNewNotification: NotificationCallback
): RealtimeChannel {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on<Notification>(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload: RealtimePostgresChangesPayload<Notification>) => {
        if (payload.new && 'id' in payload.new) {
          onNewNotification(payload.new as Notification);
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Cancela inscrição do canal de notificações
 */
export function unsubscribeFromNotifications(channel: RealtimeChannel): void {
  supabase.removeChannel(channel);
}
