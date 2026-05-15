import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockSettingsStore = {
  hasPrivacyPin: vi.fn(() => false),
  isPrivacyEnabled: vi.fn(() => false),
  isOnboardingCompleted: () => true,
  setOnboardingCompleted: vi.fn(),
};

async function loadStoreAt(hash: string) {
  vi.resetModules();
  vi.doMock('../adapters', () => ({
    settingsStore: mockSettingsStore,
  }));

  window.history.replaceState(null, '', `/${hash}`);

  return import('./appStore');
}

describe('appStore URL 入口', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSettingsStore.hasPrivacyPin.mockReturnValue(false);
    mockSettingsStore.isPrivacyEnabled.mockReturnValue(false);
    window.history.replaceState(null, '', '/');
  });

  it('無 hash 的根網址直接進入今日心情並補上 #home', async () => {
    const { useAppStore } = await loadStoreAt('');

    expect(useAppStore.getState().currentView).toBe('home');
    expect(window.location.hash).toBe('#home');
  });

  it('舊的 #landing 入口會導到 App 內的關於我們頁', async () => {
    const { useAppStore } = await loadStoreAt('#landing');

    expect(useAppStore.getState().currentView).toBe('about');
    expect(window.location.hash).toBe('#about');
  });

  it('允許直接開啟 #about 關於我們頁', async () => {
    const { useAppStore } = await loadStoreAt('#about');

    expect(useAppStore.getState().currentView).toBe('about');
  });

  it('應用鎖已開啟但尚未設定 PIN 時，會進入 PIN 設定畫面', async () => {
    mockSettingsStore.isPrivacyEnabled.mockReturnValue(true);
    mockSettingsStore.hasPrivacyPin.mockReturnValue(false);

    const { useAppStore } = await loadStoreAt('#home');

    expect(useAppStore.getState().isLocked).toBe(true);
  });

  it('應用鎖已開啟且已有 PIN 時，會進入解鎖畫面', async () => {
    mockSettingsStore.isPrivacyEnabled.mockReturnValue(true);
    mockSettingsStore.hasPrivacyPin.mockReturnValue(true);

    const { useAppStore } = await loadStoreAt('#home');

    expect(useAppStore.getState().isLocked).toBe(true);
  });
});
