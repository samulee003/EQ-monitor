# 今心 ImXin 快速交接板

> 這份 `memory.md` 是給續接 agent 的短記憶，不取代 `AGENTS.md` 與 `CHANGELOG.md`。

---

## 目前主線（2026-05-14）

- 目前分支：`codex/stitch-ui-release-20260513`。
- `main` 與 `origin/main` 目前對齊，但本工作分支有 commits 且工作樹 dirty；不要 reset、checkout 或 pull 覆蓋未整理變更。
- 內測判斷仍是黃燈偏綠：可 1-3 人封閉內測，不建議公開宣傳或大量開放。
- 真 LINE 帳號完整 E2E 仍未跑。

## 昨晚新增狀態

- 首頁與 Coach 首屏已改成更容易懂的「Agentic AI 主動教練」導覽。
  - 首頁有「今日教練建議」。
  - Coach 空狀態有晚上焦慮、對孩子發脾氣、想看教練觀察三個情境入口。
- AI soul 已寫入並接到執行面。
  - `server/insforge/agents/soul.md` 是人格、語氣、主動性、安全邊界規格。
  - `server/src/agents/soulInstruction.ts` 是 canonical prompt builder。
  - `server/src/agents/emotionCoach.ts`、`server/insforge/agents/emotionCoach.ts` 已用 ADK 的 `globalInstruction + instruction` 接 soul/RULER 策略。
  - `server/insforge/functions/coach-simple.ts` 已改成 `buildProductionCoachSystemPrompt()` 組裝 production prompt。
- `coach` InsForge Edge Function 已重新部署成功。
  - 部署 URL：`https://b88egxiz.functions.insforge.app/coach`
  - 線上 smoke：焦慮 7 分測試回 200，觸發 `MetaMomentSkill` + `open_sos`。
  - smoke userId `codex-smoke-agentic-soul` 的資料已從 `agent_ruler_logs`、`adk_events`、`adk_sessions`、`adk_user_states` 清乾淨。
- InsForge Auth 已在本機 PWA 接通。
- `.env.local` 已設定 `VITE_INSFORGE_URL` / `VITE_INSFORGE_ANON_KEY`，而且已被 `.gitignore` 排除。
- 測試帳號 `samlei@apm.org.mo` 已建立並完成 email verification；不要把密碼寫進文件或 commit。
- UI 登入已用 Playwright smoke 驗過：登入成功，重新整理後仍保持登入。
- InsForge 回查已確認：
  - `auth.users.email_verified = true`
  - `public.profiles.display_name = Sam Lei`
  - `public.coach_context` 已有該 user 的初始列
- live `handle_new_user()` trigger 已修正：InsForge 用 `new.profile` / `new.metadata`，不是 `new.raw_user_meta_data`。
- 2026-05-14 整合補強：補回 TDD session 中不改產品碼的後端測試（`rulerData`、`triggerAction`、`insforgeAdapter`、`coach` route），並把本地 ADK vendor / Stitch design artifact 加入 `.gitignore`。
- `worktree-public-launch-plan` 的公開上線 plan 仍是舊 PR 狀態記錄，已判定為歷史參考；不要原封不動當成最新執行計畫。

## 主要檔案

- `server/insforge/agents/soul.md`：今心教練 soul 契約。
- `server/src/agents/soulInstruction.ts`：ADK / production prompt 的 canonical builder。
- `server/insforge/agents/soulContract.test.ts`：避免 `soul.md`、ADK agent、production fallback prompt 分裂。
- `server/insforge/functions/coach-simple.ts`：production `coach` Edge Function；因 InsForge 打包限制，需保持自包含 prompt builder。
- `src/services/InsForgeAuthService.ts`：InsForge Auth service。
- `src/services/AuthContext.tsx`：改走 InsForge Auth，並在登入/註冊後初始化 `coach_context`。
- `src/lib/insforge/localStorageMigration.ts`：LocalStorage `feelings_logs` → InsForge `ruler_logs` 遷移。
- `server/insforge/schema/001_profiles.sql`：profile trigger 修復。
- `eslint.config.js`：排除外部 ADK vendor / Stitch artifact，避免 lint 掃非專案源碼。

## 最新驗證

- `npm run lint` → 0 errors / 31 warnings
- `npx tsc --noEmit` → passed
- `npm run test:run` → 352 tests / 37 files passed
- `npm run build` → passed
- `cd server && npm run test:run` → 156 tests / 15 files passed
- `cd server && npm run build` → passed
- `cd server && npm run test:run -- insforge/agents/soulContract.test.ts` → 3 tests passed
- `OPTIONS https://b88egxiz.functions.insforge.app/coach` → 204
- `POST https://b88egxiz.functions.insforge.app/coach` → 200, `MetaMomentSkill` + `open_sos`
- 本機登入 smoke：`http://127.0.0.1:5176/#coach` passed

## Production Prompt 注意事項

- InsForge Functions 部署不接受 `coach-simple.ts` 對本地 shared module 的相對 import。
  - `../../src/agents/soulInstruction.ts` 失敗。
  - `./_shared/soulInstruction.ts` 也失敗。
- 因此 production `coach-simple.ts` 必須保持自包含 prompt builder。
- 若更新 `server/src/agents/soulInstruction.ts`，必須同步更新 `coach-simple.ts` 內的 builder，並跑：
  - `cd server && npm run test:run -- insforge/agents/soulContract.test.ts`
  - `cd server && npm run build`
  - `npx @insforge/cli functions deploy coach --file server/insforge/functions/coach-simple.ts`
  - 線上 `POST /coach` smoke，並清掉 smoke 資料。

## 明確剩餘事項

1. 整理 dirty worktree，決定哪些變更要進同一個 commit / PR。
2. Production Zeabur PWA 確認已設定 `VITE_INSFORGE_URL` / `VITE_INSFORGE_ANON_KEY`，再重部署一次。
3. 用真 LINE 帳號跑完整 E2E：LINE「綁定」→ PWA 貼碼 → LINE 完成 RULER → Coach / 週報讀到資料。
4. 若要合併 schedule 相關變更，仍需用真實資料庫環境檢查 pg_cron / schedule。
