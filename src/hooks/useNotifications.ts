'use client';

import { useNotificationContext } from '@/contexts/NotificationContext';
import { useMemo } from 'react';
import type { Notification, NotificationType } from '@/types/notification';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadNotifications: Notification[];
  readNotifications: Notification[];
  unreadCount: number;

  isLoading: boolean;
  error: string | null;

  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;

  isDropdownOpen: boolean;
  openDropdown: () => void;
  closeDropdown: () => void;
  toggleDropdown: () => void;

  getNotificationsByType: (type: NotificationType) => Notification[];
  hasUnread: boolean;
}

export function useNotifications(): UseNotificationsReturn {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isDropdownOpen,
    setDropdownOpen,
  } = useNotificationContext();

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.is_read),
    [notifications]
  );

  const readNotifications = useMemo(
    () => notifications.filter((n) => n.is_read),
    [notifications]
  );

  const getNotificationsByType = useMemo(
    () => (type: NotificationType) =>
      notifications.filter((n) => n.type === type),
    [notifications]
  );

  const openDropdown = () => setDropdownOpen(true);
  const closeDropdown = () => setDropdownOpen(false);
  const toggleDropdown = () => setDropdownOpen(!isDropdownOpen);

  return {
    notifications,
    unreadNotifications,
    readNotifications,
    unreadCount,
    isLoading,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isDropdownOpen,
    openDropdown,
    closeDropdown,
    toggleDropdown,
    getNotificationsByType,
    hasUnread: unreadCount > 0,
  };
}
