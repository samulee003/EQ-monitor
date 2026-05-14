import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MainLayout from './MainLayout';
import { useAuth } from '../services/AuthContext';

vi.mock('../services/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../services/LanguageContext', () => ({
  useLanguage: () => ({ t: (text: string) => text }),
}));

vi.mock('../services/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'system',
    actualTheme: 'light',
    toggleTheme: vi.fn(),
  }),
}));

vi.mock('../services/NotificationService', () => ({
  notificationService: { initialize: vi.fn() },
}));

vi.mock('../adapters', () => ({
  settingsStore: {
    isOnboardingCompleted: () => true,
    setOnboardingCompleted: vi.fn(),
  },
}));

vi.mock('./AchievementToast', () => ({
  default: () => null,
}));

vi.mock('./OnboardingFlow', () => ({
  default: () => null,
}));

vi.mock('./coach/CoachFAB', () => ({
  CoachFAB: () => null,
}));

vi.mock('./AuthModal', () => ({
  default: ({ isOpen }: { isOpen: boolean }) => (isOpen ? <div role="dialog">登入表單</div> : null),
}));

vi.mock('./UserProfile', () => ({
  default: () => <div role="dialog">帳號設定</div>,
}));

describe('MainLayout 帳號入口', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('未登入時在頁首顯示登入入口並可開啟登入表單', () => {
    render(
      <MainLayout currentView="home" onNavigate={vi.fn()}>
        <div>主要內容</div>
      </MainLayout>
    );

    fireEvent.click(screen.getByRole('button', { name: '登入或註冊帳號' }));

    expect(screen.getByText('登入表單')).toBeInTheDocument();
  });

  it('頁首行動按鈕使用純圖示並保留清楚可及名稱', () => {
    render(
      <MainLayout currentView="home" onNavigate={vi.fn()}>
        <div>主要內容</div>
      </MainLayout>
    );

    const buttons = [
      screen.getByRole('button', { name: '我的成就' }),
      screen.getByRole('button', { name: '切換主題：系統' }),
      screen.getByRole('button', { name: '提醒設定' }),
      screen.getByRole('button', { name: '登入或註冊帳號' }),
    ];

    buttons.forEach((button) => {
      expect(button).toHaveTextContent(/^$/);
      expect(button.querySelector('svg')).not.toBeNull();
    });
  });

  it('已登入時帳號圖示會開啟個人中心', () => {
    (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
      user: { id: 'user_1', email: 'sam@example.com', displayName: 'Sam' },
      isAuthenticated: true,
      isLoading: false,
    });

    render(
      <MainLayout currentView="home" onNavigate={vi.fn()}>
        <div>主要內容</div>
      </MainLayout>
    );

    fireEvent.click(screen.getByRole('button', { name: '帳號設定：Sam' }));

    expect(screen.getByText('帳號設定')).toBeInTheDocument();
  });
});
