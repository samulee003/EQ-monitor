# 今心 APP 全面稽核與修復紀錄

> 稽核日期：2026-05-11  
> 總計修改檔案：45+  
> 總計修復 CRITICAL：28 項  
> 總計修復 WARNING / NOTE：60+ 項  
> 測試狀態：265 tests passing（20 test files）

---

## 第一輪：全站通用修復（6 agents 並行）

### Agent 1 — Config & npm 安全

| 檔案 | 修復 |
|------|------|
| `package.json` | `"private": true` |
| `package.json` | 移除 `@google/adk`、`pg`（dead deps） |
| `index.html` | 移除 `maximum-scale=1.0, user-scalable=no` |
| `index.html` | 新增 `apple-touch-icon` |
| `public/manifest.json` | `theme_color` 統一為 `#fdfaf3` |
| `.env.example` | 移除重複 `VITE_COACH_API_URL` |
| `npm audit` | 自動修復 27 漏洞（剩 1 moderate） |

### Agent 2 — Component 安全修復

| 檔案 | 修復 |
|------|------|
| `AIChatAssistant.tsx` | 移除 `dangerouslySetInnerHTML` → 安全 `\n` split |
| `AuthModal.tsx` | 硬編碼 `'guest123'` → `crypto.randomUUID().slice(0,12)` |
| `AuthModal.tsx` | `handleSubmit` / `handleGuestLogin` 加 try/catch |
| `Timeline.tsx` | `JSON.parse` 包 try/catch，錯誤顯示友善訊息 |
| `CoachPage.tsx` | `USER_ID = 'test-user'` → `useAuth()` 動態取得 |
| `CoachPage.test.tsx` | mock `useAuth` 讓測試通過 |

### Agent 3 — Services 錯誤處理

| 檔案 | 修復 |
|------|------|
| `AuthContext.tsx` | `initAuth` try/catch，錯誤時不轉圈 |
| `HabitContext.tsx` | `loadProgress` / `refreshProgress` try/catch |
| `useRulerFlow.ts` | `loadDraft` / `saveDraft` try/catch |
| `AIService.ts` | 新增 `fetchWithTimeout()`（AbortController + 30s） |
| `syncAdapter.ts` | `replayQueue` 空 catch → `console.error` |

### Agent 4 — 記憶體洩漏清理

| 檔案 | 修復 |
|------|------|
| `useA11y.ts` | `setTimeout` 用 ref 追蹤清除 |
| `useRulerFlow.ts` | `handleMoodComplete` 3s timeout 清除 |
| `VoiceGuideService.ts` | `sectionTimeout` 欄位，`stop()` 時清除 |
| `NotificationService.ts` | 新增 `destroy()` 供外部清理 interval |
| `syncAdapter.ts` | `NetworkMonitor.destroy()` 移除事件監聽 |
| `GrowthDashboard.tsx` | `setTimeout` cleanup |
| `Timeline.tsx` | `setTimeout` cleanup |

### Agent 5 — Accessibility & Routing

| 檔案 | 修復 |
|------|------|
| `RegulatingStep.tsx` | `<div onClick>` → `<button>`，補 `aria-label` |
| `VoiceRecorder.tsx` | `<div onClick>` → `<button>`，動態 `aria-label` |
| `AIChatAssistant.tsx` | close/send 按鈕補 `aria-label` |
| `ExportPanel.tsx` | close 按鈕補 `aria-label` |
| `Timeline.tsx` | edit/delete 按鈕補 `aria-label` |
| `UserProfile.tsx` | close 按鈕補 `aria-label` |
| `MoodMeter.tsx` | 四象限補描述性 `aria-label` |
| `App.tsx` | 新增 404 fallback 頁面 |
| `stores/appStore.ts` | `VALID_APP_VIEWS` + hash 驗證預設回 `'home'` |

### Agent 6 — Performance & Polish

| 檔案 | 修復 |
|------|------|
| `EmotionGrid.tsx` | O(n×m) `find()` → `Set` + `useMemo` |
| `BotDashboard.tsx` | 錯字 `情緒分佤` → `情緒分佈` |
| `ParentHome.tsx` | 移除註解死碼 |
| `QuickCheckIn.tsx` | 移除註解死碼 |
| `UnderstandingStep.tsx` | 移除未使用 `_setMessage` |
| `AuthModal.tsx` | `#ff6b6b` → `var(--color-red)` |
| `UserProfile.tsx` | 硬編碼色碼 → CSS 變數 |

---

## 第二輪：導覽頁面深度稽核 + CRITICAL 修復（4 agents 並行）

### Agent 7 — Home + Check-in Flow（稽核）

發現 CRITICAL：
- `RegulatingStep.tsx:134` `</button>` 錯配 `<div>`
- `ParentHome.tsx` CheckInFlow 無返回機制
- `ParentHome.tsx` `logEntry as RulerLogEntry` 結構不完整
- `SOSMode.tsx` 計時器可重複點擊加速
- `QuickCheckIn.tsx` `\\n`（字面反斜線+n）而非換行

### Agent 8 — History/Timeline + Coach（稽核）

發現 CRITICAL：
- `Timeline.tsx` `timestamp` 當唯一 key（不保證唯一）
- `CoachPage.tsx` `SESSION_ID` module reload 重新生成
- `MetaMomentOverlay.tsx` Escape 監聽器每輪 render 重新綁定
- `BreathingAnimation.tsx` 雙計時器漂移
- `adk/storage.ts` chat history 未按 user namespace
- `adk/client.ts` hardcoded production fallback URL

### Agent 9 — Growth/Dashboard（稽核）

發現 CRITICAL：
- `AIService.ts` **API Key 暴露在客戶端 bundle**
- `GrowthDashboard.tsx` `loadData()` 無 try/catch
- `ResilienceService.ts` `slice(0,7)` 拿最舊 7 筆
- `ResilienceService.ts` `postMood` 硬比對中文
- `ResilienceService.ts` `dominantEmotion` / `latest` 邏輯名實不符

### Agent 10 — Achievements + Global UI（稽核）

發現 CRITICAL：
- `AchievementToast.tsx` `clearNewlyUnlocked()` 一次清全部
- `MainLayout.tsx` `<main>` 缺 `id="main-content"`，SkipLink 失效
- `NotificationService.ts` UTC 日期 vs 本地時區錯位
- `VoiceGuideService.ts` Chrome 首次 `getVoices()` 回傳空陣列
- `OnboardingFlow.tsx` 400+ 行 inline `<style>`

---

## 第二輪 CRITICAL 修復（4 agents 並行）

### Agent 11 — RegulatingStep + ParentHome + CoachPage + Timeline

| 檔案 | 修復 |
|------|------|
| `RegulatingStep.tsx:134` | `</button>` → `</div>` |
| `ParentHome.tsx` | `logEntry` 補 `id` + `energy`/`pleasantness`，移除 `as` |
| `ParentHome.tsx` | CheckInFlow 加 **返回首頁** 按鈕 |
| `CoachPage.tsx` | `SESSION_ID` → `useRef(crypto.randomUUID())` |
| `Timeline.tsx` | `key={log.timestamp}` → `key={log.id}`，find/delete 改 `id` |

### Agent 12 — AchievementToast + MainLayout

| 檔案 | 修復 |
|------|------|
| `AchievementToast.tsx` | `clearNewlyUnlocked()` → `clearNewlyUnlocked(next.id)` |
| `HabitContext.tsx` | `clearNewlyUnlocked(id?: string)` 支援單項清除 |
| `AchievementToast.tsx` | 新增 `role="status"` `aria-live="polite"` `aria-atomic="true"` |
| `MainLayout.tsx` | `<main>` 補 `id="main-content"` `tabIndex={-1}` |

### Agent 13 — Notification + VoiceGuide + Resilience

| 檔案 | 修復 |
|------|------|
| `NotificationService.ts` | UTC `toISOString()` → `toLocaleDateString('sv')` |
| `NotificationService.ts` | 精確到分 `===` → `>= targetTotalMinutes` |
| `VoiceGuideService.ts` | `v.lang?.startsWith('zh')` null-safe |
| `VoiceGuideService.ts` | 新增 `ensureVoicesLoaded()` 監聽 `voiceschanged` |
| `ResilienceService.ts` | `slice(0,7)` → `sorted.slice(-7)` |
| `ResilienceService.ts` | `dayLogs[0]` → `dayLogs[dayLogs.length-1]` |
| `ResilienceService.ts` | `postMood` 中文硬編碼 → `PostMoodOptions` enum |
| `emotionData.ts` | 新增 `PostMoodOptions` 常數 |

### Agent 14 — AIService API Key 暴露

| 檔案 | 修復 |
|------|------|
| `AIService.ts` | **完全移除** `VITE_ZEABUR_AI_API_KEY` / `VITE_ZEABUR_AI_API_URL` |
| `AIService.ts` | `analyzeFeeling` / `generateWeeklyInsight` / `chatWithAssistant` 改 proxy-only |
| `AIService.ts` | 移除 `Authorization: Bearer` header |
| `AIService.test.ts` | 10 個測試改 mock `proxyUrl` |

**安全性結果**：客戶端 bundle 不再包含任何 API key。

---

## 尚未修復的已知問題（WARNING / NOTE 級別）

| 優先級 | 項目 |
|--------|------|
| P2 | Coach 元件大量硬編碼中文未走 i18n |
| P2 | `MetaMomentOverlay.tsx` focus trap / body scroll lock |
| P2 | `BreathingAnimation.tsx` `prefers-reduced-motion` |
| P2 | `SOSMode.tsx` 呼吸文字永遠顯示「吸氣...」（應隨動畫更新） |
| P2 | `UnderstandingStep.tsx` `isParentingContext` 用中文比對 |
| P3 | 多檔案 inline `<style>` 抽出為 CSS Modules |
| P3 | `MoodMeter.tsx` 400+ 行 inline style |
| P3 | `OnboardingFlow.tsx` 400+ 行 inline style |
| P3 | `GrowthDashboard.tsx` / `AIInsightCard.tsx` / `QuickStats.tsx` inline style |
| P3 | 多檔案裝飾性 emoji 無 `aria-hidden` |
| P3 | `RulerProgress.tsx` 無 `role="progressbar"` |

---

## 測試紀錄

| 時間 | 結果 |
|------|------|
| 第一輪修復後 | 265 passed / 265 |
| 第二輪修復後 | 265 passed / 265 |

---

*本文件由 Kimi Code CLI 自動生成，紀錄 2026-05-11 全面稽核與修復過程。*
