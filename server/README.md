# 今心 ImXin Bot Server

> LINE Bot 後端服務 — AI 情緒陪伴 Agent

這是「今心 ImXin」項目的 LINE Bot 後端，使用今心自己的四步對話式狀態機，為焦慮的父母提供即時情緒覺察陪伴。

---

## 目錄

- [項目簡介](#項目簡介)
- [技術棧](#技術棧)
- [本地開發](#本地開發)
- [環境變量](#環境變量)
- [LINE Bot 設置](#line-bot-設置)
- [部署選項](#部署選項)
- [Webhook 配置](#webhook-配置)
- [測試](#測試)
- [API 端點](#api-端點)
- [數據庫 Schema](#數據庫-schema)
- [項目結構](#項目結構)

---

## 項目簡介

今心 Bot 是一個基於對話的情緒覺察引導系統。用戶在 LINE 上與 Bot 對話，即可完成完整的知心四式情緒覺察練習：

1. **看見** — 掃描身體感受與此刻狀態
2. **命名** — 從 100+ 情緒詞彙中精確靠近感受
3. **安放** — 看見情境、需求與內在部分，並用情緒碎紙機安全表達
4. **回應** — 呼吸引導 / 5-4-3-2-1 接地 / 正念短引導

Bot 會記住每位用戶的對話上下文（30 分鐘超時），並支持週報統計與連續記錄追蹤。

---

## 技術棧

| 類別 | 技術 | 版本 |
|------|------|------|
| **運行時** | Node.js | 18+ |
| **語言** | TypeScript | 5.9+ |
| **框架** | Express | 5.x |
| **LINE SDK** | @line/bot-sdk | 9.x |
| **開發工具** | tsx | 4.x |
| **數據存儲** | 內存適配器（開發）/ PostgreSQL（生產） | — |

---

## 本地開發

### 前置要求

- Node.js 18 或更高版本
- npm 或 pnpm

### 安裝步驟

```bash
# 1. 進入 server 目錄
cd server

# 2. 安裝依賴
npm install

# 3. 複製環境變量模板
cp .env.example .env

# 4. 編輯 .env，填入你的 LINE Bot 憑證（見下文「LINE Bot 設置」章節）
#    若暫時沒有憑證，可直接進入 Demo 模式運行

# 5. 啟動開發伺服器（熱重載）
npm run dev
```

預期輸出：

```
╔══════════════════════════════════════════════════════════╗
║  今心 ImXin Bot Server                                   ║
║  版本: 1.0.0                                             ║
║  端口: 3000                                              ║
║  模式: demo                                              ║
╠══════════════════════════════════════════════════════════╣
║  端點:                                                   ║
║    GET  /        — 健康檢查                              ║
║    GET  /health  — 健康檢查                              ║
║    POST /webhook — LINE Bot Webhook                      ║
╚══════════════════════════════════════════════════════════╝
```

### 可用腳本

| 命令 | 說明 |
|------|------|
| `npm run dev` | 開發模式（tsx watch，熱重載） |
| `npm run build` | 編譯 TypeScript 到 `dist/` |
| `npm start` | 運行編譯後的代碼（生產） |
| `npm run lint` | ESLint 檢查 |

---

## 環境變量

複製 `.env.example` 為 `.env` 並按需配置：

```bash
# LINE Bot 配置
# 從 LINE Developers Console 獲取: https://developers.line.biz/
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token_here
LINE_CHANNEL_SECRET=your_channel_secret_here

# 服務端口
PORT=3000
```

### 變量說明

| 變量名 | 必填 | 說明 |
|--------|------|------|
| `LINE_CHANNEL_ACCESS_TOKEN` | 生產必填 | LINE Messaging API 的 Channel Access Token |
| `LINE_CHANNEL_SECRET` | 生產必填 | LINE Messaging API 的 Channel Secret |
| `PORT` | 否 | 服務監聽端口，默認 `3000` |

> 💡 **Demo 模式**：若未設置 `LINE_CHANNEL_ACCESS_TOKEN` 或 `LINE_CHANNEL_SECRET`，Bot 會以 Demo 模式啟動。此時 Webhook 仍可接收請求，但不會實際發送 LINE 消息，僅在控制台打印回覆內容。

---

## LINE Bot 設置

以下是從零開始創建 LINE Bot 的完整步驟。

### 步驟 1：註冊 LINE Developers 帳號

1. 訪問 [https://developers.line.biz/](https://developers.line.biz/)
2. 點擊右上角「Log in」，使用你的 LINE 帳號登入
3. 若沒有開發者帳號，按提示完成註冊

### 步驟 2：創建 Provider

1. 登入後進入 [Console](https://developers.line.biz/console/)
2. 點擊「Create」→ 選擇「Create a new provider」
3. 輸入 Provider 名稱，例如：`今心-開發團隊`
4. 點擊「Create」

### 步驟 3：創建 Messaging API Channel

1. 在 Provider 頁面，點擊「Create a new channel」
2. 選擇「Messaging API」
3. 填寫基本資訊：
   - **Channel name**：`今心 ImXin`（用戶會看到此名稱）
   - **Channel description**：`AI 情緒陪伴 Bot`
   - **Category**：`Lifestyle` → `Health & Fitness`
   - **Subcategory**：`Mental health`
   - **Email address**：你的聯繫信箱
4. 勾選同意條款，點擊「Create」

### 步驟 4：獲取 Channel 憑證

1. 進入剛創建的 Channel 設定頁面
2. 點擊左側「Basic settings」
3. 找到 **Channel secret** → 點擊「Copy」
   - 這是 `LINE_CHANNEL_SECRET` 的值
4. 點擊左側「Messaging API」
5. 找到 **Channel access token** 區塊
6. 點擊「Issue」生成 **Channel access token (long-lived)**
7. 複製生成的 Token
   - 這是 `LINE_CHANNEL_ACCESS_TOKEN` 的值

### 步驟 5：配置 Webhook URL

1. 在「Messaging API」頁面，找到 **Webhook settings**
2. 將「Use webhook」切換為 **Enabled**
3. 在「Webhook URL」欄位填入你的服務器地址：
   ```
   https://your-server-domain.com/webhook
   ```
   本地開發時可使用 [ngrok](https://ngrok.com/) 提供臨時 HTTPS URL（見下文「本地開發 Webhook 測試」）
4. 點擊「Update」保存
5. 點擊「Verify」驗證連通性（出現 Success 即表示成功）

### 步驟 6：關閉自動回覆（推薦）

1. 在「Messaging API」頁面，找到 **Auto-reply messages**
2. 將「Auto-reply」設為 **Disabled**
3. 將「Greeting messages」設為 **Disabled**
   （今心 Bot 會自行處理歡迎訊息）

### 步驟 7：將 Bot 加入好友測試

1. 在「Messaging API」頁面，找到 **QR code**
2. 使用 LINE 手機 App 掃描 QR code 加入好友
3. 發送任意訊息開始測試

---

## 部署選項

### 選項 A：Render（推薦新手）

1. 將代碼推送到 GitHub
2. 訪問 [https://dashboard.render.com/](https://dashboard.render.com/)
3. 點擊「New +」→「Web Service」
4. 綁定你的 GitHub 倉庫
5. 配置：
   - **Name**：`imxin-bot`
   - **Runtime**：`Node`
   - **Build Command**：`npm install && npm run build`
   - **Start Command**：`npm start`
   - **Root Directory**：`server`
6. 在「Environment」中添加：
   - `LINE_CHANNEL_ACCESS_TOKEN`
   - `LINE_CHANNEL_SECRET`
   - `PORT`（Render 會自動設置，通常為 `10000`）
7. 點擊「Create Web Service」
8. 部署完成後，複製服務 URL（如 `https://imxin-bot.onrender.com`）
9. 回到 LINE Developers Console，將 Webhook URL 設為 `https://imxin-bot.onrender.com/webhook`

### 選項 B：Fly.io

```bash
# 1. 安裝 Fly CLI
winget install Fly.io.flyctl        # Windows
brew install flyctl                  # macOS
curl -L https://fly.io/install.sh | sh  # Linux

# 2. 登入
fly auth login

# 3. 進入 server 目錄
cd server

# 4. 初始化應用
fly launch --name imxin-bot --region hkg

# 5. 設置機密環境變量
fly secrets set LINE_CHANNEL_ACCESS_TOKEN="your_token"
fly secrets set LINE_CHANNEL_SECRET="your_secret"

# 6. 部署
fly deploy

# 7. 查看狀態
fly status
```

> Webhook URL 將為 `https://imxin-bot.fly.dev/webhook`

### 選項 C：Zeabur

1. 將代碼推送到 GitHub
2. 訪問 [https://zeabur.com/](https://zeabur.com/)
3. 創建新項目，綁定 GitHub 倉庫
4. 服務類型選擇「Node.js」
5. 在「Environment Variables」中添加：
   - `LINE_CHANNEL_ACCESS_TOKEN`
   - `LINE_CHANNEL_SECRET`
6. 部署後複製域名，設置 Webhook URL

### 選項 D：Docker 部署

```bash
# 1. 構建映像
cd server
docker build -t imxin-bot .

# 2. 運行容器
docker run -d \
  --name imxin-bot \
  -p 3000:3000 \
  -e LINE_CHANNEL_ACCESS_TOKEN="your_token" \
  -e LINE_CHANNEL_SECRET="your_secret" \
  -e PORT=3000 \
  imxin-bot
```

`Dockerfile` 範例（若尚無此文件，可於 `server/` 目錄創建）：

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Webhook 配置

### 本地開發 Webhook 測試（ngrok）

由於 LINE Webhook 要求 HTTPS 地址，本地開發時可使用 ngrok 轉發：

```bash
# 1. 安裝 ngrok
#    Windows: winget install ngrok
#    macOS: brew install ngrok
#    或從 https://ngrok.com/download 下載

# 2. 註冊並獲取 authtoken（免費）
ngrok config add-authtoken YOUR_AUTHTOKEN

# 3. 啟動隧道（轉發本地 3000 端口）
ngrok http 3000

# 4. 複製 HTTPS URL（如 https://abc123.ngrok-free.app）
# 5. 在 LINE Developers Console 設置 Webhook URL 為：
#    https://abc123.ngrok-free.app/webhook
```

### Webhook 簽名驗證

Bot 已內建 LINE 簽名驗證。當 `LINE_CHANNEL_SECRET` 配置正確時，所有 `/webhook` 請求都會驗證 `x-line-signature` 標頭，防止偽造請求。

---

## 測試

### 端到端測試腳本

項目包含 `test-bot.cjs`，可模擬完整的情緒覺察流程：

```bash
# 1. 確保 Bot 伺服器正在運行
npm run dev

# 2. 在另一個終端執行測試
node test-bot.cjs
```

預期輸出：

```
=== 今心 Bot 端到端測試 ===

[用戶] 我今天很焦慮
[HTTP] 200

[用戶] 胸口
[HTTP] 200

[用戶] 焦慮
[HTTP] 200

...（後續步驟）...

=== 測試完成 ===
```

> 測試過程中請觀察運行 `npm run dev` 的終端，查看 Bot 的完整回覆內容。

### 手動測試命令

| 用戶輸入 | Bot 行為 |
|----------|----------|
| 任意文字 | 開始新的知心四式覺察練習 |
| `幫助` / `help` | 顯示指令說明 |
| `週報` / `weekly` | 顯示本週統計 |
| `結束` / `結束練習` | 結束當前練習 |

---

## API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| `GET` | `/` | 服務狀態檢查（含 live/demo 模式標識） |
| `GET` | `/health` | 健康檢查（含 uptime） |
| `POST` | `/webhook` | LINE Bot Webhook 接收端 |

### 狀態檢查範例

```bash
curl http://localhost:3000/
```

響應：

```json
{
  "status": "ok",
  "service": "今心 ImXin Bot Server",
  "version": "1.0.0",
  "mode": "live"
}
```

---

## 數據庫 Schema

當前使用內存適配器（`src/db/memoryAdapter.ts`）作為開發存儲。生產環境可切換至 PostgreSQL / Supabase，Schema 定義見 `src/db/schema.sql`：

| 表名 | 用途 |
|------|------|
| `bot_users` | 用戶基本資訊與統計 |
| `ruler_sessions` | 每次覺察練習的完整記錄 |
| `chat_messages` | 對話歷史 |

運行 Schema：

```bash
# 使用 psql
psql -d your_database -f src/db/schema.sql

# 或使用 Supabase SQL Editor 直接粘貼執行
```

---

## 項目結構

```
server/
├── src/
│   ├── index.ts           # Express 入口 + Webhook 路由
│   ├── rulerBot.ts        # 知心四式對話式狀態機核心
│   ├── types.ts           # TypeScript 類型定義
│   ├── emotionData.ts     # 100+ 情緒詞彙與需求映射
│   └── db/
│       ├── schema.sql     # PostgreSQL/Supabase Schema
│       └── memoryAdapter.ts  # 內存數據適配器（開發用）
├── dist/                  # TypeScript 編譯輸出
├── .env.example           # 環境變量模板
├── test-bot.cjs           # 端到端測試腳本
├── package.json
├── tsconfig.json
└── README.md              # 本文件
```

---

## 常見問題

### Q: Demo 模式和 Live 模式有什麼區別？

| | Demo 模式 | Live 模式 |
|--|-----------|-----------|
| 觸發條件 | 未設置 LINE 憑證 | 已設置 LINE 憑證 |
| 消息發送 | 僅控制台打印 | 實際發送至 LINE |
| Webhook | 正常響應 200 | 正常響應並驗證簽名 |
| 用途 | 本地開發、CI 測試 | 生產環境 |

### Q: 如何清空用戶的對話狀態？

Bot 的會話存儲在內存中，重啟服務即可清空所有狀態。單個用戶會話 30 分鐘無互動後也會自動過期。

### Q: 為什麼 LINE 沒有收到回覆？

1. 檢查 `LINE_CHANNEL_ACCESS_TOKEN` 是否正確
2. 檢查 Webhook URL 是否正確配置並已驗證
3. 檢查服務器是否可以從公網訪問
4. 查看服務器日誌是否有錯誤信息
5. 確認「Auto-reply」和「Greeting messages」已關閉

---

## 授權

MIT License — 與今心 ImXin 主項目一致。
