# Agent.md — 今心 ImXin AI 編程代理指南

> **版本**: 1.0 | **更新**: 2026-05-10
> **語言**: 繁體中文（台灣）— 所有界面文字、註釋、提交訊息均使用繁體中文

---

## 專案身份

**今心 ImXin** 是一款開源情緒覺察 PWA，基於 RULER 方法引導用戶完成五步情緒練習（覺察→理解→標記→表達→調節）。「今心」即為「念」。

**倉庫**: https://github.com/samulee003/EQ-monitor
**技術棧**: React 19.2 + TypeScript 5.9 + Vite 7 + Vitest 4 + Zustand 5
**構建狀態**: 228 測試全通 | 0 TypeScript 錯誤 | 綜合評分 82/100

---

## 架構核心原則

### 1. 適配器模式（最重要）

**所有數據操作必須通過 `dataAdapter`，禁止直接訪問 localStorage。**

```
src/adapters/
├── IDataAdapter.ts       ← 接口定義（所有方法的唯一真相來源）
├── LocalStorageAdapter.ts ← 當前實現（階段一）
├── settingsStore.ts      ← 簡單鍵值偏好（語言/主題/PIN）
├── types.ts              ← StorageKeys + 所有適配器類型
└── index.ts              ← 導出 dataAdapter 單例
```

未來遷移至 Supabase 時，只需實現新 Adapter，業務代碼零改動。

### 2. 狀態管理策略（嚴格遵守）

| 場景 | 使用方案 | 實例 |
|------|----------|------|
| 全局 UI 偏好（主題/語言） | React Context | ThemeContext, LanguageContext |
| 認證狀態 | React Context | AuthContext |
| 複雜領域狀態（流程/聊天） | useReducer | useRulerFlow |
| 跨組件共享業務數據 | Zustand | appStore, botStore |
| 臨時 UI 狀態 | useState | 各組件內部 |
| 簡單鍵值偏好 | settingsStore | 語言/主題/PIN |

**禁止**: 在新組件中混用多種狀態管理方案。按上表選擇唯一方案。

### 3. 同步/異步邊界

- `settingsStore.get<T>()` → 異步（內部有緩存，適合初始化）
- `settingsStore.getCached<T>()` → 同步（僅限已初始化場景）
- `settingsStore.getString()` → 同步（向後兼容，帶緩存）
- `dataAdapter.*` → 全部異步（未來可替換為遠端）
- **不要**在異步上下文中調用同步方法期望獲得最新數據

---

## 安全模式（必須遵守）

### 密碼與 PIN

```typescript
// ✅ 正確：使用 passwordHash 模組
import { hashPassword, verifyPassword, isLegacyHash } from '@/utils/passwordHash';

// 密碼哈希格式：$pbkdf2-sha256$<iterations>$<salt-hex>$<hash-hex>
// 迭代次數：600,000 | 鹽值：128-bit 隨機 | 算法：PBKDF2-SHA256

// ❌ 禁止：自定義哈希算法
// ❌ 禁止：明文存儲密碼或 PIN
// ❌ 禁止：使用 DJB2 或其他非密碼學哈希
```

### 加密

```typescript
// ✅ 正確：使用 crypto 模組
import { encryptData, decryptData, isEncrypted } from '@/utils/crypto';

// 密鑰管理：隨機 256-bit 主密鑰存儲於 IndexedDB
// 加密算法：AES-256-GCM + 隨機 IV + 鹽值
// 向後兼容：可解密 v1 設備指紋密鑰加密的數據
```

### 遷移兼容

- `verifyPassword()` 自動檢測舊版 DJB2 哈希並驗證
- `verifyPrivacyPin()` 自動檢測明文 PIN，驗證成功後自動遷移為 PBKDF2
- `decryptData()` 自動檢測 v1 加密格式並使用舊密鑰解密

---

## 測試指南

### 運行命令

```bash
npm run test          # 監視模式
npm run test:run      # 單次執行
npm run test:coverage # 覆蓋率報告
```

### 測試環境 (jsdom)

**關鍵陷阱**: jsdom 不支持 `crypto.subtle`，需要手動注入密鑰：

```typescript
import { _injectMasterKey, _resetKeyCache } from '@/utils/crypto';

const TEST_MASTER_KEY = '0'.repeat(64); // 256-bit hex

beforeEach(() => {
  _injectMasterKey(TEST_MASTER_KEY);
  _resetKeyCache();
});
```

**單例隔離**: `settingsStore`、`LocalStorageStore`、`logsCache` 是模組級單例，測試之間會洩漏。必須在 `beforeEach` 中：

```typescript
beforeEach(() => {
  localStorage.clear();
  _injectMasterKey(TEST_MASTER_KEY);
  _resetKeyCache();
  // 如果測試 LocalStorageAdapter，需要重新創建實例
  adapter = new LocalStorageAdapter();
  adapter.clearLogsCache();
  await adapter.initialize();
});
```

### PBKDF2 測試速度

PBKDF2 600K 迭代很慢（~400ms/次）。測試中可使用較低迭代數：

```typescript
const fastHash = await hashPassword('test', 1000); // 1000 迭代用於測試
```

### 現有測試分佈

| 文件 | 測試數 | 覆蓋範圍 |
|------|--------|----------|
| LocalStorageAdapter.test.ts | 23 | 認證、CRUD、草稿、緩存 |
| crypto.test.ts | 17 | 加密、解密、密鑰管理、遷移 |
| passwordHash.test.ts | 15 | 哈希、驗證、常數時間比較 |
| useRulerFlow.test.ts | 25 | RULER 流程狀態 |
| dateUtils.test.ts | 38 | 日期處理 |
| useA11y.test.ts | 22 | 無障礙輔助 |
| HabitService.test.ts | 17 | 習慣追踪 |
| AIService.test.ts | 24 | AI 服務 |
| StorageService.test.ts | 14 | 存儲服務 |
| AuthContext.test.tsx | 8 | 認證上下文 |
| 其他 | 25+ | 各模組 |

**未覆蓋**: 核心組件交互（MoodMeter, EmotionGrid）— 待補齊

---

## 文件導航

### 核心數據流

```
用戶操作
  → React 組件 (src/components/)
  → 業務服務 (src/services/)
  → dataAdapter (src/adapters/)
  → localStorage / IndexedDB
```

### 關鍵入口

| 文件 | 職責 |
|------|------|
| `src/App.tsx` | 根組件，路由、Provider 組合 |
| `src/components/CombinedProviders.tsx` | 所有 Context Provider 的統一包裝 |
| `src/components/MainLayout.tsx` | 主佈局（導航 + 視圖切換） |
| `src/components/CheckInFlow.tsx` | RULER 五步流程主組件 |
| `src/hooks/useRulerFlow.ts` | 覺察流程狀態管理（useReducer） |

### 類型定義

| 文件 | 關鍵類型 |
|------|----------|
| `src/types/RulerTypes.ts` | `RulerLogEntry`, `RulerDraft`, `UnderstandingData`, `BodyScanData` |
| `src/types/HabitTypes.ts` | `UserProgress`, `HabitEntry` |
| `src/types/AchievementTypes.ts` | `AchievementRecord`, `AchievementDefinition` |
| `src/adapters/types.ts` | `StorageKeys`, `UserProfile`, `AuthResult`, `PaginatedResult` |

### 注意事項

- `RulerLogEntry.id` 是 **必填 `string`**（已從 `string | undefined` 修正），導入舊數據時使用 `ensureId()` 自動生成
- `Quadrant` 類型為 `'red' | 'yellow' | 'blue' | 'green'`，來自 `emotionData.ts`
- 路徑別名 `@/` 指向 `src/`

---

## 代碼規範

### ESLint 配置

- TypeScript 文件：`@typescript-eslint` 規則集
- `no-explicit-any`: warn
- `no-unused-vars`: error（`_` 前綴忽略）
- `consistent-type-imports`: error（偏好 `import { type X }`）
- `explicit-function-return-type`: warn（允許表達式）

### 類型導入

```typescript
// ✅ 正確：inline type import
import { type RulerLogEntry } from '@/types/RulerTypes';

// ❌ 錯誤：單獨 type import
import type { RulerLogEntry } from '@/types/RulerTypes';
```

### 組件規範

- 函數組件 + Hooks
- Props 類型使用 `React.FC<{ propName: Type }>`
- 樣式使用 CSS Modules（`*.module.css`）或 CSS 自定義屬性
- **禁止**在 JSX 中嵌入 `<style>` 標籤（已全面提取）

### 設計系統

| 象限 | 色碼 | 含義 |
|------|------|------|
| 紅色 | `#C58B8A` | 高能量低愉悅 — 憤怒、焦慮 |
| 黃色 | `#D5C1A5` | 高能量高愉悅 — 興奮、快樂 |
| 藍色 | `#97A6B4` | 低能量低愉悅 — 憂鬱、疲憊 |
| 綠色 | `#AAB09B` | 低能量高愉悅 — 平靜、滿足 |

主題：Dark（默認 `#1a1a1a`）/ Light（`#f5f3ef`）/ System

---

## 常見操作指南

### 添加新組件

1. 在 `src/components/` 創建 `ComponentName.tsx`
2. 如有樣式，創建 `ComponentName.module.css`（而非內聯樣式）
3. 在 `src/components/MainLayout.tsx` 或父組件中引入
4. 如需全局狀態，按狀態管理策略表選擇方案
5. 如需數據持久化，通過 `dataAdapter` 操作

### 添加新數據類型

1. 在 `src/types/` 定義接口
2. 在 `src/adapters/types.ts` 添加 `StorageKeys` 常量
3. 在 `IDataAdapter.ts` 添加對應方法簽名
4. 在 `LocalStorageAdapter.ts` 實現方法
5. 添加測試

### 添加新測試

1. 測試文件與源文件同目錄：`ComponentName.test.tsx`
2. 在 `beforeEach` 中處理單例隔離（見「測試指南」）
3. PBKDF2 測試使用低迭代數
4. 使用 `@testing-library/react` 測試組件交互
5. 覆蓋率門檻：80%

### 修改現有組件

1. 先閱讀組件及其依賴的 Context/Store
2. 確認狀態管理方案（不要混用）
3. 確認數據操作走 `dataAdapter`
4. 修改後運行 `npm run test:run` 確認無回歸
5. 運行 `npx tsc --noEmit` 確認無類型錯誤

---

## 已知問題與待辦

### 未完成項

- [ ] 核心組件交互測試（MoodMeter, EmotionGrid）
- [ ] PhysicalService 仍返回 `null`（無真實生理數據源）
- [ ] 集成測試和 E2E 測試尚未建立

### 技術債

- 無 `React.memo` / `useMemo` 優化（性能可接受但大列表可能卡頓）
- 無 Service Worker 離線策略（PWA 已配置但未精細控制）
- `server/` 目錄為獨立後端原型，未與前端集成

### 回歸風險點

- 修改 `crypto.ts` 可能破壞已加密數據的解密（v1/v2 兼容）
- 修改 `passwordHash.ts` 可能影響舊版 DJB2 哈希的驗證
- 修改 `LocalStorageAdapter` 的緩存策略可能影響寫入一致性
- 修改 `RulerLogEntry.id` 類型可能影響 `ensureId()` 遷移邏輯

---

## Git 工作流

```bash
# 提交前必跑
npx tsc --noEmit          # 類型檢查
npm run lint              # ESLint
npm run test:run          # 全部測試

# CI 流程（GitHub Actions）
TypeScript Check → ESLint → Test + Coverage → 80% Gate → Build
```

### 提交訊息格式

```
類型: 簡短描述

詳細說明（可選）
```

類型：`feat` | `fix` | `refactor` | `test` | `docs` | `chore`

---

## 快速參考

```bash
npm run dev              # 啟動開發服務器 (localhost:5173)
npm run build            # 生產構建
npm run test             # 測試（監視）
npm run test:run         # 測試（單次）
npm run test:coverage    # 覆蓋率
npm run lint             # ESLint
npx tsc --noEmit         # 類型檢查
npm run cap:sync         # Capacitor 同步
```

---

*本文件為 AI 編程代理提供專案上下文。修改架構或約定時，請同步更新此文檔。*
