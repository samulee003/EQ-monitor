import { test, expect } from '@playwright/test';
import { bypassSplashViaSession, skipSplash } from './helpers';

/**
 * 知心四式關鍵路徑：訪問今日心情 → 從心照推進到喚名/安神前段
 *
 * 完整流程包含多個互動子組件且帶輸入校驗；端到端逐步模擬會極為脆弱
 * （且許多步驟需要鍵盤/滑桿）。此 spec 以「能進入知心四式並從心照往下一段」
 * 作為主要關鍵路徑驗證，後續細部步驟由 Vitest 單元測試覆蓋。
 */
test.describe('知心四式關鍵路徑', () => {
  test.beforeEach(async ({ page }) => {
    await bypassSplashViaSession(page);
  });

  test('使用者可以從「心照」推進到下一步', async ({ page }) => {
    await page.goto('/#home');
    await skipSplash(page);

    // 今日心情應顯示四象限選擇器（心照）
    const heading = page.getByRole('heading', { name: /你現在感覺如何/ });
    await expect(heading).toBeVisible({ timeout: 10_000 });

    // 首頁保持極簡，只顯示四象限，不在第一屏放進度條
    await expect(page.getByTestId('ruler-progress')).toHaveCount(0);

    // 選擇一個象限（綠色 / 低能量 愉快）
    await page.getByTestId('emotion-quadrant-green').click();

    // 確認進入下一步
    const confirm = page.getByTestId('emotion-confirm');
    await expect(confirm).toBeEnabled();
    await confirm.click();

    // 進入下一步後才顯示流程進度
    const progress = page.getByTestId('ruler-progress');
    await expect(progress).toBeVisible({ timeout: 5_000 });
    await expect(progress).not.toHaveAttribute('data-current-step', 'recognizing');
  });
});
