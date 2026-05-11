/**
 * 格式化工具函數
 */

// 格式化日期
export function formatDate(date: Date, locale: string = 'zh-TW'): string {
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  });
}

// 格式化時間
export function formatTime(date: Date, locale: string = 'zh-TW'): string {
  return date.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 截斷文本
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1) + '...';
}

// 格式化持續時間
export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes === 0) {
    return `${remainingSeconds}秒`;
  }

  if (remainingSeconds === 0) {
    return `${minutes}分鐘`;
  }

  return `${minutes}分${remainingSeconds}秒`;
}
