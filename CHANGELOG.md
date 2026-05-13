# 今心 ImXin 更新日誌

> 所有重要變更、架構升級與里程碑記錄。

---

## [4.2.2] - 2026-05-13 — Stitch UI 發佈候選 + 封閉內測整理

### PM 狀態

- **發佈判斷**：可合併後做 1-3 人封閉內測；不建議公開宣傳或大量開放。
- **發佈候選**：PR #20 `codex/stitch-ui-release-clean-20260513`，乾淨接在 `origin/main` 後，只包含 UI/Coach/SOS 相關變更。

### 已完成

- **Stitch / Luminous Morandi 視覺整合**
  - 套用新視覺語言到 Coach、打卡、歷史時間軸、成長洞察、成就頁與全域導覽。
  - Coach 採 Stitch 聊天畫布、快速回覆、LINE 綁定卡、固定輸入欄與底部導覽。
  - 手機底部導覽與主要卡片已做瀏覽器 smoke，避免選中狀態與輸入列在小螢幕失焦。
- **Coach 安全與信任修正**
  - 移除首屏「讀到睡眠資料」的暗示，避免未授權資料來源造成隱私信任風險。
  - Coach SOS 按鈕改為明確顯示 `SOS`。
  - Meta-Moment 覆蓋層補回安心專線 `1925` 與生命線 `1909`。
- **發佈衛生**
  - 已排除 schedule commit、`memory.md` 與 Stitch 原始匯出素材。
  - 原本混有 `feat(schedule)` 的本地分支不作為今晚發佈來源；今晚只使用乾淨分支 / PR #20。

### 驗證

- 乾淨 release worktree：
  - `git diff --check` ✅
  - `./node_modules/.bin/tsc --noEmit` ✅
  - `npm run test:run -- src/pages/CoachPage.test.tsx src/components/coach/ChatInput.test.tsx` ✅ 20 tests / 2 files
  - `npm run build` ✅
- 原工作區補驗：
  - `npm run test:run` ✅ 338 tests / 32 files
  - `npm run test:e2e` ✅ 4 Playwright tests
  - `cd server && npm run test:run` ✅ 133 tests / 10 files
  - `cd server && npm run build` ✅

### 剩餘風險

- 真 LINE 帳號完整 E2E 仍未跑：LINE 輸入「綁定」→ PWA 貼碼 → LINE 完成 RULER → Coach/週報讀到資料。
- Production PWA 目前仍需合併 PR #20 並重新部署；部署後要確認線上 asset hash 已更新。
- 認證 / LocalStorage → InsForge 完整遷移與主動推送仍不可作為本次公開能力宣傳。

---

## [4.2.1] - 2026-05-13 — Agentic Coach 內測收尾 + LINE/PWA 生產鏈路驗證

### PM 狀態

- **內測判斷**：黃燈偏綠，可進入 1-3 人封閉內測；暫不建議公開宣傳或大量開放。
- **內測目標**：驗證真實使用者是否能順利完成 LINE 綁定、RULER 情緒紀錄、AI Coach 對話與 Meta-Moment SOS。

### 已完成

- **Agentic Coach 生產鏈路收斂**
  - `coach`、`weekly-report`、`achievement-checker` 三個 InsForge Edge Functions 已重新部署。
  - 危機語句會回 `skillInvoked: "MetaMomentSkill"` 並觸發 `action: "open_sos"`。
  - 明確「請幫我記錄 + 情緒 + 強度」時，Edge Function 會確定寫入 `agent_ruler_logs`，週報與成就可讀到。
- **LINE Bot / PWA 橋接**
  - 新增並套用 `008_agentic_coach_bridge.sql`：`line_user_bindings`、`agent_ruler_logs`。
  - 兩張橋接表已啟用 RLS，採 service role only 存取。
  - Production PWA 的 LINE 綁定 UI 已能呼叫 production Bot Server `/api/line-binding/claim`。
- **Bot Server 生產部署**
  - Bot Server 已部署至 `https://imxin-bot.zeabur.app`，health 顯示 adapter 為 `insforge`。
  - `/webhook` 已補 LINE 簽名保護：缺少或無效 `x-line-signature` 回 401。
  - 使用 Zeabur container 內 `LINE_CHANNEL_SECRET` 計算有效簽名，production 空 events webhook 回 200 / `OK`，未輸出密鑰。
- **PWA 生產部署**
  - PWA 已部署至 `https://today-mood.zeabur.app`。
  - Production Coach 頁已確認有 `LINE Bot 同步`、`LINE 綁定碼` 與 Meta-Moment 快捷入口。

### 驗證

- 前端：
  - `npx tsc --noEmit` ✅
  - `npm run test:run` ✅ 336 tests / 32 files
  - `npm run build` ✅（仍有既有 circular chunk warning）
  - `npm run lint` ✅ 0 errors / 299 warnings
- 後端：
  - `cd server && npm run test:run` ✅ 117 tests / 9 files
  - `cd server && npm run build` ✅
  - `cd server && npm run test:run -- src/index.test.ts --reporter=verbose` ✅ 10 tests
- 線上 smoke：
  - Coach crisis → `open_sos` ✅
  - Coach 明確記錄 → 週報/成就讀取 ✅
  - PWA LINE 綁定 UI → Bot Server claim ✅
  - Bot webhook 無簽名 → 401 ✅
  - Bot webhook 有效簽名空事件 → 200 ✅

### 剩餘風險

- 真 LINE 使用者訊息尚未完整 E2E：LINE 輸入「綁定」→ PWA 貼碼 → LINE 完成 RULER → Coach/週報讀到資料。
- `main` 仍落後 `origin/main` 2 commits，且工作樹尚未整理成 commit/PR；不要在髒工作樹直接 pull。
- 本機沒有 `deno`，Edge Functions 本地 `deno check` 未跑，主要依賴線上 smoke。
- 既有 ESLint warnings 與 Vite circular chunk warning 仍需另排技術債整理。

---

## [4.2.0] - 2026-05-12 — Agentic AI 工具升級 + Edge Functions 擴展

### 🎯 重大變更

- **Agentic AI 能力擴展**：從單一 `coach` Edge Function 擴展為三大 Agentic 工具矩陣
  - `coach`：AI 情緒教練（4 Tools + Session 持久化 + Meta-Moment 危機協議）
  - `weekly-report`：週報生成（讀取 `ruler_logs` 分析象限分佈與趨勢）
  - `achievement-checker`：成就檢查（讀取 `ruler_logs` + `streaks`，自動解鎖成就）
- **前端改呼叫 Edge Function**：`AIService.generateWeeklyInsight` 與 `HabitService.updateProgress` 改為優先呼叫 Edge Function，失敗時本地 fallback
- **部署平台統一**：放棄 Fly.io 路徑，Bot Server 統一部署至 Zeabur（與 PWA 同平台）
- **設計系統文件化**：新增 `DESIGN.md`（402 行，58 color tokens + 8 typography + 20 component specs）
- **方案規格書**：新增 `今心_ImXin_方案規格.html`（含 5 頁實機截圖）

### ✨ 新增功能

- **📊 週報 Edge Function**
  - 讀取用戶近 7 天 `ruler_logs`
  - 計算象限分佈、平均強度、最頻繁情緒
  - 回傳個人化洞察（summary + patterns + suggestedAction + quote + colorTheory）
- **🏆 成就檢查 Edge Function**
  - 讀取 `ruler_logs` 計算統計（totalLogs / fullFlowCount / uniqueEmotions / currentStreak）
  - 與 `achievement_records` 比對，自動插入新解鎖成就
  - 5 條規則：first_log / streak_3 / streak_7 / emotions_10 / full_ruler_5
- **🔧 前端適配**
  - `GrowthDashboard` 傳遞 `userId` 給週報 API
  - `HabitContext` 傳遞 `userId` 給成就更新
  - 本地用戶（`test-user` 或 `local-*`）自動 fallback 到本地計算，無需網路

### 🔧 技術棧擴展

| 層級 | 新增/變更 |
|------|----------|
| Edge Function | `weekly-report.ts`、`achievement-checker.ts`（Deno runtime） |
| 資料庫 | `streaks` 表 RLS 策略修復（新增 `Users can upsert own streaks`） |
| 前端 API | `AIService.ts`、`HabitService.ts` 新增 Edge Function 呼叫路徑 |
| 部署 | `server/zeabur.toml` 成為 Bot Server 主要配置，移除 Fly.io 優先級 |
| 文件 | `DESIGN.md`、`今心_ImXin_方案規格.html`、`CLAUDE_CODE_HANDOFF.md` |

### 📁 新增/修改檔案

```
server/insforge/functions/weekly-report.ts       # 週報生成 Edge Function
server/insforge/functions/achievement-checker.ts # 成就檢查 Edge Function
src/services/AIService.ts                        # 週報改呼叫 Edge Function
src/services/HabitService.ts                     # 成就同步到 Edge Function
src/components/GrowthDashboard.tsx               # 傳遞 userId
src/services/HabitContext.tsx                    # 傳遞 userId
DESIGN.md                                        # 設計系統文件
今心_ImXin_方案規格.html                          # 產品規格書（含截圖）
CLAUDE_CODE_HANDOFF.md                           # Claude Code 交接文件
Zeabur_Bot_Server_部署需求.md                     # Bot Server 部署技術規格
```

### 🧪 測試

- 總測試數：**330 / 330 通過**（前端）+ **52 / 52 通過**（後端，1 文件 dotenv 忽略）
- Build：✅ 成功
- TypeScript：✅ 零錯誤

### 🚀 部署狀態

| 服務 | URL | 狀態 |
|------|-----|------|
| Edge Function — Coach | `https://b88egxiz.functions.insforge.app/coach` | ✅ 已上線 |
| Edge Function — Weekly | `https://b88egxiz.functions.insforge.app/weekly-report` | ✅ 已部署 |
| Edge Function — Achievement | `https://b88egxiz.functions.insforge.app/achievement-checker` | ✅ 已部署 |
| PWA 前端 | `https://today-mood.zeabur.app` | ✅ 已上線 |
| Bot Server | Zeabur（`server/`） | ⏳ 待部署 |

### ⚠️ 已知限制

- 數據遷移（LocalStorage → InsForge）尚未完成，需等待認證架構整合
- 主動推送（Proactive AI / Cron）尚未實現
- Bot Server 尚未部署至 Zeabur

---

## [4.1.0] - 2026-05-11 — InsForge 雲端同步 + AI 教練記憶

### 🎯 重大變更

- **三層隱私模型正式落地**：
  - Tier 1（裝置）：原始日記內容、身體掃描、表達內容 — 永不上雲
  - Tier 2（雲端元數據）：象限標籤、需求標籤、強度分數 — 同步至 InsForge `coach_context` 供 AI 教練記憶
  - Tier 3（可選完整備份）：用戶可主動選擇加密全量備份
- **AI 教練獲得持久記憶**：Edge Function 在生成回應前讀取 `coach_context`，能參考用戶連續記錄天數、常見情緒象限、核心需求與平均強度，提供真正個人化的陪伴。
- **歷史數據遷移**：已使用本地記錄的用戶，首次登入後可一鍵將歷史元數據遷移至雲端。

### ✨ 新增功能

- **🔐 帳號系統 + 隱私同意**
  - 註冊流程新增兩項勾選框：
    - （必填）雲端備份同意書 — 數據僅用於 AI 教練，不作商業用途
    - （選填）AI 教練主動關懷 — 允許系統根據情緒模式主動推送關心訊息
  - Guest 登入支援（自動生成匿名帳號）
  - `AuthContext` 同步 `coachOptIn` 狀態至 `coach_context`
- **☁️ localStorage → InsForge 遷移**
  - 自動偵測未遷移的本地記錄
  - 增量提取 Tier-2 元數據（quadrants、needs、intensity、streak）
  - `MigrationProgress` 全螢幕進度 UI（帶錯誤降級）
  - 遷移後保留本地原始數據，可隨時重刷
- **🧠 AI 教練記憶注入**
  - Edge Function `fetchCoachContext()` 讀取用戶情緒輪廓
  - `buildContextSummary()` 將元數據轉為中文摘要注入 Gemini system prompt
  - 無輪廓時 graceful fallback（不影響對話）
- **📊 即時元數據同步**
  - 每次完成 RULER 記錄後，背景同步最新元數據至 `coach_context`
  - `extractMetadataFromLog()` 純函數式提取，測試友好

### 🔧 技術棧擴展

| 層級 | 新增技術 |
|------|----------|
| 雲端資料庫 | InsForge PostgreSQL + `coach_context` 表 |
| Edge Function | `coach` function（Deno runtime，已部署） |
| 隱私安全 | Row Level Security（RLS）+ service_role 策略 |
| 前端狀態 | `AuthContext` coachOptIn 同步 |

### 📁 新增/修改檔案

```
server/insforge/schema/007_coach_context.sql    # coach_context 資料表 + RLS
src/lib/insforge/coachContext.ts                # CRUD + 元數據提取
src/lib/insforge/localStorageMigration.ts       # 遷移邏輯
src/components/MigrationProgress.tsx            # 遷移進度 UI
src/components/AuthModal.tsx                    # 隱私同意勾選框
src/services/AuthContext.tsx                    # coachOptIn 狀態管理
src/App.tsx                                     # 自動觸發遷移
src/adapters/storage.ts                         # saveLog 後背景同步
server/insforge/functions/coach-simple.ts       # 讀取 coach_context 注入 prompt
```

### 🧪 測試

- 新增 **61** 個單元測試（frontend + backend）
- 總測試數：**326 / 326 通過**（29 test files）+ **110 / 110 通過**（9 test files）
- Build：✅ 成功
- TypeScript：✅ 零錯誤

### 🔒 安全與隱私

- `coach_context` 啟用 RLS，用戶只能讀寫自己的資料
- Edge Function 使用 `SERVICE_ROLE_KEY` 繞過 RLS（內部服務調用）
- 原始日記內容始終留在 AES-256-GCM 加密的 localStorage / IndexedDB
- 加密失敗時不再靜默降級為明文儲存（已移除危險 fallback）

### 🚀 部署狀態

| 服務 | URL | 狀態 |
|------|-----|------|
| Edge Function API | `https://b88egxiz.functions.insforge.app/coach` | ✅ 已部署（含記憶注入） |
| InsForge 資料庫 | `coach_context` 表 | ✅ 已建立 |

---

## [4.0.0] - 2026-05-11 — Agentic AI 情緒教練

### 🎯 重大變更

- **Agentic AI 轉型**：從「被動打卡工具」升級為「主動 AI 情緒教練」，導入 Google ADK JS v1.0.0（後採用 REST API fallback）。
- **雙軌對話架構**：APP 內對話介面 + 已部署 Edge Function API，未來可擴展至 LINE Bot。
- **Meta-Moment 緊急協助**：基於 Marc Brackett《Dealing with Feeling》的 4 步驟 SOS 流程（感知 → 暫停 → 看見最好自己 → 策略行動）。

### ✨ 新增功能

- **🧠 AI 情緒教練對話**
  - 獨立 `/coach` 頁面，全螢幕聊天介面
  - 基於 RULER 框架的系統提示（Recognize / Understand / Label / Express / Regulate）
  - 讀取使用者歷史情緒日誌，提供個人化回應
  - 模型：`gemini-3.1-flash-lite`
- **🆘 Meta-Moment SOS 緊急協助**
  - 紅色浮動 SOS 按鈕
  - 4 步驟引導覆蓋層：身體掃描 → 4-7-8 呼吸動畫 → 最佳自我輸入 → 策略選擇
  - 呼吸動畫：圓形縮放 + 即時倒數計時
- **💬 對話體驗優化**
  - 打字指示器（「教練正在思考...」）
  - 歡迎卡片（首次使用引導 + 建議提示）
  - 錯誤處理 + 重試按鈕（網路 / API / 超時）
  - LocalStorage 聊天歷史持久化
  - 浮動 FAB 快速入口（CoachFAB）
- **♿ Accessibility**
  - ARIA 標籤（SOS、輸入框、送出按鈕）
  - 呼吸動畫 `aria-live` 播報
  - MetaMoment 覆蓋層 `role="dialog"` + Escape 鍵關閉
  - 全鍵盤可操作

### 🔧 技術棧擴展

| 層級 | 新增技術 |
|------|----------|
| AI Agent | Google Gemini REST API (`gemini-3.1-flash-lite`) |
| Edge Function | InsForge Functions (Deno runtime) |
| 前端狀態 | LocalStorage 持久化 |
| 測試 | 新增 24 個 component tests |

### 📁 新增檔案

```
src/pages/CoachPage.tsx                  # 教練主頁面
src/components/coach/
  ├── ChatBubble.tsx + .test.tsx         # 訊息氣泡
  ├── ChatInput.tsx + .test.tsx          # 輸入 + SOS 按鈕
  ├── MetaMomentOverlay.tsx              # 4 步驟 SOS 覆蓋層
  ├── BreathingAnimation.tsx             # 呼吸動畫
  ├── TypingIndicator.tsx + .test.tsx    # 打字指示器
  ├── WelcomeCard.tsx + .test.tsx        # 歡迎卡片
  └── CoachFAB.tsx                       # 浮動快速入口
src/lib/adk/
  ├── client.ts                          # API client
  ├── types.ts                           # TypeScript 型別
  └── storage.ts                         # LocalStorage 助手
server/insforge/functions/coach-simple.ts # 已部署 Edge Function
server/insforge/agents/
  ├── emotionCoach.ts                    # 主 Agent 定義
  ├── runner.ts                          # InMemoryRunner 包裝
  ├── skills/metaMoment.ts               # MetaMoment Skill
  └── tools/rulerData.ts                 # DB 查詢 Tool
```

### 🧪 測試

- 新增 **24** 個 component tests（ChatBubble、ChatInput、TypingIndicator、WelcomeCard、CoachPage）
- 總測試數：**265 / 265 通過**（20 test files）
- Build：✅ 成功
- TypeScript：✅ 零錯誤

### 🚀 部署狀態

| 服務 | URL | 狀態 |
|------|-----|------|
| Edge Function API | `https://b88egxiz.functions.insforge.app/coach` | ✅ 已部署 |
| 前端 PWA | `https://<your-domain>/#coach` | ✅ 就緒 |

### ⚠️ 已知限制

- ADK JS 無法在 InsForge Deno runtime 部署（bundler 不支援本地相對匯入），已改用純 REST API 實現
- `InMemoryRunner` session 不持久（Edge Function 無狀態），未來需遷移至持久 session store
- E2E 測試框架（Playwright / Cypress）尚未建立

---

## [3.0.0] - 2026-04-21 — Bot-First 架構重構

### 🎯 重大變更

- **Bot-First 架構**：項目從「純前端 PWA」全面轉型為「LINE Bot 為核心入口，PWA 為數據儀表盤」的架構。
- **新增後端伺服器** (`server/`)：完整的 LINE Bot 後端，基於 Express + TypeScript。
- **RULER 對話式狀態機**：實現 `recognize → understand → label → express → regulate → summary` 六步對話流程，用戶在 LINE 上即可完成完整覺察練習。

### ✨ 新增功能

- **LINE Bot 即時陪伴**
  - 加入好友自動歡迎訊息
  - 文字消息觸發情緒覺察流程
  - Quick Reply 按鈕支持（身體部位、情緒詞、需求、調節技巧）
  - 全局指令：`幫助`、`週報`、`結束練習`
- **用戶會話管理**
  - 30 分鐘會話超時機制
  - 每 5 分鐘自動清理過期會話
  - 用戶狀態持久化至內存（開發）/ PostgreSQL（生產 Schema 就緒）
- **數據持久化層**
  - 內存數據庫適配器（`memoryAdapter.ts`）：零配置開箱即用
  - PostgreSQL/Supabase Schema（`schema.sql`）：`bot_users`、`ruler_sessions`、`chat_messages` 三表結構
  - 連續記錄天數（Streak）自動計算
- **健康檢查端點**
  - `GET /` — 服務狀態（含 live/demo 模式標識）
  - `GET /health` — 健康檢查（含 uptime）
  - `POST /webhook` — LINE Webhook 接收端（帶簽名驗證）
- **端到端測試腳本** (`test-bot.cjs`)：模擬完整 RULER 流程的自動化測試

### 🔧 技術棧擴展

| 層級 | 新增技術 |
|------|----------|
| 後端框架 | Express 5.x |
| LINE SDK | @line/bot-sdk 9.x |
| 開發工具 | tsx 4.x（熱重載） |
| 數據庫 | PostgreSQL Schema（生產就緒） |

### 📝 文檔

- 新增 [`server/README.md`](./server/README.md)：後端完整文檔（開發、部署、LINE Bot 設置、測試）
- 新增 [`BOT_DEPLOYMENT.md`](./BOT_DEPLOYMENT.md)：Bot-First 架構決策說明與五分鐘快速開始
- 新增 [`CHANGELOG.md`](./CHANGELOG.md)：本文件

### 🔄 PWA 角色調整

- PWA 從「獨立完整應用」調整為「數據儀表盤與深度視圖」
- 核心情緒覺察流程遷移至 LINE Bot
- PWA 保留：歷史回顧、情緒熱力圖、成就展示、數據導出、主題設置

---

## [2.1] - 2026-04-21

### 維護更新

- 更新 `AGENTS.md` 以準確反映項目結構
- 添加後端架構規劃章節
- 更新測試覆蓋數據（165 測試 / 94.74%）
- 補充 Capacitor Android 構建流程
- 更新所有組件和服務列表

---

## [2.0] - 2026-03-01 — 100 分滿分優化版

### 新增功能

- 優化至 Lighthouse 100/100 分
- Error Boundary 錯誤邊界
- 完整可訪問性支持（A11y）
- 主題切換（Dark / Light / System）
- 路由懶加載
- 時間軸分頁
- 多格式導出（CSV / JSON / Markdown / TXT）
- Web Speech API 語音引導
- 165 個單元測試
- Bundle 優化（Terser）
- AI 聊天助手
- 親子模式
- SOS 緊急模式
- 快速打卡

---

## [1.0] — 初始版本

### 核心功能

- RULER 五步情緒覺察練習
- 100+ 繁體中文情緒詞彙
- AI 洞察分析
- 成就系統
- PWA 離線支持

---

## 版本命名約定

| 版本號變化 | 含義 |
|-----------|------|
| `MAJOR` (X.0.0) | 重大架構變更或破壞性改動 |
| `MINOR` (x.Y.0) | 新功能發布 |
| `PATCH` (x.y.Z) | Bug 修復與優化 |

---

**今心團隊** | 打造平穩心靈 🌿
