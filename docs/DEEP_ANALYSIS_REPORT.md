# 今心 ImXin — 深度架構分析報告

> 由 6 組並行 Agent 團隊於 2026-05-11 完成全面分析
> 涵蓋：前端 PWA、後端 Bot、數據層、AI 教練、測試基建、構建與安全

---

## 目錄

1. [執行摘要](#1-執行摘要)
2. [前端 PWA 架構](#2-前端-pwa-架構)
3. [後端 Bot 服務器](#3-後端-bot-服務器)
4. [數據層與存儲](#4-數據層與存儲)
5. [AI 教練系統](#5-ai-教練系統)
6. [測試基礎設施](#6-測試基礎設施)
7. [構建、部署與安全](#7-構建部署與安全)
8. [關鍵風險與建議](#8-關鍵風險與建議)
9. [技術債熱力圖](#9-技術債熱力圖)

---

## 1. 執行摘要

今心 (ImXin) 是一款基於今心四步的開源情緒覺察工具，採用 **Bot-First 雙入口架構**：

- **LINE Bot**（主要入口）：對話式完成 今心四步練習
- **PWA 儀表盤**（輔助入口）：歷史回顧、情緒熱力圖、AI 教練、成就系統

**技術棧**：React 19 + TypeScript 5.9 + Vite 7 + Express 5 + InsForge BaaS + Google Gemini

**整體評估**：
- ✅ 成熟的現代前端構建體系（Vite PWA + TS Strict + ESLint Flat + Vitest）
- ✅ 多平台部署彈性（Zeabur / Fly.io / Render）
- ✅ 客戶端安全設計良好（AES-256-GCM + PBKDF2-SHA256 600k iter）
- ⚠️ 數據層存在三條平行實現路徑，遷移策略未閉環
- ⚠️ 核心組件測試覆蓋嚴重不足（57/88 源檔案無測試）
- 🔴 發現 API Key 硬編碼洩露風險 + 加密降級漏洞 + Draft Resume 邏輯 Bug

---

## 2. 前端 PWA 架構

### 2.1 組件層次

```
main.tsx
└── App → AppContent
    ├── SplashScreen (條件)
    ├── PrivacyLock (條件)
    └── CombinedProviders
        ├── AuthProvider
        ├── ThemeProvider
        ├── LanguageProvider
        └── HabitProvider
            └── ErrorBoundary → MainLayout
                └── Suspense + Lazy Pages
                    ├── 'home' → ParentHome
                    ├── 'checkin' → CheckInFlow
                    ├── 'history' → Timeline
                    ├── 'growth' → GrowthDashboard
                    ├── 'achievement' → AchievementPage
                    └── 'coach' → CoachPage
```

**今心四步 Flow 子層次**（9 步驟）：
```
CheckInFlow
├── quickMode === 'quick' → QuickCheckIn
├── quickMode === 'parent' → ParentScenarios
├── step === 'recognizing' → 四色狀態入口
├── step === 'centering' → CenteringStep
├── step === 'bodyScan' → BodyScan
├── step === 'labeling' → EmotionGrid
├── step === 'understanding' → UnderstandingStep
├── step === 'expressing' → ExpressingStep
├── step === 'regulating' → RegulatingStep
├── step === 'neuroCheck' → NeuroCheckStep
├── step === 'summary' → SummaryStep + AIInsightCard
└── Crisis Modal (高風險情緒時觸發)
```

### 2.2 狀態管理分層

| 層級 | 方案 | 實例 | 邊界說明 |
|------|------|------|----------|
| 全局 UI 偏好 | React Context | ThemeContext, LanguageContext | 主題/語言/認證 |
| 複雜業務流程 | useReducer | useRulerFlow | 今心四步 9 步狀態機 |
| 跨組件業務數據 | Zustand | appStore, botStore | 路由/鎖屏/Bot 同步 |
| 臨時 UI 狀態 | useState | 各組件內部 | 表單/選中/動畫 |
| 持久化 | storage.ts | dataAdapter, settingsStore | 統一封裝 localStorage |

### 2.3 Morandi 設計系統

| Token | Dark | Light | 用途 |
|-------|------|-------|------|
| `--bg-color` | `#1a1a1a` | `#f5f3ef` | 主背景 |
| `--color-red` | `#C58B8A` | `#d67373` | 很滿、卡住 |
| `--color-yellow` | `#D5C1A5` | `#d4b87a` | 很滿、順心 |
| `--color-blue` | `#97A6B4` | `#6b8fa8` | 很慢、卡住 |
| `--color-green` | `#AAB09B` | `#8dae7f` | 很慢、順心 |

- 全局 `* { transition: background-color 0.3s, ... }`
- 玻璃態效果：`--glass-bg`, `--glass-border`, `--glass-blur`
- 圓角系統：32px / 24px / 16px / 12px

### 2.4 前端架構問題

| 優先級 | 問題 | 位置 |
|--------|------|------|
| 🔴 | Draft Resume 邏輯 Bug：`RESUME_DRAFT` 後又強制 `setStep('recognizing')` | `useRulerFlow.ts` |
| 🔴 | 全局 DOM 突變：`document.documentElement.style.setProperty('--aura-color', ...)` | BodyScan, UnderstandingStep, RegulatingStep |
| 🔴 | 600 行巨型存儲模組：加密+認證+CRUD+草稿+成就+連續記錄+設定快取 | `storage.ts` |
| 🔴 | JSX 內嵌 `<style>` 標籤：MainLayout 245 行、BodyScan 250+ 行、RegulatingStep 175+ 行 | 多個組件 |
| 🟡 | 混合狀態範式無清晰規則 | 全局 |
| 🟡 | Adapter 反向依賴 Service（re-export BotSyncService）| `adapters/index.ts` |
| 🟡 | IIFE Side Effects in Store（`hasPrivacyPin()` 於 `create()` 中）| `appStore.ts` |
| 🟢 | CoachPage 大量 inline styles | `CoachPage.tsx` |

### 2.5 文件耦合熱點

| 排名 | 被引用路徑 | 引用次數 |
|------|-----------|----------|
| 1 | `../services/LanguageContext` | 26 |
| 2 | `../adapters` | 24 |
| 3 | `../types/RulerTypes` | 18 |
| 4 | `./icons/SvgIcons` | 12 |
| 5 | `../data/emotionData` | 12 |

---

## 3. 後端 Bot 服務器

### 3.1 請求生命週期

```
LINE Platform
    │
    ▼ POST /webhook
Express Server (src/index.ts)
    ├── raw body 保留（簽名驗證）
    ├── validateSignature (LINE SDK)
    ├── rateLimiter (60 req/min per IP)
    ├── requestLogger
    └── rulerBot.processMessage()
            │
            ├── getOrCreateUser()
            ├── createSession() / updateSession()
            ├── 狀態機處理
            ├── saveMessage()
            └── 返回 BotResponse
                    │
                    ▼ LINE Platform → 用戶
```

### 3.2 今心四步狀態機

共 **7 個對話狀態**：
```
IDLE → RECOGNIZING → UNDERSTANDING → LABELING
                                          ↓
SUMMARY ← EXPRESSING ← REGULATING ←———
```

| 狀態 | 用戶輸入 | Bot 回覆 |
|------|----------|----------|
| IDLE | 「開始」 | 歡迎語 + 身體部位 Quick Reply |
| RECOGNIZING | 身體部位 | 情緒詞 Quick Reply（33 個） |
| UNDERSTANDING | 情緒詞 | 需求 Quick Reply（10 個） |
| LABELING | 需求 | 表達方式 Quick Reply |
| EXPRESSING | 表達方式 | 調節策略 Quick Reply |
| REGULATING | 調節策略 | 總結 + 反饋 Quick Reply |
| SUMMARY | 反饋 | 感謝語 + 週報指令提示 |

### 3.3 數據庫適配器

| 方法 | memoryAdapter | supabaseAdapter |
|------|--------------|-----------------|
| getOrCreateUser | Map | bot_users 表 |
| createSession | Map | ruler_sessions 表 |
| updateSession | Map.update | UPDATE |
| completeSession | Map + 計算 | 讀取+更新（無事務） |
| saveMessage | Array.push | chat_messages 表 |
| getUserHistory | Array.filter | SELECT LIMIT |
| getWeeklyStats | 遍歷計算 | SELECT + COUNT |

### 3.4 後端問題

| 優先級 | 問題 | 說明 |
|--------|------|------|
| 🟡 | RLS 被繞過 | supabaseAdapter 使用 service key，RLS 策略不生效 |
| 🟡 | 無事務 | `completeSession` 讀取+更新分兩次查詢，競態條件可能 |
| 🟡 | 連續天數邏輯重複 | 前後端各自實現，非 DRY |
| 🟡 | 時區邊界 | `diffDays === 1` 未處理時區邊緣情況 |
| 🟢 | dotenv 缺失 | `server/src/env.ts` 因缺少 dotenv 依賴導致 1 個測試文件失敗 |

---

## 4. 數據層與存儲

### 4.1 前端數據流

```
UI Components / Stores
    │
    ├── settingsStore (sync KV)
    ├── dataAdapter (async CRUD)
    └── storageService (facade/compat)
            │
            ▼
    ┌─────────────────────────────┐
    │     storage.ts (600 lines)   │
    │  • AES-256-GCM encrypt       │
    │  • logsCache (array|null)    │
    │  • settingsCache (Map)       │
    │  • stringCache (Map)         │
    └─────────────────────────────┘
            │
            ▼
    localStorage (encrypted)
    Key: feelings_logs_<userId>
         imxin_users, imxin_current_user
         imxin-theme, etc.
            │
            ▼
    IndexedDB ('imxin_crypto')
    • master_key_v2 (256-bit random)
    • legacy_device_key (SHA-256 UA)
```

### 4.2 三條平行存儲實現

| 實現 | 狀態 | 說明 |
|------|------|------|
| `storage.ts` | **活躍使用** | 本地 LocalStorage + IndexedDB 加密 |
| `InsForgeAdapter` | 死代碼（零引用） | 直接線上 CRUD |
| `InsForgeSyncAdapter` | 死代碼（零引用） | 離線優先 + 同步隊列 + IndexedDB 緩存 |

### 4.3 核心類型定義

```typescript
// RulerTypes.ts
interface RulerLogEntry {
  id: string;
  emotions: Emotion[];
  intensity: number;
  bodyScan: BodyScanData;
  understanding: UnderstandingData;
  expressing: ExpressingData;
  regulating: RegulatingData;
  physicalContext: PhysicalContext;
  postMood?: string;
  timestamp: number;
  isFullFlow: boolean;
}

// 情緒數據：100+ 詞彙，四色狀態分類
// Red(很滿、卡住) / Yellow(很滿、順心)
// Blue(很慢、卡住) / Green(很慢、順心)
```

### 4.4 數據層關鍵問題

| 優先級 | 問題 | 影響 |
|--------|------|------|
| 🔴 | 無統一適配器接口 | 遷移至 InsForge 需重寫所有組件 |
| 🔴 | SyncAdapter 是孤兒代碼 | 大量技術債，實現了但從未使用 |
| 🔴 | Schema Drift | Local `activityLevel: number` → InsForge `activityLevel: string` |
| 🔴 | 加密降級 | `storeSet()` catch 塊 fallback 到明文存儲 |
| 🔴 | 遷移為手動 CLI | 用戶需開 DevTools 提取加密密鑰 |
| 🟡 | 日誌 O(n) 查詢 | 單個 JSON 數組，無分頁 |
| 🟡 | Cache 非 per-user | 切換用戶可能返回錯誤數據 |
| 🟡 | Settings 未加密 | `imxin-theme`, `imxin-language` 明文存儲 |

---

## 5. AI 教練系統

### 5.1 架構概覽

```
CoachPage (前端)
    │
    ├── Chat Area (messages, optimistic UI)
    ├── ChatInput + SOS Button
    ├── EmergencyStabilizationOverlay (4 步嚮導)
    └── Error Banner + Retry
            │
            ▼ POST /coach
    ┌─────────────────────────────────────┐
    │  Edge Function: coach-simple.ts      │
    │  (生產環境，無 ADK)                  │
    │                                     │
    │  1. Crisis 關鍵字檢測 (16 個詞)      │
    │  2. 查詢 ruler_logs + streaks        │
    │  3. 組裝 Prompt (系統指令+上下文)     │
    │  4. 呼叫 Gemini 3.1 Flash Lite       │
    │  5. 返回 JSON {response, skillInvoked}│
    └─────────────────────────────────────┘
            │
            ▼
    Google Gemini API
```

### 5.2 緊急安定流程

| 步驟 | 名稱 | 前端行為 | 後端感知 |
|------|------|----------|----------|
| 0 | 感覺身體 | 身體覺察文字引導 | 無 |
| 1 | 呼吸暫停 | 4-7-8 呼吸動畫 | 無 |
| 2 | 記得想成為的自己 | 自由文字輸入 | 無 |
| 3 | 選一個照顧動作 | 5 個策略按鈕選擇 | 無 |

完成後發送文字摘要回 Coach，後端始終無結構化狀態。

### 5.3 雙 AI 系統問題

| 系統 | 用途 | 模型 | 端點 |
|------|------|------|------|
| AIService.ts | 今心四步 分析 + 週報 | GPT-4o | `VITE_API_PROXY_URL` |
| ADK Client | Coach 對話 | Gemini 3.1 Flash Lite | `VITE_COACH_API_URL` |

**問題**：兩套獨立 AI 系統，無統一層，維護成本高。

### 5.4 AI 教練關鍵問題

| 優先級 | 問題 | 說明 |
|--------|------|------|
| 🔴 | 無狀態後端 | 每次請求獨立處理，無對話歷史，coach 無法引用先前訊息 |
| 🔴 | `test-user` fallback | 未認證用戶共享同一 ID，污染分析數據 |
| 🔴 | ADK 未部署 | `coach-simple.ts` 繞過整個 ADK 框架，`agents/` 為參考代碼 |
| 🟡 | Crisis 檢測基於關鍵字 | 簡單子串匹配，可能誤判或漏判 |
| 🟡 | 無串流響應 | 15 秒超時，慢連接體驗差 |
| 🟡 | 無服務端會話存儲 | 聊天記錄僅存 localStorage，換設備即丟失 |
| 🟢 | 無 Coach 專用數據表 | 無 `coach_sessions` 或 `coach_messages` |

---

## 6. 測試基礎設施

### 6.1 測試覆蓋矩陣

| 層級 | 測試數 | 文件數 | 覆蓋狀態 |
|------|--------|--------|----------|
| 前端單元測試 | 265 | 20 | 部分（31/88 文件有測試） |
| 後端單元測試 | 88 | 4 | 中等（4/14 文件有測試） |
| E2E 測試 | 0 | 0 | 缺失 |

### 6.2 測試清單（前端）

| 文件 | 測試數 | 覆蓋範圍 |
|------|--------|----------|
| `adapters/storage.test.ts` | 29 | 認證、日誌 CRUD、草稿、快取 |
| `utils/crypto.test.ts` | 17 | AES v1/v2、加密循環、Unicode |
| `utils/passwordHash.test.ts` | 15 | PBKDF2、DJB2 兼容、常數時間比較 |
| `utils/dateUtils.test.ts` | 38 | 相對時間、問候語、時區 |
| `hooks/useRulerFlow.test.ts` | 25 | 9 步狀態機、完整/快速流程 |
| `hooks/useA11y.test.ts` | 22 | 焦點陷阱、快捷鍵、屏幕朗讀器 |
| `services/AIService.test.ts` | 24 | Mock fallback、API 降級、育兒檢測 |
| `services/HabitService.test.ts` | 17 | 連續天數、9 個成就解鎖 |
| `pages/CoachPage.test.tsx` | 10 | API 呼叫、錯誤處理、緊急安定練習 |
| `lib/insforge/syncAdapter.test.ts` | 16 | 離線/在線切換、隊列回放 |

### 6.3 測試清單（後端）

| 文件 | 測試數 | 覆蓋範圍 |
|------|--------|----------|
| `server/src/rulerBot.test.ts` | 34 | 完整 7 步對話、情緒匹配、多使用者隔離 |
| `server/src/emotionData.test.ts` | 23 | 精確/部分/模糊匹配、四色狀態 |
| `server/src/db/memoryAdapter.test.ts` | 22 | CRUD、連續天數、週統計 |
| `server/src/utils/metrics.test.ts` | 7 | 計數器、副本、重置 |

### 6.4 未測試核心模組（57 個文件）

**前端組件（~30 個無測試）**：
App.tsx, MainLayout.tsx, AuthModal.tsx, PrivacyLock.tsx, EmotionGrid.tsx, 四色狀態入口.tsx, BodyScan.tsx, UnderstandingStep.tsx, ExpressingStep.tsx, RegulatingStep.tsx, CheckInFlow.tsx, Timeline.tsx, GrowthDashboard.tsx, AchievementPage.tsx, OnboardingFlow.tsx, SplashScreen.tsx, ExportPanel.tsx, BotDashboard.tsx, ParentHome.tsx, ParentScenarios.tsx...

**後端無測試**：
index.ts, api/dashboard.ts, middleware/*, db/supabaseAdapter.ts, db/index.ts

### 6.5 已知測試缺陷

| 缺陷 | 位置 | 說明 |
|------|------|------|
| 錯誤斷言 | `ThemeContext.test.tsx:83` | `expect(stored).not.toBe('light')` 邏輯顛倒 |
| 實現耦合測試 | `format.test.ts` | 同時包含實現與測試，無獨立 `format.ts` |
| 弱斷言 | `useA11y.test.ts` | 僅 `expect(container).toBeDefined()`，未驗證焦點循環 |
| Flaky Tests | `AuthContext.test.tsx` | `setTimeout(50)` 等待 useEffect |
| Flaky Tests | `ThemeContext.test.tsx` | `setTimeout(200)` 等待 localStorage |

---

## 7. 構建、部署與安全

### 7.1 構建管線

```
Source (src/)
    ├── TypeScript 5.9 (strict mode, bundler resolution)
    ├── Vite 7.2 + @vitejs/plugin-react + vite-plugin-pwa
    ├── ESLint 9 (Flat Config) + typescript-eslint
    └── Vitest + jsdom + @testing-library/react
            │
            ▼
    ┌─────────────────┬─────────────────┬─────────────┐
    │  dist/          │  server/dist/   │  android/   │
    │  (Zeabur PWA)   │  (Node.js 22)   │  (Capacitor)│
    └─────────────────┴─────────────────┴─────────────┘
```

- Code Splitting：手動 `manualChunks`（react-vendor, ui-*, services-core, emotion-data）
- Minification：Terser，`drop_console: true`, `drop_debugger: true`
- PWA：Workbox autoUpdate、standalone 模式、maskable icons

### 7.2 部署架構

| 平台 | 配置檔 | 特點 |
|------|--------|------|
| **Zeabur**（主要）| `zeabur.toml`, `server/zeabur.toml` | 前端靜態托管 + 後端 Node.js |
| **Fly.io**（備援）| `server/fly.toml` | Docker、HKG 區域、auto-stop |
| **Render**（備援）| `server/render.yaml` | Blueprint、Singapore |

### 7.3 安全模型

| 層級 | 實現 | 評估 |
|------|------|------|
| 客戶端加密 | AES-256-GCM + PBKDF2-SHA256 (100k iter) | 良好 |
| 密碼哈希 | PBKDF2-SHA256 (600k iter) + 常數時間比較 | 業界標準 |
| PIN 隱私鎖 | 4 位數字 PBKDF2 哈希 | 良好 |
| 舊版兼容 | DJB2 自動檢測並升級、v1 設備指紋密鑰兼容 | 良好 |
| 後端速率限制 | 記憶體 Map，60 req/min | 單實例有效 |
| LINE Webhook | `validateSignature` 簽名驗證 | 良好 |

### 7.4 🔴 安全漏洞

| 風險 | 位置 | 嚴重程度 |
|------|------|----------|
| **InsForge API Key 硬編碼於 Git** | `.insforge/project.json`, `.mcp.json`, `opencode.json` | 🔴 高 |
| **加密降級到明文** | `storage.ts` catch 塊：`localStorage.setItem(key, json)` | 🔴 高 |
| **Android allowBackup="true"** | `AndroidManifest.xml` | 🔴 高（密鑰可能備份至 Google Drive）|
| 設定快取繞過加密 | `settingsCache` 直接讀寫 localStorage | 🟡 中 |
| 後端速率限制無法跨實例 | Fly.io 多機器時記憶體 Map 不共享 | 🟡 中 |
| AI Proxy 無請求驗證 | `/api/ai` 轉發任意請求體 | 🟡 中 |
| 無 CSP | `index.html` 無 Content-Security-Policy | 🟢 低 |
| 測試密鑰注入無環境檢查 | `_injectMasterKey()` 可被生產調用 | 🟢 低 |

---

## 8. 關鍵風險與建議

### 8.1 立即行動（P0 — 本週內）

1. **輪換 InsForge API Key**
   - `.insforge/project.json`、`.mcp.json`、`opencode.json` 包含生產 API key
   - 將 `.mcp.json` 和 `opencode.json` 加入 `.gitignore`
   - 使用 `git filter-repo` 或 BFG 從 Git 歷史清除

2. **修復加密降級漏洞**
   ```typescript
   // storage.ts 當前：
   catch { localStorage.setItem(key, json); } // 明文！
   
   // 建議：
   catch { logger.error('Encryption failed', err); throw err; }
   ```

3. **修復 Draft Resume Bug**
   ```typescript
   // useRulerFlow.ts：RESUME_DRAFT 後不應立即 setStep('recognizing')
   // 應恢復 draft.step 到當前步驟
   ```

4. **修復 ThemeContext 測試錯誤斷言**
   - `expect(stored).not.toBe('light')` → `expect(stored).toBe('light')`

### 8.2 短期行動（P1 — 本月內）

5. **統一前端存儲接口**
   - 定義 `IDataAdapter` 接口
   - 讓 `storage.ts`、`InsForgeAdapter`、`InsForgeSyncAdapter` 統一實現
   - 使用 Context/Factory 在運行時切換

6. **啟用 SyncAdapter 或刪除**
   - 若 InsForge 為目標：接入 SyncAdapter，替換 storage.ts
   - 若暫不遷移：刪除 InsForge 相關死代碼，減少維護負擔

7. **增加核心組件測試**
   - AuthModal、ErrorBoundary、BodyScan、EmotionGrid、CheckInFlow

8. **補充後端 API 測試**
   - 使用 supertest 測試 webhook、dashboard、middleware

### 8.3 中期行動（P2 — 下季度）

9. **AI 教練增強**
   - 實現對話歷史上下文（多輪記憶）
   - 部署真正的 ADK Agent（替代 coach-simple.ts）
   - 添加 `coach_sessions` 和 `coach_messages` 數據表

10. **E2E 自動化**
    - 將 `test-bot.cjs` 轉化為 Vitest/Playwright 自動化測試

11. **安全加固**
    - 添加 Content-Security-Policy
    - 跨實例速率限制（Redis）
    - Android `allowBackup="false"`

---

## 9. 技術債熱力圖

```
                    影響範圍
           低 ◄─────────────────► 高
         ┌─────────────────────────────┐
    高   │  🟡 混合狀態範式      🔴 600行存儲模組  │
         │  🟡 IIFE Side Effects  🔴 Draft Resume Bug │
    修   │  🟢 CoachPage inline   🔴 加密降級漏洞   │
    復   │                        🔴 API Key 洩露   │
    難   ├─────────────────────────────┤
    度   │  🟢 Type 鬆散         🟡 SyncAdapter 孤兒 │
         │  🟢 Theme 重複監聽     🟡 無統一存儲接口  │
    低   │  🟢 圖標未拆分 chunk   🟡 後端 RLS 被繞過 │
         └─────────────────────────────┘
```

---

*本報告由 Kimi Code CLI 自動生成，基於 6 組並行 Agent 的代碼分析結果。*
*分析時間：2026-05-11 | 專案路徑：/Users/samulee003/Desktop/今心 APP*
