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

    fireEvent.click(screen.getByRole('button', { name: '登入' }));

    expect(screen.getByText('登入表單')).toBeInTheDocument();
  });
});
