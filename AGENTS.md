# 今心 ImXin — Agent 開發指引

> 給 AI 編程代理的專案全景手冊。人類開發者請參閱 `README.md`。
> **語言**：繁體中文（台灣）— 所有界面文字、註釋、提交訊息、文件命名均使用繁體中文。

---

## 1. 專案概述

**今心 (ImXin)** 是一款開源情緒覺察工具，名稱取自「今心即為念」。產品基於耶魯大學 Marc Brackett 的 RULER 情緒智力框架，協助使用者在情緒高漲時暫停、覺察並選擇回應方式。

**雙入口架構（Bot-First）**：
- 🥇 **LINE Bot** — 主要入口，透過對話完成 RULER 五步練習（覺察→理解→標記→表達→調節）
- 📊 **PWA 儀表盤** — 歷史回顧、情緒熱力圖、成就展示、AI 教練對話

**授權**：MIT License | **倉庫**：https://github.com/samulee003/EQ-monitor

---

## 2. 技術棧

### 2.1 前端 PWA

| 項目 | 版本/規範 |
|---|---|
| React | 19.2 |
| TypeScript | 5.9（strict mode） |
| 構建工具 | Vite 7 |
| PWA | vite-plugin-pwa + Workbox |
| 移動端 | Capacitor 7（Android） |
| 狀態管理 | Zustand 5 + React Context + useReducer |
| 樣式 | Vanilla CSS（自定義 Morandi UI）+ CSS Modules |
| 語言處理 | opencc-js（繁簡轉換） |

### 2.2 後端 Bot Server

| 項目 | 版本/規範 |
|---|---|
| 運行時 | Node.js 18+ |
| 框架 | Express 5 + TypeScript |
| LINE SDK | @line/bot-sdk 9.x |
| 開發工具 | tsx 4.x |
| 測試 | Vitest 4 + supertest |

### 2.3 BaaS（InsForge）

| 項目 | 說明 |
|---|---|
| 平台 | InsForge（PostgreSQL + Auth + Storage + Edge Functions + Realtime） |
| 端點 | `https://b88egxiz.ap-southeast.insforge.app` |
| AI | Google Gemini REST API（`gemini-3.1-flash-lite`） |

### 2.4 部署平台

| 服務 | 平台 | 配置檔 | 狀態 |
|---|---|---|---|
| PWA 前端 | Zeabur（靜態託管） | `zeabur.toml` | ✅ 已上線 |
| Bot 後端 | Zeabur（Node.js） | `server/zeabur.toml` | ✅ 已上線 |
| Edge Functions | InsForge Functions | `server/insforge/functions/` | ✅ 已上線 |
| LINE Bot Webhook | Zeabur Bot Server | — | 🟡 已部署並驗簽通過，待真 LINE 帳號 E2E |

### 2.5 內測狀態（2026-05-14）

**PM 判斷**：黃燈偏綠，可進入 1-3 人／小圈朋友封閉試玩；暫不建議大量公開或投放式宣傳。

已收斂：
- PWA、Bot Server、`coach`、`weekly-report`、`achievement-checker` 均已部署。
- Coach 危機語句會回 `MetaMomentSkill` 並觸發 `open_sos`。
- 首頁與 Coach 首屏已強化為「Agentic AI 主動教練」導覽：首頁有「今日教練建議」，Coach 空狀態有焦慮、親子修復、教練觀察三個情境入口。
- Production PWA 最新目標版本：`https://today-mood.zeabur.app/?v=linebot-entry-9219bc3#home`。線上 smoke 已確認主導覽為原版文案「今日心情／記錄回顧／成長看板／教練」，頁首右上為純 SVG 圖示列（成就、主題、提醒、帳號），沒有再顯示「勳／系／訊」或「安定室」。
- Header 帳號入口已接 InsForge Auth：未登入時帳號圖示開啟登入／註冊 modal；已登入時打開個人中心。
- 重要 UI 約束：`MainLayout` 主導覽與 `CoachPage` 底部導覽必須保留原版文案「今日心情／記錄回顧／成長看板／教練」，不要改回「安定室／紀錄／洞察／主動教練」。
- LINE 官方帳號入口已補回首頁與 Coach 綁定區：顯示「鋅鋰師拔麻的小小額葉養成手札」、Basic ID `@980pqrhn`、加好友連結 `https://line.me/R/ti/p/@980pqrhn`，共用 `src/constants/lineBot.ts`。
- AI 教練 soul 已落地：`server/insforge/agents/soul.md` 是人格與安全邊界規格；ADK agent 使用 `globalInstruction + instruction`；production `coach-simple.ts` 使用同一套核心 prompt 組裝並已重新部署。
- LINE 綁定碼從 production PWA 到 production Bot Server 已 smoke 通過。
- Bot `/webhook` 已補簽名保護：缺少或無效 `x-line-signature` 回 401；有效簽名空事件回 200。
- 本機 PWA 已接上 InsForge Auth：`AuthContext` 走 `InsForgeAuthService`，不再使用本機假登入。
- 測試帳號 `samlei@apm.org.mo` 已在 InsForge Auth 建立並完成 email verification；UI 登入與重新整理保持登入已通過。
- `coach_context` 會在登入/註冊時自動初始化，已回查 InsForge 確認 user / profile / coach context 都落庫。
- 最近一次完整本機驗證：前端 `366 tests / 39 files` 通過，後端 `156 tests / 15 files` 通過；前端 `npm run build`、`npx tsc --noEmit`、`git diff --check` 通過。

仍需 PM/QA 實測：
- 用真 LINE 帳號跑一次完整流程：LINE 輸入「綁定」→ PWA 貼碼 → LINE 完成 RULER → Coach/週報讀到資料。
- LINE 官方帳號 UI 已補齊，但仍需用真朋友手機確認 LINE 加好友連結、輸入「綁定」、PWA 貼碼三段體驗都順。
- Production Zeabur PWA 已重部署，但部署驗證要等 `zeabur deployment list` 顯示最新 deployment `RUNNING` 後再 smoke；CLI 回 `Service deployed successfully` 時可能仍在 `BUILDING`，此時正式網址會暫時吐舊 bundle。
- 目前工作分支為 `codex/stitch-ui-release-20260513`，包含 `61f61fd`（純圖示帳號入口）、`9a5c5c3`（恢復原版導覽文案）與 `9219bc3`（補上 LINE 官方帳號入口）；不要 reset / checkout 覆蓋。

### 2.6 AI 教練 Soul / ADK / Production Prompt

| 檔案 | 用途 |
|---|---|
| `server/insforge/agents/soul.md` | 今心教練人格、語氣、主動性邊界、危機處理與資料隱私規格 |
| `server/src/agents/soulInstruction.ts` | canonical prompt builder：`buildEmotionCoachGlobalInstruction()`、`buildEmotionCoachInstruction()`、`buildProductionCoachSystemPrompt()` |
| `server/src/agents/emotionCoach.ts` | Node ADK agent，使用 `globalInstruction + instruction + tools + subAgents` |
| `server/insforge/agents/emotionCoach.ts` | InsForge ADK agent 參考實作，與 Node ADK agent 同步 soul/RULER 策略 |
| `server/insforge/functions/coach-simple.ts` | production `coach` Edge Function；因 InsForge 打包限制，保持自包含 prompt builder |
| `server/insforge/agents/soulContract.test.ts` | 契約測試，避免 `soul.md`、ADK agent、production fallback prompt 分裂 |

重要限制：
- InsForge Functions 部署時不會正確解析 `coach-simple.ts` 對本地 shared module 的相對 import；曾嘗試 `../../src/agents/soulInstruction.ts` 與 `./_shared/soulInstruction.ts`，部署 build 均失敗。
- 因此 production `coach-simple.ts` 需保持自包含。若更新 `soulInstruction.ts`，必須同步更新 `coach-simple.ts` 的 builder，並跑 `soulContract.test.ts`、後端 build、InsForge deploy、線上 smoke。
- 線上 smoke 後若寫入 `codex-smoke-*` 測試資料，務必清掉 `agent_ruler_logs`、`adk_events`、`adk_sessions`、`adk_user_states` 中對應 userId。

---

## 3. 目錄結構

```
今心 APP/
├── src/                          # 前端 PWA 源碼
│   ├── adapters/                 # 數據適配器（Adapter Pattern）
│   │   ├── IDataAdapter.ts       # 接口定義
│   │   ├── LocalStorageAdapter.ts# 當前實現（LocalStorage/IndexedDB）
│   │   ├── settingsStore.ts      # 簡單鍵值偏好（語言/主題/PIN）
│   │   ├── types.ts              # StorageKeys + 適配器類型
│   │   └── index.ts              # dataAdapter 單例導出
│   ├── components/               # React 組件
│   │   ├── coach/                # AI Coach UI（ChatBubble、MetaMomentOverlay 等）
│   │   ├── steps/                # RULER 步驟子組件
│   │   └── icons/                # SVG 圖標
│   ├── pages/                    # 頁面級組件
│   │   └── CoachPage.tsx         # AI 教練主頁面
│   ├── services/                 # 業務邏輯服務
│   │   ├── AIService.ts          # AI 對話服務
│   │   ├── HabitService.ts       # 習慣追蹤
│   │   ├── ExportService.ts      # 數據導出
│   │   └── ...
│   ├── hooks/                    # 自定義 React Hooks
│   │   └── useRulerFlow.ts       # RULER 流程狀態管理（useReducer）
│   ├── stores/                   # Zustand 全局狀態
│   │   ├── appStore.ts           # 視圖路由、主題、語言
│   │   └── botStore.ts           # Bot 同步狀態
│   ├── data/                     # 靜態數據
│   │   ├── emotionData.ts        # 100+ 情緒詞彙與象限分類
│   │   └── parentingEmotionData.ts # 育兒情境情緒數據
│   ├── types/                    # TypeScript 類型定義
│   │   ├── RulerTypes.ts         # RULER 相關類型
│   │   ├── HabitTypes.ts         # 習慣與進度類型
│   │   └── AchievementTypes.ts   # 成就系統類型
│   ├── utils/                    # 工具函數
│   │   ├── crypto.ts             # AES-256-GCM 加密
│   │   ├── passwordHash.ts       # PBKDF2-SHA256 哈希
│   │   └── format.ts             # 日期與格式化工具
│   ├── lib/                      # 外部庫整合
│   │   ├── insforge/             # InsForge SDK 整合
│   │   │   ├── client.ts         # SDK client 初始化
│   │   │   ├── adapter.ts        # 基礎 CRUD Adapter
│   │   │   ├── syncAdapter.ts    # 離線同步 + IndexedDB 緩存
│   │   │   └── types.ts          # TypeScript interfaces
│   │   └── adk/                  # AI Coach 客戶端
│   │       ├── client.ts         # fetch wrapper → /coach
│   │       ├── types.ts          # CoachMessage, CoachRequest
│   │       └── storage.ts        # LocalStorage chat history
│   ├── test/                     # 測試配置與工具
│   │   ├── setup.ts              # Vitest setup（localStorage mock, matchMedia mock）
│   │   └── mocks/                # 模擬模組
│   ├── App.tsx                   # 根組件（懶加載 + 視圖路由）
│   └── index.css                 # 全局樣式（Morandi 設計系統變量）
├── server/                       # LINE Bot 後端（獨立 Node 專案）
│   ├── src/
│   │   ├── index.ts              # Express 入口 + Webhook 處理
│   │   ├── rulerBot.ts           # RULER 對話式狀態機
│   │   ├── emotionData.ts        # 情緒詞彙（與前端共享邏輯）
│   │   ├── types.ts              # 後端類型定義
│   │   ├── env.ts                # dotenv 初始化
│   │   ├── db/
│   │   │   ├── index.ts          # 數據庫適配器入口
│   │   │   ├── memoryAdapter.ts  # 內存數據適配器（開發/測試）
│   │   │   ├── insforgeAdapter.ts# InsForge PostgreSQL 適配器（生產）
│   │   │   └── schema.sql        # PostgreSQL Schema
│   │   ├── middleware/
│   │   │   ├── errorHandler.ts   # 全局錯誤處理
│   │   │   ├── rateLimiter.ts    # 速率限制
│   │   │   └── requestLogger.ts  # 請求日誌
│   │   ├── api/
│   │   │   └── dashboard.ts      # 儀表盤 API
│   │   └── utils/
│   │       ├── logger.ts         # 結構化日誌
│   │       └── metrics.ts        # 指標統計
│   ├── insforge/                 # InsForge 基礎設施
│   │   ├── schema/               # SQL migration（001-008）
│   │   │   ├── 001_profiles.sql
│   │   │   ├── 002_ruler_logs.sql
│   │   │   ├── 003_ruler_drafts.sql
│   │   │   ├── 004_achievement_records.sql
│   │   │   ├── 005_streaks.sql
│   │   │   ├── 006_coach_messages.sql
│   │   │   ├── 007_coach_context.sql
│   │   │   └── 008_agentic_coach_bridge.sql
│   │   ├── functions/            # Edge Functions（Deno/TS）
│   │   │   ├── coach-simple.ts   # ✅ 已部署 AI 教練 API（REST fallback）
│   │   │   ├── weekly-report.ts  # ✅ 已部署週報生成
│   │   │   └── achievement-checker.ts # ✅ 已部署成就檢查
│   │   └── agents/               # ADK agent 定義 + soul.md + 契約測試
│   ├── src/agents/               # Node ADK agent + canonical soulInstruction
│   ├── test-bot.cjs              # Bot 端到端測試腳本
│   ├── package.json              # 獨立依賴管理
│   └── tsconfig.json             # 獨立 TypeScript 配置
├── docs/                         # 文檔
│   ├── insforge/                 # InsForge SDK 文件快取
│   └── superpowers/              # 計畫與規格
│       ├── plans/
│       └── specs/
├── public/                       # 靜態資源（PWA 圖標等）
├── android/                      # Capacitor Android 專案
├── dist/                         # 構建輸出（Vite）
├── package.json                  # 前端依賴
├── vite.config.ts                # Vite + PWA 配置
├── tsconfig.json                 # 前端 TypeScript 配置
├── vitest.config.ts              # 前端測試配置
├── eslint.config.js              # ESLint 配置
├── capacitor.config.ts           # Capacitor 配置
├── zeabur.toml                   # PWA 部署配置
└── AGENTS.md                     # 本文件
```

---

## 4. 構建與開發命令

### 4.1 前端 PWA

```bash
# 安裝依賴
npm install

# 開發伺服器（http://localhost:5173）
npm run dev

# 生產構建（輸出至 dist/）
npm run build

# 預覽生產構建
npm run preview

# 測試
npm run test              # 監視模式
npm run test:run          # 單次執行（366 測試通過）
npm run test:coverage     # 覆蓋率報告

# 代碼檢查
npm run lint
npx tsc --noEmit          # 類型檢查

# 移動端
npm run cap:sync          # 構建並同步 Capacitor
npm run cap:open          # 打開 Android Studio
```

### 4.2 後端 Bot Server

```bash
cd server/

# 安裝依賴
npm install

# 開發（熱重載）
npm run dev               # 監聽 http://localhost:3000

# 構建
npm run build             # 輸出至 server/dist/

# 啟動
npm run start             # 運行編譯後代碼

# 測試
npm run test              # 監視模式
npm run test:run          # 單次執行（156 測試通過）
npm run test:coverage     # 覆蓋率報告（門檻 80%）

# 端到端測試
node test-bot.cjs         # 模擬對話流程
```

### 4.3 InsForge 操作

```bash
# 設定 secrets
npx @insforge/cli secrets add GOOGLE_API_KEY "..."

# 部署 Edge Function
npx @insforge/cli functions deploy coach --file server/insforge/functions/coach-simple.ts

# 執行遷移
npm run migrate           # tsx src/lib/insforge/migrate.ts
```

---

## 5. 代碼風格與規範

### 5.1 語言與命名

- **界面文字、註釋、提交訊息、文件命名**：一律使用繁體中文（台灣用語）
- **代碼標識符**：使用英文，遵循 camelCase / PascalCase 慣例
- **類型導入**：強制 inline type import
  ```typescript
  // ✅ 正確
  import { type RulerLogEntry } from '@/types/RulerTypes';
  // ❌ 錯誤
  import type { RulerLogEntry } from '@/types/RulerTypes';
  ```

### 5.2 ESLint 規則

- `@typescript-eslint/no-unused-vars`: error（`_` 前綴忽略）
- `@typescript-eslint/no-explicit-any`: warn
- `@typescript-eslint/consistent-type-imports`: error（inline type-imports）
- `@typescript-eslint/explicit-function-return-type`: warn（允許表達式）
- `no-unused-vars`: off（由 TS 規則接管）

### 5.3 組件規範

- 函數組件 + Hooks（禁止使用 Class 組件）
- Props 類型：`React.FC<{ propName: Type }>`
- 樣式：CSS Modules（`*.module.css`）或 CSS 自定義屬量
- **禁止**在 JSX 中嵌入 `<style>` 標籤

### 5.4 狀態管理策略（嚴格遵守）

| 場景 | 使用方案 | 實例 |
|------|----------|------|
| 全局 UI 偏好（主題/語言） | React Context | ThemeContext, LanguageContext |
| 認證狀態 | React Context | AuthContext |
| 複雜領域狀態（流程/聊天） | useReducer | useRulerFlow |
| 跨組件共享業務數據 | Zustand | appStore, botStore |
| 臨時 UI 狀態 | useState | 各組件內部 |
| 簡單鍵值偏好 | settingsStore | 語言/主題/PIN |

**禁止在新組件中混用多種狀態管理方案。**

### 5.5 數據操作規範

**所有數據操作必須通過 `dataAdapter`，禁止直接訪問 localStorage。**

```typescript
import { dataAdapter } from '@/adapters';
// ✅ 正確：通過適配器
await dataAdapter.saveLog(entry);
// ❌ 錯誤：直接操作 localStorage
localStorage.setItem('feelings_logs', JSON.stringify(data));
```

未來遷移至 InsForge 時，只需實現新 Adapter，業務代碼零改動。

### 5.6 同步/異步邊界

- `settingsStore.get<T>()` → 異步（帶緩存，適合初始化）
- `settingsStore.getCached<T>()` → 同步（僅限已初始化場景）
- `dataAdapter.*` → 全部異步
- **禁止**在異步上下文中調用同步方法期望獲得最新數據

---

## 6. 設計系統

### 6.1 Luminous Morandi 配色

| 象限 | 色碼 | 情緒類型 |
|------|------|----------|
| 紅色 | `#C58B8A` | 高能量低愉悅（憤怒、焦慮） |
| 黃色 | `#D5C1A5` | 高能量高愉悅（興奮、快樂） |
| 藍色 | `#97A6B4` | 低能量低愉悅（憂鬱、疲憊） |
| 綠色 | `#AAB09B` | 低能量高愉悅（平靜、滿足） |

主題：Dark（默認 `#1a1a1a`）/ Light（`#f5f3ef`）/ System

### 6.2 路由系統

非 React Router，使用自定義 view-based 路由：
```typescript
type View = 'home' | 'checkin' | 'history' | 'growth' | 'achievement' | 'coach';
```
由 `appStore.currentView` 控制，`MainLayout` 負責切換。

---

## 7. 測試策略

### 7.1 前端測試（Vitest + jsdom）

**配置**：`vitest.config.ts`
- 環境：`jsdom`
- 全域：`true`
- Setup：`src/test/setup.ts`
- 別名：`@` → `./src`，`@insforge/sdk` → `./src/test/mocks/insforge-sdk.ts`

**當前覆蓋**（366 測試，39 文件全通）：

| 文件 | 測試數 | 覆蓋範圍 |
|------|--------|----------|
| `adapters/storage.test.ts` | 29 | LocalStorageAdapter CRUD、緩存、認證 |
| `utils/crypto.test.ts` | 17 | AES-256-GCM 加密解密、密鑰管理、v1/v2 兼容 |
| `utils/passwordHash.test.ts` | 15 | PBKDF2-SHA256、DJB2 舊版兼容、常數時間比較 |
| `hooks/useRulerFlow.test.ts` | 25 | RULER 流程狀態機 |
| `services/AIService.test.ts` | 24 | AI 對話、育兒情境檢測 |
| `services/HabitService.test.ts` | 17 | 習慣追蹤 |
| `data/emotionData.test.ts` | 8 | 情緒詞彙匹配 |
| `lib/insforge/adapter.test.ts` | 5 | InsForge SDK 整合 |
| `services/InsForgeAuthService*.test.ts` | 若干 | InsForge Auth 註冊、登入、session、profile |
| `lib/insforge/localStorageMigration*.test.ts` | 若干 | LocalStorage → InsForge `ruler_logs` 遷移 |
| `components/MainLayout.auth.test.tsx` | 若干 | Header 登入入口、純 SVG 圖示列、原版主導覽文案 |
| `pages/CoachPage.test.tsx` | 若干 | Coach 空狀態、LINE 官方帳號入口、LINE 綁定碼、底部導覽原版文案 |
| `components/coach/*.test.tsx` | 若干 | Coach UI 組件 |
| 其他 | 25+ | 格式化、無障礙、認證上下文、LoadingSpinner 等 |

**未覆蓋**：MoodMeter、EmotionGrid 等核心組件交互測試（待補齊）

### 7.2 後端測試

**配置**：`server/vitest.config.ts`
- 環境：`node`
- 覆蓋率門檻：lines/functions/branches/statements 均 80%
- 排除：middleware、api、logger、insforgeAdapter

當前狀態：156 測試通過（15 文件），`npm run build` 通過。

### 7.3 測試陷阱與解決方案

**jsdom 不支持 `crypto.subtle`**：
測試前必須注入測試主密鑰：
```typescript
import { _injectMasterKey, _resetKeyCache } from '@/utils/crypto';
const TEST_MASTER_KEY = '0'.repeat(64);
beforeEach(() => {
  _injectMasterKey(TEST_MASTER_KEY);
  _resetKeyCache();
});
```

**單例隔離**：
`settingsStore`、`LocalStorageStore`、`logsCache` 是模組級單例，測試之間會洩漏：
```typescript
beforeEach(() => {
  localStorage.clear();
  _injectMasterKey(TEST_MASTER_KEY);
  _resetKeyCache();
  adapter = new LocalStorageAdapter();
  adapter.clearLogsCache();
  await adapter.initialize();
});
```

**PBKDF2 測試速度**：
600K 迭代很慢（~400ms/次），測試中使用低迭代數：
```typescript
const fastHash = await hashPassword('test', 1000);
```

---

## 8. 安全考量

### 8.1 密碼與 PIN

```typescript
// ✅ 正確：使用 passwordHash 模組
import { hashPassword, verifyPassword, isLegacyHash } from '@/utils/passwordHash';
// 格式：$pbkdf2-sha256$<iterations>$<salt-hex>$<hash-hex>
// 迭代：600,000 | 鹽值：128-bit 隨機 | 算法：PBKDF2-SHA256
```

- ❌ 禁止自定義哈希算法
- ❌ 禁止明文存儲密碼或 PIN
- ❌ 禁止使用 DJB2 等非密碼學哈希
- `verifyPassword()` 自動檢測舊版 DJB2 哈希並驗證
- `verifyPrivacyPin()` 自動檢測明文 PIN，驗證成功後遷移為 PBKDF2

### 8.2 數據加密

```typescript
// ✅ 正確：使用 crypto 模組
import { encryptData, decryptData, isEncrypted } from '@/utils/crypto';
// 算法：AES-256-GCM + 隨機 IV + 鹽值
// 密鑰：256-bit 主密鑰存儲於 IndexedDB
// 兼容：可解密 v1 設備指紋密鑰加密的數據
```

### 8.3 部署安全

- 生產構建啟用 Terser，自動移除 `console.log/debug/info`
- `.env.example` 提供環境變量模板，實際密鑰不入庫
- LINE Bot Webhook 使用獨立 raw body 解析器進行簽名驗證
- InsForge 資料表全部啟用 RLS（Row Level Security）
- Storage Buckets：`voice-recordings`、`exports` 均為 private

---

## 9. 數據存儲

### 9.1 前端（LocalStorage / IndexedDB）

| 鍵名 | 用途 |
|------|------|
| `feelings_logs` | 情緒記錄日誌 |
| `ruler_draft` | 當前流程草稿（auto-save） |
| `user_progress` | 用戶進度/成就 |
| `jinxin-language` | 語言偏好 |
| `imxin-theme` | 主題偏好 |
| `imxin_privacy_pin` | 隱私鎖 PIN（PBKDF2 哈希） |

### 9.2 InsForge 資料表（`public` schema，RLS 已啟用）

| 表名 | 用途 | RLS 策略 |
|------|------|----------|
| `profiles` | 使用者資料擴展 | select / update own |
| `ruler_logs` | 情緒日誌（完整 RULER flow） | full CRUD own |
| `ruler_drafts` | 流程草稿（auto-save） | full CRUD own |
| `achievement_records` | 成就解鎖紀錄 | full CRUD own |
| `streaks` | 連續紀錄統計 | full CRUD own |
| `coach_context` | AI 教練上下文元數據 | full CRUD own + service_role |
| `adk_sessions` | AI 教練 Session 持久化 | full CRUD own |
| `adk_events` | AI 教練對話事件流 | full CRUD own |
| `line_user_bindings` | LINE Bot 與 PWA 本地使用者綁定碼 | service_role only |
| `agent_ruler_logs` | 內測期非 UUID 使用者的 Agentic Coach / LINE 日誌橋接 | service_role only |

**Auth Trigger**：`on_auth_user_created` 自動建立 `profiles` 列。

### 9.3 數據遷移

LocalStorage → InsForge 的 RULER 日誌遷移已在本機實作：
- `src/lib/insforge/localStorageMigration.ts` 會讀取 `feelings_logs`，支援既有加密資料解密。
- 歷史情緒紀錄會寫入 `ruler_logs`，不是只更新 `coach_context` 摘要。
- 遷移完成後會在 `coach_context.migration_completed_at` 標記完成，避免重複遷移。
- 首次登入後由 `AuthContext` 判斷是否需要顯示 `MigrationProgress`。

---

## 10. 已知問題與限制

| 問題 | 狀態 | 繞過方式 / 備註 |
|---|---|---|
| Husky pre-commit hook 壞掉 | 未修 | commit 加 `--no-verify` |
| 工作分支 ahead of `origin/main` | 待 PR / merge | 目前在 `codex/stitch-ui-release-20260513`；不要 reset / checkout 覆蓋 `61f61fd`、`9a5c5c3` 之後的發布修正 |
| 真 LINE E2E | 待實測 | UI 已顯示官方帳號、Basic ID 與加好友連結；仍需真 LINE 帳號完整跑「加好友 → 綁定碼 → PWA 貼碼 → LINE 完成 RULER」 |
| ESLint warnings | 已知 | `npm run lint` 目前 0 errors / 31 warnings |
| 本機無 `deno` | 已知 | Edge Functions 靠部署與線上 smoke 驗證；本機 `deno check` 未跑 |
| ADK JS 無法在 Deno 部署 | 已繞過 | ADK agent 已同步 soul；production 使用純 REST API fallback（`coach-simple.ts`），且因 InsForge 打包限制需自包含 prompt builder |
| Edge Function session 不持久 | 已解決 | PostgreSQL `adk_sessions` / `adk_events` 跨請求持久化 |
| Data migration（LocalStorage → InsForge）| 已實作，待更多真資料驗證 | 已會寫入 `ruler_logs` 並標記 `coach_context.migration_completed_at` |
| 認證架構（本地 ↔ InsForge Auth）| 本機已整合，待部署確認 | `AuthContext` 已改走 `InsForgeAuthService`；production PWA 需確認 env + redeploy |
| 真 LINE E2E | 待實測 | Webhook 簽名接受/拒絕已驗；仍需真 LINE 帳號跑完整事件 |
| 主動推送（Proactive AI / Cron）| 分支已實作，待部署/資料庫驗證 | `feature/insforge-schedule` 已進入當前分支；仍需真實 `DATABASE_URL` / cron 檢查 |
| Playwright E2E 基線 | 已引入 | 關鍵路徑測試已存在；真 LINE E2E 仍需人工實測 |
| `ik_` instance key 無法 schema mutation | 平台限制 | 用 direct PostgreSQL connection 執行 DDL |

---

## 11. 回歸風險點

修改以下模組時需特別謹慎，建議修改前後都執行 `npm run test:run`：

- `src/utils/crypto.ts` — 可能破壞已加密數據的解密（v1/v2 兼容）
- `src/utils/passwordHash.ts` — 可能影響舊版 DJB2 哈希的驗證
- `src/adapters/LocalStorageAdapter.ts` — 緩存策略變更可能影響寫入一致性
- `src/types/RulerTypes.ts` 中 `RulerLogEntry.id` — 類型變更可能影響 `ensureId()` 遷移邏輯
- `src/services/AIService.ts` — `generateWeeklyInsight` 的 Edge Function 呼叫邏輯與 mock fallback 路徑
- `src/services/HabitService.ts` — `updateProgress` 的本地計算與雲端同步邊界
- `server/insforge/functions/coach-simple.ts` — 生產環境唯一 AI 教練入口，改動需重新部署並驗證

---

## 12. Git 工作流

### 12.1 提交前檢查清單

```bash
npx tsc --noEmit          # 類型檢查
npm run lint              # ESLint
npm run test:run          # 全部測試
```

### 12.2 提交訊息格式

```
類型: 簡短描述

詳細說明（可選）
```

類型：`feat` | `fix` | `refactor` | `test` | `docs` | `chore`

### 12.3 CI 流程（設計中）

TypeScript Check → ESLint → Test + Coverage → 80% Gate → Build

---

## 13. Agent 工作流指南

### 13.1 執行前強制檢查清單

每次工具調用前，通過以下三問：

| 問題 | 不通過 → 停止 |
|---|---|
| **用戶實際問了什麼？** | 如果我在回答別的問題，先停。狀態報告 ≠ 啟動信號。 |
| **這是我的假設還是用戶的要求？** | 如果是假設，必須問確認。禁止偷換目標。 |
| **最簡方案是什麼？** | 如需改 >2 個文件或改動產品代碼配合測試，先報告計畫。 |

### 13.2 三條硬規則

**Rule 1：卡住就回報，不回報 = 違規**
- 同一問題嘗試 ≤ 2 次。第二次失敗必須說：「我卡在 X，建議 Y 或 Z，你選？」
- 超過 5 分鐘沒有實質進展 → 必須中斷並回報。

**Rule 2：產品代碼不為測試讓路**
- 禁止修改 `.ts` 產品源碼來讓測試通過（如：加 constructor 參數、改 method signature）。
- 測試應該適應產品代碼，不是反過來。
- 例外：用戶明確說「改架構」。

**Rule 3：只改必須改的**
- 不改相鄰代碼、註解、格式。
- 不刪除未使用的既有代碼（除非我的改動導致它變 orphan）。
- 每一行改動必須能追溯到用戶的當前請求。

### 13.3 簡潔原則

- 無投機性功能。無單用抽象。無未要求的配置彈性。
- 如果寫了 200 行但可以 50 行解決，重寫。
- 多種解讀存在時 → 列出選項問用戶，不要默默選一個。

---

## 14. 常見操作指南

### 14.1 添加新組件

1. 在 `src/components/` 創建 `ComponentName.tsx`
2. 如有樣式，創建 `ComponentName.module.css`（而非內聯樣式）
3. 在 `src/components/MainLayout.tsx` 或父組件中引入
4. 如需全局狀態，按「狀態管理策略表」選擇唯一方案
5. 如需數據持久化，通過 `dataAdapter` 操作

### 14.2 添加新數據類型

1. 在 `src/types/` 定義接口
2. 在 `src/adapters/types.ts` 添加 `StorageKeys` 常量
3. 在 `IDataAdapter.ts` 添加對應方法簽名
4. 在 `LocalStorageAdapter.ts` 實現方法
5. 添加測試

### 14.3 添加新測試

1. 測試文件與源文件同目錄：`ComponentName.test.tsx`
2. 在 `beforeEach` 中處理單例隔離（見「測試陷阱」）
3. PBKDF2 測試使用低迭代數
4. 使用 `@testing-library/react` 測試組件交互
5. 覆蓋率門檻：80%

---

## 15. 快速參考

```bash
# 前端
npm run dev              # localhost:5173
npm run build            # 生產構建
cd server && npm run dev # Bot 後端 localhost:3000
npm run test:run         # 前端全量測試（366 測試）
cd server && npm run test:run # 後端全量測試（156 測試）
npm run test:coverage    # 覆蓋率
npm run lint             # ESLint
npx tsc --noEmit         # 類型檢查
npm run cap:sync         # Capacitor 同步
```

---

> **情緒調節不是與生俱來的性格，而是一套可以透過有意識的練習與策略，不斷學習與精進的實用技能。**
>
> — Marc Brackett,《Dealing with Feeling》

這個專案的終極目標是幫助使用者建立這套技能。Agent 的每一次改動都應該服務於這個目標，而不是技術炫技。

*本文件為 AI 編程代理提供專案上下文。修改架構或約定時，請同步更新此文檔。*
