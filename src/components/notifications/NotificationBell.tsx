'use client';

import { useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationDropdown } from './NotificationDropdown';

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className = '' }: NotificationBellProps) {
  const {
    unreadCount,
    hasUnread,
    isDropdownOpen,
    toggleDropdown,
    closeDropdown,
  } = useNotifications();

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, closeDropdown]);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeDropdown();
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isDropdownOpen, closeDropdown]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        onClick={toggleDropdown}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl text-warm-600 transition-colors hover:bg-warm-100"
        aria-label={`Notificações${hasUnread ? ` (${unreadCount} não lidas)` : ''}`}
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" />

        {hasUnread && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {isDropdownOpen && <NotificationDropdown />}
    </div>
  );
}
