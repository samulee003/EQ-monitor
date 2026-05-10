# 今心 ImXin 更新日誌

> 所有重要變更、架構升級與里程碑記錄。

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
