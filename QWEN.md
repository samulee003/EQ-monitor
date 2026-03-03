# 今心 ImXin - 項目上下文

> **語言**: 本項目使用繁體中文（台灣）進行開發，所有界面文字、註釋和文檔均使用繁體中文。

---

## ⚠️ 重要說明

**本項目為開源學習項目，非商業產品。**

- 靈感來自耶魯大學情緒智能中心的 [How We Feel](https://howwefeel.org/) APP
- 與耶魯大學無官方合作關係
- RULER 為耶魯大學註冊商標
- 本項目採用 MIT License，完全免費開源
- 推薦使用官方 APP 獲得更專業的情緒支持

---

## 項目概述

**今心 ImXin** 是一款基於耶魯大學 RULER 情緒智能框架開發的專業級 Web 應用。核心理念為「今心即為念」，旨在陪伴使用者深入覺察、理解並精準調節情緒。

### RULER 框架實現

| 步驟 | 功能 | 組件 |
|------|------|------|
| **Recognizing** | 情緒辨別 | MoodMeter (象限選擇) + BodyScan (身體掃描) |
| **Labeling** | 情緒標記 | EmotionGrid (100+ 情緒詞彙) |
| **Understanding** | 理解需求 | UnderstandingStep (觸發事件追蹤) |
| **Expressing** | 情緒表達 | ExpressingStep (情緒碎紙機/私密書信) |
| **Regulating** | 情緒調節 | RegulatingStep (呼吸規律器/5-4-3-2-1 接地法) |

---

## 技術棧

| 類別 | 技術 |
|------|------|
| 前端框架 | React 19 + TypeScript |
| 構建工具 | Vite 7 |
| 樣式系統 | Vanilla CSS (自定義 Morandi UI) |
| PWA | vite-plugin-pwa + Workbox |
| 移動端 | Capacitor (Android) |
| 測試 | Vitest + @testing-library/react |
| 語言轉換 | opencc-js (繁簡轉換) |
| 部署 | Zeabur |

---

## 開發指令

```bash
npm install          # 安裝依賴
npm run dev          # 開發服務器 (localhost:5173)
npm run build        # 生產構建 (輸出到 dist/)
npm run preview      # 預覽生產構建
npm run lint         # ESLint 檢查
npm run test         # 測試 (監視模式)
npm run test:run     # 測試 (單次)
npm run test:coverage # 測試覆蓋率
npm run cap:sync     # 同步 Capacitor
npm run cap:open     # 打開 Android Studio
```

---

## 項目結構

```
src/
├── components/       # React 組件
│   ├── steps/           # RULER 步驟子組件
│   ├── CheckInFlow.tsx  # RULER 主流程
│   ├── QuickStats.tsx   # 快速統計面板 (新增)
│   ├── Skeleton.tsx     # 骨架屏組件 (新增)
│   ├── MoodMeter.tsx    # 情緒象限
│   ├── EmotionGrid.tsx  # 情緒詞彙網格
│   ├── BodyScan.tsx     # 身體掃描
│   ├── Timeline.tsx     # 歷史記錄
│   ├── GrowthDashboard.tsx # 成長看板
│   └── ...
├── services/         # 業務邏輯服務
│   ├── StorageService.ts   # LocalStorage 管理
│   ├── HabitService.ts     # 習慣追蹤
│   ├── LanguageContext.tsx # 語言切換
│   ├── ThemeContext.tsx    # 主題切換
│   ├── AIService.ts        # AI 洞察
│   ├── NotificationService.ts # 通知服務
│   └── ...
├── hooks/            # 自定義 Hooks
│   ├── useRulerFlow.ts  # RULER 流程狀態
│   └── useA11y.ts       # 可訪問性 Hooks
├── data/             # 靜態數據
│   └── emotionData.ts   # 100+ 情緒詞彙
├── types/            # TypeScript 類型
│   ├── RulerTypes.ts
│   ├── HabitTypes.ts
│   └── AchievementTypes.ts
├── utils/            # 工具函數 (新增)
│   ├── dateUtils.ts       # 日期時間工具
│   ├── statisticsUtils.ts # 統計分析工具
│   └── format.test.ts     # 格式化工具測試
├── test/             # 測試配置
├── App.tsx           # 根組件
├── main.tsx          # 應用入口
└── index.css         # 全局樣式
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

### 主題

- **Dark** (默認): `#1a1a1a` 背景
- **Light**: `#f5f3ef` 背景
- **System**: 自動跟隨系統

---

## 代碼規範

### 命名

- 組件：PascalCase (如 `MoodMeter.tsx`)
- 服務：camelCase (如 `storageService.ts`)
- 類型：PascalCase (如 `RulerLogEntry`)
- 使用 `interface` 優先於 `type`

### 路徑別名

```typescript
import { storageService } from '@/services/StorageService';
import { RulerLogEntry } from '@/types/RulerTypes';
```

### 可訪問性 (A11y)

- 所有交互元素必須有 `aria-label`
- 支持鍵盤導航
- 焦點狀態必須可見
- 使用語義化 HTML

---

## 數據存儲 (LocalStorage)

| 鍵名 | 用途 |
|------|------|
| `feelings_logs` | 情緒記錄 |
| `ruler_draft` | 當前流程草稿 |
| `user_progress` | 用戶進度/成就 |
| `jinxin-language` | 語言偏好 |
| `imxin-theme` | 主題偏好 |
| `imxin_privacy_pin` | 隱私鎖 PIN |
| `imxin_notification_settings` | 通知設置 |

---

## 環境變量

```bash
# .env (可選，用於 AI 功能)
VITE_ZEABUR_AI_API_URL=https://gateway.zeabur.com/...
VITE_ZEABUR_AI_API_KEY=your_api_key
```

---

## 測試

- 框架：Vitest + @testing-library/react
- 文件命名：`*.test.ts` / `*.test.tsx`
- 測試目錄：`src/**/*.{test,spec}.{ts,tsx}`

### 運行測試

```bash
npm run test        # 監視模式
npm run test:run    # 單次運行
npm run test:coverage # 生成覆蓋率報告
```

---

## 部署

- 平台：Zeabur
- 配置：`zeabur.toml`
- 構建優化：Terser 壓縮、代碼分割、console 清除

---

## 新增功能 (2026-03-03)

### 1. QuickStats 組件
- 顯示問候語、連續記錄天數、本週記錄數
- 提供個人化健康建議
- 自動根據時間顯示不同問候

### 2. Skeleton 骨架屏
- 支持 card、chart、text、circle、heatmap 等類型
- 流暢的 shimmer 動畫效果
- 提升加載體驗

### 3. 工具函數庫
- **dateUtils.ts**: 相對時間、問候語、日期範圍計算
- **statisticsUtils.ts**: 情緒統計、趨勢分析、多樣性指數

### 4. 增強空狀態
- Timeline 空狀態：動畫插圖、功能預覽
- GrowthDashboard 空狀態：鼓勵文字、數據預覽

---

## 重要注意事項

1. **隱私優先**: 所有數據僅存本地 LocalStorage
2. **繁體中文**: 界面文字和註釋使用繁體中文（台灣）
3. **PWA 支持**: 支持離線使用
4. **移動端**: 通過 Capacitor 支持 Android
5. **AI 功能**: 可選，未配置時使用 mock 數據

---

## 構建優化

- **代碼分割**: react-vendor、i18n、emotion-data、ui-components
- **懶加載**: Timeline、GrowthDashboard、AchievementPage
- **Terser**: 生產環境自動清除 console 日誌
- **PWA**: Service Worker 緩存策略配置

---

## 測試覆蓋

- StorageService: 14 項測試
- useRulerFlow: 14 項測試
- emotionData: 8 項測試
- format utils: 8 項測試
- ThemeContext: 6 項測試
- LoadingSpinner: 3 項測試
