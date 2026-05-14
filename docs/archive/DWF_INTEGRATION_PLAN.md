# Dealing with Feeling 整合開發計劃

> **制定日期**: 2026-05-10
> **基礎**: Marc Brackett《Dealing with Feeling》五大模組 → 今心 ImXin 現有架構
> **目標**: 補齊認知調節策略、Meta-Moment 急救流程、人際支援、PRIME 目標框架
> **預估工期**: 4 期，共 6-8 週

---

## 零、對齊度總覽

| 模組 | 名稱 | 對齊度 | 整合難度 | 優先級 |
|------|------|--------|---------|--------|
| 一 | 精確標記 Labeling | **90%** | 極低 | P3 |
| 二 | 緊急應對 Emergency | **40%** | 中 | **P1** |
| 三 | 策略工具箱 Strategies | **45%** | 中高 | **P1** |
| 四 | 人際支援 Co-Regulation | **5%** | 中 | P2 |
| 五 | 基礎建設 Foundations | **15%** | 低～高 | P2 |

---

## 第一期：認知策略 + Meta-Moment（P1，2 週）

### 1A. SOSMode 重構為 Meta-Moment 流程

**現狀問題：** SOSMode 是「情境驅動」（選情境→靜態呼吸→行動→完成），缺少書中最核心的「後設時刻」四步結構。

**目標流程：**

```
Sense（感知）→ Stop（暫停）→ See Best Self（看見最好的自己）→ Strategize（制定策略）
```

**具體改動：**

#### 1A-1. 新增「理想自我」設定機制

- **文件**: `src/services/SettingsService.ts`（或擴展 `settingsStore`）
- **存儲鍵**: `imxin_best_self`
- **數據結構**:
  ```typescript
  interface BestSelfProfile {
      adjectives: string[];    // 用戶選擇的形容詞，如「有耐心的」「冷靜的」「溫柔的」
      intention: string;       // 自由輸入的理想自我描述
      avatarEmoji: string;     // 選一個代表自己的 emoji
      lastUpdated: string;
  }
  ```
- **預設形容詞庫**: 有耐心的、冷靜的、溫柔的、堅定的、充滿同理心的、勇敢的、包容的、清晰的、慈悲的、有力量的
- **在哪設定**: OnboardingFlow 新增一步（Step 8.5）+ 用戶資料頁可隨時修改

#### 1A-2. 重構 SOSMode 四步流程

- **文件**: `src/components/SOSMode.tsx` + `src/components/SOSMode.css`
- **類型變更**:
  ```typescript
  // 舊
  type SOSStep = 'select' | 'breathe' | 'action' | 'complete';
  // 新
  type MetaMomentStep = 'sense' | 'stop' | 'seeBestSelf' | 'strategize' | 'complete';
  ```
- **Step 1: Sense（感知）**
  - 畫面：身體掃描速覽（頭部、胸口、肩膀、腹部 四個大區域）
  - 互動：用戶點選身體有感覺的部位，選擇 1-2 個感覺（緊繃、心跳加速、沉重、灼熱）
  - 文案：「你現在有什麼感覺？先察覺身體的變化。」
  - 保留舊的情境快捷入口（可選，放在底部：「或選擇情境快速進入 →」）

- **Step 2: Stop（暫停）**
  - 畫面：**互動式呼吸節拍器**（復用 RegulatingStep 的 pacer-circle 動畫）
  - 節奏：4-4-6（吸氣-屏息-吐氣），至少完成 2 個循環
  - 替換現有的靜態呼吸文字
  - 文案：「暫停。給自己一個呼吸的空間。」

- **Step 3: See Best Self（看見最好的自己）**
  - 畫面：展示用戶預設的「理想自我」形容詞 + emoji + 意圖聲明
  - 動效：形容詞逐個浮現（fadeIn + translateY），營造「喚醒」感
  - 底部提示：「這是你在最清醒時想成為的人。」
  - 如果用戶尚未設定：引導快速設定（3 個形容詞 + 1 句話）

- **Step 4: Strategize（制定策略）**
  - 畫面：從 RegulatingStep 的策略清單中抽取適合的策略（根據 Sense 步驟的身體感覺推薦）
  - 規則：
    - 緊繃/心跳加速 → 推薦深呼吸、冰水刺激
    - 沉重/空洞 → 推薦暖心儀式、自我慈悲
    - 灼熱/震動 → 推薦強效宣洩、暫停卡
  - 保留原有的 3 個情境快捷路線（yelled/crying/overwhelmed）作為「快捷模式」入口

- **Step 5: Complete** — 不變

#### 1A-3. 新增類型定義

- **文件**: `src/types/RulerTypes.ts`
- ```typescript
  export interface MetaMomentData {
      sensedAreas: string[];       // 感知到的身體部位
      sensedSensations: string[];  // 感知到的感覺
      breathCyclesCompleted: number;
      bestSelfViewed: boolean;
      selectedStrategy: string;
      quickScenario?: SOSScenario;  // 如果走快捷路線
  }
  ```

#### 1A-4. RulerLogEntry 擴展

- **文件**: `src/types/RulerTypes.ts`
- 在 `RulerLogEntry` 新增可選欄位:
  ```typescript
  metaMomentData?: MetaMomentData;
  ```

---

### 1B. RegulatingStep 新增認知轉向策略

**現狀問題：** 21 個策略偏生理（呼吸、接地、身體），缺書中三大認知策略。

**新增策略：**

#### 1B-1. 時間旅行模擬器（Temporal Distancing）

- **觸發象限**: Red（焦慮、憤怒）、Blue（沮喪、無助）
- **互動流程**:
  1. 用戶輸入/選擇困擾事件（可從 UnderstandingStep 的 trigger 帶入）
  2. 三個時間節點卡片逐張翻開：
     - 「一週後，這件事還重要嗎？」→ 用戶選 重要/不太重要/不重要
     - 「一個月後呢？」→ 同上
     - 「一年後呢？」→ 同上
  3. 結果摘要：「你覺得這件事在一年後仍然重要的機率是 X%」
  4. 反思提示：「當我們拉開時間距離，很多讓我們痛苦的事情會變小。這不代表你的感受不重要，而是幫助你找到前進的力量。」
- **type**: `'interactive'`
- **icon**: 在 `SvgIcons.tsx` 新增 `timeTravel` 圖標（時鐘+箭頭）

#### 1B-2. 抽離式自我對話（Distanced Self-talk）

- **觸發象限**: Red、Blue
- **互動流程**:
  1. 說明：「試著用第三人稱對自己說話。研究顯示，這樣做能讓大腦切換到更理性的模式。」
  2. 用戶選擇自稱方式：「他/她」或自己的名字（從用戶資料帶入）
  3. 引導書寫：
     - 先用第一人稱寫一句現在的感受（自動帶入：「我覺得...」）
     - 然後強制用第三人稱改寫：「[名字] 覺得...」
  4. 對比顯示：左邊第一人稱 vs 右邊第三人稱
  5. 底部提示：「你會發現，當你用旁觀者的角度看待自己，情緒的衝擊會自然減弱。」
- **type**: `'interactive'`
- **icon**: 在 `SvgIcons.tsx` 新增 `distancedTalk` 圖標（對話框+人影）

#### 1B-3. 重新評估（Cognitive Reappraisal）

- **觸發象限**: Red（憤怒、焦慮）
- **互動流程**:
  1. 用戶簡述觸發事件（可從 UnderstandingStep 帶入）
  2. 三個引導式問題，逐一呈現：
     - 「有沒有另一種方式來解釋對方的行為？」
     - 「如果這件事發生在你的好朋友身上，你會怎麼跟他說？」
     - 「五年後的你回看這件事，會有什麼不同的理解？」
  3. 每個問題提供文字輸入框
  4. 最後展示用戶的三個回答，加上提示：「你剛才做了一件很了不起的事——你選擇了換一個角度看問題。這不是否定你的感受，而是擴展你的選擇。」
- **type**: `'interactive'`
- **icon**: 在 `SvgIcons.tsx` 新增 `reappraisal` 圖標（翻轉的透視圖）

#### 1B-4. 新增兩種呼吸模式

- **箱型呼吸 Box Breathing (4-4-4-4)**
  - 加入 RegulatingStep 的 Red 象限策略
  - 節奏：吸氣 4s → 屏息 4s → 吐氣 4s → 屏息 4s
  - 畫面：方形軌跡動畫（四邊等長，視覺化「箱」的概念）
  - 復用現有 pacer-circle，但增加第四階段 `holdAfterExhale`

- **諧振呼吸 Coherent Breathing (5-5)**
  - 加入 RegulatingStep 的 Green/Blue 象限策略
  - 節奏：吸氣 5s → 吐氣 5s
  - 畫面：正弦波動畫（模擬心率變異性的諧振狀態）
  - 無屏息階段，更適合長期自律神經調節

- **架構改動**: 抽取呼吸邏輯為共用的 `BreathingPacer` 組件
  - **新文件**: `src/components/BreathingPacer.tsx`
  - Props: `pattern: '4-4-6' | '4-4-4-4' | '5-5'`, `onComplete?: () => void`
  - 統一 RegulatingStep 和 SOSMode（Meta-Moment Stop 步驟）的呼吸動畫

---

### 1C. 策略分類重組

**現狀：** 策略按象限分組，沒有「生理 vs 認知」的區分。

**改為雙層分類：**

```
┌── 生理調節（Quiet Mind & Body）
│   ├── 引導式深呼吸 (4-4-6)
│   ├── 箱型呼吸 (4-4-4-4) ✨新
│   ├── 諧振呼吸 (5-5) ✨新
│   ├── 5-4-3-2-1 接地法
│   ├── 強效宣洩
│   └── 冰水刺激
├── 認知轉向（Redirecting Thoughts）✨新分類
│   ├── 時間旅行模擬器 ✨新
│   ├── 抽離式自我對話 ✨新
│   └── 重新評估 ✨新
├── 自我慈悲（Self-Compassion）
│   ├── 暖心儀式
│   ├── 自我慈悲
│   ├── 自我慈悲三步驟 (parent)
│   └── 不完美宣言 (parent)
└── 行動與連結（Action & Connection）
    ├── 暫停卡 (parent)
    ├── 修復對話 (parent)
    ├── 感恩清單
    ├── 傳遞喜悦
    └── ...
```

**UI 改動**: RegulatingStep 策略列表上方加分類 Tab 切換，或用 section header 分隔。

---

## 第二期：PRIME 目標框架 + 情緒預算（P2，1.5 週）

### 2A. PRIME 目標規劃器

**概念**: Brackett 書中的 PRIME 框架，讓用戶主動管理情緒而非被動反應。

- **新文件**: `src/components/PRIMEGoals.tsx`
- **新文件**: `src/services/PRIMEService.ts`
- **數據結構**:
  ```typescript
  interface PRIMEGoal {
      id: string;
      category: 'prevent' | 'reduce' | 'initiate' | 'maintain' | 'enhance';
      title: string;
      description: string;
      strategies: string[];     // 關聯的調節策略
      frequency: 'daily' | 'weekly' | 'asNeeded';
      createdAt: string;
      completedAt?: string;
      isActive: boolean;
  }
  ```
- **UI 設計**:
  - 5 個卡片對應 P-R-I-M-E，Morandi 配色（紅-黃-綠-藍-紫）
  - 每個卡片可展開添加/查看目標
  - 目標完成時可標記，累計進度
  - 入口：GrowthDashboard 新增 PRIME 分區 + 底部導航新增「目標」入口

- **PRIME 說明文案**:
  - **P 預防 (Prevent)**: 設定界線，避開會引發不想要情緒的情境
  - **R 減少 (Reduce)**: 當不可避免時，計畫如何減少負面感受
  - **I 引發 (Initiate)**: 排定能創造好心情的活動
  - **M 維持 (Maintain)**: 記錄並品味快樂的時刻
  - **E 增強 (Enhance)**: 思考如何放大或延長正向情緒

### 2B. 情緒預算追蹤器（手動版）

**概念**: 情緒調節需要消耗心理資源，身體狀態差時調節能力下降。

- **擴展文件**: `src/services/PhysicalService.ts`
- **新增數據欄位**:
  ```typescript
  interface PhysicalData {
      sleepHours: number;
      steps: number;
      waterGlasses?: number;       // 新增：水分攝取
      mealQuality?: 1 | 2 | 3;    // 新增：飲食品質（差/普通/好）
      exerciseMinutes?: number;    // 新增：運動時間
      heartRateVariability?: number;
  }
  ```
- **情緒預算計算**:
  ```typescript
  function calculateEmotionBudget(data: PhysicalData): number {
      let budget = 50; // 基礎值
      if (data.sleepHours >= 7) budget += 20;
      else if (data.sleepHours < 5) budget -= 25;
      else if (data.sleepHours < 6) budget -= 15;
      if (data.waterGlasses && data.waterGlasses >= 6) budget += 5;
      if (data.exerciseMinutes && data.exerciseMinutes >= 20) budget += 10;
      if (data.mealQuality === 3) budget += 5;
      if (data.mealQuality === 1) budget -= 5;
      return Math.max(0, Math.min(100, budget));
  }
  ```
- **UI 位置**: CheckInFlow 的 NeuroCheckStep 中加入預算儀表板
- **低預算提醒**: 當 budget < 30 時，在首頁顯示溫和提醒：「今天的情緒預算偏低，照顧好自己比解決問題更重要。」

### 2C. 預算視覺化

- **擴展文件**: `src/components/GrowthDashboard.tsx`
- 新增「情緒預算趨勢」折線圖（7 日）
- 交叉顯示：情緒強度 vs 預算的關聯（當預算低時，高強度負面情緒是否更頻繁）

---

## 第三期：人際支援與共同調節（P2，2 週）

### 3A. 「馬文叔叔」聯絡簿

**概念**: 用戶設定信任聯絡人，情緒低落時一鍵求助。

- **新文件**: `src/components/SafetyNetContacts.tsx`
- **新文件**: `src/services/SafetyNetService.ts`
- **數據結構**:
  ```typescript
  interface SafetyNetContact {
      id: string;
      name: string;
      relation: string;          // 伴侶、摯友、家人、諮商師、其他
      phone?: string;
      lineId?: string;
      presetMessage: string;     // 預設求助訊息
      isPrimary: boolean;        // 主要聯絡人（最多 1 位）
  }
  ```
- **預設求助訊息模板**:
  - 「我現在有點低落，可以陪我聊聊嗎？」
  - 「我正在做情緒覺察練習，想跟你分享我的感受。」
  - 「我需要一些陪伴，不用給建議，聽我說就好。」
  - 自訂
- **最多 5 位聯絡人**
- **入口**: SOSMode（Meta-Moment）的 Strategize 步驟 + 主頁快捷按鈕

### 3B. LINE Bot 整合（一鍵求助）

- **概念**: 利用今心已有的 LINE Bot 基礎設施
- **流程**: 用戶在 APP 點「求助」→ 觸發 LINE 訊息推送到信任聯絡人
- **技術**: 需要後端 API 支持訊息推送（第二期後端規劃中）
- **備選方案（無後端）**: 生成文字複製到剪貼板 + LINE 分享 deep link

### 3C. 共同調節指南

- **新文件**: `src/components/CoRegulationGuide.tsx`
- **內容**: 情境式提示卡，靜態內容為主
- **場景**:
  1. 「伴侶情緒低落時」— 先傾聽、不要急著給建議、提供身體接觸
  2. 「孩子鬧情緒時」— 蹲下來、確認感受、再引導
  3. 「朋友傷心時」— 陪在旁邊、允許沉默、避免毒性正能量
  4. 「同事壓力大時」— 給空間、小善意、不追問
- **反模式提醒卡**:
  - 不要說「別難過了」（否定感受）
  - 不要說「你看別人更慘」（比較痛苦）
  - 不要急著給解決方案（跳過傾聽）
- **入口**: GrowthDashboard 或主頁

---

## 第四期：精確標記增強 + 整合打磨（P3，1 週）

### 4A. 情緒詞彙跨文化擴充

- **文件**: `src/data/emotionData.ts`
- 每個象限增加 5-8 個跨文化情緒詞彙（附原文）:
  - Red: schadenfreude（幸災樂禍）、hán xián（含恨）
  - Yellow: gemütlichkeit（溫馨舒適感）、ikigai（生存價值感）
  - Blue: hiraeth（對不存在之地的鄉愁）、saudade（深層思念）
  - Green: wabi-sabi（侘寂之美）、hygge（舒適滿足）
- 每個詞附 `culturalNote` 欄位，點擊可展開解釋

### 4B. 整合打磨

- **OnboardingFlow 更新**: 新增「設定理想自我」步驟（Step 8.5）
- **成就系統擴展**: 新增與新功能相關的成就
  - 「後設時刻大師」— 完成 5 次 Meta-Moment
  - 「認知轉向者」— 使用過所有 3 種認知策略
  - 「PRIME 實踐家」— 在每個 PRIME 類別都設定過目標
  - 「安全網編織者」— 設定 3 位以上信任聯絡人
- **AI 洞察整合**: AIService 的 prompts.ts 更新，讓 AI 洞察可以引用新功能
- **AGENTS.md 更新**: 反映新組件、新類型、新路徑

---

## 文件改動清單

### 新增文件

| 文件路徑 | 用途 |
|---------|------|
| `src/components/BreathingPacer.tsx` | 共用呼吸節拍器組件 |
| `src/components/PRIMEGoals.tsx` | PRIME 目標規劃器 |
| `src/services/PRIMEService.ts` | PRIME 目標數據服務 |
| `src/components/SafetyNetContacts.tsx` | 信任聯絡人管理 |
| `src/services/SafetyNetService.ts` | 聯絡人數據服務 |
| `src/components/CoRegulationGuide.tsx` | 共同調節指南 |
| `src/components/TemporalDistance.tsx` | 時間旅行互動組件 |
| `src/components/DistancedSelfTalk.tsx` | 抽離式自我對話組件 |
| `src/components/CognitiveReappraisal.tsx` | 重新評估互動組件 |

### 修改文件

| 文件路徑 | 改動內容 |
|---------|---------|
| `src/components/SOSMode.tsx` | 重構為 Meta-Moment 四步流程 |
| `src/components/SOSMode.css` | 配合新流程的樣式更新 |
| `src/components/RegulatingStep.tsx` | 新增 5 個策略 + 分類 Tab + 引用 BreathingPacer |
| `src/components/OnboardingFlow.tsx` | 新增理想自我設定步驟 |
| `src/components/GrowthDashboard.tsx` | 新增 PRIME 分區 + 情緒預算趨勢圖 |
| `src/components/AchievementPage.tsx` | 新增 4 個成就 |
| `src/components/CheckInFlow.tsx` | NeuroCheckStep 加入預算儀表板 |
| `src/components/ParentHome.tsx` | 新增安全網快捷入口 |
| `src/services/PhysicalService.ts` | 擴展數據欄位 + 情緒預算計算 |
| `src/services/AIService.ts` | prompts 整合新功能 |
| `src/data/emotionData.ts` | 跨文化情緒詞彙擴充 |
| `src/types/RulerTypes.ts` | 新增 MetaMomentData + PRIMEGoal 等類型 |
| `src/components/icons/SvgIcons.tsx` | 新增 5 個圖標 |
| `AGENTS.md` | 反映新組件結構 |

---

## 風險與依賴

| 風險 | 影響 | 緩解策略 |
|------|------|---------|
| Meta-Moment 流程比舊 SOS 更長，用戶可能在急性情緒下失去耐心 | 使用率下降 | 保留「快捷情境」路線，30 秒內可完成；Meta-Moment 全程約 3-5 分鐘 |
| 認知策略互動組件複雜度高 | 開發延期 | 先做時間旅行（最簡單），再做抽離式對話，最後做重新評估 |
| LINE Bot 求助功能需要後端 | 第三期阻塞 | 備選方案：剪貼板 + deep link，不依賴後端 |
| HealthKit 整合需要 Capacitor 插件 + Apple 審核 | 延期 | 手動輸入先行，HealthKit 列為未來里程碑 |
| 新策略增多可能讓 RegulatingStep 列表過長 | UX 混亂 | 分類 Tab 解決；也考慮「智能推薦」只顯示 3 個最相關的 |

---

## 與現有計劃的關係

- 本計劃與 `PLAN.md`（全面打磨計畫）和 `TEAM_TECH_UPGRADE_PLAN.md`（技術提升方案）互補
- 本計劃專注**功能層面**的增長；PLAN.md 專注**架構和後端**的升級
- 建議執行順序：P0/P1 安全修復（已完成）→ 本計劃第一期（認知策略）→ PLAN.md 後端搭建 → 本計劃第三期（LINE Bot 整合需要後端）
