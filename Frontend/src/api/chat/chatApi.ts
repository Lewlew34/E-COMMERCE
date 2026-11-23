import { API_BASE_URL, apiClient } from '../client';

export interface ChatConversation {
  id: number;
  seller_id?: number;
  customer_id?: number;
  shop_name?: string | null;
  seller_name?: string;
  customer_name?: string;
  last_message?: string | null;
  last_message_at?: string | null;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  message: string;
  message_type: 'text' | 'image' | 'product' | 'order' | 'deleted';
  attachment_url?: string | null;
  shared_product_id?: number | null;
  product_name?: string | null;
  product_slug?: string | null;
  shared_order_id?: number | null;
  order_code?: string | null;
  order_status?: string | null;
  reply_to_id?: number | null;
  reply?: {
    id: number;
    sender_id: number;
    sender_name: string;
    message: string;
    message_type: string;
  } | null;
  deleted_at?: string | null;
  created_at: string;
}

export interface ChatShareOptions {
  products: Array<{ id: number; name: string; price: number | null; image: string | null }>;
  orders: Array<{ id: number; order_code: string; order_status: string; created_at: string; item_count: number }>;
}

export interface ChatNotification {
  unread_count: number;
  latest: {
    conversation_id: number;
    message_id: number;
    message: string;
    message_type: string;
    sender_name: string;
    display_name: string;
  } | null;
}

interface ChatThread {
  conversation: {
    id: number;
    customer_id: number;
    seller_id: number;
    customer_name: string;
    shop_name: string | null;
    seller_name: string;
  };
  messages: ChatMessage[];
}

export const chatApi = {
  getConversations: () => apiClient<ChatConversation[]>('chat/conversations.php'),

  openConversation: (sellerId: number) =>
    apiClient<{ id: number }>('chat/conversations.php', {
      method: 'POST',
      body: { seller_id: sellerId }
    }),

  getMessages: (conversationId: number) =>
    apiClient<ChatThread>(`chat/messages.php?conversation_id=${conversationId}`),

  getShareOptions: (conversationId: number) =>
    apiClient<ChatShareOptions>(`chat/share_options.php?conversation_id=${conversationId}`),

  sendMessage: (conversationId: number, message: string, replyToId?: number) =>
    apiClient<ChatMessage>(`chat/messages.php?conversation_id=${conversationId}`, {
      method: 'POST',
      body: { message, ...(replyToId ? { reply_to_id: replyToId } : {}) }
    }),

  sendProduct: (conversationId: number, productId: number, replyToId?: number) =>
    apiClient<ChatMessage>(`chat/messages.php?conversation_id=${conversationId}`, {
      method: 'POST',
      body: { type: 'product', product_id: productId, ...(replyToId ? { reply_to_id: replyToId } : {}) }
    }),

  sendOrder: (conversationId: number, orderId: number, replyToId?: number) =>
    apiClient<ChatMessage>(`chat/messages.php?conversation_id=${conversationId}`, {
      method: 'POST',
      body: { type: 'order', order_id: orderId, ...(replyToId ? { reply_to_id: replyToId } : {}) }
    }),

  sendImage: (conversationId: number, image: File, caption = '', replyToId?: number) => {
    const body = new FormData();
    body.append('image', image);
    if (caption.trim()) body.append('message', caption.trim());
    if (replyToId) body.append('reply_to_id', String(replyToId));
    return apiClient<ChatMessage>(`chat/messages.php?conversation_id=${conversationId}`, {
      method: 'POST',
      body
    });
  },

  deleteMessage: (conversationId: number, messageId: number) =>
    apiClient<null>(`chat/messages.php?conversation_id=${conversationId}&message_id=${messageId}`, {
      method: 'DELETE'
    }),

  getNotifications: () => apiClient<ChatNotification>('chat/notifications.php'),

  attachmentUrl: (path: string) => `${API_BASE_URL}/${path}`
};
