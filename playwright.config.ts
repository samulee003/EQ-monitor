import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 配置
 *
 * - 只跑 Chromium（節省 CI 時間與磁碟空間）
 * - 本地：自動啟動 Vite dev server (npm run dev → :5173)
 * - CI：重試 2 次；本地：不重試
 * - 報告：list + html（artifact 上傳於 CI workflow）
 */
const isCI = !!process.env.CI;
const devPort = process.env.PLAYWRIGHT_PORT || '4173';
const devUrl = `http://127.0.0.1:${devPort}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: 1,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  reporter: isCI
    ? [['list'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: devUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${devPort}`,
    url: devUrl,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
