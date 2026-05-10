# 今心 ImXin — 團隊技術提升方案

> **資深開發工程師評審報告** | 2026-05-10
> **目標**: 系統性提升團隊代碼質量、安全性、架構設計能力

---

## 📊 代碼庫現狀評分

| 維度 | 評分 | 說明 |
|------|------|------|
| 架構設計 | ⭐⭐⭐⭐☆ | 適配器模式優秀，但狀態管理策略混亂 |
| 類型安全 | ⭐⭐⭐⭐☆ | strict 模式開啟，RulerLogEntry.id 已修正為必填 |
| 安全性 | ⭐⭐⭐⭐☆ | P0 已修復：PBKDF2 哈希、隨機加密密鑰、PIN 哈希存儲 |
| 測試覆蓋 | ⭐⭐⭐⭐☆ | 220 個測試覆蓋核心模組，新增 Adapter 和 Auth 測試，UI 組件仍需補齊 |
| 性能優化 | ⭐⭐⭐⭐☆ | localStorage 緩存層已實現，組件樣式已提取，仍需 CSS 過度動畫審計 |
| 代碼規範 | ⭐⭐⭐⭐☆ | ESLint 已覆蓋 TypeScript，測試描述已修復，仍需持續改進 |
| 可維護性 | ⭐⭐⭐⭐☆ | 連續天數算法統一、PhysicalService 修復、緩存層降低耦合 |

**綜合評分: 82/100** — P0 安全修復、P1 規範建立、P2 架構改進均已完成，測試覆蓋大幅提升

---

## 🔴 P0 — 安全漏洞（必須立即修復）

### 1. 密碼哈希使用 DJB2 算法，完全不可接受

**文件**: `src/adapters/LocalStorageAdapter.ts:36-44`

```typescript
// ❌ 當前實現：DJB2 哈希，無鹽、無拉伸、可逆
const hashPassword = (password: string): string => {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
};
```

**風險**: 任何知道用戶郵箱的人都可以在毫秒內破解密碼。

**修復方案**: 使用 Web Crypto API 的 PBKDF2（已有依賴），添加隨機鹽值：

```typescript
// ✅ 修復方案：PBKDF2 + 隨機鹽
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const hashHex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return `$pbkdf2$${saltHex}$${hashHex}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [, , saltHex, expectedHashHex] = storedHash.split('$');
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map(b => parseInt(b, 16)));
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  const hashHex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex === expectedHashHex;
}
```

### 2. 隱私 PIN 明文存儲

**文件**: `src/adapters/settingsStore.ts:89-95`

```typescript
// ❌ 當前：PIN 直接以字符串存儲
getPrivacyPin(): string | null {
  return this.getString(StorageKeys.PRIVACY_PIN);
}
setPrivacyPin(pin: string): void {
  this.setString(StorageKeys.PRIVACY_PIN, pin);
}
```

**修復方案**: PIN 必須哈希存儲，驗證時比對哈希值：

```typescript
// ✅ 修復方案
async setPrivacyPin(pin: string): Promise<void> {
  const hash = await hashPassword(pin);
  this.setString(StorageKeys.PRIVACY_PIN, hash);
}

async verifyPrivacyPin(pin: string): Promise<boolean> {
  const stored = this.getString(StorageKeys.PRIVACY_PIN);
  if (!stored) return false;
  // 兼容舊版明文 PIN（一次性遷移）
  if (!stored.startsWith('$pbkdf2$')) {
    const match = pin === stored;
    if (match) await this.setPrivacyPin(pin); // 自動遷移
    return match;
  }
  return verifyPassword(pin, stored);
}
```

### 3. 加密密鑰來自可推導的設備指紋

**文件**: `src/utils/crypto.ts:13-30`

```typescript
// ❌ 當前：密鑰由 userAgent + language + screen + timezone 組成
// 攻擊者只需知道設備型號即可解密所有數據
async function getPasswordKey(): Promise<string> {
  const deviceInfo = [
    navigator.userAgent, navigator.language,
    screen.width, screen.height,
    new Date().getTimezoneOffset(),
  ].join('|');
  // ...
}
```

**修復方案**: 首次使用時生成隨機密鑰，存儲在 IndexedDB 中：

```typescript
// ✅ 修復方案：隨機密鑰 + IndexedDB 安全存儲
const KEY_STORE = 'imxin_key_store';
const KEY_ENTRY = 'master_key';

async function getPasswordKey(): Promise<string> {
  const db = await openDB();
  const stored = await db.get(KEY_STORE, KEY_ENTRY);
  if (stored) return stored;

  // 首次：生成隨機 256-bit 密鑰
  const keyBytes = crypto.getRandomValues(new Uint8Array(32));
  const key = Array.from(keyBytes).map(b => b.toString(16).padStart(2, '0')).join('');
  await db.put(KEY_STORE, key, KEY_ENTRY);
  return key;
}
```

---

## 🟠 P1 — 代碼質量與規範（本週修復）

### 4. ESLint 不覆蓋 TypeScript 文件

**文件**: `eslint.config.js`

```javascript
// ❌ 當前：只檢查 .js/.jsx，整個項目的 .ts/.tsx 文件零 Lint
files: ['**/*.{js,jsx}'],
```

**修復方案**:

```javascript
// ✅ 安裝依賴：npm i -D typescript-eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist', 'android', 'node_modules', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': ['warn', { allowExpressions: true }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
]);
```

### 5. 重複的連續天數計算邏輯

**問題**: `HabitService.calculateStreak()` 和 `statisticsUtils.calculateStreak()` 使用**完全不同的算法**：

- `HabitService`: 從最近記錄日往回數，只有最近日是今天或昨天才開始計數
- `statisticsUtils`: 從今天往回數，檢查每天是否有記錄

**修復方案**: 統一到一個函數，放在 `statisticsUtils.ts`，`HabitService` 調用它：

```typescript
// ✅ 統一算法：src/utils/statisticsUtils.ts
export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  lastLogDate: string | null;
}

export function calculateStreakDetailed(logs: RulerLogEntry[]): StreakResult {
  if (logs.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastLogDate: null };
  }

  const dateSet = new Set(
    logs.map(log => new Date(log.timestamp).toISOString().split('T')[0])
  );
  const sortedDates = Array.from(dateSet).sort((a, b) => b.localeCompare(a));
  const lastLogDate = sortedDates[0];

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // 當前連續天數：必須從今天或昨天開始計算
  let currentStreak = 0;
  if (sortedDates[0] === today || sortedDates[0] === yesterday) {
    currentStreak = 1;
    for (let i = 0; i < sortedDates.length - 1; i++) {
      const curr = new Date(sortedDates[i]);
      const next = new Date(sortedDates[i + 1]);
      const diff = Math.round((curr.getTime() - next.getTime()) / 86400000);
      if (diff === 1) currentStreak++;
      else break;
    }
  }

  // 歷史最長連續天數
  let longestStreak = 0;
  let tempStreak = 1;
  for (let i = 0; i < sortedDates.length - 1; i++) {
    const curr = new Date(sortedDates[i]);
    const next = new Date(sortedDates[i + 1]);
    const diff = Math.round((curr.getTime() - next.getTime()) / 86400000);
    if (diff === 1) tempStreak++;
    else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

  return { currentStreak, longestStreak, lastLogDate };
}
```

### 6. PhysicalService 始終返回硬編碼假數據

**文件**: `src/services/PhysicalService.ts`

**問題**: `getDailyStats()` 永遠返回 `sleepHours: 5.5`，AI 分析基於虛假數據給出誤導性建議。

**修復方案**:

```typescript
// ✅ 方案 A：若無真實數據，不返回假數據
async getDailyStats(): Promise<PhysicalData | null> {
  // 階段二：集成 Apple HealthKit / Google Fit API
  // 當前無法獲取真實數據時返回 null，而非假數據
  return null;
}

// ✅ 方案 B：允許用戶手動輸入
async saveManualStats(data: PhysicalData): Promise<void> {
  await dataAdapter.settings.set('imxin_physical_today', data);
}
```

### 7. 刪除重複的 vite.config.js

**問題**: 根目錄同時存在 `vite.config.ts` 和 `vite.config.js`，後者是舊版簡化版本。

**修復方案**: 刪除 `vite.config.js`，只保留 `vite.config.ts`。

---

## 🟡 P2 — 架構改進（下一迭代）

### 8. 統一狀態管理策略 ✅ 已規範化

**當前問題**: 三套狀態管理混用：
- React Context: Auth, Theme, Language, Habit
- Zustand: appStore, botStore
- useReducer: useRulerFlow

**已建立的規則**:

| 場景 | 使用方案 | 原因 | 當前實例 |
|------|----------|------|----------|
| 全局 UI 偏好（主題/語言） | React Context | 輕量、值少、不頻繁更新 | ThemeContext, LanguageContext |
| 認證狀態 | React Context | 需要全局 Provider，登入/登出影響整個應用 | AuthContext |
| 複雜領域狀態（流程/聊天） | useReducer | 可預測、可測試、可序列化 | useRulerFlow |
| 跨組件共享業務數據 | Zustand | 性能好、訂閱精確、無 Provider | appStore, botStore |
| 臨時 UI 狀態 | useState | 最簡單、作用域小 | 各組件內部 |
| 簡單鍵值偏好 | settingsStore (帶緩存) | 同步讀取 + 異步寫入，向後兼容 | 語言/主題/PIN |

### 9. 消除同步/異步混用 ✅ 已修復

**問題**: `settingsStore` 是同步的，`dataAdapter.settings` 是異步的，組件兩者混用。

**已實施方案**: `settingsStore` 已改為內部緩存 + 異步兼容模式：
- `get<T>()` → 異步方法，先查緩存再讀 localStorage
- `getCached<T>()` → 同步讀取緩存（僅限已初始化場景）
- `getString()` → 同步讀取字符串（向後兼容，帶緩存）
- `set<T>()` → 異步寫入（同時更新緩存和 localStorage）
- `clearCache()` → 清除所有緩存（用於登出或調試）

```typescript
// ✅ 統一異步 + 內部緩存
class SettingsStore {
  private cache = new Map<string, unknown>();

  async get<T>(key: string, fallback?: T): Promise<T | null> {
    if (this.cache.has(key)) return this.cache.get(key) as T;
    const value = await dataAdapter.settings.get<T>(key);
    if (value !== null) this.cache.set(key, value);
    return value ?? fallback ?? null;
  }

  // 同步讀取緩存（僅用於已初始化的場景）
  getCached<T>(key: string, fallback?: T): T | null {
    return (this.cache.get(key) as T) ?? fallback ?? null;
  }
}
```

### 10. RulerLogEntry.id 類型修正

**問題**: `id` 為 `string | undefined`，到處需要 `(log as RulerLogEntry & { id?: string }).id` 強制轉型。

**修復方案**:

```typescript
// ✅ 創建時必填，讀取時保證存在
export interface RulerLogEntry {
  id: string;  // 不再可選
  emotions: Emotion[];
  // ...
}

// 導入/遷移時自動生成 ID
function ensureId(entry: RulerLogEntry & { id?: string }): RulerLogEntry {
  return { ...entry, id: entry.id || generateId() };
}
```

### 11. 性能：localStorage 全量讀寫

**問題**: 每次創建/更新/刪除日誌都要讀取全部記錄、修改、寫回。

**短期方案**: 緩存 + 增量更新

```typescript
// ✅ 內存緩存 + 增量寫入
class LogsCache {
  private cache: RulerLogEntry[] | null = null;
  private dirty = false;

  async getAll(): Promise<RulerLogEntry[]> {
    if (this.cache) return this.cache;
    this.cache = await store.get<RulerLogEntry[]>(StorageKeys.LOGS, []);
    return this.cache;
  }

  async append(log: RulerLogEntry): Promise<void> {
    const logs = await this.getAll();
    logs.unshift(log);
    this.dirty = true;
    this.debounceFlush();
  }

  private debounceFlush = debounce(async () => {
    if (!this.dirty || !this.cache) return;
    await store.set(StorageKeys.LOGS, this.cache);
    this.dirty = false;
  }, 300);
}
```

### 12. 組件內聯樣式提取

**問題**: `CheckInFlow.tsx` 和 `ErrorBoundary.tsx` 在 JSX 中嵌入數百行 `<style>` 標籤。

**修復方案**: 提取為 CSS Module 文件（`CheckInFlow.module.css`），利用 Vite 的 CSS 處理能力。

---

## 🟢 P3 — 測試與持續改進（長期規劃）

### 13. 測試策略升級

**當前覆蓋盲區**:
- 35+ 個 UI 組件未測試（僅 LoadingSpinner 有測試）
- LocalStorageAdapter（最關鍵的數據層）無測試
- crypto.ts 加密/解密無測試
- Server 端代碼無測試
- 無集成測試、無 E2E 測試

**優先級排序**:

| 優先級 | 測試目標 | 預計用例數 |
|--------|----------|-----------|
| P0 | LocalStorageAdapter 全方法 | 20+ |
| P0 | crypto.ts 加密/解密/密鑰派生 | 10+ |
| P1 | AuthContext 登入/登出/註冊 | 12+ |
| P1 | 核心組件交互（MoodMeter, EmotionGrid） | 15+ |
| P2 | 集成測試：完整 RULER 流程 | 8+ |
| P3 | E2E 測試（Playwright） | 5+ |

### 14. 修復空測試描述

**文件**: `src/services/HabitService.test.ts`

```typescript
// ❌ 當前：測試描述為空
it('', async () => { ... });

// ✅ 修復：添加描述性名稱
it('應計算空日誌的連續天數為 0', async () => { ... });
it('應正確計算當前連續天數', async () => { ... });
```

### 15. CI/CD 質量門檻

```yaml
# .github/workflows/ci.yml 建議添加
- name: Type Check
  run: npx tsc --noEmit

- name: Lint
  run: npm run lint

- name: Test with Coverage
  run: npm run test:coverage

- name: Coverage Gate
  run: |
    COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
    if (( $(echo "$COVERAGE < 80" | bc -l) )); then
      echo "Coverage $COVERAGE% is below 80% threshold"
      exit 1
    fi
```

---

## 📋 執行計劃

### 第 1 週：安全修復（P0）✅ 已完成

- [x] 替換密碼哈希為 PBKDF2
- [x] PIN 存儲改為哈希 + 自動遷移
- [x] 加密密鑰改為隨機生成 + IndexedDB
- [x] 為密碼/加密模組添加測試

### 第 2 週：規範建立（P1）✅ 已完成

- [x] 修復 ESLint 配置覆蓋 TypeScript
- [x] 統一連續天數計算算法
- [x] 修復 PhysicalService 假數據問題
- [x] 刪除重複的 vite.config.js
- [x] 修復空測試描述

### 第 3 週：架構改進（P2）✅ 已完成

- [x] 統一狀態管理策略文檔
- [x] settingsStore 改為異步 + 緩存
- [x] RulerLogEntry.id 類型修正
- [x] localStorage 緩存層實現
- [x] 提取組件內聯樣式

### 第 4 週：測試補齊（P3）✅ 部分完成

- [x] LocalStorageAdapter 完整測試（23 個測試）
- [x] crypto.ts 測試（17 個測試，P0 已完成）
- [x] AuthContext 登入/登出/註冊測試（8 個測試）
- [x] CI 質量門檻配置
- [ ] 核心組件交互測試（MoodMeter, EmotionGrid）

---

## 🎓 團隊技術培訓建議

### 必備知識補強

1. **Web 安全基礎**: 密碼存儲、XSS 防禦、CSP 策略
2. **TypeScript 進階**: 類型守衛、條件類型、模板字面量類型
3. **React 性能優化**: memo、useMemo、useCallback 的正確使用場景
4. **測試金字塔**: 單元 → 集成 → E2E 的比例和策略

### Code Review 清單

每次 PR 必須通過以下檢查：

- [ ] 無 `any` 類型（除非有充分理由 + 註釋）
- [ ] 無 `catch {}` 空 catch 塊
- [ ] 無硬編碼假數據
- [ ] 敏感數據（密碼、PIN、密鑰）必須哈希/加密
- [ ] 新代碼有對應測試
- [ ] ESLint + TypeScript 檢查通過

---

*本報告由資深開發工程師基於對今心 ImXin 代碼庫的全面審查生成。*
*建議團隊按優先級逐步實施，每週回顧進度。*
