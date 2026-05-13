import { test, expect } from '@playwright/test';
import { bypassSplashViaSession, skipSplash } from './helpers';

/**
 * Meta-Moment SOS 關鍵路徑：
 * #coach → 點 SOS 按鈕 → 4 步驟覆蓋層出現（感知 → 暫停 → 看見最好的自己 → 策略）
 */
test.describe('Meta-Moment SOS 流程', () => {
  test.beforeEach(async ({ page }) => {
    await bypassSplashViaSession(page);
  });

  test('點擊 SOS 按鈕應開啟 4 步驟 Meta-Moment 覆蓋層', async ({ page }) => {
    await page.goto('/#coach');
    await skipSplash(page);

    // 點擊紅色 SOS 按鈕
    const sosButton = page.getByTestId('coach-sos-button');
    await expect(sosButton).toBeVisible({ timeout: 10_000 });
    await sosButton.click();

    // 覆蓋層應出現，預設 step 0
    const overlay = page.getByTestId('meta-moment-overlay');
    await expect(overlay).toBeVisible();
    await expect(overlay).toHaveAttribute('data-step', '0');

    const title = page.getByTestId('meta-moment-step-title');
    await expect(title).toContainText('Step 1');
    await expect(title).toContainText('感知');

    // Step 1 → Step 2 (暫停 / 呼吸)
    await page.getByTestId('meta-moment-next').click();
    await expect(overlay).toHaveAttribute('data-step', '1');
    await expect(title).toContainText('Step 2');
    await expect(title).toContainText('暫停');

    // Step 2 → Step 3 (最好的自己)
    await page.getByTestId('meta-moment-next').click();
    await expect(overlay).toHaveAttribute('data-step', '2');
    await expect(title).toContainText('Step 3');
    await expect(title).toContainText('最好的自己');

    // Step 3 → Step 4 (策略)
    await page.getByTestId('meta-moment-next').click();
    await expect(overlay).toHaveAttribute('data-step', '3');
    await expect(title).toContainText('Step 4');
    await expect(title).toContainText('策略');
  });
});
