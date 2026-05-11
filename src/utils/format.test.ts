import { describe, it, expect } from 'vitest';
import { formatDate, formatTime, truncateText, formatDuration } from './format';

// 測試
describe('format utils', () => {
  describe('formatDate', () => {
    it('應該正確格式化日期', () => {
      const date = new Date('2026-01-15');
      const result = formatDate(date);
      expect(result).toContain('2026');
      expect(result).toContain('1');
      expect(result).toContain('15');
    });

    it('應該支持不同語言環境', () => {
      const date = new Date('2026-01-15');
      const result = formatDate(date, 'en-US');
      expect(result).toContain('January');
    });
  });

  describe('formatTime', () => {
    it('應該正確格式化時間', () => {
      const date = new Date('2026-01-15T14:30:00');
      const result = formatTime(date);
      expect(result).toMatch(/14:30|下午/);
    });
  });

  describe('truncateText', () => {
    it('應該截斷過長文本', () => {
      const text = '這是一段很長的文本，需要被截斷';
      const result = truncateText(text, 5);
      expect(result).toBe('這是一段...');
      expect(result.length).toBeLessThanOrEqual(8); // 5 + 3
    });

    it('不應截斷短文本', () => {
      const text = '短文本';
      const result = truncateText(text, 10);
      expect(result).toBe(text);
    });
  });

  describe('formatDuration', () => {
    it('應該格式化秒數', () => {
      expect(formatDuration(45)).toBe('45秒');
    });

    it('應該格式化分鐘', () => {
      expect(formatDuration(180)).toBe('3分鐘');
    });

    it('應該格式化分鐘和秒數', () => {
      expect(formatDuration(185)).toBe('3分5秒');
    });
  });
});
