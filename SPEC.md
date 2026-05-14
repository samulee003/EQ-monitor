# 今心 ImXin — V1.1 技債清理 Sprint Spec

**狀態**：草稿，待使用者確認
**日期**：2026-05-14
**範圍**：純技債清理，不新增任何功能。目標是讓 repo 保持可導航、可交接，未來 AI agent 接手時不會被殘骸文件誤導。

---

## 1. Objective

把 V1.0 上線後堆積的「文件熵」與「殘留物」清掉，鎖緊三條主軸：
- 單一事實來源（`README.md` / `CLAUDE.md` / `docs/`）
- 零死代碼（已知未引用模組刪除）
- 自動化品質閘門可用（husky pre-commit、lockfile 統一）

**Non-goals**：
- 不做 LocalStorage→InsForge migration（V1.2 再處理）
- 不重構 `CheckInFlow` / `HomePage` 分離（V1.2）
- 不寫新功能、不改 UI

---

## 2. Target Users

| 使用者 | 受益 |
|--------|------|
| Repo 維護者（你） | 找決策不再翻 15 份 .md |
| 未來 AI Agent | onboarding 時不會抓到舊計畫做事 |
| 開源貢獻者 | README → CONTRIBUTING → CLAUDE.md 三步上手 |

---

## 3. Tasks & Acceptance Criteria

### T1. Docs 大清掃
建立 `docs/archive/` 並 `git mv` 以下檔案：
- `agent.md`、`AGENTS.md`、`QWEN.md`
- `PLAN.md`、`TEAM_TECH_UPGRADE_PLAN.md`、`DWF_INTEGRATION_PLAN.md`
- `CHANGELOG_AUDIT_FIXES.md`、`CODE_REVIEW_KARPATHY.md`、`SCORE_REPORT.md`
- `BOT_DEPLOYMENT.md`、`Zeabur_Bot_Server_部署需求.md`
- `CLAUDE_CODE_HANDOFF.md`、`DELIVERY_LOG.md`
- `今心_ImXin_方案規格.html`

**保留在根**：`README.md`、`CLAUDE.md`、`CONTRIBUTING.md`、`LICENSE`、`CHANGELOG.md`、`DESIGN.md`、`SPEC.md`、`memory.md`

**驗收**：
- [ ] 根目錄 .md 檔 ≤ 8 個
- [ ] `git log --follow` 能追到原始歷史
- [ ] README.md 在 "Documentation" 段落指向 `docs/archive/`

### T2. 刪除死代碼
- `git rm src/components/HomePage.tsx`
- `git rm -r adk-js-adk-v1.0.0/`
- 大型二進位殘留 `dev_server.log`、`kling_*.mp4`、`logo_*.png`、`Logo_去背.png` 改放 `public/` 或刪除

**驗收**：
- [ ] `grep -r "HomePage" src/` 無結果
- [ ] `du -sh .` 縮減 ≥ 5 MB
- [ ] `npm run build` 成功
- [ ] `npm run test:run` 通過

### T3. Husky pre-commit 修復
診斷 `.husky/pre-commit` → 修正根本原因 → 移除 CLAUDE.md 中 `--no-verify` 變通說明。

**驗收**：
- [ ] `git commit` 不需 `--no-verify`
- [ ] pre-commit 跑 lint-staged
- [ ] CLAUDE.md「Known Issues」表格刪掉 husky 那行

### T4. Lockfile 統一
刪除 `pnpm-lock.yaml`，`package.json` 加 `"engines": { "npm": ">=10" }`。

**驗收**：
- [ ] 只剩 `package-lock.json`
- [ ] README「Commands」段確認用 `npm`

### T5. 雙 Adapter Contract Smoke Test
新增 `server/src/db/adapter.contract.test.ts`，對 `memoryAdapter` 與 `insforgeAdapter` 跑同一組最小 CRUD（save → fetch → delete）。InsForge 部分無 `DATABASE_URL` 則 skip。

**驗收**：
- [ ] 兩個 adapter 共用 it.each
- [ ] 本地 memoryAdapter 那組必跑
- [ ] `cd server && npm run test:run` 通過

### T6. `stitch_design_system_implementation/`
移到 `docs/design-assets/stitch/` 或刪除。

**驗收**：
- [ ] repo 根不再見 60+ 子目錄
- [ ] 引用路徑（如有）更新

---

## 4. Commands

沿用 CLAUDE.md，不新增。

---

## 5. Project Structure（清理後預期）

```
今心 APP/
├── README.md            # 入口
├── CLAUDE.md            # AI 接手指南
├── CONTRIBUTING.md
├── CHANGELOG.md
├── DESIGN.md
├── SPEC.md
├── memory.md
├── LICENSE
├── docs/
│   ├── archive/
│   ├── insforge/
│   ├── qa/
│   ├── superpowers/
│   └── design-assets/
├── src/
├── server/
├── android/
├── public/
└── scripts/
```

---

## 6. Code Style

沿用 CLAUDE.md「Code Style」段，無變動。

---

## 7. Testing Strategy

- 每完成一個 T 跑前端與後端 test:run
- T5 為新增 baseline
- 不動 E2E

---

## 8. Boundaries

### 永遠執行
- `git mv` 而非 `rm`（除大二進位檔）
- 每個 T 一個 commit，繁中 commit message
- commit 前跑測試

### 先問再動
- 修改 `src/utils/crypto.ts` / `passwordHash.ts` / `adapters/storage.ts` / `types/RulerTypes.ts`
- `adk-js-adk-v1.0.0/` 改成搬而非刪？
- husky 修不好是否退回移除

### 永遠不做
- force push 到 main
- `--no-verify` skip hook
- 改 Zeabur service config / env vars
- 刪 `.insforge/`、`.env*`、credentials

---

## 9. 預設決策

| 項目 | 預設 | 替代 |
|------|------|------|
| 舊文件 | 搬 `docs/archive/` | `git rm` |
| `adk-js-adk-v1.0.0/` | `git rm -r` | 搬 archive |
| husky | 修好 | 移除 |
| Lockfile | npm | pnpm |
| Contract test | 薄 smoke | 完整覆蓋 |

---

## 10. Exit Criteria

- [ ] T1–T6 acceptance 全打勾
- [ ] `npm run build` + 兩端 `test:run` 全綠
- [ ] PWA / Bot Server health check 仍綠
- [ ] 一個 PR，commit 拆 6 個
