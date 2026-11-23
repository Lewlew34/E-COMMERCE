import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { chatApi } from '../../../api/chat/chatApi';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

interface ChatNotificationLinkProps {
  isSeller: boolean;
}

export const ChatNotificationLink: React.FC<ChatNotificationLinkProps> = ({ isSeller }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const latestMessageId = useRef<number | null>(null);
  const isInitialCheck = useRef(true);

  useEffect(() => {
    latestMessageId.current = null;
    isInitialCheck.current = true;
    setUnreadCount(0);
  }, [user?.id, isSeller]);

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const result = await chatApi.getNotifications();
        if (!active) return;
        setUnreadCount(result.unread_count);
        const latest = result.latest;
        if (latest) {
          if (!isInitialCheck.current
            && latestMessageId.current !== null
            && latest.message_id > latestMessageId.current
            && !location.pathname.endsWith('/messages')) {
            showToast(`${latest.display_name}: ${latest.message}`, 'info');
          }
          latestMessageId.current = Math.max(latestMessageId.current ?? 0, latest.message_id);
        }
        isInitialCheck.current = false;
      } catch {
        if (active) setUnreadCount(0);
      }
    };

    void poll();
    const interval = window.setInterval(poll, 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [isSeller, location.pathname, showToast, user?.id]);

  const to = isSeller ? '/seller/messages' : '/customer/messages';
  return (
    <Link
      to={to}
      aria-label={unreadCount > 0 ? `${unreadCount} tin nhắn chưa đọc` : 'Tin nhắn'}
      title={unreadCount > 0 ? `${unreadCount} tin nhắn chưa đọc` : 'Tin nhắn'}
      className="relative inline-flex items-center gap-1.5 rounded-xl p-2 text-slate-700 transition-colors hover:bg-slate-100"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden text-xs font-medium text-slate-600 xl:inline">
        {isSeller ? 'Tin nhắn' : 'Tin nhắn'}
      </span>
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
};
