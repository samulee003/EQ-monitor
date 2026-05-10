/**
 * 安全密碼哈希工具
 *
 * 使用 Web Crypto API 的 PBKDF2 算法進行密碼哈希。
 * 每個密碼使用獨立的隨機鹽值，迭代次數 600,000 次。
 *
 * 格式: $pbkdf2-sha256$<iterations>$<salt-hex>$<hash-hex>
 *
 * ⚠️ 此模組同時用於用戶密碼和隱私 PIN 的哈希存儲。
 */

const ALGORITHM = 'PBKDF2';
const HASH_ALGORITHM = 'SHA-256';
const KEY_LENGTH = 256;
const DEFAULT_ITERATIONS = 600000;
const SALT_LENGTH = 16; // 128 bits

/** 哈希格式前綴，用於識別新格式 vs 舊版 DJB2 哈希 */
const PREFIX = `$pbkdf2-sha256$`;

/**
 * 對密碼進行安全哈希
 *
 * @param password 明文密碼
 * @param iterations PBKDF2 迭代次數（默認 600,000）
 * @returns 格式化哈希字符串
 */
export async function hashPassword(
  password: string,
  iterations: number = DEFAULT_ITERATIONS,
): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const hashBytes = await deriveHash(password, salt, iterations);

  const saltHex = bufferToHex(salt);
  const hashHex = bufferToHex(hashBytes);

  return `${PREFIX}${iterations}$${saltHex}$${hashHex}`;
}

/**
 * 驗證密碼是否匹配存儲的哈希
 *
 * @param password 用戶輸入的密碼
 * @param storedHash 存儲的哈希字符串
 * @returns 是否匹配
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  // 檢測舊版 DJB2 哈希（不包含前綴的十六進制字符串）
  if (!storedHash.startsWith(PREFIX)) {
    return verifyLegacyDJB2(password, storedHash);
  }

  try {
    const parts = storedHash.slice(PREFIX.length).split('$');
    if (parts.length !== 3) return false;

    const iterations = parseInt(parts[0], 10);
    const salt = hexToBuffer(parts[1]);
    const expectedHash = parts[2];

    if (isNaN(iterations) || salt.length !== SALT_LENGTH) return false;

    const hashBytes = await deriveHash(password, salt, iterations);
    const actualHash = bufferToHex(hashBytes);

    // 常數時間比較，防止計時攻擊
    return constantTimeEqual(actualHash, expectedHash);
  } catch {
    return false;
  }
}

/**
 * 檢查哈希是否為舊版格式（DJB2）
 *
 * 用於自動遷移：登入成功後自動將舊哈希升級為 PBKDF2。
 */
export function isLegacyHash(hash: string): boolean {
  return !hash.startsWith(PREFIX);
}

// ============================================
// 內部工具
// ============================================

/**
 * PBKDF2 密鑰派生
 */
async function deriveHash(
  password: string,
  salt: Uint8Array,
  iterations: number,
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: ALGORITHM },
    false,
    ['deriveBits'],
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: ALGORITHM,
      salt: salt as BufferSource,
      iterations,
      hash: HASH_ALGORITHM,
    },
    keyMaterial,
    KEY_LENGTH,
  );

  return new Uint8Array(bits);
}

/**
 * 舊版 DJB2 哈希驗驗證（僅用於遷移兼容）
 *
 * ⚠️ DJB2 不安全，驗證成功後應立即調用 hashPassword 升級。
 */
function verifyLegacyDJB2(password: string, storedHash: string): boolean {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16) === storedHash;
}

/**
 * Uint8Array 轉十六進制字符串
 */
function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * 十六進制字符串轉 Uint8Array
 */
function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * 常數時間字符串比較
 *
 * 防止計時攻擊（timing attack），
 * 無論兩個字符串在哪個位置開始不同，比較時間都相同。
 */
function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
