/**
 * App Store - 全局應用狀態管理
 *
 * 使用 Zustand 管理跨組件共享的狀態，替代部分 Context 的使用。
 * 目前管理：視圖路由、啟動畫面、隱私鎖等全局 UI 狀態。
 */

import { create } from 'zustand';
import { settingsStore } from '../adapters';

export type AppView = 'home' | 'checkin' | 'history' | 'growth' | 'achievement' | 'coach';

interface AppState {
  // 視圖路由
  currentView: AppView;
  setView: (view: AppView) => void;

  // 啟動畫面
  showSplash: boolean;
  dismissSplash: () => void;

  // 隱私鎖
  isLocked: boolean;
  isLockInitialized: boolean;
  unlock: () => void;
  relock: () => void;
  initializeLock: () => void;

  // 導引
  showOnboarding: boolean;
  dismissOnboarding: () => void;

  // 導入結果提示
  importToast: { message: string; type: 'success' | 'error' } | null;
  showImportToast: (message: string, type: 'success' | 'error') => void;
  clearImportToast: () => void;
}

const VALID_APP_VIEWS: AppView[] = ['home', 'checkin', 'history', 'growth', 'achievement', 'coach'];

function getValidViewFromHash(): AppView {
  if (typeof window === 'undefined') return 'home';
  const hash = location.hash.slice(1);
  return VALID_APP_VIEWS.includes(hash as AppView) ? (hash as AppView) : 'home';
}

export const useAppStore = create<AppState>((set) => ({
  // 視圖路由（默認從 URL hash 讀取，否則 home）
  currentView: getValidViewFromHash(),
  setView: (view) => {
    set({ currentView: view });
    // 同步到 URL hash，支持瀏覽器前進後退
    if (typeof window !== 'undefined') {
      location.hash = view;
    }
  },

  // 啟動畫面
  showSplash: true,
  dismissSplash: () => set({ showSplash: false }),

  // 隱私鎖
  // 初始狀態：使用 hasPrivacyPin() 同步判斷是否有 PIN 存在
  // PIN 內容已改為哈希存儲，此處僅判斷存在性
  isLocked: (() => {
    const hasPin = settingsStore.hasPrivacyPin();
    const enabled = settingsStore.isPrivacyEnabled();
    return hasPin && enabled;
  })(),
  isLockInitialized: true,
  unlock: () => set({ isLocked: false }),
  relock: () => {
    const hasPin = settingsStore.hasPrivacyPin();
    const enabled = settingsStore.isPrivacyEnabled();
    if (hasPin && enabled) {
      set({ isLocked: true });
    }
  },
  initializeLock: () => {
    const hasPin = settingsStore.hasPrivacyPin();
    const enabled = settingsStore.isPrivacyEnabled();
    set({ isLocked: hasPin && enabled, isLockInitialized: true });
  },

  // 導引
  showOnboarding: !settingsStore.isOnboardingCompleted(),
  dismissOnboarding: () => {
    settingsStore.setOnboardingCompleted(true);
    set({ showOnboarding: false });
  },

  // 導入提示
  importToast: null,
  showImportToast: (message, type) => set({ importToast: { message, type } }),
  clearImportToast: () => set({ importToast: null }),
}));

// 監聽瀏覽器 hash 變化，同步到 store
if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => {
    const hash = location.hash.slice(1) as AppView;
    if (VALID_APP_VIEWS.includes(hash)) {
      useAppStore.setState({ currentView: hash });
    }
  });
}
