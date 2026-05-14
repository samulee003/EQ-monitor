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
│      (主要入口)                      (Zeabur — 已部署 ✅)    │
├─────────────────────────────────────────────────────────────┤
│  📊 PWA 前端  ←─── API ───────→  ⚡ Edge Functions (Deno)   │
│   (Zeabur)                          (InsForge — 已上線 ✅)   │
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
- PWA 前端：`https://today-mood.zeabur.app` ✅
- Bot Server：`https://imxin-bot.zeabur.app` ✅
- Edge Function — AI Coach：`https://b88egxiz.functions.insforge.app/coach` ✅
- Edge Function — 週報：`https://b88egxiz.functions.insforge.app/weekly-report` ✅
- Edge Function — 成就檢查：`https://b88egxiz.functions.insforge.app/achievement-checker` ✅
- InsForge API：`https://b88egxiz.ap-southeast.insforge.app`

---

## 三、本 Session 已完成（Kimi → 你的交接）

### 3.1 修復 LINE Bot RULER 流程循環 Bug
**問題**：第五步（Regulate）結束後，用戶點 summary 的「謝謝」quickReply，Bot 又自動開啟第一步（Recognize）。

**根因**：`handleSummary()` 在回傳訊息前就清除了 session，用戶點「謝謝」後 `getOrCreateSession()` 創建新的 `idle` session，觸發 `handleIdle()` 重新開始流程。

**修復**：
- 新增 `RulerStep = 'completed'`
- `handleSummary()` 不再清除 session，改為 `advanceStep(session, 'completed')`
- 新增 `handleCompleted()`：回傳「不客氣...」後才清除 session
- 用戶必須再發一則訊息才會開始新流程

**Commit**：`c7d6544`（已 push）

### 3.2 Health Endpoint 新增 Adapter 資訊
- `GET /health` 現在回傳 `"adapter": "insforge"`（或 memory/supabase），方便確認 Bot Server 是否連上 PostgreSQL
- **Commit**：`ab59d99`（已 push）

### 3.3 驗證 Bot-PWA 聯動的關鍵發現（⚠️ 重要）

經過完整探索，**LINE Bot 和 PWA 目前完全沒有數據聯動**。

| 系統 | 數據存儲 | 用戶 ID | 表名 |
|------|---------|---------|------|
| LINE Bot | InsForge PostgreSQL | `line_user_id` | `bot_users`, `ruler_sessions`, `chat_messages` |
| PWA | `localStorage` | `user_{timestamp}_{rand}` | `feelings_logs` |

**核心問題**：
- Bot 寫入 `ruler_sessions`（flat schema，通過 `pg` Pool）
- PWA 讀取 `feelings_logs`（localStorage，AES-256-GCM 加密）
- 兩者是**完全不同的表結構、不同的用戶身份體系、不同的存儲層**
- PWA 的 `src/lib/insforge/` 適配器代碼在 `_deprecated/` 目錄，生產環境未使用
- PWA 認證也是純 localStorage（`imxin_users`），與 InsForge `auth.users` 完全獨立

這意味著：**用戶在 LINE 上做的 RULER 練習，不會出現在 PWA 的歷史回顧中。**

---

## 四、接下來的方向（由你接手）

### 🔴 P0 — 阻塞級

#### 4.1 確認 Bot Server 數據庫連線
- [ ] 等 Zeabur 重新部署後，`curl https://imxin-bot.zeabur.app/health` 確認 `"adapter": "insforge"`
- [ ] 如果 adapter 是 `"memory"`，檢查 Zeabur 環境變數 `DATABASE_URL` 是否正確設定
- [ ] 確認 `ruler_sessions` 表有數據（可用 MCP `run-raw-sql` 查詢）

#### 4.2 關閉 LINE Auto-reply
- [ ] 進 [manager.line.biz](https://manager.line.biz) → 設定 → 回應設定 → 關閉自動回覆
- [ ] 將回應模式設為「Webhook」

### 🟡 P1 — 重要級（二選一或並行）

#### 方向 A：讓 Bot 數據進入 PWA（短期方案）
這是最快的「看起來有聯動」的方案：

1. **在 Bot Server 寫入 `ruler_logs` 表**（而非現在的 `ruler_sessions`）
   - `ruler_logs` 是 PWA 的 deprecated adapter 預期讀取的表
   - schema 不同，需要數據轉換：`ruler_sessions` flat columns → `ruler_logs` jsonb 結構
   - 或者直接在 `insforgeAdapter.ts` 中同時寫入兩張表

2. **在 PWA 啟用 InsForge 讀取**
   - 把 `src/lib/insforge/_deprecated/` 的代碼恢復並整合到 `dataAdapter`
   - 或者新增一個簡單的 `fetch` 讀取 `ruler_logs` API
   - 需要處理認證：PWA 目前沒有 JWT，需要 Anonymous Key 或臨時方案

#### 方向 B：打通認證 + 統一數據模型（長期方案）
這是正確但工作量大的方案：

1. **認證整合**：PWA 改用 InsForge Auth（或至少產生一致的 user_id）
2. **統一表結構**：Bot 和 PWA 共用 `ruler_logs` 表
3. **LINE 綁定**：用戶在 PWA 輸入綁定碼或掃 QR，將 `line_user_id` 關聯到 `auth.users.id`
4. **數據遷移**：將現有 localStorage 數據遷移到 InsForge

#### 建議
如果目標是「快速驗證聯動」，**先走方向 A**：
- 讓 Bot 同時寫入 `ruler_sessions`（現有）和 `ruler_logs`（PWA 可讀）
- PWA 用 Anonymous Key 讀取 `ruler_logs`（繞過 RLS 或用 public policy）
- 這樣歷史頁面就能看到 LINE 的記錄

### 🟢 P2 — 增強級

#### 4.3 主動推送（Proactive AI）
- [ ] Edge Function `daily-nudge` + InsForge Schedule（cron）
- [ ] 48 小時未記錄 → 溫柔提醒
- [ ] 連續高壓 → 推送呼吸練習

#### 4.4 測試補齊
- [ ] Bot Server 目前 112 tests passed，保持即可
- [ ] 前端 330 tests passed

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
| Bot 資料庫適配器 | `server/src/db/insforgeAdapter.ts` |
| PWA 資料適配器（localStorage） | `src/adapters/storage.ts` |
| PWA InsForge 適配器（deprecated） | `src/lib/insforge/_deprecated/` |
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

### 已部署 Secrets（InsForge Edge Functions）
- `GOOGLE_API_KEY` — Gemini API
- `API_KEY`, `ANON_KEY`, `JWT_SECRET` — InsForge 系統

### Zeabur Bot Server 環境變數（需確認）
- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`
- `DATABASE_URL`（應指向 InsForge PostgreSQL）

### 缺少 Secrets
- `SERVICE_ROLE_KEY` — InsForge Service Role（如需後端繞過 RLS 寫入）

---

## 七、快速驗證指令

```bash
# 確認 Bot Server 健康
curl -s https://imxin-bot.zeabur.app/health

# 確認 Edge Functions
curl -s https://b88egxiz.functions.insforge.app/coach

# 查詢 Bot 數據（用 MCP run-raw-sql）
SELECT COUNT(*) FROM bot_users;
SELECT COUNT(*) FROM ruler_sessions;
SELECT COUNT(*) FROM chat_messages;

# 查詢 PWA 數據（用 MCP run-raw-sql）
SELECT COUNT(*) FROM ruler_logs;
SELECT COUNT(*) FROM profiles;
```

---

> **交接日期**：2026-05-11
> 
> **最後 Commit**：`c7d6544` fix: RULER 流程結束後說謝謝不再自動重開第一步
