import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
    formatRelativeTime,
    formatShortDate,
    formatDateTime,
    getGreeting,
    isSameDay,
    isToday,
    getDaysBetween,
    getWeekRange,
    getMonthRange,
    formatTimezoneTime
} from './dateUtils';

describe('dateUtils', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('formatRelativeTime', () => {
        it('應該格式化剛剛的時間（少於60秒）', () => {
            const now = new Date('2026-01-15T12:00:00');
            vi.setSystemTime(now);
            
            const target = new Date('2026-01-15T11:59:30');
            const result = formatRelativeTime(target);
            
            expect(result).toContain('秒');
        });

        it('應該格式化幾分鐘前', () => {
            const now = new Date('2026-01-15T12:00:00');
            vi.setSystemTime(now);
            
            const target = new Date('2026-01-15T11:55:00');
            const result = formatRelativeTime(target);
            
            expect(result).toContain('分鐘');
        });

        it('應該格式化幾小時前', () => {
            const now = new Date('2026-01-15T12:00:00');
            vi.setSystemTime(now);
            
            const target = new Date('2026-01-15T09:00:00');
            const result = formatRelativeTime(target);
            
            expect(result).toContain('小時');
        });

        it('應該格式化昨天', () => {
            const now = new Date('2026-01-15T12:00:00');
            vi.setSystemTime(now);
            
            const target = new Date('2026-01-14T12:00:00');
            const result = formatRelativeTime(target);
            
            expect(result).toBe('昨天');
        });

        it('應該格式化幾天前', () => {
            const now = new Date('2026-01-15T12:00:00');
            vi.setSystemTime(now);
            
            const target = new Date('2026-01-12T12:00:00');
            const result = formatRelativeTime(target);
            
            expect(result).toContain('天');
        });

        it('應該格式化超過一週的日期', () => {
            const now = new Date('2026-01-15T12:00:00');
            vi.setSystemTime(now);
            
            const target = new Date('2026-01-05T12:00:00');
            const result = formatRelativeTime(target);
            
            // 應該返回短日期格式
            expect(result).toContain('1');
            expect(result).toContain('5');
        });

        it('應該支持英文語言環境', () => {
            const now = new Date('2026-01-15T12:00:00');
            vi.setSystemTime(now);
            
            const target = new Date('2026-01-14T12:00:00');
            const result = formatRelativeTime(target, 'en-US');
            
            expect(result).toBe('Yesterday');
        });
    });

    describe('formatShortDate', () => {
        it('應該格式化短日期', () => {
            const date = new Date('2026-01-15');
            const result = formatShortDate(date);
            
            expect(result).toContain('1');
            expect(result).toContain('15');
        });

        it('應該支持不同語言環境', () => {
            const date = new Date('2026-01-15');
            const result = formatShortDate(date, 'en-US');
            
            expect(result).toContain('1');
            expect(result).toContain('15');
        });

        it('應該處理字符串日期', () => {
            const result = formatShortDate('2026-01-15');
            
            expect(result).toContain('1');
            expect(result).toContain('15');
        });
    });

    describe('formatDateTime', () => {
        it('應該格式化完整日期時間', () => {
            const date = new Date('2026-01-15T14:30:00');
            const result = formatDateTime(date);
            
            expect(result).toContain('2026');
            expect(result).toContain('1');
            expect(result).toContain('15');
        });

        it('應該支持不同語言環境', () => {
            const date = new Date('2026-01-15T14:30:00');
            const result = formatDateTime(date, 'en-US');
            
            expect(result).toContain('2026');
        });
    });

    describe('getGreeting', () => {
        it('應該返回早安（5-12點）', () => {
            const morning = new Date('2026-01-15T08:00:00');
            vi.setSystemTime(morning);
            
            const result = getGreeting();
            
            expect(result).toBe('早安');
        });

        it('應該返回午安（12-18點）', () => {
            const afternoon = new Date('2026-01-15T14:00:00');
            vi.setSystemTime(afternoon);
            
            const result = getGreeting();
            
            expect(result).toBe('午安');
        });

        it('應該返回晚安（18-22點）', () => {
            const evening = new Date('2026-01-15T20:00:00');
            vi.setSystemTime(evening);
            
            const result = getGreeting();
            
            expect(result).toBe('晚安');
        });

        it('應該返回夜深了（22-5點）', () => {
            const night = new Date('2026-01-15T23:00:00');
            vi.setSystemTime(night);
            
            const result = getGreeting();
            
            expect(result).toBe('夜深了');
        });

        it('應該在凌晨返回夜深了', () => {
            const lateNight = new Date('2026-01-15T03:00:00');
            vi.setSystemTime(lateNight);
            
            const result = getGreeting();
            
            expect(result).toBe('夜深了');
        });

        it('應該支持簡體中文', () => {
            const morning = new Date('2026-01-15T08:00:00');
            vi.setSystemTime(morning);
            
            const result = getGreeting('zh-CN');
            
            expect(result).toBe('早安');
        });

        it('應該默認使用繁體中文', () => {
            const morning = new Date('2026-01-15T08:00:00');
            vi.setSystemTime(morning);
            
            const result = getGreeting('unknown-locale' as any);
            
            expect(result).toBe('早安');
        });
    });

    describe('isSameDay', () => {
        it('應該返回 true 當日期相同', () => {
            const date1 = new Date('2026-01-15T10:00:00');
            const date2 = new Date('2026-01-15T14:00:00');
            
            const result = isSameDay(date1, date2);
            
            expect(result).toBe(true);
        });

        it('應該返回 false 當日期不同', () => {
            const date1 = new Date('2026-01-15T10:00:00');
            const date2 = new Date('2026-01-16T10:00:00');
            
            const result = isSameDay(date1, date2);
            
            expect(result).toBe(false);
        });

        it('應該返回 false 當月份不同', () => {
            const date1 = new Date('2026-01-15T10:00:00');
            const date2 = new Date('2026-02-15T10:00:00');
            
            const result = isSameDay(date1, date2);
            
            expect(result).toBe(false);
        });

        it('應該返回 false 當年份不同', () => {
            const date1 = new Date('2026-01-15T10:00:00');
            const date2 = new Date('2027-01-15T10:00:00');
            
            const result = isSameDay(date1, date2);
            
            expect(result).toBe(false);
        });

        it('應該支持字符串日期', () => {
            const result = isSameDay('2026-01-15', '2026-01-15');
            
            expect(result).toBe(true);
        });
    });

    describe('isToday', () => {
        it('應該返回 true 當日期是今天', () => {
            const today = new Date();
            
            const result = isToday(today);
            
            expect(result).toBe(true);
        });

        it('應該返回 false 當日期不是今天', () => {
            const yesterday = new Date(Date.now() - 86400000);
            
            const result = isToday(yesterday);
            
            expect(result).toBe(false);
        });
    });

    describe('getDaysBetween', () => {
        it('應該計算兩個日期之間的天數', () => {
            const start = new Date('2026-01-01');
            const end = new Date('2026-01-15');
            
            const result = getDaysBetween(start, end);
            
            expect(result).toBe(14);
        });

        it('應該處理相反的順序', () => {
            const start = new Date('2026-01-15');
            const end = new Date('2026-01-01');
            
            const result = getDaysBetween(start, end);
            
            expect(result).toBe(14);
        });

        it('應該支持字符串日期', () => {
            const result = getDaysBetween('2026-01-01', '2026-01-15');
            
            expect(result).toBe(14);
        });
    });

    describe('getWeekRange', () => {
        it('應該返回本週範圍（從週一開始）', () => {
            // 2026-01-15 是星期四
            const date = new Date('2026-01-15T12:00:00');
            
            const result = getWeekRange(date);
            
            // 本週一應該是 2026-01-12
            expect(result.start.getDay()).toBe(1); // 週一
            expect(result.end.getDay()).toBe(0); // 週日
            
            // 驗證開始時間是 00:00:00
            expect(result.start.getHours()).toBe(0);
            expect(result.start.getMinutes()).toBe(0);
            expect(result.start.getSeconds()).toBe(0);
            
            // 驗證結束時間是 23:59:59
            expect(result.end.getHours()).toBe(23);
            expect(result.end.getMinutes()).toBe(59);
            expect(result.end.getSeconds()).toBe(59);
        });

        it('應該默認使用當前日期', () => {
            const now = new Date('2026-01-15T12:00:00');
            vi.setSystemTime(now);
            
            const result = getWeekRange();
            
            expect(result.start.getDay()).toBe(1);
            expect(result.end.getDay()).toBe(0);
        });
    });

    describe('getMonthRange', () => {
        it('應該返回本月範圍', () => {
            const date = new Date('2026-01-15T12:00:00');
            
            const result = getMonthRange(date);
            
            expect(result.start.getDate()).toBe(1);
            expect(result.start.getMonth()).toBe(0); // 一月
            expect(result.start.getFullYear()).toBe(2026);
            
            expect(result.end.getMonth()).toBe(0); // 一月
            expect(result.end.getFullYear()).toBe(2026);
            
            // 驗證開始時間是 00:00:00
            expect(result.start.getHours()).toBe(0);
            expect(result.start.getMinutes()).toBe(0);
            expect(result.start.getSeconds()).toBe(0);
            
            // 驗證結束時間是 23:59:59
            expect(result.end.getHours()).toBe(23);
            expect(result.end.getMinutes()).toBe(59);
            expect(result.end.getSeconds()).toBe(59);
        });

        it('應該處理不同月份的天數', () => {
            // 二月（非閏年）
            const feb = new Date('2026-02-15T12:00:00');
            const result = getMonthRange(feb);
            
            expect(result.start.getDate()).toBe(1);
            expect(result.end.getDate()).toBe(28);
        });

        it('應該默認使用當前日期', () => {
            const now = new Date('2026-01-15T12:00:00');
            vi.setSystemTime(now);
            
            const result = getMonthRange();
            
            expect(result.start.getDate()).toBe(1);
        });
    });

    describe('formatTimezoneTime', () => {
        it('應該格式化時區時間', () => {
            const date = new Date('2026-01-15T14:30:00');
            
            const result = formatTimezoneTime(date);
            
            // 驗證返回時間格式
            expect(result).toMatch(/\d{1,2}:\d{2}/);
        });

        it('應該支持不同時區', () => {
            const date = new Date('2026-01-15T14:30:00');
            
            const result = formatTimezoneTime(date, 'America/New_York');
            
            expect(result).toMatch(/\d{1,2}:\d{2}/);
        });

        it('應該支持不同語言環境', () => {
            const date = new Date('2026-01-15T14:30:00');
            
            const result = formatTimezoneTime(date, 'Asia/Taipei', 'en-US');
            
            expect(result).toMatch(/\d{1,2}:\d{2}/);
        });

        it('應該處理字符串日期', () => {
            const result = formatTimezoneTime('2026-01-15T14:30:00');
            
            expect(result).toMatch(/\d{1,2}:\d{2}/);
        });
    });
});
