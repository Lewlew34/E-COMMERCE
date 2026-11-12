import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  X,
  Minus,
  Send,
  RotateCcw,
  Flame,
  ShieldCheck,
  Truck,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { productService } from '../../services/storageService';
import { aiChatApi, type AiChatHistoryItem } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import type { Product } from '../../types/ecommerce.types';
import { formatCurrencyVN } from '../../utils/format';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  products?: Product[];
}

const MAX_STORED_MESSAGES = 50;

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'ai',
    text: 'Xin chào bạn! 👋 Em là **LHKTech AI Assistant**. Em có thể giúp bạn chọn thiết bị công nghệ phù hợp ngân sách, tra cứu sản phẩm Flash Sale hoặc giải đáp chính sách bảo hành & giao hàng. Bạn cần em hỗ trợ gì hôm nay?',
    timestamp: 'Vừa xong'
  }
];

const SUGGESTION_CHIPS = [
  '🔥 Sản phẩm Flash Sale hôm nay',
  '💻 Laptop gaming dưới 40 triệu',
  '🍎 MacBook chính hãng Apple',
  '📱 Flagship iPhone & Smartphone',
  '🛡️ Chính sách bảo hành & đổi trả',
  '🚚 Phí giao hàng & thời gian nhận'
];

function getChatStorageKey(email?: string, id?: string | number): string | null {
  const identifier = (email || (id != null ? String(id) : '')).trim().toLowerCase();
  return identifier ? `techmart_ai_chat_${identifier}` : null;
}

function loadUserMessages(storageKey: string | null): ChatMessage[] {
  if (!storageKey) return INITIAL_MESSAGES;
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return INITIAL_MESSAGES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_MESSAGES;

    const valid = parsed
      .filter(
        (item): item is ChatMessage =>
          item &&
          typeof item === 'object' &&
          typeof item.id === 'string' &&
          (item.sender === 'ai' || item.sender === 'user') &&
          typeof item.text === 'string' &&
          typeof item.timestamp === 'string'
      )
      .map(item => (item.id === 'msg-welcome' ? { ...item, text: INITIAL_MESSAGES[0].text } : item));
    return valid.length > 0 ? valid.slice(-MAX_STORED_MESSAGES) : INITIAL_MESSAGES;
  } catch {
    return INITIAL_MESSAGES;
  }
}

function saveUserMessages(storageKey: string | null, messages: ChatMessage[]): void {
  if (!storageKey) return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)));
  } catch (error) {
    console.warn('Không thể lưu lịch sử chat AI:', error);
  }
}

function createChatMessage(
  sender: 'ai' | 'user',
  text: string,
  products?: Product[]
): ChatMessage {
  return {
    id: `${sender}-${Date.now()}`,
    sender,
    text,
    timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    products: products && products.length > 0 ? products : undefined
  };
}

function extractMaxBudgetVnd(lowerText: string): number | null {
  const match = lowerText.match(/(?:dưới|tầm|khoảng|tối đa|<=?)\s*(\d+(?:[.,]\d+)?)\s*(tr|triệu|trieu|m|k|nghìn|nghin)?/i);
  if (!match) return null;
  const num = Number(match[1].replace(',', '.'));
  if (!Number.isFinite(num) || num <= 0) return null;
  const unit = (match[2] || '').toLowerCase();
  if (unit === 'k' || unit === 'nghìn' || unit === 'nghin') return num * 1_000;
  if (unit === 'tr' || unit === 'triệu' || unit === 'trieu' || unit === 'm' || num < 500) {
    return num * 1_000_000;
  }
  return num;
}

function getProductPrice(product: Product): number {
  return product.flashSalePrice || product.variants[0]?.price || 0;
}

function generateLocalFallbackReply(
  text: string,
  allProducts: Product[]
): { reply: string; products: Product[] } {
  const lower = text.toLowerCase();
  const maxBudget = extractMaxBudgetVnd(lower);

  const filterByBudget = (items: Product[]) =>
    maxBudget ? items.filter(p => {
      const price = getProductPrice(p);
      return price > 0 && price <= maxBudget;
    }) : items;

  // 1. Chính sách bảo hành & đổi trả
  if (lower.includes('bảo hành') || lower.includes('đổi trả') || lower.includes('lỗi') || lower.includes('chính sách')) {
    return {
      reply: 'Dạ, chính sách cam kết chất lượng tại **LHKTech** luôn đảm bảo an tâm tuyệt đối:\n\n• 🛡️ **Bảo hành 24 tháng:** Toàn bộ thiết bị chính hãng có VAT và thẻ bảo hành.\n• 🔄 **1 Đổi 1 trong 30 ngày:** Đổi mới ngay lập tức nếu xuất hiện lỗi từ nhà sản xuất.\n• 👨‍💻 **Kỹ thuật viên 24/7:** Hỗ trợ tư vấn cấu hình, cài đặt phần mềm và tối ưu hiệu năng miễn phí.',
      products: []
    };
  }

  // 2. Chính sách giao hàng
  if (lower.includes('giao hàng') || lower.includes('ship') || lower.includes('vận chuyển') || lower.includes('thời gian nhận') || lower.includes('phí')) {
    return {
      reply: 'Dạ, dịch vụ giao vận tại **LHKTech** cực kỳ nhanh chóng:\n\n• 🚀 **Giao hỏa tốc 2H:** Áp dụng nội thành cho quý khách cần nhận máy gấp.\n• 📦 **Miễn phí ship toàn quốc:** Cho đơn hàng có giá trị từ 500.000₫ trở lên.\n• 🛡️ **Bọc chống sốc chuyên dụng:** Đóng thùng bảo vệ đa lớp an toàn tuyệt đối cho linh kiện điện tử.',
      products: []
    };
  }

  // 3. Flash sale
  if (lower.includes('flash') || lower.includes('sale') || lower.includes('giảm giá') || lower.includes('khuyến mãi')) {
    const flashSales = filterByBudget(allProducts.filter(p => p.isFlashSale));
    const matched = flashSales.length > 0 ? flashSales.slice(0, 4) : filterByBudget(allProducts).slice(0, 3);
    return {
      reply: 'Dưới đây là các thiết bị công nghệ đang trong chương trình **Flash Sale Giờ Vàng** tại LHKTech! Số lượng có hạn bạn nhanh tay săn ngay nhé:',
      products: matched
    };
  }

  // 4. Laptop / Gaming / MacBook / Máy tính
  if (
    lower.includes('laptop') ||
    lower.includes('máy tính') ||
    lower.includes('may tinh') ||
    lower.includes('ultrabook') ||
    lower.includes('macbook') ||
    lower.includes('gaming') ||
    lower.includes('đồ họa') ||
    lower.includes('asus') ||
    lower.includes('rog') ||
    lower.includes('m3')
  ) {
    const laptops = allProducts.filter(p =>
      p.category?.slug === 'laptop' ||
      p.name.toLowerCase().includes('laptop') ||
      p.name.toLowerCase().includes('macbook') ||
      p.name.toLowerCase().includes('rog')
    );
    const budgetMatched = filterByBudget(laptops).slice(0, 4);
    if (maxBudget && budgetMatched.length === 0) {
      return {
        reply: `Hiện chưa có mẫu laptop nào dưới **${formatCurrencyVN(maxBudget)}** trong danh sách. Bạn tham khảo các mẫu laptop hiện có tại LHKTech nhé:`,
        products: laptops.slice(0, 3)
      };
    }
    return {
      reply: maxBudget
        ? `Dưới đây là các mẫu **Laptop / MacBook** phù hợp ngân sách dưới **${formatCurrencyVN(maxBudget)}** tại LHKTech:`
        : 'LHKTech hiện có các dòng Laptop Gaming hiệu năng khủng và MacBook chính hãng Apple. Em gợi ý bạn các mẫu nổi bật nhất:',
      products: budgetMatched
    };
  }

  // 5. Điện thoại / Tablet
  if (lower.includes('iphone') || lower.includes('phone') || lower.includes('điện thoại') || lower.includes('đt') || lower.includes('smartphone') || lower.includes('tablet') || lower.includes('samsung')) {
    const phones = filterByBudget(allProducts.filter(p =>
      p.category?.slug === 'phone' ||
      p.name.toLowerCase().includes('iphone') ||
      p.name.toLowerCase().includes('samsung')
    )).slice(0, 4);
    return {
      reply: 'Các dòng điện thoại Flagship chính hãng phân phối ủy quyền tại Việt Nam, cam kết nguyên seal 100% VAT đầy đủ:',
      products: phones
    };
  }

  // 6. Linh kiện PC / VGA
  if (lower.includes('pc') || lower.includes('vga') || lower.includes('rtx') || lower.includes('card') || lower.includes('linh kiện') || lower.includes('cpu')) {
    const parts = filterByBudget(allProducts.filter(p =>
      p.category?.slug === 'pc-component' ||
      p.name.toLowerCase().includes('rtx') ||
      p.name.toLowerCase().includes('vga')
    )).slice(0, 4);
    return {
      reply: 'Linh kiện build PC cao cấp, card đồ họa NVIDIA RTX hiệu năng dẫn đầu cho game thủ và đồ họa chuyên nghiệp:',
      products: parts
    };
  }

  // 7. Màn hình
  if (lower.includes('màn hình') || lower.includes('monitor')) {
    const monitors = filterByBudget(allProducts.filter(p =>
      p.category?.slug === 'monitor' ||
      p.name.toLowerCase().includes('màn hình')
    )).slice(0, 4);
    return {
      reply: 'Màn hình công nghệ chuẩn màu đồ họa và tần số quét cao dành cho bạn:',
      products: monitors
    };
  }

  // 8. Chào hỏi
  if (lower.includes('chào') || lower.includes('hi') || lower.includes('hello') || lower.includes('ơi')) {
    return {
      reply: 'Xin chào bạn! Rất vui được đồng hành cùng bạn. Em có thể tìm kiếm cấu hình máy tính, check giá Flash Sale hoặc giải đáp các thắc mắc về chính sách giao hàng và bảo hành giúp bạn ngay lúc này nhé!',
      products: []
    };
  }

  // 9. Lọc theo ngân sách hoặc từ khóa tự do
  if (maxBudget) {
    const underBudget = filterByBudget(allProducts).slice(0, 4);
    if (underBudget.length > 0) {
      return {
        reply: `Em tìm thấy ${underBudget.length} sản phẩm phù hợp mức giá dưới **${formatCurrencyVN(maxBudget)}**:`,
        products: underBudget
      };
    }
  }

  const keywordMatches = allProducts.filter(p =>
    p.name.toLowerCase().includes(lower) ||
    p.description.toLowerCase().includes(lower) ||
    (p.brand?.name.toLowerCase().includes(lower) ?? false)
  );

  if (keywordMatches.length > 0) {
    return {
      reply: `Em tìm thấy ${keywordMatches.length} sản phẩm phù hợp với từ khóa "${text}" của bạn:`,
      products: keywordMatches.slice(0, 3)
    };
  }

  return {
    reply: 'Cảm ơn bạn đã nhắn tin cho LHKTech AI! Em có thể tư vấn chi tiết cấu hình máy, gợi ý deal Flash Sale giá sốc hoặc tra cứu sản phẩm chính hãng. Bạn có thể bấm các gợi ý nhanh bên dưới hoặc miêu tả nhu cầu cụ thể hơn (VD: "laptop dưới 40tr", "iPhone", "màn hình 240Hz") nhé!',
    products: []
  };
}

export const AIChatWidget: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const chatStorageKey = getChatStorageKey(user?.email, user?.id);

  // Chỉ hiển thị boxchat sau khi đăng nhập; key theo từng user để tự động tách lịch sử chat
  if (!isAuthenticated || !user || !chatStorageKey) {
    return null;
  }

  return <AIChatWidgetInner key={chatStorageKey} storageKey={chatStorageKey} />;
};

const AIChatWidgetInner: React.FC<{ storageKey: string }> = ({ storageKey }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadUserMessages(storageKey));
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [aiModeLabel, setAiModeLabel] = useState<'Gemini AI' | 'Tư vấn tức thì'>('Gemini AI');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Lưu lịch sử chat riêng cho người dùng hiện tại
  useEffect(() => {
    saveUserMessages(storageKey, messages);
  }, [storageKey, messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleOpen = () => {
    setIsOpen(true);
    setHasUnread(false);
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isTyping) return;

    const historyPayload: AiChatHistoryItem[] = messages.slice(-10).map(m => ({
      sender: m.sender,
      text: m.text
    }));

    const userMessage = createChatMessage('user', text);

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    let replyText = '';
    let matchedProducts: Product[] = [];

    try {
      const aiRes = await aiChatApi.sendMessage(text, historyPayload);
      replyText = aiRes.reply;
      matchedProducts = aiRes.products;
      setAiModeLabel('Gemini AI');
    } catch (error) {
      console.warn('Không thể kết nối Gemini Proxy, chuyển sang bộ lọc cục bộ:', error);
      const localResult = generateLocalFallbackReply(text, productService.getAll());
      replyText = localResult.reply;
      matchedProducts = localResult.products;
      setAiModeLabel('Tư vấn tức thì');
    }

    const aiMessage = createChatMessage('ai', replyText, matchedProducts);

    setMessages(prev => [...prev, aiMessage]);
    setIsTyping(false);

    if (!isOpenRef.current) {
      setHasUnread(true);
    }
  };

  const handleReset = () => {
    setMessages(INITIAL_MESSAGES);
    setHasUnread(false);
  };

  return (
    <>
      {/* 1. FLOATING ROUND ACTION BUTTON (When collapsed) */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
          {/* Subtle invitation chip tooltip */}
          <div
            onClick={handleOpen}
            className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/90 text-white text-xs font-semibold shadow-xl border border-slate-700/80 backdrop-blur-md cursor-pointer hover:bg-slate-900 transition-all animate-bounce"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Hỏi LHKTech AI ✨</span>
          </div>

          <button
            onClick={handleOpen}
            aria-label="Mở khung chat LHKTech AI"
            className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-2xl shadow-blue-600/50 hover:scale-105 active:scale-95 transition-all cursor-pointer group border-2 border-white/20"
          >
            <Bot className="w-7 h-7 text-white group-hover:rotate-12 transition-transform" />

            {/* Sparkle ping indicator */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-white"></span>
            </span>

            {/* Unread badge if closed while response arrived */}
            {hasUnread && (
              <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-600 text-white border-2 border-white shadow">
                1
              </span>
            )}
          </button>
        </div>
      )}

      {/* 2. EXPANDED AI CHAT WINDOW */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[410px] h-[580px] max-h-[calc(100vh-3rem)] bg-white rounded-3xl shadow-2xl border border-slate-200/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-300">
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white flex items-center justify-between shrink-0 shadow-sm border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-md">
                <Bot className="w-5 h-5" />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-950"></span>
              </div>
              <div>
                <div className="font-bold text-xs tracking-tight text-white flex items-center gap-1.5">
                  LHKTech AI Assistant
                  <span className="px-1.5 py-0.2 rounded-md bg-blue-500/20 text-blue-400 text-[9px] font-mono border border-blue-500/30">
                    {aiModeLabel === 'Gemini AI' ? 'GEMINI' : 'PRO'}
                  </span>
                </div>
                <div className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Trực tuyến 24/7 • {aiModeLabel}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                title="Làm mới cuộc trò chuyện"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Thu nhỏ thành hình tròn"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Đóng chat"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick value banner */}
          <div className="bg-slate-50 border-b border-slate-100 px-3 py-1.5 flex items-center justify-between text-[10px] text-slate-500 shrink-0">
            <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-600" /> 100% Chính hãng</span>
            <span className="flex items-center gap-1"><Truck className="w-3 h-3 text-blue-600" /> Ship 2H nội thành</span>
            <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-red-500" /> Flash Sale -30%</span>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className="max-w-[85%] space-y-2">
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-xs shadow-md shadow-blue-600/20'
                        : 'bg-white text-slate-800 rounded-tl-xs border border-slate-200/80 shadow-xs'
                    }`}
                  >
                    <div className="whitespace-pre-line">
                      {msg.text.split('**').map((part, i) =>
                        i % 2 === 1 ? <strong key={i} className="font-bold">{part}</strong> : part
                      )}
                    </div>
                    <div
                      className={`text-[9px] mt-1 text-right ${
                        msg.sender === 'user' ? 'text-blue-200' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>

                  {/* Recommended Products Carousel Cards */}
                  {msg.products && msg.products.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Layers className="w-3 h-3 text-blue-500" />
                        <span>Sản phẩm gợi ý dành cho bạn:</span>
                      </div>
                      <div className="space-y-1.5">
                        {msg.products.map(p => {
                          const v = p.variants[0];
                          const price = p.flashSalePrice || v?.price || 0;
                          const origPrice = p.flashSaleOriginalPrice || v?.compareAtPrice;

                          return (
                            <Link
                              key={p.id}
                              to={`/product/${p.id}`}
                              onClick={() => setIsOpen(false)}
                              className="p-2 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-md transition-all flex items-center gap-2.5 group block text-left"
                            >
                              <img
                                src={v?.image || ''}
                                alt={p.name}
                                className="w-12 h-12 rounded-lg object-cover border border-slate-100 shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-[10px] text-slate-400 font-semibold uppercase">{p.brand?.name}</div>
                                <div className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                                  {p.name}
                                </div>
                                <div className="flex items-baseline gap-1.5 mt-0.5">
                                  <span className="text-xs font-black text-rose-600">
                                    {formatCurrencyVN(price)}
                                  </span>
                                  {origPrice && origPrice > price && (
                                    <span className="text-[10px] text-slate-400 line-through">
                                      {formatCurrencyVN(origPrice)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-slate-400 text-xs">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white px-3 py-2 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="text-[11px] text-slate-400 ml-1">LHKTech AI đang trả lời...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap text-[11px] shrink-0 no-scrollbar">
            {SUGGESTION_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleSendMessage(chip)}
                disabled={isTyping}
                className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 border border-slate-200/80 text-slate-600 transition-all shrink-0 cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2 shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Nhập câu hỏi cho AI (VD: laptop dưới 40tr)..."
              className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white text-slate-800 placeholder:text-slate-400 transition-all"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 text-white transition-all cursor-pointer shadow-md disabled:cursor-not-allowed shrink-0"
              title="Gửi tin nhắn"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
