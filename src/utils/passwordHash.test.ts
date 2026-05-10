/**
 * 密碼哈希工具測試
 *
 * 測試 PBKDF2 密碼哈希、驗驗證、舊版遷移功能。
 *
 * 注意：為加速測試，使用 1000 次迭代。
 * 生產環境使用 600,000 次迭代（密碼哈希工具默認值）。
 */

import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, isLegacyHash } from './passwordHash';

// 測試用低迭代次數，加速執行
const TEST_ITERATIONS = 1000;

describe('passwordHash', () => {
  describe('hashPassword', () => {
    it('應生成 PBKDF2 格式的哈希字符串', async () => {
      const hash = await hashPassword('test123', TEST_ITERATIONS);
      expect(hash).toMatch(/^\$pbkdf2-sha256\$1000\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
    });

    it('應為不同密碼生成不同的哈希', async () => {
      const hash1 = await hashPassword('password1', TEST_ITERATIONS);
      const hash2 = await hashPassword('password2', TEST_ITERATIONS);
      expect(hash1).not.toBe(hash2);
    });

    it('應為相同密碼生成不同的哈希（隨機鹽值）', async () => {
      const hash1 = await hashPassword('samePassword', TEST_ITERATIONS);
      const hash2 = await hashPassword('samePassword', TEST_ITERATIONS);
      expect(hash1).not.toBe(hash2);
    });

    it('應支持自定義迭代次數', async () => {
      const hash = await hashPassword('test', 500);
      expect(hash).toMatch(/^\$pbkdf2-sha256\$500\$/);
    });

    it('應正確處理空字符串密碼', async () => {
      const hash = await hashPassword('', TEST_ITERATIONS);
      expect(hash).toMatch(/^\$pbkdf2-sha256\$/);
    });

    it('應正確處理包含 Unicode 的密碼', async () => {
      const hash = await hashPassword('密碼測試🔑', TEST_ITERATIONS);
      expect(hash).toMatch(/^\$pbkdf2-sha256\$/);
    });
  });

  describe('verifyPassword', () => {
    it('應正確驗證匹配的密碼', async () => {
      const hash = await hashPassword('correctPassword', TEST_ITERATIONS);
      const result = await verifyPassword('correctPassword', hash);
      expect(result).toBe(true);
    });

    it('應拒絕不匹配的密碼', async () => {
      const hash = await hashPassword('correctPassword', TEST_ITERATIONS);
      const result = await verifyPassword('wrongPassword', hash);
      expect(result).toBe(false);
    });

    it('應拒絕格式錯誤的哈希', async () => {
      const result = await verifyPassword('test', 'invalid-hash-format');
      expect(result).toBe(false);
    });

    it('應拒絕部分匹配的哈希', async () => {
      const hash = await hashPassword('test', TEST_ITERATIONS);
      // 截斷哈希
      const truncated = hash.slice(0, -10);
      const result = await verifyPassword('test', truncated);
      expect(result).toBe(false);
    });
  });

  describe('舊版 DJB2 哈希兼容', () => {
    it('應識別舊版 DJB2 哈希為 legacy 格式', () => {
      // DJB2 hash of "test" = 7c4
      const djb2Hash = '7c4';
      expect(isLegacyHash(djb2Hash)).toBe(true);
    });

    it('應識別 PBKDF2 哈希為非 legacy 格式', async () => {
      const pbkdf2Hash = await hashPassword('test', TEST_ITERATIONS);
      expect(isLegacyHash(pbkdf2Hash)).toBe(false);
    });

    it('應能驗證舊版 DJB2 哈希密碼', async () => {
      // 手動計算 DJB2 hash of "hello"
      let hash = 0;
      for (let i = 0; i < 'hello'.length; i++) {
        const char = 'hello'.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      const djb2Hash = hash.toString(16);

      const result = await verifyPassword('hello', djb2Hash);
      expect(result).toBe(true);
    });

    it('應拒絕舊版 DJB2 哈希的錯誤密碼', async () => {
      // DJB2 hash of "hello"
      let hash = 0;
      for (let i = 0; i < 'hello'.length; i++) {
        const char = 'hello'.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      const djb2Hash = hash.toString(16);

      const result = await verifyPassword('wrongPassword', djb2Hash);
      expect(result).toBe(false);
    });
  });

  describe('常數時間比較安全性', () => {
    it('不同長度的哈希應返回 false', async () => {
      const hash = await hashPassword('test', TEST_ITERATIONS);
      const result = await verifyPassword('test', hash + 'extra');
      expect(result).toBe(false);
    });
  });
});
