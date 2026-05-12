# 今心 ImXin — Claude Code 交接文件

> **專案方向：Agentic AI 情緒覺察工具**
> 
> 這是一份給 Claude Code 的完整接手文件。前一位 AI Agent（Kimi）已完成基礎架構與 Agentic AI 核心升級，現由你接手後續開發與部署。

---

## 一、專案願景（Agentic AI 方向）

今心（ImXin）不是一個「問答式聊天機器人」，而是一個**具備工具調用能力、長期記憶、主動行動力**的情緒智力 Agent。

**Agentic 能力藍圖：**

| 能力層級 | 狀態 | 說明 |
|---------|------|------|
| 🔧 **工具調用（Function Calling）** | ✅ 已上線 | 4 個 Tools：查歷史、存日誌、分析趨勢、觸發前端動作 |
| 🧠 **Session 持久化（長期記憶）** | ✅ 已上線 | PostgreSQL 跨對話記憶，非揮發性 |
| 🎯 **子代理路由（Sub-agent Routing）** | ✅ 已上線 | 危機偵測 → 自動切換 Meta-Moment 安全協議 |
| ⚡ **主動行動（Proactive Actions）** | ✅ 已上線 | AI 可觸發前端呼吸器、SOS、導航至記錄頁面 |
| 📤 **主動推送（Proactive Push）** | ❌ 未實現 | 需 cron/schedule：定時關懷、週報推播、連續紀錄提醒 |
| 🔗 **跨平台同步（LINE ↔ PWA）** | ⚠️ 半實現 | Bot 與 PWA 資料尚未完全打通 |

**核心理念**：AI 不只是「回應」，而是「觀察 → 判斷 → 行動」。當用戶連續三天記錄高壓情緒，Agent 應主動推送呼吸練習；當用戶達成連續紀錄，Agent 主動給予鼓勵。

---

## 二、當前架構總覽

```
┌─────────────────────────────────────────────────────────────┐
│                        用戶入口層                              │
├─────────────────────────────────────────────────────────────┤
│  🥇 LINE Bot  ←─── webhook ───→  🤖 Bot Server (Node.js)   │
│      (主要入口)                      (Zeabur — 部署中)      │
├─────────────────────────────────────────────────────────────┤
│  📊 PWA 前端  ←─── API ───────→  ⚡ Edge Functions (Deno)   │
│   (Zeabur)                          (InsForge — 已上線)     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  InsForge BaaS  │
                    │  PostgreSQL +   │
                    │  Auth + Storage │
                    └─────────────────┘
```

**已上線服務：**
- PWA 前端：`https://today-mood.zeabur.app`
- Edge Function — AI Coach：`https://b88egxiz.functions.insforge.app/coach`
- Edge Function — 週報：`https://b88egxiz.functions.insforge.app/weekly-report`
- Edge Function — 成就檢查：`https://b88egxiz.functions.insforge.app/achievement-checker`
- InsForge API：`https://b88egxiz.ap-southeast.insforge.app`

---

## 三、已完成清單（前一位 Agent 交付）

### 3.1 Agentic AI 核心
- [x] Edge Function `coach` 重寫為 Agentic 版本（Function Calling + Session 持久化）
- [x] 資料庫新增 `adk_sessions`, `adk_events`, `adk_app_states`, `adk_user_states`
- [x] 4 個 Tools：`get_user_emotion_summary`, `get_emotion_trend`, `save_ruler_log`, `trigger_action`
- [x] 危機偵測關鍵詞 → 自動切換 `META_MOMENT_PROMPT`
- [x] 前端 `CoachPage.tsx` 適配 action 觸發（呼吸/記錄/SOS/導航）

### 3.2 Edge Functions 部署
- [x] `coach` — 已部署並上線
- [x] `weekly-report` — 已部署（2025-05-12）
- [x] `achievement-checker` — 已部署（2025-05-12）

### 3.3 前端改動（已改未部署）
- [x] `AIService.ts` — `generateWeeklyInsight` 改呼叫 `weekly-report` Edge Function
- [x] `GrowthDashboard.tsx` — 傳遞 `userId` 給週報 API
- [x] `HabitService.ts` — `updateProgress` 同步成就到 `achievement-checker` Edge Function
- [x] `HabitContext.tsx` — 傳遞 `userId` 給成就更新
- [x] `streaks` 表 RLS 策略修復（允許用戶 upsert 自己的記錄）

### 3.4 設計與文件
- [x] `DESIGN.md` — 402 行設計系統文件
- [x] `今心_ImXin_方案規格.html` — 含截圖的完整規格文件
- [x] `Zeabur_Bot_Server_部署需求.md` — Bot Server 部署技術規格

---

## 四、待辦清單（由你接手）

### 🔴 P0 — 阻塞級（優先處理）

#### 4.1 Bot Server 部署到 Zeabur
**狀態**：前一位 Agent 已寫好需求文件，尚未執行
**文件**：`Zeabur_Bot_Server_部署需求.md`
**核心工作**：
- [ ] 新增 `server/src/db/insforgeAdapter.ts`（用 `pg` 連 InsForge PostgreSQL）
- [ ] 修改 `server/src/db/index.ts` 優先使用 InsForge adapter
- [ ] 確保 `npm run build` 無錯誤
- [ ] Zeabur Dashboard 新增 Service（Root Directory: `server/`）
- [ ] 設定環境變數（`LINE_CHANNEL_ACCESS_TOKEN`, `LINE_CHANNEL_SECRET`, `DATABASE_URL` 等）
- [ ] 部署並驗證 `/health`
- [ ] LINE Developers Console 設定 Webhook URL

#### 4.2 前端 PWA 重新部署
**狀態**：前端已有改動（週報 + 成就同步），但未 push 觸發 Zeabur 構建
**核心工作**：
- [ ] `npm run test:run` 確認 330 測試通過
- [ ] `npx tsc --noEmit` 確認無類型錯誤
- [ ] `npm run build` 確認構建成功
- [ ] `git commit` + `git push` 觸發 Zeabur 自動部署
- [ ] 驗證線上 PWA 的週報與成就功能正常

### 🟡 P1 — 重要級

#### 4.3 認證架構整合（本地認證 ↔ InsForge Auth）
**問題**：目前 `storage.ts` 的 `signUp`/`signIn` 是純 localStorage 實現，與 InsForge `auth.users` 完全獨立。這導致：
- 無法寫入 `ruler_logs`（RLS 要求 `auth.uid() = user_id`）
- 無法寫入 `achievement_records`
- 無法寫入 `streaks`
- 數據遷移無法進行

**建議方案**（選一）：
- **方案 A**：`storage.ts` 的 `signUp`/`signIn` 同時呼叫 InsForge SDK `insforge.auth.signUp` / `signInWithPassword`，保存 accessToken，後續 SDK 操作自動帶上 auth header
- **方案 B**：使用 InsForge 匿名登入（如果 SDK 支持）或自動創建帳號
- **方案 C**：創建一個 `/api/migrate` Edge Function，接收 localStorage payload，用 service role 寫入（需要 `SERVICE_ROLE_KEY`）

**注意**：這是許多其他功能的**前置條件**。

#### 4.4 數據遷移（LocalStorage → InsForge）
**狀態**：`localStorageMigration.ts` 只有 `coach_context` 元數據遷移，未遷移真正的 `feelings_logs`
**依賴**：4.3 認證整合完成後才能進行
**核心工作**：
- [ ] `runMigration()` 將 `feelings_logs` 批量插入 `ruler_logs`
- [ ] `user_progress` 遷移到 `achievement_records` + `streaks`
- [ ] 處理重複插入（upsert 或去重）
- [ ] `MigrationProgress` 組件顯示真實進度

### 🟢 P2 — 增強級

#### 4.5 主動推送（Proactive AI）
**狀態**：完全未實現
**需求**：
- [ ] 創建 Edge Function `proactive-check` 或 `daily-nudge`
- [ ] InsForge Schedule（cron）每天固定時間觸發
- [ ] 檢查用戶最後活動時間，若超過 48 小時未記錄，發送溫柔提醒
- [ ] 檢測連續高壓情緒（紅色象限佔比 > 60%），主動推送呼吸練習
- [ ] 連續紀錄里程碑（3/7/30 天）自動發送鼓勵訊息

#### 4.6 LINE Bot ↔ PWA 數據同步
**狀態**：架構預留，未完整串接
**需求**：
- [ ] LINE Bot 用戶可以綁定 PWA 帳號（輸入綁定碼或掃描 QR）
- [ ] LINE 端記錄的 RULER flow 同步到 PWA 的 `ruler_logs`
- [ ] PWA 的歷史回顧可以看到 LINE 端記錄的數據

#### 4.7 測試覆蓋率補齊
**狀態**：前端 330 測試通過，但核心組件（MoodMeter、EmotionGrid、CoachPage）缺少交互測試
**需求**：
- [ ] `MoodMeter.test.tsx` — 象限選擇、多選、確認
- [ ] `EmotionGrid.test.tsx` — 情緒搜尋、多選、分類
- [ ] `CoachPage.test.tsx` — 對話發送、action 觸發、錯誤處理
- [ ] Bot Server 測試補齊（目前 52 測試，1 個 dotenv 文件失敗）

---

## 五、關鍵程式碼位置

| 功能 | 路徑 |
|------|------|
| Agentic AI Coach Edge Function | `server/insforge/functions/coach-simple.ts` |
| 週報 Edge Function | `server/insforge/functions/weekly-report.ts` |
| 成就檢查 Edge Function | `server/insforge/functions/achievement-checker.ts` |
| 前端 AI Service | `src/services/AIService.ts` |
| 前端 Coach Client | `src/lib/adk/client.ts` |
| Bot Server 入口 | `server/src/index.ts` |
| Bot 對話狀態機 | `server/src/rulerBot.ts` |
| 資料庫適配器 | `server/src/db/index.ts` |
| RULER Flow 前端 | `src/components/CheckInFlow.tsx` |
| 情緒詞彙數據 | `src/data/emotionData.ts` |

---

## 六、環境與憑證

### InsForge 專案
- **Project ID**: `9803abb6-5614-48f6-b9fb-bb52d5b1360e`
- **App Key**: `b88egxiz`
- **Region**: `ap-southeast`
- **API URL**: `https://b88egxiz.ap-southeast.insforge.app`
- **PostgreSQL**: `postgresql://postgres:036fd61640ebc629542456b8e98e788d@b88egxiz.ap-southeast.database.insforge.app:5432/insforge?sslmode=require`

### 已部署 Secrets（InsForge）
- `GOOGLE_API_KEY` — Gemini API
- `API_KEY`, `ANON_KEY`, `JWT_SECRET` — InsForge 系統

### 缺少 Secrets（需設定）
- `LINE_CHANNEL_ACCESS_TOKEN` — LINE Bot
- `LINE_CHANNEL_SECRET` — LINE Bot
- `SERVICE_ROLE_KEY` — InsForge Service Role（如需後端繞過 RLS）

---

## 七、設計約束（不可違反）

1. **語言**：所有界面文字、註釋、提交訊息、文件命名使用**繁體中文（台灣）**
2. **狀態管理**：按策略表選擇唯一方案，禁止混用
3. **數據操作**：必須通過 `dataAdapter`，禁止直接訪問 localStorage
4. **加密**：密碼必須用 `passwordHash.ts`（PBKDF2），數據加密用 `crypto.ts`（AES-256-GCM）
5. **測試**：修改後必須跑 `npm run test:run`，覆蓋率門檻 80%
6. **Git**：Husky pre-commit 已壞，commit 加 `--no-verify`

---

## 八、快速指令參考

```bash
# 前端
cd "/Users/samulee003/Desktop/今心 APP"
npm run dev           # localhost:5173
npm run build         # dist/
npm run test:run      # 330 測試
npx tsc --noEmit      # 類型檢查

# 後端
cd server/
npm run dev           # localhost:3000
npm run build         # dist/
npm run test:run      # 52 測試

# InsForge CLI（已 link）
cd "/Users/samulee003/Desktop/今心 APP"
npx @insforge/cli functions list
npx @insforge/cli functions deploy <name> --file <path>
npx @insforge/cli secrets list
```

---

> **交接人**：Kimi Code CLI
> **日期**：2026-05-12
> **狀態**：基礎架構 + Agentic AI 核心已完成，等待 Bot Server 部署與認證整合
>
> **情緒調節不是與生俱來的性格，而是一套可以透過有意識的練習與策略，不斷學習與精進的實用技能。** — Marc Brackett
