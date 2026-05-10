# 今心 ImXin 更新日誌

> 所有重要變更、架構升級與里程碑記錄。

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
