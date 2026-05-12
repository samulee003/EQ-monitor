# 今心 Bot Server — Zeabur 部署需求（給 Claude Code）

## 背景
- 放棄 Fly.io 路徑，Bot Server 統一部署到 **Zeabur**（前端 PWA 已在此）。
- BaaS 使用 **InsForge**（PostgreSQL + Edge Functions）。
- 此文件是給 Claude Code 執行的精確技術規格。

---

## 目標
將 `server/` 目錄的 Node.js Express Bot 後端成功部署到 Zeabur，並與 InsForge 資料庫正確連線。

---

## 1. 資料庫適配器修正（優先）

**問題**：`server/src/db/index.ts` 目前只支援 Supabase 和 Memory，不支援 InsForge。

**需求**：
- 新增 `server/src/db/insforgeAdapter.ts`
- 使用 `@insforge/sdk`（與前端相同）或 `pg` 套件連接 InsForge PostgreSQL
- 實作 `DatabaseAdapter` 接口的所有方法：
  - `getOrCreateUser`
  - `createSession`
  - `updateSession`
  - `completeSession`
  - `saveMessage`
  - `getUserHistory`
  - `getWeeklyStats`
  - `getAllUsers`
  - `getAllSessions`
- `server/src/db/index.ts` 優先判斷 `INSFORGE_URL` + `INSFORGE_SERVICE_KEY`（或 `DATABASE_URL`），若存在則使用 `insforgeAdapter`，否則 fallback 到 `memoryAdapter`

**參考連線資訊**：
```
postgresql://postgres:036fd61640ebc629542456b8e98e788d@b88egxiz.ap-southeast.database.insforge.app:5432/insforge?sslmode=require
```

---

## 2. 環境變數標準化

**在 Zeabur Dashboard > Bot Server Service > Variables 中設定**：

| 變數名 | 說明 | 從哪裡取得 |
|--------|------|-----------|
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Bot 頻道 Token | LINE Developers Console |
| `LINE_CHANNEL_SECRET` | LINE Bot 頻道 Secret | LINE Developers Console |
| `INSFORGE_URL` | InsForge API URL | `https://b88egxiz.ap-southeast.insforge.app` |
| `INSFORGE_SERVICE_KEY` / `DATABASE_URL` | 連線用金鑰 | InsForge Dashboard > Settings > API |
| `GOOGLE_API_KEY` | Gemini API Key | 已有的 `GOOGLE_API_KEY` secret |
| `PORT` | 服務埠口 | Zeabur 自動注入，默認 `3000` |
| `NODE_ENV` | 環境 | `production` |

**注意**：`server/zeabur.toml` 已存在，Root Directory 設為 `server/`。

---

## 3. 部署驗證清單

部署後確認以下端點正常：

```bash
# 1. 健康檢查
curl https://<bot-server-url>/health
# 預期回傳：status: healthy, 包含 uptime / memory / sessionCount

# 2. 服務狀態
curl https://<bot-server-url>/
# 預期回傳：status: ok, mode: live（有 LINE_TOKEN）或 demo（無 TOKEN）

# 3. LINE Webhook（需設定 callback URL）
# POST https://<bot-server-url>/webhook
# 測試：發訊息給 LINE Bot，確認有回應
```

---

## 4. LINE Bot Webhook 設定

部署完成後，到 **LINE Developers Console** > **Messaging API** > **Webhook settings**：
1. Webhook URL 設為 `https://<bot-server-url>/webhook`
2. 開啟 **Use webhook**
3. 驗證 Webhook（Verify）

---

## 5. 已知限制（不影響部署）

- `server/src/agents/` 的完整 ADK 架構（`LlmAgent` + `InMemoryRunner`）**不是**當前優先項，生產 AI Coach 由 InsForge Edge Function `coach` 處理。
- `/api/coach` 路由目前直接呼叫 InsForge Edge Function 即可（見 `server/src/routes/coach.ts`）。

---

## 6. 測試命令

```bash
cd server/
npm install
npm run build      # tsc 必須無錯誤
npm run test:run   # 52 測試通過（1 個 dotenv 文件可忽略）
```

---

## 總結

執行順序：
1. 修正資料庫適配器 → 支援 InsForge
2. 確保 `npm run build` 無錯誤
3. Zeabur Dashboard 新增 Service（Root Directory: `server/`）
4. 設定環境變數
5. 部署並驗證 `/health`
6. LINE Console 設定 Webhook URL
