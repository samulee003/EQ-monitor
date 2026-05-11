# 貢獻指南

感謝你對 **今心 ImXin** 的關注！我們歡迎各種形式的貢獻。

---

## 🌟 如何貢獻

### 1. 報告問題

發現 Bug 或有功能建議？請開啟 [Issue](https://github.com/samulee003/EQ-monitor/issues)：

- **Bug 報告**：請提供重現步驟、預期行為、實際行為
- **功能建議**：請說明使用場景和預期效果
- **文檔改進**：指出需要改進的地方

### 2. 提交代碼

#### 第一步：Fork 與克隆

```bash
# Fork 本倉庫後
git clone https://github.com/YOUR_USERNAME/EQ-monitor.git
cd EQ-monitor
```

#### 第二步：安裝依賴

```bash
npm install
```

#### 第三步：建立分支

```bash
# 功能分支
git checkout -b feature/your-feature-name

# 修復分支
git checkout -b fix/your-fix-name
```

#### 第四步：開發與測試

```bash
# 啟動開發伺服器
npm run dev

# 運行測試
npm run test

# ESLint 檢查
npm run lint
```

#### 第五步：提交與推送

```bash
# 添加更改
git add .

# 提交（請使用有意義的提交信息）
git commit -m "feat: 添加新功能"

# 推送
git push origin feature/your-feature-name
```

#### 第六步：開啟 Pull Request

在 GitHub 上開啟 PR，並填寫模板。

---

## 📝 代碼規範

### 命名規範

| 類型 | 規範 | 範例 |
|------|------|------|
| 組件 | PascalCase | `MoodMeter.tsx` |
| 服務/工具 | camelCase | `storageService.ts` |
| 類型/接口 | PascalCase | `RulerLogEntry` |
| 常量 | UPPER_SNAKE_CASE | `MAX_RETRY` |
| 私有屬性 | 下劃線前綴 | `_internalValue` |

### 代碼風格

```typescript
// ✅ 好的寫法
interface User {
  id: string;
  name: string;
}

const getUser = (id: string): User => {
  // 實現
};

// ❌ 避免的寫法
type User = {
  id: string,
  name: string,
}
```

### 註釋規範

```typescript
/**
 * 計算情緒統計數據
 * @param logs - 情緒記錄日誌
 * @returns 統計結果對象
 */
export function calculateStats(logs: RulerLogEntry[]): EmotionStats {
  // 實現
}
```

### 提交信息規範

```
feat: 添加新功能
fix: 修復 Bug
docs: 文檔更新
style: 代碼格式調整
refactor: 重構
test: 測試相關
chore: 構建/工具相關
```

---

## 🧪 測試要求

- 新功能請添加對應測試
- 確保現有測試通過
- 目標測試覆蓋率：70%+

```bash
# 運行測試
npm run test

# 生成覆蓋率報告
npm run test:coverage
```

---

## 📦 發布流程

維護者會定期合併 PR 並發布新版本。

---

## 💬 討論區

歡迎在 [Discussions](https://github.com/samulee003/EQ-monitor/discussions) 交流想法！

---

## 🙏 感謝貢獻者

<a href="https://github.com/samulee003/EQ-monitor/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=samulee003/EQ-monitor" />
</a>

---

**今心團隊** 🌿
