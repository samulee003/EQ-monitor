import { test, expect } from '@playwright/test';
import { bypassSplashViaSession, skipSplash } from './helpers';

/**
 * 緊急安定 SOS 關鍵路徑：
 * #coach → 點 SOS 按鈕 → 4 步驟覆蓋層出現（感覺身體 → 呼吸暫停 → 記得想成為的自己 → 選一個照顧動作）
 */
test.describe('緊急安定 SOS 流程', () => {
  test.beforeEach(async ({ page }) => {
    await bypassSplashViaSession(page);
  });

  test('點擊 SOS 按鈕應開啟 4 步驟緊急安定覆蓋層', async ({ page }) => {
    await page.goto('/#coach');
    await skipSplash(page);

    // 點擊紅色 SOS 按鈕
    const sosButton = page.getByTestId('coach-sos-button');
    await expect(sosButton).toBeVisible({ timeout: 10_000 });
    await sosButton.click();

    // 覆蓋層應出現，預設 step 0
    const overlay = page.getByTestId('emergency-stabilization-overlay');
    await expect(overlay).toBeVisible();
    await expect(overlay).toHaveAttribute('data-step', '0');

    const title = page.getByTestId('emergency-stabilization-step-title');
    await expect(title).toContainText('第 1 步');
    await expect(title).toContainText('感覺身體');

    // 第 1 步 → 第 2 步（呼吸暫停）
    await page.getByTestId('emergency-stabilization-next').click();
    await expect(overlay).toHaveAttribute('data-step', '1');
    await expect(title).toContainText('第 2 步');
    await expect(title).toContainText('呼吸暫停');

    // 第 2 步 → 第 3 步（想成為的自己）
    await page.getByTestId('emergency-stabilization-next').click();
    await expect(overlay).toHaveAttribute('data-step', '2');
    await expect(title).toContainText('第 3 步');
    await expect(title).toContainText('想成為的自己');

    // 第 3 步 → 第 4 步（照顧動作）
    await page.getByTestId('emergency-stabilization-next').click();
    await expect(overlay).toHaveAttribute('data-step', '3');
    await expect(title).toContainText('第 4 步');
    await expect(title).toContainText('照顧動作');
  });
});
