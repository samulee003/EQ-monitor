# 今心 ImXin — InsForge 雲端同步 + Agentic Coach 設計文件

**日期**：2026-05-11  
**狀態**：已審閱，待實作  
**作者**：設計協作（用戶 + Claude Code）

---

## 1. 目標與核心原則

### 1.1 目標

1. **InsForge 雲端同步**：讓用戶可選擇性地把情緒輪廓同步到雲端，解鎖跨裝置體驗與 AI 教練記憶
2. **Agentic AI 教練**：從被動回應升級為主動陪伴——教練了解你的情緒模式，在對的時機主動關心你

### 1.2 核心原則

- **隱私優先**：原始情緒記錄（日記內容）永遠不離開裝置，AI 教練只讀元數據（狀態色彩標籤、需求標籤、強度分數）
- **本地優先**：App 完整功能無需帳號，雲端同步為自願升級
- **情緒安全**：App 內對話永遠免費，不設使用次數限制，避免脆弱時刻被打斷

---

## 2. 三層隱私模型

### Tier 1：純本地模式（預設）

- 不需帳號
- 所有情緒日誌 AES-256-GCM 加密存於 localStorage
- App 全功能可用
- AI 教練為單次對話，無跨對話記憶

### Tier 2：教練模式（自願 opt-in）

- 建立帳號後開啟
- **只同步元數據**到 InsForge，原始日誌內容留在裝置
- 解鎖：主動 AI 教練 + 教練記憶（免費 7 天，Pro 無限期）

**同步至 InsForge 的欄位（`coach_context` 表）：**

```
user_id, last_active, streak_days,
recent_quadrants: string[],   // 例：["red","red","blue","red"]
recent_needs: string[],       // 例：["connection","rest"]
avg_intensity: float,
subscription_tier: "free" | "pro",
proactive_count_this_month: int,
line_user_id: string | null,
push_token: string | null,
coach_memory_expires_at: timestamp | null
```

**永遠不上傳：**
- 表達步驟的文字內容
- 身體掃描的具體感受
- 觸發事件描述
- 互動循環細節
- 完整知心四式 步驟內容

### Tier 3：完整備份（二次明確確認）

- 完整日誌加密後備份至 InsForge Storage
- 用途：換裝置時還原
- AI 教練不解密讀取，不用於任何分析
- 用戶可隨時刪除雲端備份

---

## 3. Auth + 資料同步設計

### 3.1 Auth Modal

支援三種登入方式（InsForge 內建）：
- Email + 密碼
- Google OAuth
- GitHub OAuth

**隱私同意（必填）：**
```
☑ 我同意將情緒輪廓備份至雲端，數據僅用於提供個人化 AI 教練功能，不作商業用途。
  [閱讀隱私權政策]

☐ 允許 AI 教練根據我的情緒模式主動傳送關心訊息（可隨時關閉）
```

第一個勾選框為必填，第二個為選填（控制主動觸達功能）。

### 3.2 首次登入遷移

登入成功後，若 localStorage 有歷史數據，觸發一次性遷移：

1. 讀取本機所有 `ruler_logs`
2. 逐筆提取元數據（象限、需求、強度）
3. 計算聚合值，寫入 `coach_context`
4. 本機數據保留，不刪除
5. 標記遷移完成（`migration_completed_at`）

遷移期間顯示進度畫面，逐類別顯示狀態。

### 3.3 雙寫策略（遷移後）

每次完成 情緒記錄後：

1. 立刻寫入 localStorage（即時，離線可用）
2. 背景提取元數據，更新 `coach_context`（非同步）
3. 網路斷開時：元數據進入離線佇列，恢復連線後補同步

讀取優先級：
- 已登入且在線：InsForge 為主
- 離線 / 訪客：localStorage 為主

---

## 4. Agentic Coach 架構

### 4.1 整體架構

```
裝置（本地）
  ↓ 完成記錄後上傳元數據
InsForge coach_context 表
  ↓ InsForge schedules 定時觸發
coach-agent Edge Function
  ↓ 讀取 coach_context，生成訊息
LINE Bot 推送 / PWA 推播
```

### 4.2 四種觸發

#### 觸發①：連續天數中斷（每小時排程）
- 條件：`last_active > 24h AND streak_days ≥ 3`
- 訊息風格：「你已經 N 天沒有記錄了，還好嗎？」
- 頻率限制：每次中斷週期只觸發一次

#### 觸發②：情緒模式偵測（每日排程）
- 條件：`最近 5 筆中 ≥ 3 筆為紅色狀態 AND avg_intensity ≥ 7`
- 訊息風格：「你最近壓力好像不小，今天有空聊聊嗎？」
- 頻率限制：每週最多 2 次

#### 觸發③：週報對話（每週一排程）
- 條件：上週有 ≥ 2 次記錄
- 訊息風格：「上週你記錄了 N 次，主要在 X 象限，主要需求是 Y...」
- 頻率：固定每週一次

#### 觸發④：完成記錄後（客戶端即時，永遠免費）
- 觸發：用戶完成 知心四式流程後，客戶端直接呼叫 coach-agent
- 不走排程，不計入每月配額
- 免費 / Pro 用戶均享有

### 4.3 訊息生成

`coach-agent` edge function 使用 InsForge AI（建議：`anthropic/claude-sonnet-4.5`）：

```
系統提示 = 知心四式 教練角色 + 今心品牌口吻
輸入 = coach_context 中的元數據（非原始內容）
輸出 = 溫暖、簡短的繁體中文訊息（≤ 100 字）
```

訊息不得推測原始日記內容，只能基於狀態色彩標籤和需求標籤。

### 4.4 發送管道

依用戶設定選擇：
- **LINE Bot**：透過 LINE Messaging API 主動推送，用戶點擊進入對話
- **PWA 推播**：Web Push Notification，點擊後開啟 App 的 Coach 頁面
- 兩者可同時啟用

---

## 5. 免費額度 + 訂閱模型

### 5.1 方案對比

| 功能 | 免費 | Pro |
|------|------|-----|
| App 內 AI 教練對話 | 無限 | 無限 |
| 完成後即時觸達（觸發④） | 無限 | 無限 |
| 主動觸達（觸發①②③） | 每月 3 次 | 無限 |
| 教練記憶持續時間 | 7 天（從最後一次登入起算） | 無限期 |
| 完整備份（Tier 3） | ✗ | ✓（可選） |

### 5.2 定價

| 方案 | USD | MOP |
|------|-----|-----|
| 月付 | $5 / 月 | MOP 50 / 月 |
| 年付 | $45 / 年（省 25%） | MOP 450 / 年 |

### 5.3 支付閘道

- **Stripe**（InsForge 內建）：信用卡、Apple Pay、Google Pay，幣別 USD
- **MPAY / 支付寶 / 微信支付**（Sprint 3，待 skill 集成）：幣別 MOP/CNY

訂閱啟用後：
- Stripe webhook → InsForge edge function → 更新 `coach_context.subscription_tier = "pro"`
- 即時生效，無需用戶重啟 App

### 5.4 配額防護邏輯（`coach-agent` 內）

```
if trigger in [①, ②, ③]:
  if subscription_tier == "free" AND proactive_count_this_month >= 3:
    skip (或改送升級提示)
    return
  generate_and_send_message()
  proactive_count_this_month += 1

if trigger == ④:
  generate_and_send_message()  // 永遠執行，不計配額
```

月初重置：InsForge schedule 每月 1 日 00:00 → 所有用戶 `proactive_count_this_month = 0`

---

## 6. 升級觸發點（UX）

1. **配額用完時**：教練改送「本月免費陪伴次數已用完，升級繼續讓我陪著你 →」
2. **App 設定頁**：「教練方案」區塊隨時可查看 / 升級
3. **教練記憶到期**：7 天到期前，教練提示「我快記不住你了，升級讓我一直記得你的旅程」

---

## 7. Sprint 路線圖

### Sprint 1：InsForge 基礎 + 即時教練（1–2 週）

1. `coach_context` 資料表 SQL migration
2. Auth Modal UI（Email + Google/GitHub）+ 隱私同意勾選
3. 首次登入遷移流程（localStorage → coach_context 元數據）
4. 完成記錄後上傳元數據到 `coach_context`（雙寫）
5. 升級現有 `coach` edge function，加入持久記憶（讀寫 `coach_context`）
6. 觸發④：完成後即時呼叫，有教練記憶

**Sprint 1 交付物**：用戶能登入、有跨對話教練記憶、完成記錄後即時獲得 AI 回應

### Sprint 2：Stripe 訂閱 + 主動觸達（1–2 週）

1. Stripe 設定（`npx @insforge/cli payments config set`）
2. 升級頁面 UI（方案對比 + 支付方式選擇）
3. Stripe webhook handler edge function
4. `coach-agent` edge function（含觸發①②③ + 配額防護）
5. InsForge schedules 設定（每小時 / 每日 / 每週一）
6. LINE Bot 主動推送集成（觸發①②③）

**Sprint 2 交付物**：Freemium 模型完整運作，LINE Bot 會主動關心用戶

### Sprint 3：PWA 推播 + 澳門支付（待 skill 到位）

1. PWA Web Push Notification 集成（Service Worker）
2. MPAY skill 集成
3. 支付寶 skill 集成
4. 微信支付 skill 集成
5. Tier 3 完整備份（選填）

**Sprint 3 交付物**：全管道、全支付方式上線

---

## 8. 新增資料表

### `coach_context`（InsForge，RLS 啟用）

```sql
CREATE TABLE coach_context (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  last_active timestamptz,
  streak_days int DEFAULT 0,
  recent_quadrants text[] DEFAULT '{}',
  recent_needs text[] DEFAULT '{}',
  avg_intensity float DEFAULT 0,
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free','pro')),
  proactive_count_this_month int DEFAULT 0,
  coach_opted_in boolean DEFAULT false,
  line_user_id text,
  push_token text,
  coach_memory_expires_at timestamptz,
  migration_completed_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- RLS：只能讀寫自己的資料
ALTER TABLE coach_context ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own data" ON coach_context
  USING (user_id = auth.uid());
```

---

## 9. 不在此 Spec 範圍內

- Tier 3 完整備份的加密方案細節（Sprint 3 另行設計）
- MPAY / 支付寶 / 微信支付的具體 API 流程（待 skill 提供）
- Android Capacitor 推播（先聚焦 LINE Bot + PWA）
- E2E 測試覆蓋（現有 Vitest 單元測試繼續適用）
