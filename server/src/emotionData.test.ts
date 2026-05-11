import { describe, it, expect } from 'vitest';
import {
  findEmotionWords,
  getQuadrantDescription,
  getNeedsForEmotion,
  EMOTION_WORDS,
} from './emotionData.js';

describe('emotionData', () => {
  describe('findEmotionWords', () => {
    it('精確匹配單個情緒詞', () => {
      const result = findEmotionWords('焦慮');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('焦慮');
      expect(result[0].quadrant).toBe('red');
    });

    it('精確匹配多個不同情緒詞', () => {
      const angry = findEmotionWords('憤怒');
      expect(angry[0].name).toBe('憤怒');

      const happy = findEmotionWords('快樂');
      expect(happy[0].name).toBe('快樂');

      const calm = findEmotionWords('平靜');
      expect(calm[0].name).toBe('平靜');
    });

    it('部分匹配：輸入包含情緒詞', () => {
      const result = findEmotionWords('我很焦慮');
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((e) => e.name === '焦慮')).toBe(true);
    });

    it('部分匹配：情緒詞包含輸入', () => {
      const result = findEmotionWords('壓力');
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((e) => e.name === '壓力大')).toBe(true);
    });

    it('模糊匹配紅色象限關鍵字', () => {
      const result = findEmotionWords('我好生氣');
      expect(result.every((e) => e.quadrant === 'red')).toBe(true);
    });

    it('模糊匹配黃色象限關鍵字', () => {
      const result = findEmotionWords('開心');
      expect(result.every((e) => e.quadrant === 'yellow')).toBe(true);
    });

    it('模糊匹配藍色象限關鍵字', () => {
      const result = findEmotionWords('難過');
      expect(result.every((e) => e.quadrant === 'blue')).toBe(true);
    });

    it('模糊匹配綠色象限關鍵字', () => {
      const result = findEmotionWords('靜');
      expect(result.every((e) => e.quadrant === 'green')).toBe(true);
    });

    it('模糊匹配英文關鍵字 OK', () => {
      const result = findEmotionWords('OK');
      expect(result.every((e) => e.quadrant === 'green')).toBe(true);
    });

    it('無匹配時返回默認高頻情緒詞', () => {
      const result = findEmotionWords('xyz-unknown');
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(6);
    });

    it('空字符串返回默認高頻情緒詞', () => {
      const result = findEmotionWords('');
      expect(result.length).toBeGreaterThan(0);
    });

    it('限制返回數量', () => {
      const result = findEmotionWords('煩', 3);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('處理包含空格的輸入', () => {
      const result = findEmotionWords('  焦慮  ');
      expect(result[0].name).toBe('焦慮');
    });
  });

  describe('getQuadrantDescription', () => {
    it('返回紅色象限描述', () => {
      expect(getQuadrantDescription('red')).toContain('高能量低愉悅');
    });

    it('返回黃色象限描述', () => {
      expect(getQuadrantDescription('yellow')).toContain('高能量高愉悅');
    });

    it('返回藍色象限描述', () => {
      expect(getQuadrantDescription('blue')).toContain('低能量低愉悅');
    });

    it('返回綠色象限描述', () => {
      expect(getQuadrantDescription('green')).toContain('低能量高愉悅');
    });

    it('未知象限返回空字符串', () => {
      expect(getQuadrantDescription('unknown')).toBe('');
    });
  });

  describe('getNeedsForEmotion', () => {
    it('返回已知情緒的需求', () => {
      const needs = getNeedsForEmotion('焦慮');
      expect(needs).toContain('安全感');
      expect(needs).toContain('確定性');
      expect(needs).toContain('被支持');
    });

    it('返回另一已知情緒的需求', () => {
      const needs = getNeedsForEmotion('憤怒');
      expect(needs).toContain('被尊重');
    });

    it('未知情緒返回默認需求', () => {
      const needs = getNeedsForEmotion('不存在的情緒');
      expect(needs).toEqual(['被理解', '被接納', '安全感']);
    });
  });

  describe('EMOTION_WORDS', () => {
    it('包含情緒詞數據', () => {
      expect(EMOTION_WORDS.length).toBeGreaterThan(0);
    });

    it('每個情緒詞都有 name、quadrant、intensity', () => {
      for (const word of EMOTION_WORDS) {
        expect(word.name).toBeDefined();
        expect(word.quadrant).toMatch(/^(red|yellow|blue|green)$/);
        expect(typeof word.intensity).toBe('number');
      }
    });
  });
});
