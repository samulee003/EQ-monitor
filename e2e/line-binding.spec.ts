import { test, expect } from '@playwright/test';
import { bypassSplashViaSession, skipSplash } from './helpers';

/**
 * LINE 綁定關鍵路徑：訪問 #coach → 輸入綁定碼 → 收到綁定成功訊息
 *
 * Bot Server `/api/line-binding/claim` 端點以 Playwright route 攔截 mock，
 * 不依賴真實後端。
 */
test.describe('LINE 綁定流程', () => {
  test.beforeEach(async ({ page }) => {
    await bypassSplashViaSession(page);

    // 攔截綁定 API
    await page.route('**/api/line-binding/claim', async (route) => {
      const request = route.request();
      const body = JSON.parse(request.postData() || '{}');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          lineUserId: `U-${body.code || 'TEST00'}`,
          appUserId: body.appUserId,
          boundAt: new Date().toISOString(),
        }),
      });
    });
  });

  test('使用者輸入綁定碼後應顯示「已綁定」成功訊息', async ({ page }) => {
    await page.goto('/#coach');
    await skipSplash(page);

    const panel = page.getByTestId('line-binding-panel');
    await expect(panel).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('line-binding-input').fill('ABC123');
    await page.getByTestId('line-binding-submit').click();

    const message = page.getByTestId('line-binding-message');
    await expect(message).toBeVisible();
    await expect(message).toContainText('已綁定 LINE Bot');
    await expect(message).toContainText('U-ABC123');
  });

  test('綁定碼為空時應顯示提示訊息', async ({ page }) => {
    await page.goto('/#coach');
    await skipSplash(page);

    await page.getByTestId('line-binding-submit').click();

    const message = page.getByTestId('line-binding-message');
    await expect(message).toBeVisible();
    await expect(message).toContainText('請輸入');
  });
});
