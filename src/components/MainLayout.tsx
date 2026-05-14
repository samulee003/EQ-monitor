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

interface MainLayoutProps {
  children: React.ReactNode;
  currentView: 'home' | 'history' | 'growth' | 'achievement' | 'coach';
  onNavigate: (view: 'home' | 'history' | 'growth' | 'achievement' | 'coach') => void;
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
            {t('安定室')}
          </button>
          <button
            className={`nav-link ${currentView === 'history' ? 'active' : ''}`}
            onClick={() => onNavigate('history')}
          >
            {t('紀錄')}
          </button>
          <button
            className={`nav-link ${currentView === 'growth' ? 'active' : ''}`}
            onClick={() => onNavigate('growth')}
          >
            {t('洞察')}
          </button>
          <button
            className={`nav-link ${currentView === 'coach' ? 'active' : ''}`}
            onClick={() => onNavigate('coach')}
            title={t('今心主動 AI 教練')}
          >
            {t('主動教練')}
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
          {t('每日情緒覺察 • 主動教練陪你整理下一步')}
        </div>
        <div className="footer-disclaimer">
          {t('本工具非醫療器材，不能取代專業心理治療。')}
          <span className="footer-hotline">
            {t('如需協助：安心專線')} <strong>1925</strong> · {t('生命線')} <strong>1909</strong>
          </span>
        </div>
      </footer>

      {/* Notification Settings Modal */}
      {showSettings && (
        <NotificationSettingsPanel onClose={() => setShowSettings(false)} />
      )}

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
      {showProfile && <UserProfile onClose={() => setShowProfile(false)} />}

      <style>{`
        .glass-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--shell-panel);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border-bottom: 1px solid var(--shell-border);
          box-shadow: var(--shell-highlight), 0 10px 28px rgba(0, 0, 0, 0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: calc(var(--s-3) + 2px) var(--s-6);
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }

        .logo-image {
          height: 40px;
          width: 40px;
          object-fit: contain;
          border-radius: 8px;
          transition: transform 0.3s ease;
        }

        .logo-section:hover .logo-image {
          transform: scale(1.05) rotate(-2deg);
        }

        .logo-text {
          font-size: 1.45rem;
          font-weight: 900;
          letter-spacing: 0.18em;
          background: linear-gradient(135deg, var(--text-primary) 0%, var(--color-yellow) 58%, var(--color-green) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          white-space: nowrap;
          flex-shrink: 0;
        }

        nav {
          display: flex;
          gap: var(--s-6);
        }

        .nav-link {
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 0.92rem;
          font-weight: 600;
          cursor: pointer;
          padding: 10px 14px;
          position: relative;
          transition: var(--transition);
          white-space: nowrap;
          flex-shrink: 0;
          border-radius: 999px;
        }

        .nav-link:hover {
          color: var(--text-primary);
          background: var(--surface-elevated);
        }

        .nav-link.active {
          color: var(--text-primary);
          font-weight: 700;
          background: var(--surface-elevated);
          box-shadow: inset 0 0 0 1px var(--glass-border);
        }

        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 2px;
          background: var(--color-yellow);
          border-radius: 2px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: var(--s-2);
        }

        .header-icon-button {
          background: var(--surface-elevated);
          border: 1px solid var(--shell-border);
          border-radius: 50%;
          width: 48px;
          min-width: 48px;
          height: 48px;
          padding: 0;
          color: var(--text-primary);
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          flex-shrink: 0;
          position: relative;
        }

        .achievement-nav-btn:hover { transform: translateY(-1px) scale(1.05); background: var(--surface-hover); }
        .achievement-nav-btn:focus-visible { outline: 2px solid var(--color-yellow); outline-offset: 2px; }
        .achievement-nav-btn.active { border-color: rgba(212, 184, 122, 0.45); box-shadow: 0 0 0 1px rgba(212, 184, 122, 0.15), 0 8px 20px rgba(212, 184, 122, 0.12); background: rgba(212, 184, 122, 0.12); }

        .settings-btn:hover {
          transform: translateY(-1px) scale(1.05);
          background: var(--surface-hover);
        }

        .settings-btn:focus-visible { outline: 2px solid var(--color-yellow); outline-offset: 2px; }

        .settings-btn:active {
          transform: scale(0.95);
        }

        .theme-toggle:hover {
          transform: translateY(-1px) scale(1.05) rotate(10deg);
          background: var(--surface-hover);
        }

        .theme-toggle:focus-visible { outline: 2px solid var(--color-yellow); outline-offset: 2px; }

        .theme-toggle:active {
          transform: scale(0.95);
        }

        .account-btn {
          font-weight: 700;
        }

        .account-btn.signed-out {
          background: linear-gradient(135deg, var(--surface-elevated), rgba(151, 166, 180, 0.14));
        }

        .account-btn.signed-in {
          border-color: rgba(170, 176, 155, 0.55);
          background: linear-gradient(135deg, rgba(170, 176, 155, 0.18), var(--surface-elevated));
        }

        .header-action-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
        }

        .header-action-icon svg {
          width: 24px;
          height: 24px;
          display: block;
        }

        .account-status-dot {
          position: absolute;
          right: 8px;
          bottom: 8px;
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: var(--color-green);
          box-shadow: 0 0 0 2px var(--shell-panel);
        }

        .account-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          background: var(--surface-hover);
        }

        .account-btn:focus-visible { outline: 2px solid var(--color-yellow); outline-offset: 2px; }

        .account-btn:disabled {
          cursor: wait;
          opacity: 0.7;
        }

        footer {
          padding: 0.75rem 1rem 0.5rem;
          text-align: center;
          font-size: 0.75rem;
          color: var(--text-secondary);
          opacity: 0.55;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        @media (max-width: 768px) {
          .footer-disclaimer { display: none; }
          footer { padding: 0.5rem 1rem 5.75rem; }
          .main-content { padding-bottom: 5.25rem; }
          .glass-header {
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
          }
          .glass-header nav {
            position: fixed;
            left: 50%;
            bottom: var(--s-3);
            z-index: 120;
            width: min(calc(100vw - 24px), 420px);
            transform: translateX(-50%);
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 0;
            padding: 6px;
            background: var(--shell-panel);
            border: 1px solid var(--shell-border);
            border-radius: 28px;
            box-shadow: var(--shell-highlight), 0 16px 34px rgba(0, 0, 0, 0.12);
            backdrop-filter: blur(28px);
            -webkit-backdrop-filter: blur(28px);
          }
          .glass-header .nav-link {
            min-height: 44px;
            padding: 10px 8px;
            border-radius: 22px;
            font-size: 0.76rem;
            text-align: center;
          }
          .glass-header .nav-link.active {
            color: #1f1b16;
            background: linear-gradient(135deg, rgba(245, 243, 239, 0.9), rgba(213, 193, 165, 0.55));
            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45), 0 8px 18px rgba(0, 0, 0, 0.14);
          }
          .glass-header .nav-link.active::after {
            display: none;
          }
        }

        .footer-main {
          opacity: 1;
        }

        .footer-disclaimer {
          font-size: 0.72rem;
          opacity: 0.8;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 0.5rem;
        }

        .footer-hotline {
          color: var(--color-yellow);
          opacity: 0.9;
        }

        .nav-link:focus-visible {
          outline: 2px solid var(--color-yellow);
          outline-offset: 4px;
          border-radius: 4px;
        }

        @media (max-width: 1023px) {
          .settings-btn,
          .achievement-nav-btn,
          .theme-toggle,
          .account-btn {
            width: 44px;
            min-width: 44px;
            padding: 0;
            gap: 0;
          }
        }

        @media (max-width: 480px) {
          .glass-header {
            padding: var(--s-3) var(--s-4);
          }
          .logo-text {
            font-size: 1.2rem;
            letter-spacing: 1px;
          }
          .logo-image {
            height: 32px;
            width: 32px;
          }
          nav {
            gap: var(--s-3);
          }
          .nav-link {
            font-size: 0.85rem;
          }
          .header-actions {
            gap: var(--s-1);
          }
          .settings-btn,
          .achievement-nav-btn,
          .theme-toggle,
          .account-btn {
            width: 40px;
            min-width: 40px;
            padding: 0;
            height: 40px;
            font-size: 0.95rem;
            gap: 0;
          }
        }

        @media (max-width: 360px) {
          .logo-text {
            display: none;
          }
          nav {
            gap: var(--s-2);
          }
          .settings-btn,
          .achievement-nav-btn,
          .theme-toggle,
          .account-btn {
            width: 36px;
            min-width: 36px;
            padding: 0;
            height: 36px;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
};

export default MainLayout;
