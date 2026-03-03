/**
 * 日期和時間工具函數
 */

/**
 * 格式化相對時間 (如 "2小時前", "昨天")
 */
export function formatRelativeTime(date: Date | string, locale: string = 'zh-TW'): string {
    const now = new Date();
    const target = new Date(date);
    const diffMs = now.getTime() - target.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

    if (diffSeconds < 60) {
        return rtf.format(-diffSeconds, 'second');
    } else if (diffMinutes < 60) {
        return rtf.format(-diffMinutes, 'minute');
    } else if (diffHours < 24) {
        return rtf.format(-diffHours, 'hour');
    } else if (diffDays === 1) {
        return locale === 'zh-TW' ? '昨天' : 'Yesterday';
    } else if (diffDays < 7) {
        return rtf.format(-diffDays, 'day');
    } else {
        return formatShortDate(date, locale);
    }
}

/**
 * 格式化短日期 (如 "1/15" 或 "01/15")
 */
export function formatShortDate(date: Date | string, locale: string = 'zh-TW'): string {
    const target = new Date(date);
    return target.toLocaleDateString(locale, {
        month: 'numeric',
        day: 'numeric',
    });
}

/**
 * 格式化完整日期時間
 */
export function formatDateTime(date: Date | string, locale: string = 'zh-TW'): string {
    const target = new Date(date);
    return target.toLocaleString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * 獲取一天中的問候語
 */
export function getGreeting(locale: string = 'zh-TW'): string {
    const hour = new Date().getHours();
    
    const greetings = {
        'zh-TW': {
            morning: '早安',
            afternoon: '午安',
            evening: '晚安',
            night: '夜深了',
        },
        'zh-CN': {
            morning: '早安',
            afternoon: '午安',
            evening: '晚安',
            night: '夜深了',
        },
    };

    const langGreetings = greetings[locale] || greetings['zh-TW'];

    if (hour >= 5 && hour < 12) return langGreetings.morning;
    if (hour >= 12 && hour < 18) return langGreetings.afternoon;
    if (hour >= 18 && hour < 22) return langGreetings.evening;
    return langGreetings.night;
}

/**
 * 檢查是否為同一天
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
}

/**
 * 檢查是否為今天
 */
export function isToday(date: Date | string): boolean {
    return isSameDay(date, new Date());
}

/**
 * 獲取日期範圍內的天數
 */
export function getDaysBetween(start: Date | string, end: Date | string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * 獲取本週的開始和結束日期
 */
export function getWeekRange(date: Date = new Date()): { start: Date; end: Date } {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); // 調整為禮拜一開始
    
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    
    return { start, end };
}

/**
 * 獲取本月的開始和結束日期
 */
export function getMonthRange(date: Date = new Date()): { start: Date; end: Date } {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end };
}

/**
 * 格式化時區時間
 */
export function formatTimezoneTime(date: Date | string, timezone: string = 'Asia/Taipei', locale: string = 'zh-TW'): string {
    const target = new Date(date);
    return target.toLocaleTimeString(locale, {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
    });
}