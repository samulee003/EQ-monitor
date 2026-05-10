# 今心 ImXin APP — Agent 開發指引

> 給 AI Agent 的專案操作手冊。人類開發者請看 `README.md`。

## 1. 專案概述

**今心 (ImXin)** 是一款基於 RULER 情緒察覺框架的情緒調節 APP，靈感來自 Marc Brackett《Dealing with Feeling》。

- **前端**：React 19 + TypeScript + Vite + PWA
- **後端**：InsForge BaaS (PostgreSQL + Auth + Storage + AI + Edge Functions)
- **AI Agent**：Google Gemini REST API (`gemini-3.1-flash-lite`)
- **即時通訊**：LINE Bot 整合
- **測試**：Vitest (前端)、265 測試通過中

**產品方向**：已完成 **Agentic AI Coach** MVP（對話介面 + Meta-Moment SOS），未來可擴充《Dealing with Feeling》五大模組（Labeling / Emergency / Strategies / Co-Regulation / Foundations）。**擴充前必須先問用戶確認。**

---

## 2. Agent 行為準則（強制）

這些規則優先於一切技術決策。違反 = 浪費用戶 token。

### 2.1 執行前強制檢查清單

每次工具調用前，必須通過以下三問：

| 問題 | 不通過 → 停止 |
|---|---|
| **用戶實際問了什麼？** | 如果我在回答別的問題，先停。狀態報告 ≠ 啟動信號。 |
| **這是我的假設還是用戶的要求？** | 如果是假設，必須問確認。禁止偷換目標。 |
| **最簡方案是什麼？** | 如需改 >2 個文件或改動產品代碼配合測試，先報告計畫。 |

### 2.2 三條硬規則

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

### 2.3 簡潔原則

- 無投機性功能。無單用抽象。無未要求的配置彈性。
- 如果寫了 200 行但可以 50 行解決，重寫。
- 多種解讀存在時 → 列出選項問用戶，不要默默選一個。

---

## 3. 開發工作流

```
用戶請求 → 明確成功標準 → 最小改動 → 驗證 → 回報
```

- **狀態更新**：進行中的任務每完成一個 milestone 回報一次，不要等全部做完。
- **測試策略**：改動後跑 `npm run test:run`。如果既有測試失敗，先判斷是否是我的改動導致。如果不是，記錄但不強修（見 Rule 2）。
- **Git**：不主動 commit / push，除非用戶明確要求。
- **Supervisor**：多 agent 並行時，必須有一個 supervisor agent 定時監控進度、識別阻塞、調度修正。

---

## 4. 技術棧規範

### 4.1 前端

| 項目 | 版本/規範 |
|---|---|
| React | 19 |
| TypeScript | strict mode |
| 樣式 | Tailwind CSS 3.4（**禁止升級 v4**，已鎖定） |
| 建構 | Vite |
| 測試 | Vitest |
| 狀態管理 | 以 React hooks 為主，`useAppStore` 管理 view 路由 |
| 路由 | Custom view-based（非 React Router）：`currentView` ∈ `{home, checkin, history, growth, achievement, coach}` |

### 4.2 後端（InsForge BaaS）

**Endpoint**: `https://b88egxiz.ap-southeast.insforge.app`

**資料表**（`public` schema，RLS 已啟用）：

| 表名 | 用途 | RLS |
|---|---|---|
| `profiles` | 使用者資料擴展 | select / update own |
| `ruler_logs` | 情緒日誌（完整 RULER flow） | full CRUD own |
| `ruler_drafts` | 流程草稿（auto-save） | full CRUD own |
| `achievement_records` | 成就解鎖紀錄 | full CRUD own |
| `streaks` | 連續紀錄統計 | select own |

**Storage Buckets**:
- `voice-recordings` (private)
- `exports` (private)

**Edge Functions**（`server/insforge/functions/`）：
- `weekly-report.ts` — 7 天情緒報告
- `achievement-checker.ts` — 成就檢查與自動解鎖
- `coach-simple.ts` — ✅ **已部署** AI 情緒教練 API

**部署 URL**: `https://b88egxiz.functions.insforge.app/coach`

**Auth Trigger**: `on_auth_user_created` 自動建立 `profiles` 列。

### 4.3 AI Agent 架構

**模型**: `gemini-3.1-flash-lite`
**API Key**: 從 `Deno.env.get('GOOGLE_API_KEY')` 讀取（InsForge Edge Function secrets）

**實現方式**: 純 REST API（非 ADK）
- 原因：ADK JS 依賴 Node.js API，InsForge Deno bundler 無法解析本地相對匯入
- 優點：零依賴、最穩定、Bundle 最小
- 缺點：無 ADK 的 agent orchestration、session 不持久

**系統提示核心**：
- RULER 框架（Recognize / Understand / Label / Express / Regulate）
- 繁體中文（臺灣用語）
- 溫暖、不帶評判
- 危機轉介規則（自傷意念 → 觸發 MetaMoment）

### 4.4 InsForge SDK 使用規範

- **初始化**: `src/lib/insforge/client.ts`
- **Adapter Pattern**: `src/lib/insforge/adapter.ts`（基礎 CRUD）+ `syncAdapter.ts`（IndexedDB 離線緩存 + sync queue）
- **資料庫 insert 必須用陣列格式**: `.insert([data])`
- **回傳結構**: `{ data, error }`

**寫 InsForge 整合代碼前，先 fetch 最新 SDK 文件**: MCP `fetch-docs` 工具可用文件類型：`instructions`, `auth-sdk-typescript`, `db-sdk-typescript`, `storage-sdk`, `functions-sdk`, `ai-integration-sdk`, `real-time`, `deployment`。

**InsForge CLI 正確指令**:
```bash
# 設定 secrets
npx @insforge/cli secrets add GOOGLE_API_KEY "..."

# 部署 Edge Function
npx @insforge/cli functions deploy coach --file server/insforge/functions/coach-simple.ts
```

---

## 5. 已知問題與限制

| 問題 | 狀態 | 繞過方式 |
|---|---|---|
| Husky pre-commit hook 壞掉 | 未修 | commit 加 `--no-verify` |
| `ik_` instance key 無法 schema mutation | 未修（平台限制） | 用 direct PostgreSQL connection 執行 DDL |
| User API Key (`uak_`) 無法 headless 取得 | 未修 | 用 direct SQL + MCP 工具做基礎設施任務 |
| Data migration（LocalStorage → InsForge）| **未實作** | 待排程 |
| Server test `dotenv` missing | 未修 | `cd server && npm install` 可能解決 |
| ADK JS 無法在 Deno 部署 | **已知，已繞過** | 使用純 REST API fallback |
| Edge Function session 不持久 | **已知** | `InMemoryRunner` 記憶體儲存，每次請求獨立 |
| E2E 測試框架缺失 | **已知** | 尚未引入 Playwright / Cypress |

---

## 6. 目錄結構

```
今心 APP/
├── src/                          # 前端源碼
│   ├── lib/
│   │   ├── insforge/             # InsForge SDK 整合
│   │   │   ├── client.ts         # SDK client 初始化
│   │   │   ├── adapter.ts        # 基礎 adapter (InsForgeAdapter class)
│   │   │   ├── syncAdapter.ts    # 離線同步 adapter (+ IndexedDB cache)
│   │   │   ├── types.ts          # TypeScript interfaces
│   │   │   └── *.test.ts         # 測試
│   │   └── adk/                  # 🤖 AI Coach 客戶端
│   │       ├── client.ts         # fetch wrapper → /coach
│   │       ├── types.ts          # CoachMessage, CoachRequest, CoachResponse
│   │       └── storage.ts        # LocalStorage chat history
│   ├── components/coach/         # 🤖 AI Coach UI 組件
│   │   ├── ChatBubble.tsx        # 訊息氣泡
│   │   ├── ChatInput.tsx         # 輸入 + SOS 按鈕
│   │   ├── MetaMomentOverlay.tsx # 4 步驟 SOS 覆蓋層
│   │   ├── BreathingAnimation.tsx# 呼吸動畫
│   │   ├── TypingIndicator.tsx   # 打字指示器
│   │   ├── WelcomeCard.tsx       # 歡迎卡片
│   │   └── CoachFAB.tsx          # 浮動快速入口
│   ├── pages/CoachPage.tsx       # 🤖 教練主頁面
│   ├── adapters/                 # 既有 storage adapters
│   ├── data/                     # 情緒資料、常數
│   └── ...                       # 頁面、組件
├── server/
│   ├── insforge/
│   │   ├── schema/               # SQL migration 檔 (001-005)
│   │   ├── functions/            # Edge Functions (Deno/TS)
│   │   │   ├── weekly-report.ts
│   │   │   ├── achievement-checker.ts
│   │   │   ├── coach.ts          # ADK 原始版本（未部署）
│   │   │   └── coach-simple.ts   # ✅ REST API fallback（已部署）
│   │   └── agents/               # ADK agent 定義（參考用）
│   │       ├── emotionCoach.ts   # 主 agent 工廠
│   │       ├── runner.ts         # InMemoryRunner 包裝
│   │       ├── skills/
│   │       │   └── metaMoment.ts # MetaMoment Skill 工廠
│   │       └── tools/
│   │           └── rulerData.ts  # DB 查詢 Tool
│   └── src/                      # 既有 server 源碼 (Express + LINE Bot)
├── docs/
│   ├── insforge/                 # SDK 文件快取
│   └── superpowers/              # 🤖 計畫與規格文件
│       ├── plans/
│       │   └── 2026-05-10-agentic-emotion-coach.md
│       └── specs/
│           └── 2026-05-10-agentic-emotion-coach-design.md
├── AGENTS.md                     # 本文件
├── CHANGELOG.md                  # 更新日誌
└── ...
```

---

## 7. 測試命令

```bash
npm run test:run      # 全量測試
```

---

## 8. 最後提醒

> **情緒調節不是與生俱來的性格，而是一套可以透過有意識的練習與策略，不斷學習與精進的實用技能。**
>
> — Marc Brackett,《Dealing with Feeling》

這個專案的終極目標是幫助使用者建立這套技能。Agent 的每一次改動都應該服務於這個目標，而不是技術炫技。
