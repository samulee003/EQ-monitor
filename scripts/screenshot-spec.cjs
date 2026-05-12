const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTDIR = path.resolve(__dirname, '../docs/spec-screenshots');
const BASE_URL = 'http://localhost:4173';

// iPhone 14 Pro viewport
const VIEWPORT = { width: 390, height: 844 };

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function dismissOverlays(page) {
  // Dismiss splash if present
  await page.evaluate(() => {
    const store = window.useAppStore;
    if (store) {
      store.getState().dismissSplash();
    }
  }).catch(() => {});

  // Unlock privacy lock if present
  await page.evaluate(() => {
    const store = window.useAppStore;
    if (store) {
      store.getState().unlock();
    }
  }).catch(() => {});

  // Dismiss onboarding if present
  await page.evaluate(() => {
    const store = window.useAppStore;
    if (store) {
      store.getState().dismissOnboarding();
    }
  }).catch(() => {});
}

async function screenshotView(browser, viewName, hash, opts = {}) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    locale: 'zh-TW',
  });

  const page = await context.newPage();

  // Pre-seed localStorage to skip privacy lock / onboarding
  // Pre-seed sessionStorage to skip splash screen
  await context.addInitScript(() => {
    localStorage.setItem('imxin_onboarding_completed', 'true');
    localStorage.removeItem('imxin_privacy_pin');
    localStorage.removeItem('imxin_privacy_enabled');
    localStorage.setItem('imxin-theme', 'dark');
    localStorage.setItem('jinxin-language', 'zh-TW');
    sessionStorage.setItem('splashPlayed', '1');
  });

  // Inject mock data for history/growth/achievement views
  if (opts.mockLogs) {
    await context.addInitScript(() => {
      const logs = [
        { id: 'l1', timestamp: new Date(Date.now() - 86400000).toISOString(), emotions: [{ id: 'anxious', name: '焦慮的', quadrant: 'red' }], intensity: 6, bodyScan: null, understanding: null, expressing: null, regulating: { selectedStrategies: ['暫停卡'] }, postMood: '平靜一些', isFullFlow: true },
        { id: 'l2', timestamp: new Date(Date.now() - 172800000).toISOString(), emotions: [{ id: 'calm', name: '平靜的', quadrant: 'green' }], intensity: 4, bodyScan: null, understanding: null, expressing: null, regulating: null, postMood: '持續平靜', isFullFlow: false },
        { id: 'l3', timestamp: new Date(Date.now() - 259200000).toISOString(), emotions: [{ id: 'excited', name: '興奮的', quadrant: 'yellow' }], intensity: 8, bodyScan: null, understanding: null, expressing: null, regulating: null, postMood: '開心', isFullFlow: true },
        { id: 'l4', timestamp: new Date(Date.now() - 345600000).toISOString(), emotions: [{ id: 'tired', name: '疲憊的', quadrant: 'blue' }], intensity: 5, bodyScan: null, understanding: null, expressing: null, regulating: { selectedStrategies: ['自我慈悲三步驟'] }, postMood: '稍好', isFullFlow: true },
        { id: 'l5', timestamp: new Date(Date.now() - 432000000).toISOString(), emotions: [{ id: 'grateful', name: '感恩的', quadrant: 'green' }], intensity: 7, bodyScan: null, understanding: null, expressing: null, regulating: null, postMood: '溫暖', isFullFlow: false },
        { id: 'l6', timestamp: new Date(Date.now() - 518400000).toISOString(), emotions: [{ id: 'frustrated', name: '挫敗的', quadrant: 'red' }], intensity: 7, bodyScan: null, understanding: null, expressing: null, regulating: { selectedStrategies: ['修復對話'] }, postMood: '釋懷', isFullFlow: true },
        { id: 'l7', timestamp: new Date(Date.now() - 604800000).toISOString(), emotions: [{ id: 'content', name: '滿足的', quadrant: 'green' }], intensity: 6, bodyScan: null, understanding: null, expressing: null, regulating: null, postMood: '滿足', isFullFlow: false },
      ];
      localStorage.setItem('feelings_logs', JSON.stringify(logs));
    });
  }

  if (opts.mockProgress) {
    await context.addInitScript(() => {
      const progress = {
        streak: { currentStreak: 5, longestStreak: 12, lastLogDate: new Date().toISOString() },
        unlockedAchievements: ['first_log', 'streak_3', 'streak_7'],
        totalLogs: 42,
      };
      localStorage.setItem('user_progress', JSON.stringify(progress));
    });
  }

  await page.goto(`${BASE_URL}/#${hash}`, { waitUntil: 'networkidle' });
  await sleep(800);

  await dismissOverlays(page);
  await sleep(600);

  // Wait for lazy components to load
  await page.waitForLoadState('networkidle');
  await sleep(600);

  const filePath = path.join(OUTDIR, `${viewName}.png`);
  await page.screenshot({ path: filePath, fullPage: opts.fullPage !== false });
  console.log(`Screenshot: ${filePath}`);

  await context.close();
}

(async () => {
  fs.mkdirSync(OUTDIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  // 1. Home - MoodMeter + QuickStats
  await screenshotView(browser, '01-home', 'home', { mockLogs: true, mockProgress: true });

  // 2. History - Timeline
  await screenshotView(browser, '02-history', 'history', { mockLogs: true, mockProgress: true });

  // 3. Growth - Dashboard
  await screenshotView(browser, '03-growth', 'growth', { mockLogs: true, mockProgress: true });

  // 4. Achievement
  await screenshotView(browser, '04-achievement', 'achievement', { mockLogs: true, mockProgress: true });

  // 5. Coach - AI Coach
  await screenshotView(browser, '05-coach', 'coach', { mockLogs: true, mockProgress: true });

  await browser.close();
  console.log('All screenshots done.');
})();
