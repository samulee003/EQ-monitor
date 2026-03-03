# 今心 ImXin - 開源情緒覺察工具 🌿

> **今心，即為「念」。**  
> 一個陪伴你深入覺察、理解並調節情緒的數字避風港。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-purple.svg)](https://vitejs.dev/)
[![PWA](https://img.shields.io/badge/PWA-Supported-green.svg)](https://web.dev/progressive-web-apps/)

---

## 📖 關於本項目

「今心 ImXin」是一款**開源**的情緒覺察 Web 應用，靈感來自耶魯大學情緒智能中心的 [How We Feel](https://howwefeel.org/) APP。

### ⚠️ 重要說明

- 本項目為**獨立開發**，與耶魯大學無官方合作關係
- RULER 為耶魯大學註冊商標，本項目僅供學習與研究使用
- 我們推薦使用官方的 **How We Feel** APP 獲得更專業的情緒支持
- 本項目完全**免費開源**，不作為商業用途

---

## ✨ 核心功能

### 情緒覺察流程

| 步驟 | 功能 | 說明 |
|------|------|------|
| **辨別** | Mood Meter + Body Scan | 動態象限圖 + 身體掃描 |
| **標記** | Emotion Grid | 100+ 繁體中文情緒詞彙 |
| **理解** | Understanding Step | 追蹤觸發事件與心理需求 |
| **表達** | Expressing Step | 情緒碎紙機 + 私密書信 |
| **調節** | Regulating Step | 呼吸練習 + 5-4-3-2-1 接地法 |

### 特色功能

- 🎨 **微光莫蘭迪設計** - 低飽和配色，減少視覺壓力
- 📱 **PWA 支持** - 離線可用，可安裝至主畫面
- 🔒 **隱私優先** - 所有數據本地存儲，可選 PIN 鎖保護
- 📊 **成長看板** - 情緒熱力圖、韌性趨勢、智能指標
- 🏆 **成就系統** - 記錄你的心靈成長足跡
- 🔔 **每日提醒** - 自訂時間提醒記錄心情
- 🌙 **主題切換** - 深色/淺色/跟隨系統

---

## 🛠️ 技術棧

| 類別 | 技術 |
|------|------|
| **前端框架** | React 19 + TypeScript |
| **構建工具** | Vite 7 |
| **樣式系統** | Vanilla CSS (自定義 Morandi UI) |
| **PWA** | vite-plugin-pwa + Workbox |
| **移動端** | Capacitor (Android) |
| **測試** | Vitest + @testing-library/react |
| **語言** | opencc-js (繁簡轉換) |

---

## 🚀 快速開始

### 環境要求

- Node.js 18+ 
- npm 或 pnpm

### 安裝與運行

```bash
# 1. 克隆倉庫
git clone https://github.com/samulee003/EQ-monitor.git
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

## 📁 項目結構

```
src/
├── components/       # React 組件
│   ├── steps/          # RULER 步驟子組件
│   ├── CheckInFlow.tsx # 主流程
│   ├── QuickStats.tsx  # 快速統計
│   ├── Skeleton.tsx    # 骨架屏
│   └── ...
├── services/         # 業務邏輯服務
├── hooks/            # 自定義 React Hooks
├── utils/            # 工具函數
├── data/             # 靜態數據 (情緒詞彙)
├── types/            # TypeScript 類型定義
├── test/             # 測試配置
├── App.tsx           # 根組件
├── main.tsx          # 應用入口
└── index.css         # 全局樣式
```

---

## 🎨 設計系統

### Luminous Morandi 配色

| 象限 | 色碼 | 情緒類型 |
|------|------|----------|
| 紅色 | `#C58B8A` | 高能量低愉悅 (憤怒、焦慮) |
| 黃色 | `#D5C1A5` | 高能量高愉悅 (興奮、快樂) |
| 藍色 | `#97A6B4` | 低能量低愉悅 (憂鬱、疲憊) |
| 綠色 | `#AAB09B` | 低能量高愉悅 (平靜、滿足) |

---

## 📊 數據存儲

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

## 🧪 測試覆蓋

| 模組 | 測試數 |
|------|--------|
| StorageService | 14 項 |
| useRulerFlow | 14 項 |
| emotionData | 8 項 |
| format utils | 8 項 |
| ThemeContext | 6 項 |
| LoadingSpinner | 3 項 |

---

## 🤝 貢獻指南

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

## 📄 授權協議

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

## 🙏 致謝

- 靈感來自耶魯大學情緒智能中心的 [How We Feel](https://howwefeel.org/) APP
- 感謝所有開源貢獻者

---

## 📬 聯繫

- 項目主頁：https://github.com/samulee003/EQ-monitor
- 問題反饋：https://github.com/samulee003/EQ-monitor/issues

---

**今心團隊** | 打造平穩心靈 🌿
