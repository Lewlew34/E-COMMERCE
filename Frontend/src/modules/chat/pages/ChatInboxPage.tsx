import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Link2, MessageCircle, Package, Reply, Send, ShoppingBag, Store, Trash2, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { chatApi, type ChatConversation, type ChatMessage, type ChatShareOptions } from '../../../api/chat/chatApi';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';

const formatMessageTime = (value: string) =>
  new Date(value.replace(' ', 'T')).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

export const ChatInboxPage: React.FC = () => {
  const { user, isSeller } = useAuth();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const sellerId = Number(searchParams.get('sellerId')) || null;
  const requestedConversationId = Number(searchParams.get('conversationId')) || null;
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [shareOptions, setShareOptions] = useState<ChatShareOptions>({ products: [], orders: [] });
  const [shareMode, setShareMode] = useState<'product' | 'order' | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const imageInput = useRef<HTMLInputElement>(null);

  const activeConversation = useMemo(
    () => conversations.find(conversation => conversation.id === activeId) || null,
    [activeId, conversations]
  );
  const otherPartyName = (conversation: ChatConversation) =>
    isSeller ? conversation.customer_name || 'Khách hàng' : conversation.shop_name || conversation.seller_name || 'Shop';

  const refreshConversations = useCallback(async () => {
    const data = await chatApi.getConversations();
    setConversations(data);
    return data;
  }, []);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      setLoading(true);
      setError('');
      try {
        let data = await chatApi.getConversations();
        if (!active) return;
        if (requestedConversationId && data.some(item => item.id === requestedConversationId)) {
          setActiveId(requestedConversationId);
        } else if (!isSeller && sellerId) {
          let selected = data.find(conversation => conversation.seller_id === sellerId);
          if (!selected) {
            const opened = await chatApi.openConversation(sellerId);
            if (!active) return;
            data = await chatApi.getConversations();
            selected = data.find(conversation => conversation.id === opened.id);
          }
          if (selected) setActiveId(selected.id);
        } else if (data.length > 0) {
          setActiveId(current => current && data.some(item => item.id === current) ? current : data[0].id);
        }
        setConversations(data);
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Không thể tải hộp thư.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void initialize();
    return () => { active = false; };
  }, [isSeller, requestedConversationId, sellerId]);

  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }

    let active = true;
    const loadMessages = async () => {
      try {
        const thread = await chatApi.getMessages(activeId);
        if (active) {
          setMessages(thread.messages);
          setError('');
        }
      } catch (requestError) {
        if (active) setError(requestError instanceof Error ? requestError.message : 'Không thể tải tin nhắn.');
      }
    };
    void loadMessages();
    const interval = window.setInterval(loadMessages, 4000);
    void chatApi.getShareOptions(activeId).then(options => {
      if (active) setShareOptions(options);
    }).catch(requestError => {
      if (active) setError(requestError instanceof Error ? requestError.message : 'Không thể tải nội dung để chia sẻ.');
    });
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [activeId]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshConversations().catch(requestError => {
        setError(requestError instanceof Error ? requestError.message : 'Không thể cập nhật hộp thư.');
      });
    }, 10000);
    return () => window.clearInterval(interval);
  }, [refreshConversations]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    const message = draft.trim();
    if (!activeId || !message || sending) return;
    setSending(true);
    try {
      await chatApi.sendMessage(activeId, message, replyingTo?.id);
      setDraft('');
      setReplyingTo(null);
      const thread = await chatApi.getMessages(activeId);
      setMessages(thread.messages);
      await refreshConversations();
      setError('');
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : 'Không thể gửi tin nhắn.', 'error');
    } finally {
      setSending(false);
    }
  };

  const sendSharedItem = async (kind: 'product' | 'order', id: number) => {
    if (!activeId || sending) return;
    setSending(true);
    try {
      if (kind === 'product') await chatApi.sendProduct(activeId, id, replyingTo?.id);
      else await chatApi.sendOrder(activeId, id, replyingTo?.id);
      const thread = await chatApi.getMessages(activeId);
      setMessages(thread.messages);
      await refreshConversations();
      setShareMode(null);
      setReplyingTo(null);
      setError('');
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : 'Không thể chia sẻ nội dung.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleImageSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const image = event.target.files?.[0];
    event.target.value = '';
    if (!image || !activeId) return;
    if (image.size > 5 * 1024 * 1024) {
      showToast('Ảnh phải có kích thước tối đa 5 MB.', 'error');
      return;
    }
    setSending(true);
    try {
      await chatApi.sendImage(activeId, image, draft, replyingTo?.id);
      setDraft('');
      setReplyingTo(null);
      const thread = await chatApi.getMessages(activeId);
      setMessages(thread.messages);
      await refreshConversations();
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : 'Không thể gửi ảnh.', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (message: ChatMessage) => {
    if (!activeId || !window.confirm('Xóa tin nhắn này với cả hai bên?')) return;
    try {
      await chatApi.deleteMessage(activeId, message.id);
      const thread = await chatApi.getMessages(activeId);
      setMessages(thread.messages);
      await refreshConversations();
      if (replyingTo?.id === message.id) setReplyingTo(null);
    } catch (requestError) {
      showToast(requestError instanceof Error ? requestError.message : 'Không thể xóa tin nhắn.', 'error');
    }
  };

  const messagePreview = (message: ChatMessage) => {
    if (message.message_type === 'deleted') return 'Tin nhắn đã bị xóa';
    if (message.message_type === 'image') return message.message || 'Hình ảnh';
    if (message.message_type === 'product') return message.product_name || 'Sản phẩm';
    if (message.message_type === 'order') return message.order_code || 'Đơn hàng';
    return message.message;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <MessageCircle className="w-6 h-6 text-blue-600" />
          {isSeller ? 'Tin nhắn khách hàng' : 'Liên hệ shop'}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Mỗi shop có một hội thoại riêng; nội dung chỉ hiển thị với khách và shop tham gia.
        </p>
      </div>

      {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="grid min-h-[65vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:grid-cols-[320px_1fr]">
        <aside className="border-b border-slate-200 md:border-b-0 md:border-r">
          <div className="border-b border-slate-100 px-4 py-3 font-bold text-slate-800">Hộp thư</div>
          {loading ? (
            <p className="p-5 text-sm text-slate-500">Đang tải hội thoại...</p>
          ) : conversations.length === 0 ? (
            <div className="p-5 text-sm text-slate-500">
              Chưa có hội thoại. Mở trang sản phẩm của shop và chọn “Liên hệ shop” để bắt đầu.
            </div>
          ) : (
            <div className="max-h-[65vh] overflow-y-auto">
              {conversations.map(conversation => (
                <button
                  type="button"
                  key={conversation.id}
                  onClick={() => setActiveId(conversation.id)}
                  className={`w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 ${activeId === conversation.id ? 'bg-blue-50' : ''}`}
                >
                  <span className="flex items-center gap-2 font-semibold text-slate-800">
                    {isSeller ? <MessageCircle className="h-4 w-4 text-emerald-600" /> : <Store className="h-4 w-4 text-blue-600" />}
                    <span className="truncate">{otherPartyName(conversation)}</span>
                  </span>
                  <span className="mt-1 block truncate text-xs text-slate-500">{conversation.last_message || 'Bắt đầu trò chuyện'}</span>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section className="flex min-h-[55vh] flex-col">
          {activeConversation ? (
            <>
              <header className="border-b border-slate-100 px-5 py-3">
                <div className="font-bold text-slate-900">{otherPartyName(activeConversation)}</div>
                <div className="text-xs text-slate-500">Tin nhắn được lưu trong hộp thư của hai bên</div>
              </header>
              <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/70 p-4">
                {messages.length === 0 && <p className="pt-8 text-center text-sm text-slate-500">Hãy gửi lời nhắn đầu tiên.</p>}
                {messages.map(message => {
                  const isMine = Number(user?.id) === message.sender_id;
                  return (
                    <div key={message.id} className={`group flex items-center gap-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${message.message_type === 'deleted' ? 'border border-slate-200 bg-slate-100 text-slate-500 italic' : isMine ? 'bg-blue-600 text-white' : 'border border-slate-200 bg-white text-slate-800'}`}>
                        {!isMine && <div className="mb-1 text-[11px] font-bold opacity-70">{message.sender_name}</div>}
                        {message.reply && message.message_type !== 'deleted' && (
                          <div className={`mb-2 rounded-lg border-l-2 px-2 py-1 text-xs ${isMine ? 'border-blue-200 bg-blue-700/60 text-blue-50' : 'border-blue-500 bg-slate-50 text-slate-600'}`}>
                            <div className="font-bold">{message.reply.sender_name}</div>
                            <div className="truncate">{message.reply.message}</div>
                          </div>
                        )}
                        {message.message_type === 'deleted' && <p className="text-sm">Tin nhắn đã bị xóa</p>}
                        {message.message_type === 'image' && message.attachment_url && (
                          <a
                            href={chatApi.attachmentUrl(message.attachment_url)}
                            target="_blank"
                            rel="noreferrer"
                            className="block"
                          >
                            <img
                              src={chatApi.attachmentUrl(message.attachment_url)}
                              alt="Ảnh được chia sẻ trong hội thoại"
                              className="max-h-72 max-w-full rounded-lg object-contain"
                            />
                          </a>
                        )}
                        {message.message_type === 'product' && message.shared_product_id && (
                          <Link
                            to={`/product/${message.shared_product_id}`}
                            className="block min-w-56 rounded-xl bg-white/95 p-3 text-slate-800 hover:bg-white"
                          >
                            <div className="mb-1 flex items-center gap-1 text-[11px] font-bold text-blue-700">
                              <Package className="h-3.5 w-3.5" /> Sản phẩm của shop
                            </div>
                            <div className="text-sm font-bold">{message.product_name || 'Xem sản phẩm'}</div>
                            <div className="mt-1 text-xs text-blue-600">Mở trang sản phẩm →</div>
                          </Link>
                        )}
                        {message.message_type === 'order' && message.shared_order_id && (
                          <Link
                            to={isSeller ? '/seller/orders' : '/customer/orders'}
                            className="block min-w-56 rounded-xl bg-white/95 p-3 text-slate-800 hover:bg-white"
                          >
                            <div className="mb-1 flex items-center gap-1 text-[11px] font-bold text-indigo-700">
                              <ShoppingBag className="h-3.5 w-3.5" /> Đơn hàng
                            </div>
                            <div className="text-sm font-bold">{message.order_code || `Đơn #${message.shared_order_id}`}</div>
                            <div className="mt-1 text-xs text-slate-500">Trạng thái: {message.order_status || 'Đang cập nhật'}</div>
                            <div className="mt-1 text-xs text-blue-600">Mở danh sách đơn hàng →</div>
                          </Link>
                        )}
                        {message.message_type === 'text' && (
                          <p className="whitespace-pre-wrap break-words text-sm">{message.message}</p>
                        )}
                        {message.message_type === 'image' && message.message !== 'Đã gửi hình ảnh' && (
                          <p className="mt-1 whitespace-pre-wrap break-words text-sm">{message.message}</p>
                        )}
                        <time className={`mt-1 block text-right text-[10px] ${isMine ? 'text-blue-100' : 'text-slate-400'}`}>{formatMessageTime(message.created_at)}</time>
                      </div>
                      {message.message_type !== 'deleted' && (
                        <div className={`flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 ${isMine ? 'order-first' : ''}`}>
                          <button
                            type="button"
                            onClick={() => { setReplyingTo(message); setShareMode(null); }}
                            aria-label="Trả lời tin nhắn"
                            title="Trả lời"
                            className="rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm hover:text-blue-600"
                          >
                            <Reply className="h-4 w-4" />
                          </button>
                          {isMine && (
                            <button
                              type="button"
                              onClick={() => void handleDeleteMessage(message)}
                              aria-label="Xóa tin nhắn"
                              title="Xóa với cả hai bên"
                              className="rounded-full border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-slate-100 p-3">
                {replyingTo && (
                  <div className="mb-2 flex items-center justify-between rounded-xl border-l-4 border-blue-500 bg-blue-50 px-3 py-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-blue-800">Đang trả lời {replyingTo.sender_name}</div>
                      <div className="truncate text-xs text-slate-600">{messagePreview(replyingTo)}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      aria-label="Hủy trả lời"
                      className="ml-2 rounded-full p-1 text-slate-500 hover:bg-blue-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <input
                    ref={imageInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleImageSelected}
                  />
                  <button
                    type="button"
                    onClick={() => imageInput.current?.click()}
                    disabled={sending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                  >
                    <ImagePlus className="h-4 w-4" /> Ảnh (tối đa 5 MB)
                  </button>
                  <button
                    type="button"
                    onClick={() => setShareMode(current => current === 'product' ? null : 'product')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <Link2 className="h-4 w-4" /> Chia sẻ sản phẩm
                  </button>
                  <button
                    type="button"
                    onClick={() => setShareMode(current => current === 'order' ? null : 'order')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    <ShoppingBag className="h-4 w-4" /> Chia sẻ đơn hàng
                  </button>
                </div>
                {shareMode && (
                  <div className="mb-2 max-h-36 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2">
                    {shareMode === 'product' ? (
                      shareOptions.products.length === 0 ? (
                        <p className="p-2 text-xs text-slate-500">Shop chưa có sản phẩm nào đang đăng bán.</p>
                      ) : shareOptions.products.map(product => (
                        <button
                          key={product.id}
                          type="button"
                          disabled={sending}
                          onClick={() => void sendSharedItem('product', product.id)}
                          className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs hover:bg-blue-50 disabled:opacity-50"
                        >
                          <span className="truncate font-semibold text-slate-800">{product.name}</span>
                          <span className="shrink-0 text-slate-500">{product.price === null ? '' : `${product.price.toLocaleString('vi-VN')} ₫`}</span>
                        </button>
                      ))
                    ) : shareOptions.orders.length === 0 ? (
                      <p className="p-2 text-xs text-slate-500">Không có đơn hàng liên quan đến hội thoại này.</p>
                    ) : shareOptions.orders.map(order => (
                      <button
                        key={order.id}
                        type="button"
                        disabled={sending}
                        onClick={() => void sendSharedItem('order', order.id)}
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs hover:bg-indigo-50 disabled:opacity-50"
                      >
                        <span className="font-semibold text-slate-800">{order.order_code}</span>
                        <span className="text-slate-500">{order.order_status} · {order.item_count} sản phẩm</span>
                      </button>
                    ))}
                  </div>
                )}
                <form onSubmit={handleSend} className="flex gap-2">
                <input
                  value={draft}
                  onChange={event => setDraft(event.target.value)}
                  maxLength={2000}
                  placeholder="Nhập tin nhắn..."
                  aria-label="Tin nhắn"
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  Gửi
                </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-slate-500">
              {loading ? 'Đang tải hộp thư...' : 'Chọn một hội thoại để xem tin nhắn.'}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
