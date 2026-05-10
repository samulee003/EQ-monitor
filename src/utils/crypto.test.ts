/**
 * 加密工具測試
 *
 * 測試 v2 隨機密鑰加密、解密、格式識別。
 * 使用 _injectMasterKey 繞過 IndexedDB 依賴。
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { encryptData, decryptData, isEncrypted, _resetKeyCache, _injectMasterKey } from './crypto';

// 測試用密鑰（256-bit，64 個十六進制字符）
const TEST_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

describe('crypto', () => {
  beforeEach(() => {
    _resetKeyCache();
    _injectMasterKey(TEST_KEY);
  });

  describe('isEncrypted', () => {
    it('應識別 v1 格式的字符串', () => {
      const v1Payload = JSON.stringify({
        v: 'v1',
        salt: 'dGVzdA==',
        iv: 'dGVzdA==',
        data: 'dGVzdA==',
      });
      expect(isEncrypted(v1Payload)).toBe(true);
    });

    it('應識別 v2 格式的字符串', () => {
      const v2Payload = JSON.stringify({
        v: 'v2',
        salt: 'dGVzdA==',
        iv: 'dGVzdA==',
        data: 'dGVzdA==',
      });
      expect(isEncrypted(v2Payload)).toBe(true);
    });

    it('應拒絕普通 JSON 字符串', () => {
      expect(isEncrypted('{"name":"test"}')).toBe(false);
    });

    it('應拒絕普通文本', () => {
      expect(isEncrypted('hello world')).toBe(false);
    });

    it('應拒絕缺少字段的偽加密字符串', () => {
      expect(isEncrypted('{"v":"v2","salt":"abc"}')).toBe(false);
    });

    it('應拒絕未知版本號', () => {
      expect(isEncrypted('{"v":"v3","salt":"a","iv":"b","data":"c"}')).toBe(false);
    });
  });

  describe('encryptData + decryptData', () => {
    it('應加密後解密還原原始數據', async () => {
      const original = '重要情緒數據 🧠✨';
      const encrypted = await encryptData(original);
      const decrypted = await decryptData(encrypted);
      expect(decrypted).toBe(original);
    });

    it('應生成 v2 格式的加密字符串', async () => {
      const encrypted = await encryptData('test data');
      const parsed = JSON.parse(encrypted);
      expect(parsed.v).toBe('v2');
      expect(parsed.salt).toBeDefined();
      expect(parsed.iv).toBeDefined();
      expect(parsed.data).toBeDefined();
    });

    it('每次加密相同明文應產生不同密文', async () => {
      const encrypted1 = await encryptData('same data');
      const encrypted2 = await encryptData('same data');
      expect(encrypted1).not.toBe(encrypted2);
      // 但都能正確解密
      expect(await decryptData(encrypted1)).toBe('same data');
      expect(await decryptData(encrypted2)).toBe('same data');
    });

    it('應正確加密 JSON 字符串', async () => {
      const data = JSON.stringify({ name: '測試', value: 42 });
      const encrypted = await encryptData(data);
      const decrypted = await decryptData(encrypted);
      expect(decrypted).toBe(data);
    });

    it('應正確處理空字符串', async () => {
      const encrypted = await encryptData('');
      const decrypted = await decryptData(encrypted);
      expect(decrypted).toBe('');
    });

    it('應正確處理 Unicode 內容', async () => {
      const text = '情緒覺察 🔐 心理健康 💚';
      const encrypted = await encryptData(text);
      const decrypted = await decryptData(encrypted);
      expect(decrypted).toBe(text);
    });

    it('大數據加密解密應保持一致性', async () => {
      const largeData = 'x'.repeat(10000);
      const encrypted = await encryptData(largeData);
      const decrypted = await decryptData(encrypted);
      expect(decrypted).toBe(largeData);
    });
  });

  describe('decryptData 錯誤處理', () => {
    it('應對無效密文返回 null', async () => {
      const result = await decryptData('not-encrypted');
      expect(result).toBeNull();
    });

    it('應對空字符串返回 null', async () => {
      const result = await decryptData('');
      expect(result).toBeNull();
    });

    it('應對損壞的加密數據返回 null', async () => {
      const encrypted = await encryptData('test');
      const corrupted = encrypted.slice(0, -5) + 'XXXXX';
      const result = await decryptData(corrupted);
      expect(result).toBeNull();
    });
  });

  describe('加密/解密循環穩定性', () => {
    it('多次加密解密應保持數據一致性', async () => {
      const original = '重要情緒數據 🧠✨';
      for (let i = 0; i < 3; i++) {
        const encrypted = await encryptData(original);
        const decrypted = await decryptData(encrypted);
        expect(decrypted).toBe(original);
      }
    });
  });
});
