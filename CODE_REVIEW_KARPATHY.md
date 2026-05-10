# 今心 ImXin 代碼審查報告

> 應用 Karpathy Guidelines：簡單優先、精準修改、目標驅動
> 審查範圍：src/ 全部 94 個檔案
> 審查原則：只報告、不修改

---

## 執行摘要

**這不是一個 100 分的專案。**

程式碼功能完整、UI 精緻、測試覆蓋率高，但存在**系統性的過度設計**。核心問題是：為了一個「可能未來會有的後端」，在本地優先（local-first）的單機應用中引入了多層不必要的抽象，導致程式碼量膨脹約 40-50%，維護成本遠超實際需求。

---

## P0：過度設計（最嚴重）

### 1. 三層儲存抽象 — 用 750 行包裝 localStorage

**問題**：為了讀寫 localStorage，專案建立了三個獨立層級：

| 層級 | 檔案 | 行數 | 職責 |
|------|------|------|------|
| 底層 | `LocalStorageAdapter.ts` | 526 行 | 實現 `IDataAdapter` 介面，含完整 Auth、CRUD、Sync、Pagination |
| 中層 | `StorageService.ts` | 115 行 | 「門面模式」，把所有呼叫轉發給 Adapter |
| 頂層 | `settingsStore.ts` | 128 行 | 另一套同步 API，專門處理簡單設置 |

**具體問題**：
- `LocalStorageAdapter` 實現了 `signUp`/`signIn`/`signInWithOAuth`/`updatePassword`/`deleteAccount` — 這是一個**本地單機情緒記錄 App**，沒有後端，卻有完整的帳號系統程式碼
- `StorageService` 的註釋說「未來遷移至後端時，無需修改此文件」— 但實際上它就是一個純轉發層，沒有任何額外邏輯
- `settingsStore` 與 `LocalStorageAdapter` 的 `settings` 方法功能完全重疊

**Karpathy 準則對照**：
> 「No abstractions for single-use code」「If you write 200 lines and it could be 50, rewrite it」

**建議**：直接刪除 `StorageService` 和 `IDataAdapter` 介面，讓組件直接使用 `settingsStore`（同步）或一個精簡的 `localStorage` 工具（異步）。等真的有後端時，再建抽象層。

---

### 2. CSS-in-JSX 膨脹 — 元件內嵌數百行樣式

**問題**：多個元件將大量 CSS 直接嵌入 JSX 的 `<style>` 標籤中，而非使用專案的 CSS Modules 或全域 CSS。

| 檔案 | 內嵌 CSS 行數 | 元件總行數 | CSS 佔比 |
|------|-------------|-----------|---------|
| `GrowthDashboard.tsx` | ~390 | 846 | 46% |
| `CheckInFlow.tsx` | ~310 | 539 | 57% |
| `MainLayout.tsx` | ~240 | 370 | 65% |
| `Timeline.tsx` | ~240 | 751 | 32% |

**具體問題**：
- `MainLayout.tsx` 第 123-364 行：header、nav、footer、所有按鈕樣式全在元件內
- `CheckInFlow.tsx` 第 222-533 行：危機彈窗、快速記錄按鈕、動畫 keyframes 全在內部
- 這些 `<style>` 標籤在每次渲染時都會被重新插入 DOM（React 不會優化這個）
- 專案聲稱使用「Vanilla CSS + CSS Modules」，但實際上走的是 CSS-in-JSX 路線

**Karpathy 準則對照**：
> 「Minimum code that solves the problem. Nothing speculative.」

**建議**：將所有內嵌 CSS 遷移至對應的 `.css` 或 `.module.css` 檔案。這會減少元件體積、提升渲染效能、讓樣式可被瀏覽器快取。

---

### 3. 客戶端加密 — 虛假的安全感

**檔案**：`src/utils/crypto.ts`（135 行）

**問題**：
- 使用 AES-GCM + PBKDF2 加密 localStorage 資料
- 密鑰從 `navigator.userAgent` + `screen.width` + `screen.height` + `timezoneOffset` 派生
- **這些都是公開資訊**，任何拿到裝置的人都能導出相同的密鑰
- 加密增加了複雜度（async 加密/解密、版本管理、fallback 邏輯），卻沒有提供實際安全價值
- `LocalStorageAdapter.ts` 第 71-97 行的 `LocalStorageStore` 類因為加密而全部變成 async

**Karpathy 準則對照**：
> 「No error handling for impossible scenarios」「Would a senior engineer say this is overcomplicated?」

**建議**：
- 如果目標是防止「旁觀者偷看」：使用裝置 PIN（已有 `PrivacyLock`）比加密整個資料庫更實際
- 如果目標是資料安全：localStorage 本來就不該存敏感資料
- **建議刪除整個 crypto 模組**，讓儲存層回歸同步操作

---

### 4. Bot 後端耦合 — 不相關的功能混入核心

**檔案**：
- `src/services/BotSyncService.ts`
- `src/stores/botStore.ts`
- `src/components/BotDashboard.tsx`

**問題**：
- 專案核心是一個前端情緒覺察 PWA
- 卻混入了 LINE Bot 後端的同步邏輯（`getDashboardSummary`、`getWeeklyReport`）
- `botStore.ts` 定義了獨立的 Zustand store，與核心情緒記錄無直接關聯
- 這應該是獨立專案或外掛，而非核心程式碼的一部分

**建議**：將 Bot 相關程式碼移至獨立套件或分支，核心專案保持單一職責。

---

### 5. AIService Mock 資料過度膨脹

**檔案**：`src/services/AIService.ts`（383 行）

**問題**：
- 第 33-68 行：5 組完整的 mock 洞察資料（含心理學建議、名言引用、色彩理論）
- 第 200-229 行：另外 4 組週報 mock 資料（內容與上方高度相似但不同）
- 第 333-379 行：`getMockChatResponse` 含 3 組完整的對話回應模板
- 這些 hardcoded 的心理學內容佔據了約 200 行原始碼
- 如果 AI 文案需要調整，工程師必須修改原始碼並重新部署

**建議**：將 mock 資料提取至 `src/data/` 下的 JSON 檔案，或至少提取至獨立的 `mockData.ts`。

---

## P1：品質問題

### 6. 雙重狀態管理 — Zustand + Context 並存

**問題**：
- 路由、隱私鎖、啟動畫面：Zustand（`appStore.ts`、`botStore.ts`）
- 主題、語言、認證、習慣：React Context（4 個 Provider）
- `CombinedProviders.tsx` 存在純粹是為了包裹這 4 個 Context Provider
- 同一專案內同時存在兩種狀態管理模式，增加認知負擔

**建議**：統一遷移至 Zustand（已有依賴），移除 `CombinedProviders` 和所有 Context。

---

### 7. useRulerFlow — Reducer 過度設計

**檔案**：`src/hooks/useRulerFlow.ts`（398 行）

**問題**：
- 用 `useReducer` 管理一個 9 步的流程（總共 11 種 action）
- 大多數 action 只是簡單的 `return { ...state, step: 'nextStep' }`
- `useEffect` 依賴陣列長達 10 項（第 265-276 行），容易觸發不必要的重新儲存
- 草稿恢復邏輯已知有 bug（第 368-371 行註釋：「暫時簡化：直接重置」）
- `setTimeout` 在第 329-331 行硬編碼 3 秒延遲，沒有清理邏輯

**建議**：這個流程本質上是「當前步驟 + 一些表單資料」，一個 `useState` 管理 currentStep + 一個物件存表單資料就足夠。Reducer 模式在這裡是殺雞用牛刀。

---

### 8. 型別安全漏洞

**檔案**：`src/components/Timeline.tsx`

**問題**：
- 第 55-56 行：`(targetLog as RulerLogEntry & { id?: string }).id`
- 第 79-80 行：重複的相同型別斷言
- 第 91-102 行：舊資料相容邏輯直接覆寫全部日誌
- `RulerLogEntry` 型別定義沒有 `id` 欄位，但程式碼假設某些物件可能有
- 這是「型別系統說謊」的典型案例

**建議**：
- 為日誌條目定義正確的型別（含 `id: string`）
- 寫一個資料遷移函數，在載入時將舊格式轉為新格式，而非在每次 CRUD 時處理

---

### 9. Logger — 過度設計的日誌包裝

**檔案**：`src/utils/logger.ts`（81 行）

**問題**：
- 包裝了 `console.debug/info/warn/error`，加上前綴 `[今心 LEVEL]`
- 維護一個 100 條的 `history` 陣列
- `getHistory()` / `clearHistory()` 方法沒有任何 UI 呼叫
- 生產環境自動抑制非錯誤日誌（但 Vite 的 `drop_console` 已經做了這件事）

**Karpathy 準則對照**：
> 「No features beyond what was asked.」

**建議**：如果沒有除錯面板的計劃，直接用 `console.error` 和 `console.warn` 即可。需要結構化日誌時再引入庫。

---

### 10. Vite 配置過度分割

**檔案**：`vite.config.ts`（第 99-120 行）

**問題**：
- 手動定義了 10 個 chunk 分割規則
- `ui-timeline`、`ui-dashboard`、`ui-achievement`、`ui-checkin`、`ui-parent`、`ui-steps`、`ui-emotion`、`ui-settings`、`ui-ai`、`services-core`、`emotion-data`
- Vite/Rollup 的自動分割已經足夠好
- 過度細分可能導致更多的 HTTP 請求，反而拖慢載入

**建議**：移除大部分手動 `manualChunks`，只保留 `react-vendor` 和 `vendor`。

---

## P2：次要問題

### 11. Skeleton 元件 CSS 重複

**檔案**：`src/components/Skeleton.tsx`

**問題**：
- 7 個不同的 CSS 類別（`.skeleton-line`、`.skeleton-tag`、`.skeleton-circle`、`.skeleton-circle-lg`、`.skeleton-cell`）定義了完全相同的 `linear-gradient` + `animation: shimmer`
- 只有 `width`/`height` 不同

**建議**：提取一個 `.skeleton-shimmer` 基礎類別，各元素只覆寫尺寸。

---

### 12. 未使用的元件

**檔案**：`src/components/ContextLogger.tsx`

**問題**：
- 從檔案列表中可見此元件存在
- `App.tsx` 中沒有引用它
- 這是為 `logger.getHistory()` 設計的除錯面板，但該功能未被使用

**建議**：刪除未使用的元件。

---

## 總結與優先級

| 優先級 | 問題 | 影響 | 預估減少行數 |
|--------|------|------|-------------|
| P0 | 三層儲存抽象 | 維護成本、認知負擔 | -400 |
| P0 | CSS-in-JSX 遷移至 CSS 檔案 | 效能、可維護性 | -800（移出 TSX） |
| P0 | 客戶端加密 | 虛假安全、async 複雜度 | -135 |
| P0 | Bot 後端耦合 | 單一職責 | -200 |
| P0 | AIService mock 資料 | 可維護性 | -200（移出） |
| P1 | 統一狀態管理（移除 Context） | 認知負擔 | -100 |
| P1 | useRulerFlow 簡化 | 可讀性、bug 風險 | -150 |
| P1 | 型別修復（id 欄位） | 型別安全 | -20 |
| P1 | Logger 簡化 | 去除無用抽象 | -60 |
| P1 | Vite chunk 簡化 | 建構效能 | -15 |
| P2 | Skeleton CSS 去重 | DRY | -50 |
| P2 | 刪除未使用元件 | 乾淨度 | -20 |

**預估總共可精簡約 2,150 行原始碼**（從目前 ~6,500 行 src/ 中）。

---

## 正面的東西（值得保留）

1. **測試覆蓋率高**：165 個測試，94%+ statements coverage
2. **PWA 配置完整**：vite-plugin-pwa、Workbox、manifest 都正確配置
3. **無障礙支援**：SkipLink、A11yAnnouncer、focus-visible、aria-labels 到位
4. **TypeScript 嚴格模式**：`strict: true`、`noUnusedLocals: true`
5. **懶加載策略**：`App.tsx` 中正確使用 `React.lazy` 分割非首屏元件
6. **危機介入機制**：高風險情緒自動顯示求助熱線（`CheckInFlow.tsx` 第 54-60 行）

---

> 「If you write 200 lines and it could be 50, rewrite it.」
> 
> — Karpathy Guidelines #2
