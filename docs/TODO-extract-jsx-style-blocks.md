# TODO：把 21 個元件的 JSX 內嵌 `<style>{`...`}</style>` 抽到同名 `.css`

**交接對象**：Codex Agent
**前情**：人類同伴於 2026-05-14 進行 UI 大盤點，發現 CLAUDE.md 規定「不要在 JSX 寫 `<style>`」但實際有 28 處違規。Claude 已先示範處理 3 個元件（UserProfile / BodyScan / RegulatingStep，commit `b6b1740`）。請接手剩餘 21 個。

---

## 目標

把每個元件 JSX 裡的 `<style>{`...`}</style>` 區塊：
1. **抽出** CSS 內容到同名 `<Component>.css`（同資料夾）
2. 在元件檔頂部加 `import './<Component>.css';`
3. **刪除** JSX 內的 `<style>` 區塊
4. `className` 完全不動，行為零變化

最終 `grep -rn "<style>" src/components src/pages --include="*.tsx"` 應回傳 0 行。

---

## 為什麼這樣做（不要做更多）

- CLAUDE.md 第「Code Style」段寫明：「CSS Modules (`*.module.css`) 或 CSS custom properties；不要在 JSX 內寫 `<style>`」
- 專案已有 `CheckInFlow.css`、`SOSMode.css` 等同名 `.css` 的既定模式，與本次抽取一致
- **不要** 同時做 CSS Modules 化（每檔 35–46 個 className 要改 camelCase + `styles.xxx`，是另一個 sprint 的工作量）
- **不要** 趁機重構樣式內容（顏色 token、AI 美學等是另一個 task）

---

## 待處理檔案清單（依複雜度排序，建議由簡入繁）

### 🟢 簡單（單一 `<style>` 區塊，< 50 行 CSS）

| # | 檔案 | `<style>` 起始行 | 預估 CSS 行數 |
|---|---|---|---|
| 1 | `src/components/LoadingSpinner.tsx` | ~16 | 小 |
| 2 | `src/components/Skeleton.tsx` | ~56 | 小 |
| 3 | `src/components/AchievementToast.tsx` | ~42 | 小 |
| 4 | `src/components/SplashScreen.tsx` | ~69 | 小 |
| 5 | `src/components/PrivacyLock.tsx` | ~115 | 中 |
| 6 | `src/components/VoiceRecorder.tsx` | ~73 | 中 |
| 7 | `src/components/QuickStats.tsx` | ~70 | 中 |
| 8 | `src/components/RulerProgress.tsx` | ~107 | 中 |
| 9 | `src/components/MoodMeter.tsx` | ~102 | 中 |
| 10 | `src/components/NotificationSettings.tsx` | ~196 | 中 |
| 11 | `src/components/ExportPanel.tsx` | ~111 | 中 |
| 12 | `src/components/ExpressingStep.tsx` | ~161 | 中 |
| 13 | `src/components/UnderstandingStep.tsx` | ~231 | 中 |
| 14 | `src/components/OnboardingFlow.tsx` | ~257 | 中 |
| 15 | `src/components/AuthModal.tsx` | ~262 | 中 |
| 16 | `src/components/MainLayout.tsx` | ~278 | 中 |
| 17 | `src/components/AchievementPage.tsx` | ~190 | 中 |

### 🟡 中等（單一區塊，> 200 行 CSS，或檔案 > 500 行）

| # | 檔案 | 備註 |
|---|---|---|
| 18 | `src/components/AchievementPage.tsx` | 檔案 635 行，CSS 區塊可能很大 |

### 🔴 困難（多個 `<style>` 區塊，需個別處理或合併）

| # | 檔案 | 區塊數 | 備註 |
|---|---|---|---|
| 19 | `src/components/AIInsightCard.tsx` | 2 | 兩個區塊建議合併到一份 .css |
| 20 | `src/components/EmotionGrid.tsx` | 3 | 三個區塊建議合併 |
| 21 | `src/components/Timeline.tsx` | 3 | 檔案 1288 行，CSS 很大 |
| 22 | `src/components/GrowthDashboard.tsx` | 3 | 檔案 915 行，CSS 很大 |

**多個區塊處理建議**：通通併入一份 `<Component>.css`。順序保持原本 JSX 出現順序，避免 cascade 行為改變。

---

## 執行流程（每個檔案）

```bash
# 1. 確認狀態乾淨
git status

# 2. 找出 <style> 區塊起訖行
grep -n "<style>\|</style>" src/components/<Name>.tsx

# 3. 讀取該區塊，貼到新檔 src/components/<Name>.css
#    - 把 css 內容的縮排（通常多餘 16 空格）拿掉
#    - 樣板字串裡的 ${...} 動態值極少；若有，需特別處理（多半沒有）

# 4. 在 <Name>.tsx 的 import 段加：
#    import './<Name>.css';

# 5. 刪除 <style>{` ... `}</style> 連同前後可能的空白行
#    可用 sed -i '' '<起>,<迄>d' src/components/<Name>.tsx

# 6. 驗證：build + test 全綠
npm run build
npm run test:run

# 7. commit
git add src/components/<Name>.tsx src/components/<Name>.css
git commit -m "refactor: 將 <Name> 內嵌樣式抽出為同名 .css"
```

---

## ⚠️ 已知陷阱（Claude 踩過的）

### 陷阱 1：sed 多刪或少刪一行
sed 範圍 `<start>,<end>d` 是 **inclusive**。先 `grep -n` 確認 `<style>{`} ` 開頭那行與 `` `}</style>`` 結尾那行**精確行號**，再執行。執行後立刻 `grep -n "<style>" <file>` 與 `grep -n "</style>" <file>`，確認兩者皆無回傳。

### 陷阱 2：殘留 `` `}</style>`` 一行
UserProfile 那次出現過 — sed 刪到結尾前一行就停了，殘留 1 行 `` `}</style>``，導致 vite build 失敗。檢查 vite build error 訊息會明確指出殘留位置；用 `sed -i '' '<row>d' <file>` 補刪。

### 陷阱 3：樣板字串內含 `${...}` 動態值
極少數元件可能把動態值塞進 CSS（如 `<style>{`background: ${color}`}</style>`）。這種**不能**直接抽走 — 需改成 className 切換或 CSS 變數注入。掃描 grep：
```bash
grep -A2 "<style>{" <file> | grep -E '\$\{'
```
若有，先暫時 skip 該檔，註記在本 TODO，最後跟人類同伴討論。

### 陷阱 4：worktree 的 lint-staged 殘留 tsc
若進 worktree 後遇到 commit 被 tsc 卡住，把 `package.json` 的 `lint-staged.*.{ts,tsx}` 改成只剩 `"eslint --fix"`（main 上已是這樣，部分 worktree 因 base ref 為 origin/main 而沒同步到）。

---

## 收尾驗證

全部完成後：

```bash
# 1. 應為 0
grep -rn "<style>" src/components src/pages --include="*.tsx" | wc -l

# 2. 應為 21 個新檔
find src/components -name "*.css" ! -name "*.module.css" | wc -l
#   原本 7 個（CheckInFlow / SOSMode / ParentScenarios / QuickCheckIn /
#            ParentHome / AIChatAssistant / BotDashboard）
#   + Claude 加的 3 個（UserProfile / BodyScan / RegulatingStep）= 10
#   + 你新增的 21 個 = 31
#   實際數字可能因合併區塊略少於 31

# 3. 兩端驗證
npm run build                # 必須通過
npm run test:run             # 必須 372+ 全綠
cd server && npm run test:run # 必須 164 全綠

# 4. 視覺確認（人類同伴會做）
npm run dev
# 開瀏覽器點開每個畫面確認樣式沒掉漆
```

---

## Commit 規範

- 每個元件 **一個 commit**（或 5 個簡單元件併一個，視 PR 大小判斷）
- Commit message 必須繁體中文（Taiwan）
- 訊息格式：
  ```
  refactor: 將 <Name> 內嵌樣式抽出為同名 .css
  
  <可選的補充：是否有合併多區塊、是否遇到動態值處理>
  ```

---

## 完成後

更新本 TODO 文件最後一行：
```
**狀態**：✅ 完成於 2026-XX-XX，PR #XXX
```

並把本檔搬到 `docs/archive/TODO-extract-jsx-style-blocks.md`（已完成的 TODO 不留根目錄）。

---

**狀態**：⏳ 進行中（3/24 完成）
