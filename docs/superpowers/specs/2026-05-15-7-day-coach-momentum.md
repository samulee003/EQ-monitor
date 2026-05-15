# 今心 ImXin — 7 日推動感與 Coach 遊戲化待辦規格

- **版本日期**：2026-05-15
- **文件狀態**：Phase 1 action-loop MVP implementation plan written
- **適用範圍**：PWA Coach 第一版；LINE Bot 暫不建立小行動
- **核心目標**：讓使用者在 7 天內感覺「阿念真的有推動我生活一點點」

> Implementation note: the first implementation plan is `docs/superpowers/plans/2026-05-15-complete-agentic-action-loop.md`. It prioritizes runtime loop, trace, micro-action lifecycle, safety guardrails, and Coach UI before full shop / Pro surfaces.

---

## 1. North Star

今心下一階段不只要讓 Coach 會聊天，而是要讓使用者在 7 天內完成至少一次真實的小行動閉環。

**7 日推動感** 定義：

> 使用者在開始使用今心後 7 天內，主觀感覺阿念讓自己在生活裡多前進了一點點。

第一版驗收：

1. 阿念提出或挑選一個小行動。
2. 使用者明確確認。
3. 使用者在 24 小時內回來回報 `completed`、`partial` 或 `skipped`。
4. 阿念根據回報調整下一步。
5. 使用者能說出一句：「這有讓我多動一點。」

這不是治療成效，不承諾 7 天改善焦慮、親子關係或心理狀態。

---

## 2. 產品定位

此功能把阿念定位為 **B+ 情緒教練**：

- 不是單純聊天機器人。
- 不是心理師、治療師、診斷工具或危機處置服務。
- 不是全自主生活代理。
- 是一個會把情緒整理成低風險小行動，並陪使用者回來看一眼的 AI 情緒教練。

### 2.1 Agentic AI 角色

阿念在此規格中的產品角色是 **Agentic 情緒代理**，不是普通聊天框，也不是單純的遊戲化待辦工具。

Agentic 的意思是：

1. **讀脈絡**：讀取今心內部脈絡，例如情緒紀錄、LINE 互動、Coach 對話、小行動回報。
2. **判斷下一步**：根據使用者當下狀態與近期模式，決定先陪聊、先降載、先記錄、先建立小行動或先進 SOS。
3. **使用工具**：透過工具建立小行動、查詢 active 小行動、記錄回報、發放 XP / 金幣、整理行動回顧。
4. **維持狀態**：記得 7 日小陪跑進度、active 小行動、復盤連續與 Day 7 小結所需資料。
5. **回來時調整**：使用者回報 completed、partial 或 skipped 後，阿念要調整下一個小行動，而不是只說鼓勵語。

此規格要求 **完整 Agentic Action Loop**，不是單次工具呼叫：

```text
Observe  讀取使用者輸入、session、active 小行動、陪跑進度與風險訊號
Orient   判斷目前是陪聊、降載、建立小行動、回報、遊戲化摘要、Day 7 小結或 SOS
Plan     選擇下一個可執行步驟與需要的工具
Act      呼叫工具或 deterministic service 執行狀態變更
Persist  保存事件、狀態、工具結果與必要的最小資料
Evaluate 檢查安全守門、過期、獎勵、是否完成小行動閉環
Adjust   生成回覆與下一步，必要時再次回到 Observe / Plan
```

LLM 負責語意判斷與自然語言陪伴；deterministic code 負責狀態轉移、副作用、XP / 金幣、過期、權限與安全守門。不能讓 LLM 直接決定資料是否有效、是否發獎勵或是否覆寫安全規則。

因此：

- **7 日推動感** 是 Agentic 能力的產品驗收。
- **小行動閉環** 是 Agentic 能力的最小可見行為。
- **遊戲化待辦** 是 Agentic 情緒代理用來推動生活微行動的工具層，不是產品本體。
- **阿念 Pro** 賣的是更長期、更個人化的 Agentic 行動陪跑，不是單純 AI 聊天訂閱。

阿念不能做：

- 未授權讀取外部 App。
- 自動替使用者做重大生活決策。
- 主動聯絡第三方。
- 把心理狀態診斷化。
- 把未完成小行動解讀成失敗。

### 2.2 免費與 Pro 邊界

**免費核心照顧** 永遠保留：

- 基礎情緒記錄
- 基礎 Coach 安撫
- SOS / 緊急安定練習
- 資料刪除與隱私能力
- 第一次 7 日小陪跑

**阿念 Pro** 的可付費價值：

- 多輪 7 日小陪跑
- 更多陪跑目標
- 完整每日任務庫
- 完整個人排行榜
- 完整金幣商店
- 長期行動回顧
- 更長記憶保存
- 週期性成長報告

不得把 SOS、基礎支持、隱私或刪除資料能力放到 paywall 後面。

---

## 3. 7 日小陪跑

**7 日小陪跑** 是新使用者第一次進入 Coach 的主入口。語氣要像陪跑，不像挑戰、訓練營或任務衝刺。

首屏問題：

> 這 7 天，你最想讓阿念幫你推動哪一點？

第一版固定三個陪跑目標：

| 目標 | 適合使用者 | 任務方向 |
|---|---|---|
| 睡前焦慮少一點 | 晚上腦中一直轉、身體緊繃 | 呼吸、睡前安神、寫一句需要 |
| 親子衝突後快一點回來 | 對孩子發脾氣後後悔、想修復 | 離開現場 2 分鐘、修復訊息草稿、對自己降載 |
| 每天做一個照顧自己的小動作 | 不確定想解決什麼，但想被推一下 | 喝水、伸展、短暫安靜、寫一句感受 |

預設推薦第三個：**每天做一個照顧自己的小動作**。

### 3.1 三節點陪跑節奏

第一版只做三個節點，不做每天壓迫式任務。

| 節點 | 目標 | 體驗 |
|---|---|---|
| Day 1 | 啟動陪跑 | 選目標，建立第一個身體降載型小行動 |
| Day 2-3 | 完成閉環 | 使用者回來時回顧，回報結果，阿念調小或換一個 |
| Day 7 | 收束 | 產出一頁非診斷式行動回顧小結 |

### 3.2 未完成閉環

如果 7 天內沒有完成小行動閉環，不使用失敗語言。

阿念應說：

> 這週可能太滿了，我們先把目標縮小一點。

提供三個選項：

1. 再來一次 3 天迷你陪跑。
2. 改成更小的小行動。
3. 先只做情緒記錄，不追蹤行動。

---

## 4. 小行動閉環

**小行動** 是使用者在情緒整理後願意嘗試的一個低風險、短時間、24 小時內可回報的下一步。

第一個小行動優先使用 **身體降載型小行動**：

- 睡前做 3 分鐘安神呼吸
- 喝一杯水，坐下來寫一句「我現在其實需要……」
- 情緒升高時先離開現場 2 分鐘
- 親子衝突後，先把修復訊息草稿寫給自己看

避免第一步就做：

- 複雜生活規劃
- 重大修復對話
- 深度心理分析
- 需要外部 App 或第三方配合的任務

### 4.1 建立條件

阿念可以提議小行動，但必須等使用者 **明確確認** 才建立紀錄。

可建立：

- 使用者回「好」
- 使用者回「可以」
- 使用者回「就這個」
- 使用者按下確認 UI

不可建立：

- 阿念只是給一般建議
- 使用者沉默
- 使用者沒有明確同意
- SOS / 危機情境中的穩定步驟

### 4.2 生命週期

| 狀態 | 意義 | 是否給獎勵 |
|---|---|---|
| `active` | 使用者已確認，24 小時內可回報 | 否 |
| `completed` | 有做到 | 是 |
| `partial` | 做了一半或做得比預期小 | 是 |
| `skipped` | 沒做到，但有回來回報 | 是 |
| `expired` | 超過 24 小時未回報 | 否，不扣分 |

超過 24 小時未回報即過期。過期後阿念只能溫和帶過，不能追問。

---

## 5. 遊戲化待辦

使用者希望第一版就是重遊戲化方向，但今心必須採 **無扣分模式**。

第一版包含：

- 個人排行榜
- 經驗值等級
- 大量每日任務
- 金幣
- 金幣商店

第一版不包含：

- 公開排行榜
- 好友排行榜
- 扣分
- 降級
- 失敗懲罰
- 羞辱式提醒

### 5.1 復盤獎勵

獎勵「回來照顧自己」這件事，不只獎勵完美完成。

建議第一版數值：

| 事件 | XP | 金幣 |
|---|---:|---:|
| 建立並確認一個小行動 | +5 | 0 |
| 回報 `completed` | +20 | +10 |
| 回報 `partial` | +15 | +7 |
| 回報 `skipped` | +10 | +5 |
| 完成一次情緒記錄 | +15 | +5 |
| 完成一次完整知心四式 | +30 | +12 |
| `expired` | 0 | 0 |

`expired` 不給獎勵，也不扣分。

### 5.2 經驗值等級

第一版等級可先用簡單曲線：

| 等級 | 累積 XP |
|---|---:|
| Level 1 | 0 |
| Level 2 | 100 |
| Level 3 | 250 |
| Level 4 | 450 |
| Level 5 | 700 |

等級文案避免「強者」「自律王」等比較語言。可以使用：

- 起步同行者
- 回來看一眼
- 小步練習者
- 安神行動者
- 慢慢有力

### 5.3 復盤連續

小行動 streak 與情緒記錄 streak 分開。

**復盤連續** 計算的是使用者連續多日回來回報或復盤小行動，不要求每天都 completed。

可計入：

- `completed`
- `partial`
- `skipped`

不計入：

- `expired`
- 只建立但未回報

前台避免使用「連勝」，優先使用：

- 復盤連續
- 回來看一眼
- 行動有回聲

### 5.4 個人排行榜

排行榜只比較使用者自己的資料。

第一版排行榜範圍：

- 本週最常完成的小行動類型
- 本週最多回報的任務類型
- 最近 7 天復盤天數
- 自己的最佳復盤連續
- 安神 / 動念 / 親子修復任務分布

不得做：

- 全站排名
- 好友排名
- 父母之間比較
- 自律排名

### 5.5 每日任務庫

大量每日任務必須來自預先審核的任務庫，不讓 LLM 無限制自由生成。

任務來源：

1. 固定任務庫
2. 阿念依內部脈絡從任務庫挑選
3. 使用者短自訂

任務類型建議：

| 類型 | 範例 |
|---|---|
| 身體降載 | 3 分鐘呼吸、喝水、伸展、坐下 30 秒 |
| 安神 | 寫一句需要、把手機放遠 5 分鐘 |
| 動念 | 選一個不傷害自己的小動作 |
| 親子修復 | 寫一句修復訊息草稿、先離開現場 2 分鐘 |
| 睡前焦慮 | 睡前一口氣、一句放下、一個明天再說 |

使用者自訂任務限制：

- 短文字
- 不鼓勵重大生活決策
- 不鼓勵聯絡第三方
- 不鼓勵自傷、懲罰或過度節食等高風險行為

### 5.6 金幣商店

金幣商店只能賣裝飾、表達與個人化外觀。

可販售：

- Coach 對話背景
- 阿念稱號 / 小名片
- 情緒卡片外觀
- 呼吸動畫主題
- 徽章展示框
- 今日鼓勵語風格
- 個人成就牆裝飾

不得販售：

- AI 次數
- SOS 功能
- 情緒分析能力
- 核心教練能力
- 隱私能力
- 備份能力

### 5.7 折扣點

未來可加入 **折扣點**，少量折抵訂閱費用。

折扣點必須與 XP 和金幣分開：

- XP：升等，不可消耗
- 金幣：買外觀，可消耗
- 折扣點：未來折抵訂閱，獨立促銷點數

限制：

- 每月折抵需有上限
- 不得把訂閱折成 0 元
- 不得從一般每日任務大量刷出
- 實作前需檢查 Stripe / App Store / Google Play 規則

---

## 6. Day 7 行動回顧小結

Day 7 小結是一頁非診斷式行動回顧，不是心理評估報告。

內容：

- 這 7 天你回來看了幾次
- 你完成、做一半、回報沒做到的小行動數
- 哪一類小行動最適合你
- 阿念觀察到的一個模式
- 下一週保留一個小動作
- 一句使用者可帶走的話

不得寫：

- 你改善了多少 %
- 你焦慮下降了多少
- 你心理狀態評分
- 診斷式語句
- 大量圖表

範例語氣：

> 這週你有 2 次回來看自己的小行動。最有幫助的不是做很多，而是你願意在卡住時回來看一眼。下一週，我建議先保留「情緒升高時離開現場 2 分鐘」這個小動作。

---

## 7. 資料模型草案

### 7.1 `coach_micro_actions`

小行動應保存為獨立資料模型，不塞進 `ruler_logs.regulating`。

```sql
create table coach_micro_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  app_user_id text,
  source_log_id uuid,
  source text not null default 'coach',
  goal_key text,
  task_key text,
  title text not null,
  category text not null,
  status text not null default 'active',
  due_at timestamptz not null,
  reported_at timestamptz,
  report_text text,
  xp_awarded integer default 0,
  coins_awarded integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (status in ('active', 'completed', 'partial', 'skipped', 'expired'))
);
```

原則：

- `user_id` 用於登入使用者。
- `app_user_id` 支援內測或非 UUID 使用者。
- `report_text` 只存使用者短回報，不存完整對話。
- 只保存標題、狀態、期限、來源、短回報與獎勵。

### 7.2 `coach_gamification_stats`

```sql
create table coach_gamification_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  app_user_id text,
  total_xp integer default 0,
  coin_balance integer default 0,
  lifetime_coins integer default 0,
  total_reported integer default 0,
  completed_count integer default 0,
  partial_count integer default 0,
  skipped_count integer default 0,
  current_review_streak integer default 0,
  longest_review_streak integer default 0,
  last_review_date date,
  updated_at timestamptz default now()
);
```

此表不可與現有 `streaks` 表混用。`streaks` 繼續代表情緒記錄；`coach_gamification_stats` 代表小行動復盤。

### 7.3 `coach_task_templates`

可先用前端常數或 Edge Function 內常數；正式化後再落表。

欄位建議：

- `key`
- `goal_key`
- `category`
- `title`
- `description`
- `default_due_hours`
- `risk_level`
- `is_active`

---

## 8. Coach 工具草案

Production `coach` Edge Function 可加入下列工具。

### 8.0 Action Loop Runtime

Production `coach` 不應維持單次 function call fallback。第一版可先做單 Agent、多步工具迴圈，不必一開始做多 Agent orchestration。

Runtime 要求：

1. 每次 request 先載入 session、active micro action、7 日陪跑狀態、gamification summary 與最近情緒摘要。
2. 先跑危機與安全分類；危機情境直接進 SOS，不建立小行動、不發遊戲化獎勵。
3. 讓模型提出 structured intent，例如 `chat`、`propose_micro_action`、`create_micro_action`、`report_micro_action`、`show_gamification_summary`、`day7_review`。
4. 由 deterministic service 驗證 intent 是否允許執行。
5. 執行工具後重新整理狀態。
6. 若工具結果需要下一步，允許第二輪或第三輪模型判斷；設定最大步數，避免無限迴圈。
7. 保存 trace event：input、intent、tool call、tool result、guardrail result、final response。

第一版 max steps 建議為 3：

```text
Step 1: classify / plan
Step 2: tool execution
Step 3: final response or one additional tool if required
```

這樣足以完成小行動閉環，但不會讓 runtime 過度複雜。

### 8.1 `get_active_micro_action`

用途：使用者進入 Coach 或發訊息時，查詢是否有未過期小行動。

回傳：

- active 小行動
- 是否即將過期
- 建議回顧文案

### 8.2 `create_micro_action`

用途：使用者明確確認後建立小行動。

限制：

- 必須有明確確認訊號。
- 不得在危機 / SOS 情境建立。
- `due_at` 預設 24 小時。
- 任務必須來自任務庫或短自訂。

### 8.3 `report_micro_action`

用途：使用者回報 `completed`、`partial` 或 `skipped`。

副作用：

- 更新小行動狀態。
- 發放 XP / 金幣。
- 更新復盤連續。
- 讓阿念根據回報調整下一步。

### 8.4 `get_gamification_summary`

用途：顯示 XP、金幣、等級、個人排行榜與復盤連續。

---

## 9. PWA Coach UI 草案

第一版只放 PWA Coach，不放 LINE Bot。

### 9.1 新使用者首屏

Coach 首屏主 CTA：

> 開始 7 日小陪跑

下方顯示三個陪跑目標。

避免首屏主文案只說「和我聊天」。要讓使用者知道阿念會陪他完成一個小行動閉環。

### 9.2 小行動確認卡

阿念提出小行動後，前端顯示確認卡：

- 小行動標題
- 24 小時內可回報
- 「設為今天的小行動」
- 「換一個更小的」
- 「先不要」

只有使用者點確認或明確回覆後才建立紀錄。

### 9.3 回來時回顧卡

使用者回到 Coach 時，若有 active 且未過期的小行動：

- 顯示「上次的小行動」
- 三個回報按鈕：
  - 有做到
  - 做了一半
  - 沒做到，但我回來了
- 一個「換更小的」選項

### 9.4 遊戲化面板

第一版可做 compact summary：

- Level
- XP 進度條
- 金幣
- 復盤連續
- 個人排行入口

不要讓遊戲化面板壓過 Coach 對話。它是推動感，不是主菜本體。

---

## 10. 不做事項

第一版不做：

- LINE Bot 建立小行動
- LINE push 小行動提醒
- PWA notification 小行動提醒
- 外部行事曆 / Gmail / 文件連結
- 公開排行榜
- 好友排行榜
- 扣分或降級
- 金幣購買核心支持能力
- 折扣點正式折抵訂閱
- 心理評估報告
- 醫療或治療成效聲稱

---

## 11. 第一版實作切片

建議先做一個小而完整的垂直切片。

### Phase 1：最小小行動閉環

1. 新增 `coach_micro_actions` schema。
2. Coach API 加 `create_micro_action`、`report_micro_action`、`get_active_micro_action`。
3. PWA Coach 加小行動確認卡。
4. PWA Coach 加回來時回顧卡。
5. 支援 `completed`、`partial`、`skipped`、`expired`。
6. 不做 XP / 金幣 UI，只先回覆自然語言。

驗收：

- 使用者能完成一次小行動閉環。
- 超過 24 小時不追問。
- 未確認不建立紀錄。

### Phase 2：遊戲化統計

1. 新增 `coach_gamification_stats`。
2. 回報小行動時發 XP / 金幣。
3. 加 Level 與復盤連續。
4. 加 compact gamification summary。

驗收：

- completed / partial / skipped 都給獎勵。
- expired 不給也不扣。
- 小行動 streak 不影響情緒記錄 streak。

### Phase 3：7 日小陪跑

1. Coach 首屏加入 7 日小陪跑入口。
2. 加三個陪跑目標。
3. Day 1 產生身體降載型小行動。
4. Day 2-3 回顧閉環。
5. Day 7 產生行動回顧小結。

驗收：

- 新使用者能理解 7 天要做什麼。
- 第一次小行動不需要理解整套遊戲化系統。
- Day 7 小結不含診斷或改善百分比。

### Phase 4：Pro fake-door

1. 加「阿念 Pro」說明頁。
2. 顯示多輪陪跑、完整任務庫、完整商店、長期回顧。
3. 使用者點升級後登記意願，不收費。
4. 記錄願付價格與最想要功能。

驗收：

- 不影響免費核心照顧。
- 可量測 Pro 點擊與意向。

---

## 12. 成功指標

### 12.1 7 日推動感指標

核心：

- 7 天內完成至少一次小行動閉環的使用者比例
- Day 7 主觀問題：「阿念有沒有讓你多做一點點？」

輔助：

- 建立小行動率
- 小行動回報率
- partial / skipped 回報率
- Day 2-3 回訪率
- Day 7 小結查看率
- Pro fake-door 點擊率

### 12.2 不用作主指標

不要把以下當成主要成功指標：

- 聊天訊息數
- 每日登入數
- AI 回覆字數
- 情緒改善百分比
- 焦慮下降分數

---

## 13. 安全與文案邊界

阿念可以說：

- 「我們把這件事縮小一點。」
- 「你有回來看，這本身就算數。」
- 「做一半也可以，這讓我知道下次要調小。」
- 「這週我們看見的是行動軌跡，不是成績單。」

阿念不可說：

- 「你失敗了。」
- 「你沒有完成任務。」
- 「你的焦慮改善了 40%。」
- 「你需要治療。」
- 「你應該取消某個現實承諾。」
- 「你只要照做就會好。」

危機語句仍優先走 SOS / 緊急安定練習，不建立小行動、不觸發遊戲化獎勵。
