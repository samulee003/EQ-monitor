import React, { useState, useEffect } from 'react';
import { useLanguage } from '../services/LanguageContext';
import { useTheme } from '../services/ThemeContext';
import NotificationSettingsPanel from './NotificationSettings';
import { notificationService } from '../services/NotificationService';
import AchievementToast from './AchievementToast';
import OnboardingFlow from './OnboardingFlow';
import { settingsStore } from '../adapters';
import { CoachFAB } from './coach/CoachFAB';
import AuthModal from './AuthModal';
import UserProfile from './UserProfile';
import { useAuth } from '../services/AuthContext';
import './MainLayout.css';

type MainLayoutNavView = 'home' | 'history' | 'growth' | 'achievement' | 'coach';

interface MainLayoutProps {
  children: React.ReactNode;
  currentView: MainLayoutNavView | 'about';
  onNavigate: (view: MainLayoutNavView) => void;
}

type HeaderIconType = 'achievement' | 'moon' | 'sun' | 'system' | 'bell' | 'account' | 'loading';

const HeaderActionIcon: React.FC<{ type: HeaderIconType }> = ({ type }) => {
  const sharedProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
  };

  if (type === 'achievement') {
    return (
      <svg {...sharedProps}>
        <path d="M8 4h8v3.5a4 4 0 0 1-8 0V4Z" />
        <path d="M6 5H4.75A1.75 1.75 0 0 0 3 6.75C3 9 4.6 10.6 7.1 11" />
        <path d="M18 5h1.25A1.75 1.75 0 0 1 21 6.75c0 2.25-1.6 3.85-4.1 4.25" />
        <path d="M12 12v4" />
        <path d="M8.5 20h7" />
        <path d="M10 16h4" />
      </svg>
    );
  }

  if (type === 'moon') {
    return (
      <svg {...sharedProps}>
        <path d="M20 14.2A7.3 7.3 0 0 1 9.8 4a8.2 8.2 0 1 0 10.2 10.2Z" />
      </svg>
    );
  }

  if (type === 'sun') {
    return (
      <svg {...sharedProps}>
        <circle cx="12" cy="12" r="3.4" />
        <path d="M12 2.8v2.1" />
        <path d="M12 19.1v2.1" />
        <path d="M4.2 4.2l1.5 1.5" />
        <path d="M18.3 18.3l1.5 1.5" />
        <path d="M2.8 12h2.1" />
        <path d="M19.1 12h2.1" />
        <path d="M4.2 19.8l1.5-1.5" />
        <path d="M18.3 5.7l1.5-1.5" />
      </svg>
    );
  }

  if (type === 'system') {
    return (
      <svg {...sharedProps}>
        <rect x="4" y="5" width="16" height="11" rx="2.2" />
        <path d="M9 20h6" />
        <path d="M12 16v4" />
        <path d="M8.4 9.4h7.2" />
        <path d="M8.4 12.2h4.8" />
      </svg>
    );
  }

  if (type === 'bell') {
    return (
      <svg {...sharedProps}>
        <path d="M6.8 10.3a5.2 5.2 0 0 1 10.4 0c0 5 2 5.8 2 5.8H4.8s2-.8 2-5.8Z" />
        <path d="M10 19a2.4 2.4 0 0 0 4 0" />
        <path d="M12 3.4V2.8" />
      </svg>
    );
  }

  if (type === 'loading') {
    return (
      <svg {...sharedProps}>
        <path d="M12 4a8 8 0 1 0 8 8" />
      </svg>
    );
  }

  return (
    <svg {...sharedProps}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
};

const MainLayout: React.FC<MainLayoutProps> = ({ children, currentView, onNavigate }) => {
  const { t } = useLanguage();
  const { theme, actualTheme, toggleTheme } = useTheme();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showSettings, setShowSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const themeIcon = {
    dark: 'moon',
    light: 'sun',
    system: 'system',
  }[theme] as HeaderIconType;
  const themeLabel = {
    dark: t('深色'),
    light: t('淺色'),
    system: t('系統')
  }[theme];

  // Initialize notification service and check onboarding
  useEffect(() => {
    notificationService.initialize();
    
    const onboardingCompleted = settingsStore.isOnboardingCompleted();
    if (!onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    settingsStore.setOnboardingCompleted(true);
    setShowOnboarding(false);
  };

  const handleAccountClick = () => {
    if (isAuthenticated) {
      setShowProfile(true);
      return;
    }
    setShowAuth(true);
  };

  const accountLabel = isLoading
    ? t('載入中')
    : isAuthenticated
      ? `${t('帳號設定')}：${user?.displayName || user?.email || t('帳號')}`
      : t('登入或註冊帳號');

  return (
    <div className="app-container">
      <header className="glass-header">
        <div className="logo-section" onClick={() => onNavigate('home')} style={{ cursor: 'pointer' }}>
          <img src="/logo.png" alt="今心 Logo" className="logo-image" />
          <span className="logo-text">{t('今心')}</span>
        </div>
        <nav>
          <button
            className={`nav-link ${currentView === 'home' ? 'active' : ''}`}
            onClick={() => onNavigate('home')}
          >
            {t('今日心情')}
          </button>
          <button
            className={`nav-link ${currentView === 'history' ? 'active' : ''}`}
            onClick={() => onNavigate('history')}
          >
            {t('記錄回顧')}
          </button>
          <button
            className={`nav-link ${currentView === 'growth' ? 'active' : ''}`}
            onClick={() => onNavigate('growth')}
          >
            {t('成長看板')}
          </button>
          <button
            className={`nav-link ${currentView === 'coach' ? 'active' : ''}`}
            onClick={() => onNavigate('coach')}
            title={t('阿念教練')}
            aria-label={t('教練')}
          >
            <span>{t('教練')}</span>
            <span className="nav-beta-badge" aria-hidden="true">Beta</span>
          </button>
        </nav>
        <div className="header-actions" aria-label={t('快捷操作')}>
          <button
            className={`header-icon-button achievement-nav-btn ${currentView === 'achievement' ? 'active' : ''}`}
            onClick={() => onNavigate('achievement')}
            title={t('我的成就')}
            aria-label={t('我的成就')}
          >
            <span className="header-action-icon">
              <HeaderActionIcon type="achievement" />
            </span>
          </button>
          <button
            className="header-icon-button theme-toggle"
            onClick={toggleTheme}
            title={`${t('當前主題')}: ${t(theme)} (${t(actualTheme)})`}
            aria-label={`${t('切換主題')}：${themeLabel}`}
          >
            <span className="header-action-icon">
              <HeaderActionIcon type={themeIcon} />
            </span>
          </button>
          <button
            className="header-icon-button settings-btn"
            onClick={() => setShowSettings(true)}
            title={t('提醒設定')}
            aria-label={t('提醒設定')}
          >
            <span className="header-action-icon">
              <HeaderActionIcon type="bell" />
            </span>
          </button>
          <button
            className={`header-icon-button account-btn ${isAuthenticated ? 'signed-in' : 'signed-out'}`}
            onClick={handleAccountClick}
            title={accountLabel}
            aria-label={accountLabel}
            disabled={isLoading}
          >
            <span className="header-action-icon">
              <HeaderActionIcon type={isLoading ? 'loading' : 'account'} />
            </span>
            {isAuthenticated && <span className="account-status-dot" aria-hidden="true" />}
          </button>
        </div>
      </header>

      <main id="main-content" className="main-content" tabIndex={-1}>
        {children}
      </main>

      <AchievementToast />

      {showOnboarding && (
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      )}

      <CoachFAB
        visible={currentView !== 'coach'}
        onClick={() => onNavigate('coach')}
      />

      <footer>
        <div className="footer-main">
          {t('每日情緒覺察 • 阿念陪你整理下一步')}
        </div>
        <div className="footer-disclaimer">
          {t('本工具非醫療器材，不能取代專業心理治療。')}
          <span className="footer-hotline">
            {t('如需協助：安心專線')} <strong>1925</strong> · {t('生命線')} <strong>1909</strong>
          </span>
        </div>
        <div className="footer-links" aria-label={t('產品資訊')}>
          <a href="#about">{t('關於我們')}</a>
          <a href="/privacy.html" target="_blank" rel="noopener noreferrer">{t('隱私與免責聲明')}</a>
          <a href="/account-deletion.html" target="_blank" rel="noopener noreferrer">{t('資料刪除申請')}</a>
          <a href="https://github.com/samulee003/EQ-monitor/issues/new" target="_blank" rel="noopener noreferrer">{t('回報問題')}</a>
        </div>
      </footer>

      {/* Notification Settings Modal */}
      {showSettings && (
        <NotificationSettingsPanel onClose={() => setShowSettings(false)} />
      )}

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}

    </div>
  );
};

export default MainLayout;
