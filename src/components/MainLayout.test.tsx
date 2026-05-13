import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MainLayout from './MainLayout';

vi.mock('../services/LanguageContext', () => ({
  useLanguage: () => ({
    t: (text: string) => text,
  }),
}));

vi.mock('../services/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    actualTheme: 'light',
    toggleTheme: vi.fn(),
  }),
}));

vi.mock('../services/NotificationService', () => ({
  notificationService: {
    initialize: vi.fn(),
  },
}));

vi.mock('../adapters', () => ({
  settingsStore: {
    isOnboardingCompleted: vi.fn(() => true),
  },
}));

vi.mock('./NotificationSettings', () => ({
  default: () => <div>提醒設定面板</div>,
}));

vi.mock('./AchievementToast', () => ({
  default: () => null,
}));

vi.mock('./OnboardingFlow', () => ({
  default: () => <div>新手引導</div>,
}));

vi.mock('./coach/CoachFAB', () => ({
  CoachFAB: () => null,
}));

describe('MainLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('應該使用原版首頁導覽文案', () => {
    render(
      <MainLayout currentView="home" onNavigate={vi.fn()}>
        <div>內容</div>
      </MainLayout>
    );

    expect(screen.getByRole('button', { name: '今日心情' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '記錄回顧' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '成長看板' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '教練' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '安定室' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '紀錄' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '洞察' })).not.toBeInTheDocument();
  });

  it('右上角操作不應該顯示勳亮訊單字', () => {
    render(
      <MainLayout currentView="home" onNavigate={vi.fn()}>
        <div>內容</div>
      </MainLayout>
    );

    expect(screen.getByRole('button', { name: '我的成就' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '切換主題' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '提醒設定' })).toBeInTheDocument();
    expect(screen.queryByText('勳')).not.toBeInTheDocument();
    expect(screen.queryByText('亮')).not.toBeInTheDocument();
    expect(screen.queryByText('訊')).not.toBeInTheDocument();
  });
});
