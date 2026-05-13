# 今心 ImXin — API Key 輪換操作指引

> 本指引用於更換已洩露的 InsForge API Key，並更新所有部署平台的環境變數。
> 預估時間：5-10 分鐘

---

## 背景說明

舊的 InsForge API Key 已經洩露到 Git 歷史中。
需要：
1. 在 InsForge 生成新的 API Key
2. 在 Zeabur 更新環境變數
3. 確認程式碼已無硬編碼（已由工程師完成）

---

## 第一步：在 InsForge 生成新 API Key

### 操作：
1. 用瀏覽器打開 `https://insforge.app`
2. 登入帳號
3. 進入專案（專案名稱可能包含 "imxin" 或 "今心"）
4. 左側選單點擊 **「Settings」**（齒輪圖示 ⚙️）
5. 找到 **「API Keys」** 區塊
6. 點擊 **「Regenerate」** 或 **「Rotate」** 按鈕
7. **複製新生成的 Key**（格式為 `ik_` 開頭的一串英數字）

### 預期結果：
- 舊 Key 立即失效
- 得到一串新的 `ik_xxxxxxxx...` 文字
- 把這串文字記下來（貼到記事本），等等要用

---

## 第二步：在 Zeabur 更新環境變數

### 操作：
1. 用瀏覽器打開 `https://zeabur.com`
2. 登入帳號
3. 找到並點入 **「今心」或 "ImXin"** 專案
4. 左側選單點擊 **「Variables」**（環境變數）
5. 在變數列表中找到以下欄位，更新為新值：

| 變數名稱 | 填入內容 |
|---------|---------|
| `INSFORGE_API_KEY` | 貼上第一步複製的新 Key |
| `VITE_INSFORGE_URL` | `https://b88egxiz.ap-southeast.insforge.app`（確認這個網址沒變） |
| `VITE_COACH_API_URL` | `https://b88egxiz.functions.insforge.app/coach`（確認這個網址沒變） |

6. 點擊 **「Save」** 儲存

### 預期結果：
- Zeabur 會自動重新部署服務
- 等待 1-2 分鐘，狀態變為 "Running"

---

## 第三步：更新本地 .env 檔案（可選但建議做）

### 操作：
1. 打開專案資料夾中的 `.env` 檔案
2. 如果有舊的 `INSFORGE_API_KEY`，替換為新 Key
3. 儲存檔案

---

## 第四步：測試確認（可選）

### 操作：
1. 打開今心 App 的網址（如 `https://today-mood.zeabur.app`）
2. 試著使用 AI 教練功能
3. 如果能正常對話，表示新 Key 生效

---

## 注意事項

- **第一步和第二步要連續做**，中間不要間隔太久（舊 Key 已失效，新 Key 還沒貼上去會導致服務中斷）
- 如果第一步找不到「API Keys」，可能是專案管理員權限問題，請確認你是專案擁有者
- 如果第二步找不到 Variables，請確認你在 Zeabur 選的是正確的專案

---

## 檢查清單

- [ ] 在 InsForge 生成新 Key 並複製
- [ ] 在 Zeabur Variables 貼上新 Key 並儲存
- [ ] Zeabur 顯示重新部署中，等待完成
- [ ] 測試 AI 教練功能正常運作

---

*本指引由 Kimi Code CLI 生成*
*日期：2026-05-11*
