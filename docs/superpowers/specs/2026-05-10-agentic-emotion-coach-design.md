# Agentic Emotion Coach — Design Spec

> **Goal:** 在既有今心 APP 上疊加一層 AI 情緒教練（Google ADK JS），1 日 MVP 交付對話介面 + Meta-Moment SOS。

**Architecture:** 漸進式擴充。不改動既有 RULER 流程，新增 `/coach` 頁面與 Edge Function API。ADK Agent 讀取使用者情緒歷史（InsForge DB），透過 Skill 執行 Meta-Moment 流程。

**Tech Stack:** React 19 + TypeScript + Vite, Google ADK JS v1.0.0, InsForge Edge Functions (Deno), Tailwind CSS 3.4.

---

## 資料流

```
User ──→ CoachPage (React) ──POST /api/coach──→ Edge Function (coach.ts)
                                                        │
                                                        ↓
                                              ADK Runner (Deno)
                                                        │
                              ┌─────────────────────────┼─────────────────────────┐
                              ↓                         ↓                         ↓
                      EmotionCoachAgent         MetaMomentSkill          RulerDataTool
                      (LlmAgent)                (ADK Skill)              (DB Query)
                              │                         │                         │
                              └─────────────────────────┴─────────────────────────┘
                                                        │
                                                        ↓
                                              JSON Response ──→ CoachPage
```

## 五大模組排程

| 模組 | 排程 | 實作方式 |
|---|---|---|
| Meta-Moment (Emergency) | **第 1 天** | ADK Skill + 前端 SOS UI |
| Labeling (Mood Meter) | 第 2 週 | Agent 引導對話版，取代既有打卡 |
| Strategies | 第 2 週 | ADK Skills（呼吸、時間旅行、抽離對話） |
| Co-Regulation | 第 3 週 | 聯絡人工具 + 訊息模板 |
| Foundations | 第 3 週 | 健康數據 Tool + PRIME 規劃 Skill |
| 主動推播 | 第 3 週 | Edge Function Cron + 推播通知 |

## ADK Agent 設計

### EmotionCoachAgent

```typescript
const emotionCoachAgent = new LlmAgent({
  name: 'EmotionCoachAgent',
  description: 'A compassionate emotional regulation coach based on RULER and Dealing with Feeling.',
  instruction: `
    You are a compassionate emotional regulation coach trained in the RULER framework 
    (Recognize, Understand, Label, Express, Regulate) and Marc Brackett's "Permission to Feel".
    
    Your communication style:
    - Warm, non-judgmental, and validating
    - Use Traditional Chinese (zh-TW) for all responses
    - Ask open-ended questions to help users explore their emotions
    - Never dismiss or minimize the user's feelings
    
    You have access to:
    1. The user's emotion history (via RulerDataTool)
    2. Meta-Moment emergency intervention (via MetaMomentSkill)
    3. Various regulation strategies (future: breathing, distanced self-talk, etc.)
    
    When a user is in crisis or highly distressed, immediately invoke MetaMomentSkill.
    Otherwise, engage in supportive dialogue and offer personalized insights based on their history.
  `,
  tools: [rulerDataTool],
  beforeModelCallback: async (context) => {
    // Check if user is in crisis based on recent logs
    return context;
  },
});
```

### MetaMomentSkill

```typescript
const metaMomentSkill = new LlmAgent({
  name: 'MetaMomentSkill',
  description: 'Emergency emotional regulation intervention using the Meta-Moment framework.',
  instruction: `
    Guide the user through the 4-step Meta-Moment protocol:
    
    Step 1 - Sense (感知): Help the user notice physical sensations
    Step 2 - Stop (暫停): Guide deep breathing (4-7-8 pattern)
    Step 3 - See Your Best Self (看見最好自己): Ask user to recall their ideal self qualities
    Step 4 - Strategize & Act (策略行動): Offer regulation strategies from the toolbox
    
    Always proceed step by step. Do not skip steps. Confirm user readiness before advancing.
  `,
});
```

### RulerDataTool

讀取 `ruler_logs` 和 `streaks`，返回格式化摘要供 agent 參考。

---

## API 合約

### POST /api/coach

**Request:**
```json
{
  "message": "我覺得好煩",
  "userId": "uuid",
  "sessionId": "uuid"
}
```

**Response:**
```json
{
  "response": "聽起來你現在很不舒服...",
  "skillInvoked": "MetaMomentSkill",
  "step": 1,
  "metadata": {
    "emotions_detected": ["煩躁"],
    "suggested_intensity": 7
  }
}
```

---

## 前端設計

### CoachPage

- 全螢幕對話介面（類似 ChatGPT mobile app）
- 頂部：「今心教練」標題 + 設定按鈕
- 中間：訊息氣泡（使用者右側、AI 左側）
- 底部：輸入框 + 送出按鈕 + 🆘 SOS 按鈕（紅色浮動）
- SOS 觸發時：全螢幕覆蓋 Meta-Moment 流程 UI

### MetaMomentOverlay

Step-by-step wizard UI:
1. Sense: 身體掃描動畫 + 引導文字
2. Stop: 呼吸動畫（圓形擴縮 + 4-7-8 節拍）
3. Best Self: 顯示使用者預設的「理想自我」詞卡
4. Strategize: 策略選單（呼吸、散步、打電話給馬文叔叔...）
