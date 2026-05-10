# 今心 ImXin - 開源情緒覺察 PWA + LINE Bot

> **今心，即為「念」。**
> 一個陪伴你深入覺察、命名並選擇回應情緒的數字避風港。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-purple.svg)](https://vitejs.dev/)
[![PWA](https://img.shields.io/badge/PWA-Supported-green.svg)](https://web.dev/progressive-web-apps/)
[![LINE Bot](https://img.shields.io/badge/LINE-Bot-06C755.svg)](https://developers.line.biz/)
[![Deployed on Zeabur](https://img.shields.io/badge/Deployed%20on-Zeabur-6D28D9.svg)](https://zeabur.com/)

---

## 線上體驗

**立即試用：** [https://today-mood.zeabur.app/](https://today-mood.zeabur.app/)

---

## 關於本項目

「今心 ImXin」是一款**開源**的情緒覺察工具，提供 **LINE Bot 即時陪伴** 與 **PWA 數據儀表盤** 雙入口，幫助焦慮的父母在情緒高漲的時刻暫停、覺察並選擇回應方式。

### 重要說明

- 本工具為**情緒覺察反思工具**，非教育課程或臨床治療系統
- 本項目完全**免費開源**，不作為商業用途

### Bot-First 架構

> 從「父母情緒急救箱」出發，使命是通過 AI 陪伴幫助焦慮的父母覺察和調節情緒，最終鼓勵與真人連結。

- 🥇 **LINE Bot** — 主要入口，即時對話完成 RULER 情緒覺察練習
- 📊 **PWA 儀表盤** — 歷史回顧、情緒熱力圖、成就展示與數據導出
- 🧠 **後端伺服器** — RULER 對話式狀態機、用戶上下文管理、數據持久化

---

## 核心功能

### 情緒覺察流程（RULER 方法）

| 步驟 | 功能 | 說明 |
|------|------|------|
| **覺察 (Recognize)** | 身體掃描 | 注意當下的身體感受 |
| **理解 (Understand)** | 情緒定位 | 從 100+ 詞彙中精確匹配 |
| **標記 (Label)** | 需求挖掘 | 為情緒命名，找到內在需要 |
| **表達 (Express)** | 情緒碎紙機 | 安全宣洩，無需邏輯與禮貌 |
| **調節 (Regulate)** | 回應練習 | 呼吸引導 / 5-4-3-2-1 接地 / 正念 |

### LINE Bot 特色

- **對話即覺察** — 在 LINE 上完成完整的五步練習，無需下載 App
- **智能快捷按鈕** — Quick Reply 引導身體部位、情緒詞、調節技巧選擇
- **週報統計** — 輸入「週報」查看累積覺察次數與連續記錄天數
- **30 分鐘上下文** — Bot 記住對話狀態，隨時回來繼續

### PWA 儀表盤特色

- **微光莫蘭迪設計** - 低飽和配色，減少視覺壓力
- **離線可用** - 可安裝至主畫面，PWA 支持
- **隱私優先** - 可選 PIN 鎖保護
- **成長看板** - 情緒熱力圖、參與度趨勢、智能指標
- **成就系統** - 記錄你的心靈成長足跡
- **數據導出** - CSV / JSON / Markdown / TXT 多格式
- **主題切換** - 深色/淺色/跟隨系統

---

## 技術棧

| 類別 | 技術 |
|------|------|
| **前端框架** | React 19 + TypeScript |
| **構建工具** | Vite 7 |
| **樣式系統** | Vanilla CSS (自定義 Morandi UI) |
| **PWA** | vite-plugin-pwa + Workbox |
| **移動端** | Capacitor (Android) |
| **後端框架** | Express 5 + TypeScript |
| **LINE SDK** | @line/bot-sdk |
| **測試** | Vitest + @testing-library/react |
| **語言** | opencc-js (繁簡轉換) |

---

## 快速開始

### 環境要求

- Node.js 18+
- npm 或 pnpm

### 方案 A：五分鐘啟動 LINE Bot（推薦）

```bash
# 1. 克隆倉庫
git clone https://github.com/samulee003/EQ-monitor.git
cd EQ-monitor/server

# 2. 安裝依賴
npm install

# 3. 以 Demo 模式啟動（無需 LINE 憑證）
npm run dev

# 4. 測試對話流程（另一終端）
node test-bot.cjs
```

完整 LINE Bot 設置與部署請見 [BOT_DEPLOYMENT.md](./BOT_DEPLOYMENT.md) 與 [server/README.md](./server/README.md)。

### 方案 B：啟動 PWA 前端

```bash
# 1. 進入前端目錄
cd EQ-monitor

# 2. 安裝依賴
npm install

# 3. 啟動開發伺服器 (http://localhost:5173)
npm run dev

# 4. 生產構建
npm run build

# 5. 預覽生產構建
npm run preview
```

### 測試

```bash
# 運行測試 (監視模式)
npm run test

# 運行測試 (單次)
npm run test:run

# 生成測試覆蓋率報告
npm run test:coverage
```

### 移動端構建 (Android)

```bash
# 同步 Capacitor
npm run cap:sync

# 打開 Android Studio
npm run cap:open
```

---

## 項目結構

```
今心 APP/
├── src/                    # PWA 前端源碼
│   ├── components/           # React 組件
│   ├── services/             # 業務邏輯服務
│   ├── hooks/                # 自定義 React Hooks
│   ├── data/                 # 靜態數據 (情緒詞彙)
│   └── ...
├── server/                 # LINE Bot 後端
│   ├── src/
│   │   ├── index.ts            # Express 入口 + Webhook
│   │   ├── rulerBot.ts         # RULER 對話式狀態機
│   │   ├── emotionData.ts      # 100+ 情緒詞彙
│   │   └── db/
│   │       ├── schema.sql      # PostgreSQL Schema
│   │       └── memoryAdapter.ts # 內存數據適配器
│   ├── test-bot.cjs          # 端到端測試腳本
│   └── .env.example          # 環境變量模板
├── docs/                   # 文檔
├── BOT_DEPLOYMENT.md       # Bot-First 架構指南
├── CHANGELOG.md            # 更新日誌
└── README.md               # 本文件
```

---

## 設計系統

### Luminous Morandi 配色

| 象限 | 色碼 | 情緒類型 |
|------|------|----------|
| 紅色 | `#C58B8A` | 高能量低愉悅 (憤怒、焦慮) |
| 黃色 | `#D5C1A5` | 高能量高愉悅 (興奮、快樂) |
| 藍色 | `#97A6B4` | 低能量低愉悅 (憂鬱、疲憊) |
| 綠色 | `#AAB09B` | 低能量高愉悅 (平靜、滿足) |

---

## 數據存儲

所有數據存儲在瀏覽器 LocalStorage：

| 鍵名 | 用途 |
|------|------|
| `feelings_logs` | 情緒記錄日誌 |
| `ruler_draft` | 當前流程草稿 |
| `user_progress` | 用戶進度/成就 |
| `jinxin-language` | 語言偏好 |
| `imxin-theme` | 主題偏好 |
| `imxin_privacy_pin` | 隱私鎖 PIN |

---

## 測試覆蓋

| 模組 | 測試數 |
|------|--------|
| StorageService | 14 項 |
| useRulerFlow | 14 項 |
| emotionData | 8 項 |
| format utils | 8 項 |
| ThemeContext | 6 項 |
| LoadingSpinner | 3 項 |

---

## 貢獻指南

我們歡迎各種形式的貢獻！

### 如何貢獻

1. Fork 本倉庫
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

### 開發規範

- 使用繁體中文進行界面和註釋
- 遵循現有代碼風格
- 為新功能添加測試
- 確保 ESLint 檢查通過

---

## 授權協議

本項目採用 **MIT License** 授權。

```
MIT License

Copyright (c) 2026 今心團隊

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 致謝

- 感謝所有開源貢獻者

---

## 聯繫

- 項目主頁：https://github.com/samulee003/EQ-monitor
- 問題反饋：https://github.com/samulee003/EQ-monitor/issues

---

**今心團隊** | 打造平穩心靈
