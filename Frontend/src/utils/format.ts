/**
 * Định dạng số thành tiền tệ VNĐ (ví dụ: 24.990.000 ₫)
 */
export function formatCurrencyVN(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}

/**
 * Định dạng ngày giờ chuẩn Việt Nam (DD/MM/YYYY)
 */
export function formatDateVN(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}
