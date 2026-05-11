# 今心 ImXin APP — 全面打磨計畫

> **制定日期**: 2026-04-21
> **目標**: 從 100 分「優秀的前端應用」進化為「商業級全棧產品」
> **預估工期**: 6-8 週（可分期交付）

---

## 一、現狀診斷

### ✅ 已達成的優勢

| 維度 | 狀態 | 說明 |
|------|------|------|
| 架構 | ⭐⭐⭐⭐⭐ | React 19 + TS 嚴格模式，組件化良好 |
| 測試 | ⭐⭐⭐⭐⭐ | 165 測試 / 94.74% 覆蓋率 |
| PWA | ⭐⭐⭐⭐⭐ | Workbox 離線支持、Service Worker |
| A11y | ⭐⭐⭐⭐⭐ | ARIA、鍵盤導航、屏幕閱讀器 |
| 設計 | ⭐⭐⭐⭐⭐ | Luminous Morandi 設計系統完整 |
| 跨平台 | ⭐⭐⭐⭐☆ | Capacitor 7 Android 支持 |

### ⚠️ 發現的問題與風險

#### 🔴 P0 — 必須立即修復

| # | 問題 | 影響 | 解決方案 |
|---|------|------|----------|
| 1 | **AI API Key 暴露於客戶端** | `VITE_ZEABUR_AI_API_KEY` 被打包進 JS，任何人可提取盜用 | 建立後端代理服務，Key 存於服務端 |
| 2 | **數據層零抽象** | `StorageService` 直接耦合 `localStorage`，遷移後端需改動上百處 | 建立 `IDataAdapter` 通用接口 |
| 3 | **LocalStorage 無加密** | 用戶情緒日記、PIN 碼以明文存儲，設備丟失即洩露 | 添加 AES-256 客戶端加密 |
| 4 | **無離線寫入隊列** | 用戶離線時的操作會丟失，PWA 只讀緩存靜態資源 | 建立 IndexedDB 操作隊列 + 同步機制 |

#### 🟡 P1 — 重要優化

| # | 問題 | 影響 | 解決方案 |
|---|------|------|----------|
| 5 | **Context 嵌套過深** | App.tsx 中 4 層 Provider 嵌套，渲染性能損耗 | 組合 Provider 或使用 Zustand |
| 6 | **console.log 殘留 16 處** | 雖然 Terser 會清除，但源碼髒亂、開發時干擾 | 統一使用結構化日誌庫 |
| 7 | **樣式內聯於組件** | `MainLayout.tsx` 等文件用 `<style>` 標籤寫 CSS，難維護 | 遷移至 CSS Modules / CSS-in-JS |
| 8 | **useRulerFlow Hook 過重** | 229 行、10+ 個 useState，邏輯與狀態混雜 | 重構為 useReducer + 狀態機 |
| 9 | **無請求重試/熔斷** | AI API 失敗僅回退 mock，無指數退避重試 | 添加 fetch 重試邏輯 |
| 10 | **路由狀態用 useState** | `view` 狀態在記憶體中，重新整理後丟失頁面位置 | 使用 URL hash 或 query 持久化 |

#### 🟢 P2 — 錦上添花

| # | 問題 | 解決方案 |
|---|------|----------|
| 11 | 無 CI/CD | GitHub Actions 自動測試、構建、部署 |
| 12 | 無錯誤監控 | 集成 Sentry 追蹤生產環境異常 |
| 13 | 無數據備份 | 用戶誤刪無法恢復，需定期雲端備份 |
| 14 | 無分析埋點 | 不知道用戶實際使用哪些功能 |
| 15 | 主題切換閃爍 | FOUC (Flash of Unstyled Content) 問題 |

---

## 二、打磨路線圖

### Phase 1: 前端加固與重構（第 1-2 週）
**目標: 代碼質量從「好」變為「無懈可擊」**

```
Week 1
├── Day 1-2: 數據層抽象化
│   ├── 建立 IDataAdapter 接口
│   ├── LocalStorageAdapter (當前實現)
│   ├── 重構 StorageService 依賴注入
│   └── 所有組件改為依賴接口而非具體實現
│
├── Day 3-4: 狀態管理升級
│   ├── 引入 Zustand 替代多層 Context
│   ├── 重構 useRulerFlow → useReducer 狀態機
│   ├── 組合 Providers 消除嵌套地獄
│   └── URL 路由持久化 (hash-based)
│
└── Day 5-7: 代碼清理與工程化
    ├── 統一日誌系統 (移除所有 console.log)
    ├── Husky + lint-staged 提交前檢查
    ├── 建立 .github/workflows/ci.yml
    └── CSS 模塊化遷移 (MainLayout 等)

Week 2
├── Day 1-2: 性能優化
│   ├── React.memo / useMemo / useCallback 審計
│   ├── 虛擬列表 (Timeline 長列表)
│   ├── 圖片懶加載 + WebP 格式
│   └── 主題切換 FOUC 修復
│
├── Day 3-4: 安全性加固
│   ├── 客戶端數據加密 (crypto.subtle AES-GCM)
│   ├── PIN 碼 bcrypt 哈希 (或至少 PBKDF2)
│   ├── XSS 防護 (DOMPurify 清理用戶輸入)
│   └── Content-Security-Policy 標頭
│
└── Day 5-7: 離線體驗升級
    ├── IndexedDB 操作隊列 (dexie.js)
    ├── 背景同步 (Background Sync API)
    ├── 衝突解決策略 (最後寫入勝出 + 時間戳)
    └── 離線指示器 UI
```

### Phase 2: 後端搭建（第 3-4 週）
**目標: 建立 BaaS 後端，實現數據雲端化**

**技術選型決策: Supabase**

| 候選方案 | 優點 | 缺點 | 評分 |
|----------|------|------|------|
| **Supabase** | PostgreSQL、開源、Auth、Realtime、Storage、免費額度高 | 自托管較複雜 | ⭐⭐⭐⭐⭐ |
| Firebase | Google 生態、成熟 | 閉源、 vendor lock-in、台灣連線不穩 | ⭐⭐⭐☆☆ |
| Appwrite | 開源、自托管友好 | 生態較小、文檔不夠成熟 | ⭐⭐⭐⭐☆ |

```
Week 3
├── Day 1-2: Supabase 項目初始化
│   ├── 創建項目、配置數據庫
│   ├── 設計數據表結構 (見下方 Schema)
│   ├── Row Level Security (RLS) 策略
│   └── 環境變量配置 (.env.local / .env.prod)
│
├── Day 3-4: 認證系統
│   ├── 郵箱密碼登入
│   ├── OAuth (Google、GitHub)
│   ├── JWT 刷新機制
│   └── 匿名用戶 → 註冊用戶數據遷移
│
└── Day 5-7: API 抽象層實現
    ├── SupabaseAdapter (實現 IDataAdapter)
    ├── 本地優先策略 (LocalStorage + 後端同步)
    ├── 數據版本控制 (樂觀鎖 / vector clock)
    └── 批量同步 API

Week 4
├── Day 1-2: AI 服務端代理
│   ├── Edge Function: /functions/ai/insight
│   ├── Edge Function: /functions/ai/chat
│   ├── Edge Function: /functions/ai/weekly
│   ├── API Key 存於 Supabase Vault
│   └── 速率限制 (每用戶每日限額)
│
├── Day 3-4: 推送通知
│   ├── Supabase Edge Functions + FCM/APNs
│   ├── 每日提醒排程 (pg_cron)
│   ├── 訂閱管理
│   └── Capacitor Push Notification 插件集成
│
└── Day 5-7: 數據備份與恢復
    ├── 自動每日備份 (Supabase 原生)
    ├── 用戶手動導出/導入增強版
    ├── 數據遷移腳本 (LocalStorage → Supabase)
    └── 災難恢復測試
```

### Phase 3: 高級功能與智能化（第 5-6 週）
**目標: 從「記錄工具」升級為「智能情緒管家」**

```
Week 5
├── Day 1-2: 智能分析後端化
│   ├── 情緒趨勢聚合 (PostgreSQL 窗口函數)
│   ├── 自動週報生成 (排程 + Edge Function)
│   ├── 異常檢測 (連續低能量預警)
│   └── 數據可視化 API (供 GrowthDashboard 使用)
│
├── Day 3-4: 社交功能 (可選)
│   ├── 匿名情緒廣場 (可選分享)
│   ├── 支持者系統 (邀請好友關注)
│   ├── SOS 緊急聯絡人通知
│   └── 隱私控制 (精細化分享權限)
│
└── Day 5-7: 多語言擴展
    ├── i18n 架構 (react-i18next)
    ├── 英語、日語、韓語語言包
    ├── AI 自動翻譯情緒詞彙庫
    └── RTL 支持 (阿拉伯語等)

Week 6
├── Day 1-2: 數據洞察強化
│   ├── 情緒預測 (簡單時序分析)
│   ├── 生理數據關聯分析 (睡眠 vs 情緒)
│   ├── 個性化建議引擎
│   └── 月度/年度報告
│
├── Day 3-4: 語音與多模態
│   ├── 語音轉文字 (Whisper API)
│   ├── 情緒語音日記
│   ├── 圖片情緒表達 (上傳照片)
│   └── 音樂推薦 (根據情緒狀態)
│
└── Day 5-7: 專業整合
    ├── 心理健康資源目錄
    ├── 專業轉介流程
    ├── 危機干預協議
    └── 臨床級數據導出 (供心理師使用)
```

### Phase 4: DevOps 與商業化準備（第 7-8 週）
**目標: 從「個人項目」變為「可持續運營的產品」**

```
Week 7
├── Day 1-2: 監控與分析
│   ├── Sentry 錯誤追蹤集成
│   ├── Plausible/GA4 隱私友好分析
│   ├── 性能監控 (Web Vitals)
│   └── 自定義儀表板 (Grafana)
│
├── Day 3-4: CI/CD 完整鏈路
│   ├── GitHub Actions: PR 檢查 (lint + test + build)
│   ├── 自動化版本發布 (semantic-release)
│   ├── 預覽環境 (Vercel/Netlify Preview)
│   └── 生產部署自動化
│
└── Day 5-7: 商業化準備
    ├── 訂閱系統設計 (Freemium)
    ├── 功能開關 (Feature Flags)
    ├── A/B 測試框架
    └── 合規準備 (GDPR、個資法)

Week 8
├── Day 1-2: 文檔與開發者體驗
│   ├── API 文檔 (Swagger/OpenAPI)
│   ├── 組件文檔 (Storybook)
│   ├── 架構決策記錄 (ADR)
│   └── 貢獻指南更新
│
├── Day 3-4: 安全審計
│   ├── 依賴漏洞掃描 (npm audit)
│   ├── 滲透測試清單
│   ├── 數據隱私影響評估 (DPIA)
│   └── 第三方安全審查準備
│
└── Day 5-7: 發布與回滾
    ├── 灰度發布策略
    ├── 數據庫遷移策略 (零停機)
    ├── 緊急回滾方案
    └── 發布檢查清單
```

---

## 三、數據庫 Schema 設計

```sql
-- 用戶表 (由 Supabase Auth 管理，此處擴展資料)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  avatar_url text,
  timezone text default 'Asia/Taipei',
  language text default 'zh-TW',
  theme_preference text default 'system',
  privacy_pin_hash text, -- bcrypt hash
  privacy_enabled boolean default false,
  notification_settings jsonb default '{}',
  subscription_tier text default 'free',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 情緒記錄表
create table public.emotion_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  -- 覺察數據
  emotions jsonb not null, -- [{ id, name, quadrant, intensity }]
  quadrant text not null,
  intensity integer check (intensity between 1 and 10),
  
  -- Body Scan
  body_scan jsonb,
  
  -- 理解層
  understanding jsonb, -- { trigger, who, what, why }
  
  -- 表達層
  expressing jsonb, -- { method, content, destroyed }
  
  -- 調節層
  regulating jsonb, -- { strategies, duration, effectiveness }
  
  -- 生理數據
  physical_context jsonb, -- { sleep_hours, steps, heart_rate }
  
  -- 調節後
  post_mood text,
  post_intensity integer,
  
  -- 元數據
  is_full_flow boolean default false,
  is_quick_checkin boolean default false,
  note text,
  tags text[],
  
  -- 時間戳
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  local_timestamp text -- 用於離線同步衝突解決
);

-- 成就表
create table public.achievements (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  achievement_key text not null,
  unlocked_at timestamptz default now(),
  viewed boolean default false,
  unique(user_id, achievement_key)
);

-- 連續記錄表
create table public.streaks (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_checkin_date date,
  checkin_count integer default 0,
  weekly_count integer default 0,
  monthly_count integer default 0,
  updated_at timestamptz default now()
);

-- AI 對話歷史
create table public.chat_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  emotion_context jsonb, -- 對話時的情緒狀態
  created_at timestamptz default now()
);

-- 啟用 RLS
alter table public.profiles enable row level security;
alter table public.emotion_logs enable row level security;
alter table public.achievements enable row level security;
alter table public.streaks enable row level security;
alter table public.chat_history enable row level security;

-- RLS 策略: 用戶只能訪問自己的數據
create policy "Users can only access their own data"
  on public.profiles for all
  using (auth.uid() = id);

create policy "Users can only access their own logs"
  on public.emotion_logs for all
  using (auth.uid() = user_id);

create policy "Users can only access their own achievements"
  on public.achievements for all
  using (auth.uid() = user_id);

create policy "Users can only access their own streaks"
  on public.streaks for all
  using (auth.uid() = user_id);

create policy "Users can only access their own chat history"
  on public.chat_history for all
  using (auth.uid() = user_id);
```

---

## 四、技術架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                        用戶層                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Web App   │  │ Android App │  │    iOS App (未來)    │  │
│  │  (PWA+Vite) │  │ (Capacitor) │  │    (Capacitor)      │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼────────────────────┼─────────────┘
          │                │                    │
          └────────────────┴────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                      前端層 (Client)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React 19 + TypeScript + Vite + Zustand              │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  • 狀態管理: Zustand (替代 Context)                   │  │
│  │  • 數據層: DataAdapter (接口抽象)                     │  │
│  │  • 路由: URL hash 持久化                              │  │
│  │  • 離線: IndexedDB 隊列 + Background Sync             │  │
│  │  • 加密: crypto.subtle AES-GCM                        │  │
│  │  • UI: CSS Modules + 設計系統 Token                   │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────┐
│                    邊緣層 (Edge/Serverless)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Supabase Edge Functions (Deno)                      │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  POST /ai/insight    → 調用 GPT-4o 生成情緒洞察       │  │
│  │  POST /ai/chat       → 對話代理 + 上下文管理          │  │
│  │  POST /ai/weekly     → 週報生成 + 趨勢分析            │  │
│  │  POST /push/send     → FCM/APNs 推送通知              │  │
│  │  POST /sync/batch    → 批量數據同步衝突解決           │  │
│  └──────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    數據層 (BaaS)                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Supabase                                            │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │  • PostgreSQL 15  (情緒記錄、用戶資料、對話歷史)      │  │
│  │  • Auth  (OAuth + JWT + 匿名用戶)                     │  │
│  │  • Storage  (頭像、語音、圖片上傳)                    │  │
│  │  • Realtime  (跨設備實時同步)                         │  │
│  │  • Vault  (AI API Key 安全存儲)                       │  │
│  │  • pg_cron  (定時任務: 每日提醒、週報)                │  │
│  │  • RLS  (行級安全策略)                                │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 五、接口設計 (IDataAdapter)

```typescript
// src/adapters/IDataAdapter.ts

export interface IDataAdapter {
  // 認證
  auth: {
    signUp(email: string, password: string): Promise<AuthResult>;
    signIn(email: string, password: string): Promise<AuthResult>;
    signInWithOAuth(provider: 'google' | 'github'): Promise<void>;
    signOut(): Promise<void>;
    getUser(): Promise<User | null>;
    onAuthChange(callback: (user: User | null) => void): () => void;
  };

  // 情緒記錄
  logs: {
    create(log: Omit<EmotionLog, 'id' | 'created_at'>): Promise<EmotionLog>;
    list(options?: ListOptions): Promise<PaginatedResult<EmotionLog>>;
    update(id: string, data: Partial<EmotionLog>): Promise<EmotionLog>;
    delete(id: string): Promise<void>;
    import(logs: EmotionLog[]): Promise<ImportResult>;
    export(): Promise<EmotionLog[]>;
  };

  // 用戶資料
  profile: {
    get(): Promise<Profile | null>;
    update(data: Partial<Profile>): Promise<Profile>;
  };

  // 成就
  achievements: {
    list(): Promise<Achievement[]>;
    unlock(key: string): Promise<Achievement>;
    markAsViewed(id: string): Promise<void>;
  };

  // 連續記錄
  streak: {
    get(): Promise<Streak | null>;
    recordCheckin(date: string): Promise<Streak>;
  };

  // AI (透過後端代理)
  ai: {
    analyze(data: AIAnalysisData): Promise<AIInsight>;
    chat(message: string, history: ChatEntry[]): Promise<string>;
    weeklyInsight(logs: EmotionLog[]): Promise<AIInsight>;
  };

  // 同步
  sync: {
    push(changes: SyncChange[]): Promise<SyncResult>;
    pull(since: string): Promise<SyncChange[]>;
    getStatus(): Promise<SyncStatus>;
  };
}

// 兩個實現
// src/adapters/LocalStorageAdapter.ts  (離線模式)
// src/adapters/SupabaseAdapter.ts      (雲端模式)
```

---

## 六、風險與對策

| 風險 | 概率 | 影響 | 對策 |
|------|------|------|------|
| Supabase 免費額度耗盡 | 中 | 高 | 監控使用量，準備自托管方案 |
| AI API 費用暴漲 | 中 | 高 | 實施速率限制 + 快取機制 |
| 數據遷移失敗 | 低 | 高 | 完整備份 + 回滾腳本 + 測試環境驗證 |
| 用戶抗拒註冊 | 高 | 中 | 保留完整離線模式，雲端為可選增值 |
| 性能退化 | 中 | 中 | Lighthouse CI + 性能基準測試 |
| 安全漏洞 | 低 | 極高 | 定期依賴掃描 + 滲透測試 |

---

## 七、成功指標 (KPI)

| 指標 | 當前 | 目標 | 測量方式 |
|------|------|------|----------|
| Lighthouse Performance | ~95 | ≥98 | Lighthouse CI |
| 測試覆蓋率 | 94.74% | ≥95% | Vitest Coverage |
| TypeScript 嚴格度 | strict | strict + exactOptional | tsc --noEmit |
| 構建時間 | ~? | ≤30s | CI 日誌 |
| 首屏加載 | ~? | ≤1.5s | Web Vitals LCP |
| 離線功能可用率 | 0% | 100% (核心流程) | 手動測試 |
| 數據同步成功率 | N/A | ≥99.9% | 後端日誌 |
| 生產錯誤率 | N/A | ≤0.1% | Sentry |

---

## 八、交付物清單

### Phase 1 交付
- [ ] `src/adapters/` 數據層抽象
- [ ] Zustand 狀態管理重構
- [ ] URL 路由持久化
- [ ] 結構化日誌系統
- [ ] Husky + lint-staged
- [ ] GitHub Actions CI
- [ ] CSS Modules 遷移
- [ ] 性能優化 (memo/virtual list)
- [ ] 客戶端數據加密
- [ ] IndexedDB 離線隊列

### Phase 2 交付
- [ ] Supabase 項目 + 數據庫 Schema
- [ ] Auth 系統 (郵箱 + OAuth)
- [ ] `SupabaseAdapter` 實現
- [ ] Edge Functions (AI 代理)
- [ ] 推送通知系統
- [ ] 數據遷移工具

### Phase 3 交付
- [ ] 智能週報後端化
- [ ] 異常檢測預警
- [ ] i18n 多語言
- [ ] 語音轉文字
- [ ] 專業資源整合

### Phase 4 交付
- [ ] Sentry 監控
- [ ] 完整 CI/CD
- [ ] 訂閱系統設計
- [ ] 安全審計報告
- [ ] 商業化文檔

---

**今心團隊** | 持續進化，永不止步
