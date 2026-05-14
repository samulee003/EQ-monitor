# 今心 ImXin — Bot-First 架構部署指南

> 🚀 五分鐘內讓你的 LINE Bot 上線運行

---

## 目錄

- [為什麼 Bot-First？](#為什麼-bot-first)
- [PWA 與 Bot 的關係](#pwa-與-bot-的關係)
- [五分鐘快速開始](#五分鐘快速開始)
- [架構決策說明](#架構決策說明)

---

## 為什麼 Bot-First？

「今心 ImXin」從一個純前端的 PWA 情緒覺察工具，演進為 **Bot-First 架構**。這不是技術炫技，而是基於用戶真實處境的設計決策。

### 用戶場景對比

| 場景 | PWA 獨立 App | LINE Bot |
|------|-------------|----------|
| 半夜三點孩子哭鬧，媽媽焦慮到想找人說話 | 需要解鎖手機 → 找 App 圖標 → 等待加載 | 打開 LINE → 直接對話 |
| 上班途中突然情緒低落 | 需要主動「記得」打開 App | 推送通知，一鍵開始 |
| 長輩或不擅長操作 App 的家長 | 學習成本高 | 會用 LINE 就會用 |
| 已經在 LINE 家庭群組裡崩潰 | 需要切換 App | 直接在熟悉的介面獲得支持 |

### 核心洞察

> **情緒急救的黃金時間是 30 秒。任何需要「打開另一個 App」的動作，都在消耗用戶已經瀕臨耗竭的認知資源。**

LINE 在台灣、日本、泰國等市場擁有極高的滲透率，用戶無需下載、無需註冊、無需學習新介面。Bot 就是情緒支持的「最短路径」。

---

## PWA 與 Bot 的關係

在 Bot-First 架構下，PWA 的角色發生了轉變：

```
┌─────────────────────────────────────────────────────────┐
│                     今心 ImXin 架構                      │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐        ┌──────────────────────────┐  │
│  │   LINE Bot   │◄──────►│    後端伺服器 (server/)   │  │
│  │  主要入口     │        │  • RULER 狀態機            │  │
│  │  即時陪伴     │        │  • 對話管理                │  │
│  │  情緒急救     │        │  • 數據持久化              │  │
│  └──────────────┘        └──────────────────────────┘  │
│         ▲                            │                  │
│         │                            ▼                  │
│         │                 ┌──────────────────────────┐  │
│         │                 │  PWA 儀表盤 (前端 App)    │  │
│         │                 │  • 歷史記錄可視化          │  │
│         │                 │  • 情緒熱力圖              │  │
│         │                 │  • 成就系統展示            │  │
│         │                 │  • 深度設置與導出          │  │
│         │                 └──────────────────────────┘  │
│         │                                               │
│         └─────────── 用戶可選切換 ──────────────────────┘
└─────────────────────────────────────────────────────────┘
```

### 角色重新定義

| 層級 | 角色 | 功能 |
|------|------|------|
| **LINE Bot** | 🥇 主要入口 | 即時對話、情緒覺察練習、週報推送、日常打卡 |
| **後端伺服器** | 🧠 大腦 | RULER 狀態機、用戶上下文管理、數據存儲、AI 整合 |
| **PWA 儀表盤** | 📊 數據視圖 | 歷史回顧、深度分析、成就展示、數據導出、主題設置 |

### 數據流

1. 用戶在 LINE 上與 Bot 對話完成覺察練習
2. 後端將完整記錄存入數據庫
3. 用戶可選擇打開 PWA，授權後查看：
   - 歷次覺察的時間軸
   - 情緒熱力圖與趨勢分析
   - 連續記錄成就
   - 導出 PDF/CSV 報告

### PWA 降級為儀表盤的意義

- **不強迫用戶切換**：沒有 PWA 也能完整使用核心功能
- **增強而非替代**：PWA 提供 Bot 無法承載的複雜可視化與數據操作
- **降低維護壓力**：前端無需處理即時對話狀態管理，專注數據呈現
- **未來擴展性**：可輕鬆增加 Web 獨有的功能（如社群分享、專業報告）

---

## 五分鐘快速開始

### 前提

- 已安裝 Node.js 18+
- 有一個 GitHub 帳號
- 有一個 LINE 帳號（用於創建 Bot）

### 第 1 分鐘：啟動後端

```bash
# 進入項目目錄
cd "K:\今心 APP"

# 進入 server 目錄
cd server

# 安裝依賴
npm install

# 以 Demo 模式啟動（無需 LINE 憑證即可測試）
npm run dev
```

看到以下輸出即表示成功：

```
╔══════════════════════════════════════════════════════════╗
║  今心 ImXin Bot Server                                   ║
║  版本: 1.0.0                                             ║
║  端口: 3000                                              ║
║  模式: demo                                              ║
╚══════════════════════════════════════════════════════════╝
```

### 第 2 分鐘：測試對話流程

在另一個終端窗口：

```bash
cd "K:\今心 APP\server"
node test-bot.cjs
```

這會模擬一個用戶完成完整的 RULER 五步覺察練習。

### 第 3 分鐘：創建 LINE Bot

1. 訪問 [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. 使用 LINE 帳號登入
3. 點擊「Create」→「Create a new provider」→ 命名「今心-開發」
4. 點擊「Create a new channel」→ 選擇「Messaging API」
5. 填寫：
   - Channel name：`今心 ImXin`
   - Category：`Lifestyle` → `Health & Fitness`
6. 提交創建

### 第 4 分鐘：配置憑證與 Webhook

1. 在 Channel 頁面，左側「Basic settings」→ 複製 **Channel secret**
2. 左側「Messaging API」→ 點擊「Issue」生成 **Channel access token (long-lived)**
3. 在本地創建 `.env` 文件：

```bash
cd "K:\今心 APP\server"
copy .env.example .env
```

編輯 `.env`：

```env
LINE_CHANNEL_ACCESS_TOKEN=你剛複製的長期令牌
LINE_CHANNEL_SECRET=你剛複製的密鑰
PORT=3000
```

4. 安裝 ngrok 以提供臨時 HTTPS URL：

```bash
# Windows
winget install ngrok

# 註冊並配置（免費）
ngrok config add-authtoken YOUR_TOKEN

# 啟動隧道
ngrok http 3000
```

複製 ngrok 提供的 `https://xxxx.ngrok-free.app` 地址。

5. 回到 LINE Developers Console：
   - 「Messaging API」→「Webhook settings」
   - 開啟「Use webhook」
   - 填入 `https://xxxx.ngrok-free.app/webhook`
   - 點擊「Update」→「Verify」

### 第 5 分鐘：開始對話

1. 在 LINE Developers Console 的「Messaging API」頁面，找到 **QR code**
2. 用手機 LINE App 掃描加入好友
3. 發送任意訊息，例如：「我今天很累」
4. Bot 會引導你完成完整的覺察練習

---

## 架構決策說明

### 1. 為什麼選擇 LINE 而非其他平台？

| 平台 | 優勢 | 劣勢 | 結論 |
|------|------|------|------|
| **LINE** | 台灣/日本滲透率 >90%，用戶基礎龐大，Messaging API 成熟 | 國際擴展有限 | ✅ **首選** |
| WhatsApp | 國際覆蓋廣 | 台灣滲透率低，Business API 門檻高 | 次要選項 |
| Messenger | 與 Facebook 整合 | 台灣年輕用戶流失，隱私疑慮 | 不選 |
| 微信 | 華語用戶覆蓋 | 海外開發者限制多，審核嚴格 | 未來考慮 |

### 2. 為什麼使用對話式狀態機而非 LLM 直接驅動？

| 方案 | 優勢 | 劣勢 | 結論 |
|------|------|------|------|
| **RULER 狀態機** | 可預測、零延遲、無 API 費用、隱私安全、可精確控制每步引導語 | 擴展性受限 | ✅ **核心流程** |
| LLM 直接驅動 | 靈活、自然 | 延遲高、費用累積、輸出不可控、可能產生不當建議 | 輔助增強 |

**混合策略**：RULER 五步核心流程由狀態機精確控制，確保每個焦慮中的父母都能獲得穩定、可預測、溫暖的回應。未來可在「開放對話」環節引入 LLM 作為情感支持補充。

### 3. 為什麼內存存儲 + 適配器模式？

```typescript
// 當前：內存適配器（零配置，開箱即用）
import { memoryAdapter } from './db/memoryAdapter.js';

// 未來：一行程式碼切換到 Supabase/PostgreSQL
// import { supabaseAdapter } from './db/supabaseAdapter.js';
```

- **開發速度**：新貢獻者無需配置數據庫即可運行
- **測試友好**：單元測試無需數據庫依賴
- **部署靈活**：從免費 Demo 到生產數據庫，無需改動業務代碼
- **Schema 就緒**：`schema.sql` 已包含完整的 PostgreSQL/Supabase 結構

### 4. 為什麼保留 PWA？

雖然 Bot 是主要入口，PWA 仍有不可替代的價值：

- **數據主權**：用戶可以導出、備份、刪除自己的全部歷史
- **深度可視化**：情緒熱力圖、趨勢曲線等複雜圖表不適合對話介面
- **沈浸體驗**：呼吸練習的動畫引導在 App 中體驗更佳
- **無平台依賴**：即使未來遷移 Bot 平台，PWA 作為獨立數據視圖依然可用

---

## 下一步

- 📖 詳細後端開發文檔請見 [`server/README.md`](./server/README.md)
- 🗄️ 數據庫 Schema 與遷移策略請見 [`server/src/db/schema.sql`](./server/src/db/schema.sql)
- 🎨 PWA 前端開發指南請見 [`AGENTS.md`](./AGENTS.md)

---

**今心團隊** | 打造平穩心靈 🌿
