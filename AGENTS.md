# 今心 ImXin Agent 交接規範

> 給 Codex / Claude / 其他 agent 的短規範。若本檔與最新 git 狀態衝突，以最新 git 狀態與使用者最新指示為準。

## 產品定位

今心 ImXin 是開源情緒覺察 PWA + LINE Bot，目標是幫焦慮父母在情緒高漲時先停一下、看清感受，再選一個較不傷害自己與他人的下一步。

前台方法語言定稿為 **知心四式**：

1. **心照**：心照一念，先看清此刻。
2. **喚名**：喚其真名，精準靠近感受。
3. **安神**：安住心神，讓感受與需要有地方放。
4. **動念**：一念可轉，選一個可做的小行動。

方法來源要誠實：今心是 RULER-inspired、ACT-informed、IFS-informed、Dan Siegel-informed 的自有整合練習。不得宣稱與 Yale、RULER Approach、ACT、IFS、Dan Siegel / Mindsight Institute 或任何治療機構有官方關係，也不得宣稱提供正式心理治療、診斷或醫療建議。

## 工作原則

- 使用繁體中文（台灣）更新 UI 文案、文件與 commit message。
- 四象限 / energy-valence 類型可以保留；不要再使用 `Mood Meter`、`Meta-Moment`、`How We Feel` 作為前台或 active prompt 語言。
- 保留內部資料模型與相容命名，例如 `ruler_logs`、`RulerLogEntry`、`useRulerFlow`、`server/src/rulerBot.ts`，除非使用者明確要求資料遷移。
- `server/insforge/functions/coach-simple.ts` 是 production `coach` Edge Function 自包含 prompt builder；改 AI 教練方法語言時要同步它、`server/src/agents/soulInstruction.ts`、`server/insforge/agents/soul.md` 與相關測試。
- 根目錄 `memory.md` 是短交接板；`CHANGELOG.md` 是產品變更紀錄；兩者要在重要命名、部署、驗證狀態變更後同步更新。

## 常用驗證

```bash
npm run test:run
npm run build
npm run lint
npm run test:e2e
cd server && npm run test:run
cd server && npm run build
cd server && npm run lint
git diff --check
```

目前最新本地基線（2026-05-15）：

- Frontend tests: 40 files / 368 tests passed
- Server tests: 17 files / 164 tests passed
- E2E: 4 passed
- Frontend lint: 0 errors / 31 warnings
- Server lint: 0 errors / 24 warnings

## 最新主線

- `582659e Reduce method language overlap risk`
  - 移除 How We Feel / Mood Meter / Meta-Moment 等 active 前台風險語言。
  - 保留 RULER-inspired 誠實來源與非官方邊界。
- `636b8e4 Rename 知心四式 moves`
  - 前台四式定稿為：心照、喚名、安神、動念。
  - 同步 PWA、LINE Bot、AI 教練 prompt / fallback、docs、E2E 與測試。

## 近期下一步

1. 找 1 位非開發者用手機完整試玩。
2. 觀察使用者是否理解「知心四式」與 LINE 綁定流程。
3. 只根據真回饋補圖解、入口分流或 Coach 首屏文案，不預先堆太多說明。
