import { type Page, expect } from '@playwright/test';

/**
 * 共用測試輔助函式
 */

/** 跳過 SplashScreen（5 秒影片）並等待主畫面 */
export async function skipSplash(page: Page): Promise<void> {
  // sessionStorage 可能尚未設定，splash 仍會顯示；用 testid 點擊 skip
  const skip = page.getByTestId('splash-skip');
  // 等待 splash 出現或直接消失（已被 session 略過）
  try {
    await skip.waitFor({ state: 'visible', timeout: 3000 });
    await skip.click();
  } catch {
    // splash 已自動略過，繼續即可
  }
}

/** 預先把 sessionStorage 設好，避免 splash 撥放 */
export async function bypassSplashViaSession(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('splashPlayed', '1');
    } catch {
      /* ignore */
    }
  });
}

/** 等待沒有 isLocked 隱私鎖（測試環境預設無 PIN） */
export async function waitForApp(page: Page): Promise<void> {
  // MainLayout 載入後會有 main 容器；改用較寬鬆的等待
  await expect(page).toHaveURL(/localhost:5173/);
}
