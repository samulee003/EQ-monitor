import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MainLayout from './MainLayout';
import { useAuth } from '../services/AuthContext';

const mockSettingsStore = vi.hoisted(() => ({
  isOnboardingCompleted: vi.fn(() => true),
  setOnboardingCompleted: vi.fn(),
}));

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
  settingsStore: mockSettingsStore,
}));

vi.mock('./AchievementToast', () => ({
  default: () => null,
}));

vi.mock('./OnboardingFlow', () => ({
  default: () => <div role="dialog">初次導覽</div>,
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
    mockSettingsStore.isOnboardingCompleted.mockReturnValue(true);
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

  it('主導覽保留原版首頁文案', () => {
    render(
      <MainLayout currentView="home" onNavigate={vi.fn()}>
        <div>主要內容</div>
      </MainLayout>
    );

    expect(screen.getByRole('button', { name: '今日心情' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '記錄回顧' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '成長看板' })).toBeInTheDocument();
    const coachNav = screen.getByRole('button', { name: '教練' });
    expect(coachNav).toBeInTheDocument();
    expect(within(coachNav).getByText('Beta')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '安定室' })).not.toBeInTheDocument();
  });

  it('第一次進入會自動顯示 App 導覽', () => {
    mockSettingsStore.isOnboardingCompleted.mockReturnValue(false);

    render(
      <MainLayout currentView="home" onNavigate={vi.fn()}>
        <div>主要內容</div>
      </MainLayout>
    );

    expect(screen.getByText('主要內容')).toBeInTheDocument();
    expect(screen.getByText('初次導覽')).toBeInTheDocument();
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

  it('頁尾提供關於我們、隱私、資料刪除與回報問題入口', () => {
    render(
      <MainLayout currentView="home" onNavigate={vi.fn()}>
        <div>主要內容</div>
      </MainLayout>
    );

    expect(screen.getByRole('link', { name: '關於我們' })).toHaveAttribute('href', '#about');
    expect(screen.getByRole('link', { name: '隱私與免責聲明' })).toHaveAttribute('href', '/privacy.html');
    expect(screen.getByRole('link', { name: '資料刪除申請' })).toHaveAttribute('href', '/account-deletion.html');
    expect(screen.getByRole('link', { name: '回報問題' })).toHaveAttribute(
      'href',
      'https://github.com/samulee003/EQ-monitor/issues/new'
    );
  });
});
