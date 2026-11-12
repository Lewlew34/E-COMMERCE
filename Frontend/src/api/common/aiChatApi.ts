import { apiClient } from '../client';
import { mapRawProductToModel, type ApiRawProduct } from './catalogApi';
import type { Product } from '../../types/ecommerce.types';

export interface AiChatHistoryItem {
  sender: 'user' | 'ai';
  text: string;
}

export interface AiChatResponse {
  reply: string;
  products: Product[];
  source: 'gemini';
  model?: string;
}

interface RawAiChatResponse {
  reply: string;
  products?: ApiRawProduct[];
  source?: 'gemini';
  model?: string;
}

export const aiChatApi = {
  async sendMessage(message: string, history: AiChatHistoryItem[]): Promise<AiChatResponse> {
    const data = await apiClient<RawAiChatResponse>('common/ai_chat.php', {
      method: 'POST',
      body: {
        message,
        history: history.slice(-10)
      }
    });

    const products = Array.isArray(data.products)
      ? data.products.map(item => mapRawProductToModel(item))
      : [];

    return {
      reply: data.reply,
      products,
      source: 'gemini',
      model: data.model
    };
  }
};
