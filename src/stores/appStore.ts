/**
 * App Store - 全局應用狀態管理
 *
 * 使用 Zustand 管理跨組件共享的狀態，替代部分 Context 的使用。
 * 目前管理：視圖路由、啟動畫面、隱私鎖等全局 UI 狀態。
 */

import { create } from 'zustand';
import { settingsStore } from '../adapters';

export type AppView = 'home' | 'history' | 'growth' | 'achievement' | 'coach' | 'about';

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

const VALID_APP_VIEWS: AppView[] = ['home', 'history', 'growth', 'achievement', 'coach', 'about'];

function shouldShowPrivacyLock(): boolean {
  const enabled = settingsStore.isPrivacyEnabled();
  if (!enabled) return false;

  // When privacy lock is enabled for the first time there is no PIN yet.
  // Enter the lock surface so PrivacyLock can collect the initial 4-digit PIN.
  return true;
}

function replaceHash(view: AppView): void {
  if (typeof window === 'undefined') return;
  const nextUrl = `${location.pathname}${location.search}#${view}`;
  history.replaceState(null, '', nextUrl);
}

function getValidViewFromHash(): AppView {
  if (typeof window === 'undefined') return 'home';
  const hash = location.hash.slice(1);
  if (!hash) {
    replaceHash('home');
    return 'home';
  }
  if (hash === 'checkin') return 'home';
  if (hash === 'landing') {
    replaceHash('about');
    return 'about';
  }
  if (VALID_APP_VIEWS.includes(hash as AppView)) return hash as AppView;
  replaceHash('home');
  return 'home';
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
  // 初始狀態：若已啟用應用鎖，即進入鎖定畫面。
  // 尚未設定 PIN 時，PrivacyLock 會負責收集初始 PIN；已有 PIN 時則進入解鎖。
  isLocked: shouldShowPrivacyLock(),
  isLockInitialized: true,
  unlock: () => set({ isLocked: false }),
  relock: () => {
    if (shouldShowPrivacyLock()) {
      set({ isLocked: true });
    }
  },
  initializeLock: () => {
    set({ isLocked: shouldShowPrivacyLock(), isLockInitialized: true });
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
    useAppStore.setState({ currentView: getValidViewFromHash() });
  });
}
