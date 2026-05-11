/**
 * 數據加密工具
 *
 * 使用 Web Crypto API 的 AES-256-GCM 進行對稱加密。
 *
 * 🔒 安全設計：
 * - 加密密鑰：首次使用時隨機生成 256-bit 密鑰，存儲於 IndexedDB
 * - 替代舊版基於設備指紋的密鑰派生（可被推導破解）
 * - 每次加密使用獨立的隨機 IV + 鹽值
 * - 向後兼容：可解密舊版設備指紋密鑰加密的數據
 */

const ENCRYPTION_VERSION = 'v2';
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const ITERATIONS = 100000;

// IndexedDB 配置
const DB_NAME = 'imxin_crypto';
const DB_VERSION = 1;
const KEY_STORE = 'encryption_keys';
const MASTER_KEY_ID = 'master_key_v2';
const LEGACY_KEY_ID = 'legacy_device_key';

interface EncryptedPayload {
  v: string;
  salt: string;
  iv: string;
  data: string;
}

// ============================================
// IndexedDB 密鑰管理
// ============================================

/** 打開/創建密鑰存儲數據庫 */
function openKeyDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(KEY_STORE)) {
        db.createObjectStore(KEY_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** 從 IndexedDB 讀取密鑰 */
async function getKeyFromDB(id: string): Promise<string | null> {
  try {
    const db = await openKeyDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(KEY_STORE, 'readonly');
      const store = tx.objectStore(KEY_STORE);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

/** 向 IndexedDB 寫入密鑰 */
async function setKeyToDB(id: string, key: string): Promise<void> {
  const db = await openKeyDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(KEY_STORE, 'readwrite');
    const store = tx.objectStore(KEY_STORE);
    const request = store.put(key, id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// ============================================
// 密鑰獲取（隨機生成 + 向後兼容）
// ============================================

let cachedMasterKey: string | null = null;

/**
 * 獲取加密密鑰
 *
 * 🔒 安全策略：
 * 1. 優先使用隨機生成並存儲在 IndexedDB 中的密鑰（v2）
 * 2. 若不存在，生成新的隨機密鑰並存儲
 * 3. 同時嘗試遷移舊版設備指紋密鑰加密的數據
 */
async function getMasterKey(): Promise<string> {
  // 內存緩存命中
  if (cachedMasterKey) return cachedMasterKey;

  // 從 IndexedDB 讀取
  const stored = await getKeyFromDB(MASTER_KEY_ID);
  if (stored) {
    cachedMasterKey = stored;
    return stored;
  }

  // 首次使用：生成隨機 256-bit 密鑰
  const keyBytes = crypto.getRandomValues(new Uint8Array(32));
  const newKey = Array.from(keyBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  await setKeyToDB(MASTER_KEY_ID, newKey);
  cachedMasterKey = newKey;
  return newKey;
}

/**
 * 獲取舊版設備指紋密鑰（僅用於解密遷移）
 */
async function getLegacyDeviceKey(): Promise<string | null> {
  // 嘗試從緩存讀取
  const cached = await getKeyFromDB(LEGACY_KEY_ID);
  if (cached) return cached;

  // 計算舊版設備指紋密鑰
  if (typeof navigator === 'undefined') return null;

  const deviceInfo = [
    navigator.userAgent,
    navigator.language,
    typeof screen !== 'undefined' ? screen.width : 0,
    typeof screen !== 'undefined' ? screen.height : 0,
    new Date().getTimezoneOffset(),
  ].join('|');

  const encoder = new TextEncoder();
  const data = encoder.encode(deviceInfo);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const legacyKey = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  // 緩存舊版密鑰以供遷移使用
  await setKeyToDB(LEGACY_KEY_ID, legacyKey);
  return legacyKey;
}

// ============================================
// 密鑰派生（PBKDF2）
// ============================================

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordData,
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

// ============================================
// 編碼工具
// ============================================

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// ============================================
// 加密 / 解密
// ============================================

/**
 * 加密數據
 *
 * 使用隨機主密鑰 + PBKDF2 + AES-256-GCM 加密。
 * 每次加密使用獨立的隨機鹽值和 IV。
 */
export async function encryptData(plaintext: string): Promise<string> {
  const masterKey = await getMasterKey();
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(masterKey, salt);

  const encoder = new TextEncoder();
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext),
  );

  const payload: EncryptedPayload = {
    v: ENCRYPTION_VERSION,
    salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
    iv: arrayBufferToBase64(iv.buffer as ArrayBuffer),
    data: arrayBufferToBase64(encrypted),
  };

  return JSON.stringify(payload);
}

/**
 * 解密數據
 *
 * 支持 v1（舊版設備指紋密鑰）和 v2（隨機主密鑰）兩種格式。
 * v1 數據解密成功後會自動重新加密為 v2 格式（透明遷移）。
 */
export async function decryptData(ciphertext: string): Promise<string | null> {
  try {
    const payload: EncryptedPayload = JSON.parse(ciphertext);

    // 選擇對應版本的密鑰
    let masterKey: string;
    if (payload.v === 'v1') {
      // 舊版：使用設備指紋密鑰
      const legacyKey = await getLegacyDeviceKey();
      if (!legacyKey) {
        console.warn('[crypto] 無法獲取舊版設備指紋密鑰');
        return null;
      }
      masterKey = legacyKey;
    } else if (payload.v === ENCRYPTION_VERSION) {
      // 新版：使用隨機主密鑰
      masterKey = await getMasterKey();
    } else {
      console.warn('[crypto] 不支持的加密版本:', payload.v);
      return null;
    }

    const salt = new Uint8Array(base64ToArrayBuffer(payload.salt));
    const iv = new Uint8Array(base64ToArrayBuffer(payload.iv));
    const key = await deriveKey(masterKey, salt);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      base64ToArrayBuffer(payload.data),
    );

    const decoder = new TextDecoder();
    const result = decoder.decode(decrypted);

    return result;
  } catch (error) {
    console.warn('[crypto] 解密失敗:', error);
    return null;
  }
}

/**
 * 檢查字符串是否為加密格式
 */
export function isEncrypted(value: string): boolean {
  try {
    const parsed = JSON.parse(value);
    return (parsed.v === 'v1' || parsed.v === ENCRYPTION_VERSION) &&
           !!parsed.salt && !!parsed.iv && !!parsed.data;
  } catch {
    return false;
  }
}

/**
 * 測試用途：重置內存緩存
 */
export function _resetKeyCache(): void {
  cachedMasterKey = null;
}

/**
 * 測試用途：注入主密鑰（繞過 IndexedDB）
 *
 * 僅用於測試環境，避免在 jsdom 中模擬 IndexedDB。
 * 生產環境不應使用此方法。
 */
export function _injectMasterKey(key: string): void {
  cachedMasterKey = key;
}
