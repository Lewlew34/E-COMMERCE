/**
 * HTTP Client cơ sở dùng chung cho toàn bộ Frontend
 * Tự động đọc VITE_API_URL từ file .env gốc (fallback về localhost TechMart)
 */
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string) || 'http://localhost/TechMart/Backend/api';

export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  user?: T;
}

export async function apiClient<T>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const url = `${API_BASE_URL}/${endpoint}`;
  const response = await fetch(url, {
    method: options.method || 'GET',
    credentials: 'include', // Giữ cookie session PHP
    headers: {
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });

  const text = await response.text();
  let json: ApiResponse<T>;
  try {
    json = JSON.parse(text) as ApiResponse<T>;
  } catch {
    throw new Error(`Máy chủ phản hồi không đúng định dạng JSON (${response.status}): ${text.slice(0, 150)}`);
  }

  if (!response.ok || json.status !== 'success') {
    throw new Error(json.message || `Lỗi yêu cầu API (${response.status})`);
  }

  if (json.data !== undefined) return json.data;
  if (json.user !== undefined) return json.user;
  return json as unknown as T;
}
