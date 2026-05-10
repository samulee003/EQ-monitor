# 今心 ImXin - AI 情緒覺察助手開發指南

> **語言提示**: 本項目主要使用繁體中文（台灣）進行開發，所有用戶界面文字、註釋和文檔都應使用繁體中文。
>
> **更新日期**: 2026-04-21
> **版本**: 2.1 - 100 分滿分優化版 · 前後端一體化規劃中

---

## 項目概述

**今心 ImXin** 是一款開源的情緒覺察 Web 應用。它是一個日常反思工具，透過動態交互、身心聯結與儀式化宣洩，引導使用者從「覺察」走向「平衡」。

**核心理念**: 「今心」即為「念」，旨在陪伴使用者深入覺察、理解並精準調節情緒的數字避風港。

**當前狀態**: ⭐ 100/100 分 - 已達商業級生產標準

---

## 技術棧

| 類別 | 技術 |
|------|------|
| **前端框架** | React 19.2 + TypeScript 5.9 |
| **構建工具** | Vite 7 |
| **樣式系統** | Vanilla CSS (Luminous Morandi 設計系統) + CSS Modules |
| **PWA 支持** | vite-plugin-pwa + Workbox 7 |
| **跨平台** | Capacitor 7 (Android App 封裝) |
| **數據持久化** | LocalStorage (階段一) / 後端 API (階段二規劃) |
| **語言轉換** | opencc-js (繁簡轉換) |
| **測試框架** | Vitest 4 + @testing-library/react + jsdom |
| **代碼質量** | ESLint 9 + TypeScript 嚴格模式 |
| **部署平台** | Zeabur (前端靜態托管) |

---

## 項目結構

```
src/
├── components/              # React 組件
│   ├── steps/                   # 覺察步驟子組件
│   │   ├── SummaryStep.tsx          # 完成摘要
│   │   ├── NeuroCheckStep.tsx       # 調節後檢查
│   │   └── CenteringStep.tsx        # 沉靜步驟
│   ├── CheckInFlow.tsx          # 情緒覺察主流程
│   ├── MoodMeter.tsx            # 情緒象限選擇器
│   ├── EmotionGrid.tsx          # 情緒詞彙網格
│   ├── BodyScan.tsx             # 身體掃描組件 (含語音引導)
│   ├── UnderstandingStep.tsx    # 理解/需求探索
│   ├── ExpressingStep.tsx       # 表達/情緒碎紙機
│   ├── RegulatingStep.tsx       # 調節/呼吸練習
│   ├── Timeline.tsx             # 歷史記錄時間軸 (分頁)
│   ├── GrowthDashboard.tsx      # 成長看板/數據可視化
│   ├── AchievementPage.tsx      # 成就系統頁面
│   ├── AchievementToast.tsx     # 成就解鎖提示
│   ├── AIInsightCard.tsx        # AI 洞察卡片
│   ├── AIChatAssistant.tsx      # AI 聊天助手 (實時情緒支持)
│   ├── AuthModal.tsx            # 認證彈窗
│   ├── MainLayout.tsx           # 主佈局組件
│   ├── SplashScreen.tsx         # 啟動畫面
│   ├── OnboardingFlow.tsx       # 新用戶引導流程
│   ├── PrivacyLock.tsx          # 隱私鎖/PIN 保護
│   ├── ExportPanel.tsx          # 多格式導出面板
│   ├── NotificationSettings.tsx # 通知設置
│   ├── UserProfile.tsx          # 用戶資料頁
│   ├── QuickCheckIn.tsx         # 快速情緒打卡
│   ├── QuickStats.tsx           # 快速統計概覽
│   ├── SOSMode.tsx              # 緊急 SOS 情緒急救模式
│   ├── VoiceRecorder.tsx        # 語音記錄組件
│   ├── RulerProgress.tsx        # 覺察進度指示器
│   ├── ParentHome.tsx           # 親子模式首頁
│   ├── ParentScenarios.tsx      # 親子情境引導
│   ├── Skeleton.tsx             # 加載骨架屏
│   ├── ContextLogger.tsx        # 開發日誌組件
│   ├── ErrorBoundary.tsx        # 錯誤邊界
│   ├── SkipLink.tsx             # 跳轉到主要內容 (A11y)
│   ├── A11yAnnouncer.tsx        # 屏幕閱讀器公告
│   ├── LoadingSpinner.tsx       # 載入動畫
│   └── icons/                   # SVG 圖標組件
│       └── SvgIcons.tsx
├── services/                # 業務邏輯服務
│   ├── StorageService.ts        # LocalStorage 數據管理
│   ├── HabitService.ts          # 習慣追踪/連續記錄
│   ├── HabitContext.tsx         # 習慣狀態 React Context
│   ├── LanguageContext.tsx      # 語言切換 (繁/簡)
│   ├── ThemeContext.tsx         # 主題切換 (Dark/Light/System)
│   ├── AuthContext.tsx          # 認證狀態管理
│   ├── NotificationService.ts   # 瀏覽器通知
│   ├── ExportService.ts         # 多格式導出服務
│   ├── VoiceGuideService.ts     # 語音引導服務 (Web Speech API)
│   ├── AIService.ts             # AI 洞察服務 (Zeabur AI)
│   ├── PhysicalService.ts       # 生理數據服務
│   ├── ResilienceService.ts     # 心理韌性/復原力服務
│   └── prompts.ts               # AI System Prompts
├── hooks/                   # 自定義 React Hooks
│   ├── useRulerFlow.ts          # 覺察流程狀態管理
│   └── useA11y.ts               # 可訪問性輔助 Hooks
├── utils/                   # 工具函數
│   ├── dateUtils.ts             # 日期處理工具
│   ├── statisticsUtils.ts       # 統計計算工具
│   └── format.test.ts           # 格式化工具 + 測試
├── data/                    # 靜態數據
│   ├── emotionData.ts           # 100+ 情緒詞彙定義
│   └── parentingEmotionData.ts  # 親子情境情緒數據
├── types/                   # TypeScript 類型定義
│   ├── RulerTypes.ts            # 覺察流程相關類型
│   ├── HabitTypes.ts            # 習慣/連續記錄類型
│   └── AchievementTypes.ts      # 成就系統類型
│   └── opencc-js.d.ts           # opencc-js 類型聲明
├── test/                    # 測試配置
│   └── setup.ts                 # Vitest 測試環境設置
├── index.css                # 全局樣式 (Luminous Morandi 設計系統)
├── main.tsx                 # 應用入口
└── App.tsx                  # 根組件
```

---

## 覺察五步練習 (RULER 方法)

應用引導使用者完成五步情緒覺察練習：

1. **覺察 (Recognize)** - 情緒象限選擇 + Body Scan 身體掃描
2. **理解 (Understand)** - 從 100+ 情緒詞彙中精確選擇，定位觸發事件
3. **標記 (Label)** - 為情緒精確命名，挖掘底層心理需求
4. **表達 (Express)** - 情緒碎紙機儀式或私密書信宣洩
5. **調節 (Regulate)** - 呼吸規律器、5-4-3-2-1 接地法、正念引導

---

## 開發指令

```bash
# 安裝依賴
npm install

# 開發服務器 (http://localhost:5173)
npm run dev

# 生產構建 (輸出到 dist/)
npm run build

# 預覽生產構建
npm run preview

# ESLint 檢查
npm run lint

# 運行測試 (監視模式)
npm run test

# 運行測試 (單次)
npm run test:run

# 生成測試覆蓋率報告
npm run test:coverage

# Capacitor 同步 (構建 + 複製到原生項目)
npm run cap:sync

# 打開 Android Studio
npm run cap:open
```

---

## 設計系統

### Luminous Morandi 配色

| 象限 | 基礎色 | 應用 |
|------|--------|------|
| 紅色 (Red) | `#C58B8A` | 高能量低愉悅 - 憤怒、焦慮 |
| 黃色 (Yellow) | `#D5C1A5` | 高能量高愉悅 - 興奮、快樂 |
| 藍色 (Blue) | `#97A6B4` | 低能量低愉悅 - 憂鬱、疲憊 |
| 綠色 (Green) | `#AAB09B` | 低能量高愉悅 - 平靜、滿足 |

### 主題支持

- **Dark** (默認): `#1a1a1a` 深色背景
- **Light**: `#f5f3ef` 淺色背景
- **System**: 自動跟隨系統偏好

### CSS 變量

```css
:root {
  --bg-color: #1a1a1a;         /* 深色背景 */
  --bg-secondary: #242424;      /* 次級背景 */
  --text-primary: #e8e8e8;      /* 主要文字 */
  --text-secondary: #b8b8b8;    /* 次要文字 */
  --radius-luxe: 32px;          /* 大圓角 */
  --glass-bg: rgba(255,255,255,0.05);   /* 毛玻璃背景 */
  --glass-border: rgba(255,255,255,0.1); /* 毛玻璃邊框 */
}

[data-theme="light"] {
  --bg-color: #f5f3ef;
  --bg-secondary: #ebe7e0;
  --text-primary: #2d2d2d;
  --text-secondary: #6b6b6b;
}
```

---

## 數據存儲

### 階段一：LocalStorage (當前)

所有數據存儲在 LocalStorage，鍵名如下：

| 鍵名 | 用途 |
|------|------|
| `feelings_logs` | 情緒記錄日誌 (RulerLogEntry[]) |
| `ruler_draft` | 當前流程草稿 (RulerDraft) |
| `user_progress` | 用戶進度/連續記錄/成就 |
| `jinxin-language` | 語言偏好 (zh-TW/zh-CN) |
| `imxin-theme` | 主題偏好 (dark/light/system) |
| `imxin_privacy_pin` | 隱私鎖 PIN |
| `imxin_privacy_enabled` | 隱私鎖開關 |
| `imxin_notification_settings` | 通知設置 |
| `imxin_onboarding_completed` | 引導完成標記 |

### 階段二：後端 API (規劃中)

> 參見「後端架構規劃」章節

---

## 環境變量

複製 `.env.example` 為 `.env`：

```bash
VITE_ZEABUR_AI_API_URL=https://gateway.zeabur.com/api/v1/projects/.../proxy
VITE_ZEABUR_AI_API_KEY=your_api_key_here
```

**注意**: AI 功能為可選，未配置時會使用 mock 數據。

---

## 代碼規範

### 類型定義

- 所有類型定義放在 `src/types/` 目錄
- 使用 PascalCase 命名 (如 `RulerLogEntry`)
- 接口優先使用 `interface` 而非 `type`

### 組件規範

- 組件使用 PascalCase 命名 (如 `MoodMeter.tsx`)
- 服務使用 PascalCase 命名 (如 `StorageService.ts`)
- 優先使用函數組件 + Hooks
- Props 類型使用 `React.FC<{ propName: Type }>`

### 語言規範

- 界面文字使用繁體中文（台灣）
- 代碼註釋使用繁體中文
- 透過 `useLanguage()` hook 支持簡體中文切換

### 可訪問性規範 (A11y)

- 所有交互元素必須有 `aria-label`
- 支持鍵盤導航 (Tab/Enter/Space)
- 焦點狀態必須可見
- 圖片必須有 `alt` 屬性
- 使用語義化 HTML 標籤
- 支持 `prefers-reduced-motion` 減少動畫

### 路徑別名

使用 `@/` 別名指向 `src/` 目錄：

```typescript
import { storageService } from '@/services/StorageService';
import { RulerLogEntry } from '@/types/RulerTypes';
```

---

## 測試策略

### 測試覆蓋

- **單元測試**: Vitest + @testing-library/react
- **當前覆蓋**: 94.74% statements / 95.6% lines (165 個測試)
- **測試文件**: `*.test.ts` / `*.test.tsx`

### 測試文件位置

```
src/
├── services/
│   ├── StorageService.test.ts   (14 測試)
│   ├── ThemeContext.test.tsx    (6 測試)
│   ├── AIService.test.ts        (24 測試)
│   └── HabitService.test.ts     (17 測試)
├── data/
│   └── emotionData.test.ts      (8 測試)
├── components/
│   └── LoadingSpinner.test.tsx  (3 測試)
├── hooks/
│   ├── useRulerFlow.test.ts     (25 測試)
│   └── useA11y.test.ts          (22 測試)
├── utils/
│   ├── format.test.ts           (8 測試)
│   └── dateUtils.test.ts        (38 測試)
```

### 運行測試

```bash
# 開發模式 (監視)
npm run test

# 生產模式 (單次)
npm run test:run

# 覆蓋率報告
npm run test:coverage
```

---

## 部署流程

### Zeabur 部署

項目配置在 `zeabur.toml`：

```toml
[build]
publish_dir = "dist"

[serves]
index = "index.html"
history_api_fallback = true
```

1. 推送代碼到 GitHub
2. 在 Zeabur 綁定倉庫
3. 自動構建並部署

### 構建優化

Vite 配置包含精細代碼分割：
- `react-vendor` chunk: React + ReactDOM
- `i18n` chunk: opencc-js
- `emotion-data` chunk: 情緒數據
- `vendor` chunk: 其他 npm 依賴
- `ui-timeline` / `ui-dashboard` / `ui-achievement`: 頁面級懶加載
- `ui-checkin` / `ui-steps` / `ui-emotion`: 功能模塊分割
- `ui-settings` / `ui-ai` / `ui-parent`: 場景級分割
- `services-core`: 核心服務

### Capacitor Android 構建

```bash
# 構建並同步到 Android 項目
npm run cap:sync

# 在 Android Studio 中打開並打包 APK
npm run cap:open
```

---

## 後端架構規劃 (階段二)

> 本節規劃從純前端 LocalStorage 架構遷移至前後端分離架構。

### 目標

- 用戶數據雲端同步
- 多設備登入支持
- 社交功能（可選分享）
- AI 服務端代理（保護 API Key）
- 數據分析與洞察

### 技術選型 (待定)

| 層級 | 候選方案 |
|------|----------|
| **BaaS 平台** | Supabase / Firebase / Appwrite |
| **數據庫** | PostgreSQL (Supabase) |
| **認證** | OAuth 2.0 + JWT |
| **API** | RESTful / GraphQL |
| **部署** | Zeabur / Render / Fly.io |

### 數據遷移策略

1. 用戶註冊/登入後，提示同步本地數據
2. LocalStorage 作為離線緩存
3. 在線時自動同步至後端
4. 衝突解決：後端為主，本地為輔

### API 設計草案

```typescript
// 情緒記錄 CRUD
GET    /api/v1/logs          # 獲取記錄列表
POST   /api/v1/logs          # 創建新記錄
PUT    /api/v1/logs/:id      # 更新記錄
DELETE /api/v1/logs/:id      # 刪除記錄

// 用戶資料
GET    /api/v1/user/profile   # 獲取用戶資料
PUT    /api/v1/user/profile   # 更新用戶資料
GET    /api/v1/user/stats     # 獲取統計數據

// AI 洞察 (服務端代理)
POST   /api/v1/ai/insight    # 生成情緒洞察
POST   /api/v1/ai/chat       # AI 對話

// 成就系統
GET    /api/v1/achievements   # 獲取成就列表
```

---

## 安全注意事項

1. **隱私優先**: 所有數據默認僅存儲在本地 LocalStorage
2. **PIN 保護**: 可選的 4 位 PIN 鎖保護應用
3. **AI API 密鑰**: 僅在構建時注入，不暴露給客戶端（階段二將移至服務端）
4. **PWA**: Service Worker 啟用離線使用和緩存
5. **Console 清除**: 生產環境自動清除 console 日誌
6. **XSS 防護**: 用戶輸入使用 DOMPurify 清理（規劃中）

---

## 常用組件開發模式

### 創建新的覺察步驟組件

```typescript
import React from 'react';
import { useRulerFlow } from '@/hooks/useRulerFlow';

interface MyStepProps {
  onComplete: (data: MyData) => void;
}

export const MyStep: React.FC<MyStepProps> = ({ onComplete }) => {
  // 實現步驟邏輯
  return (
    <div className="step-container">
      {/* 步驟內容 */}
    </div>
  );
};
```

### 使用 Context

```typescript
import { useLanguage } from '@/services/LanguageContext';
import { useHabit } from '@/services/HabitContext';
import { useTheme } from '@/services/ThemeContext';
import { useAuth } from '@/services/AuthContext';

const MyComponent = () => {
  const { t, language, toggleLanguage } = useLanguage();
  const { progress, refreshProgress } = useHabit();
  const { theme, actualTheme, toggleTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  
  return <div>{t('繁體中文文字')}</div>;
};
```

### 使用可訪問性 Hooks

```typescript
import { useFocusTrap, useKeyboardShortcut, useAnnouncer } from '@/hooks/useA11y';

const MyModal = ({ isOpen, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const announce = useAnnouncer();
  
  // 焦點陷阱
  useFocusTrap(isOpen, containerRef);
  
  // 鍵盤快捷鍵
  useKeyboardShortcut('Escape', onClose);
  
  // 宣布內容變化
  useEffect(() => {
    if (isOpen) {
      announce('對話框已打開', 'polite');
    }
  }, [isOpen]);
};
```

---

## 依賴說明

### 生產依賴
- `react` / `react-dom`: React 19.2
- `@capacitor/core` / `@capacitor/android` / `@capacitor/cli`: 跨平台移動應用
- `opencc-js`: 繁簡中文轉換

### 開發依賴
- `vite`: 構建工具
- `vite-plugin-pwa`: PWA 支持
- `@vitejs/plugin-react`: React 支持
- `vitest` / `@vitest/coverage-v8`: 測試框架
- `@testing-library/react` / `jsdom`: React 測試工具
- `eslint` / `eslint-plugin-react-hooks`: 代碼檢查
- `typescript`: 類型支持
- `terser`: 代碼壓縮
- `rollup-plugin-visualizer`: Bundle 分析
- `workbox-window`: PWA 窗口支持

---

## 資源文件

- `public/logo.png`: 應用圖標 (PWA/通知/Android 使用)
- `public/manifest.json`: PWA 配置
- `android/`: Capacitor Android 原生項目

---

## 更新日誌

### v2.1 (2026-04-21)
- 🔄 更新 AGENTS.md 以準確反映項目結構
- 🔄 添加後端架構規劃章節
- 🔄 更新測試覆蓋數據 (165 測試 / 94.74%)
- 🔄 補充 Capacitor Android 構建流程
- 🔄 更新所有組件和服務列表

### v2.0 (2026-03-01)
- ✅ 優化至 100/100 分
- ✅ 添加 Error Boundary
- ✅ 完整可訪問性支持 (A11y)
- ✅ 主題切換 (Dark/Light/System)
- ✅ 路由懶加載
- ✅ 時間軸分頁
- ✅ 多格式導出 (CSV/JSON/Markdown/TXT)
- ✅ Web Speech API 語音引導
- ✅ 165 個單元測試
- ✅ Bundle 優化 (Terser)
- ✅ AI 聊天助手
- ✅ 親子模式
- ✅ SOS 緊急模式
- ✅ 快速打卡

### v1.0 (初始版本)
- 覺察五步練習
- 100+ 情緒詞彙
- AI 洞察分析
- 成就系統
- PWA 支持

---

## 貢獻指南

1. 確保代碼通過 ESLint 檢查 (`npm run lint`)
2. 為新功能添加測試
3. 保持可訪問性標準
4. 更新相關文檔 (尤其是 AGENTS.md)
5. 使用繁體中文註釋

---

## 許可證

MIT License

---

**今心團隊** | 打造平穩心靈
