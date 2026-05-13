import React, { useState, useEffect } from 'react';
import { useLanguage } from '../services/LanguageContext';
import { useTheme } from '../services/ThemeContext';
import NotificationSettingsPanel from './NotificationSettings';
import { notificationService } from '../services/NotificationService';
import AchievementToast from './AchievementToast';
import OnboardingFlow from './OnboardingFlow';
import { settingsStore } from '../adapters';
import { CoachFAB } from './coach/CoachFAB';

interface MainLayoutProps {
  children: React.ReactNode;
  currentView: 'home' | 'history' | 'growth' | 'achievement' | 'coach';
  onNavigate: (view: 'home' | 'history' | 'growth' | 'achievement' | 'coach') => void;
}

const headerIcons = {
  achievement: (
    <svg className="header-action-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 4h10v5.4a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4.5a1 1 0 0 0-1 1v1.2A3.8 3.8 0 0 0 7 12" />
      <path d="M17 6h2.5a1 1 0 0 1 1 1v1.2A3.8 3.8 0 0 1 17 12" />
      <path d="M12 14.5v3.2" />
      <path d="M8.8 20h6.4" />
    </svg>
  ),
  theme: (
    <svg className="header-action-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M10.5 4.2a6.8 6.8 0 0 0 8.9 8.9 7.5 7.5 0 1 1-8.9-8.9Z" />
      <path d="M17.8 3.5v2.2" />
      <path d="M17.8 10.3v2.2" />
      <path d="M13.3 8h2.2" />
      <path d="M20.1 8h2.2" />
    </svg>
  ),
  reminder: (
    <svg className="header-action-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M18 10.7a6 6 0 0 0-12 0c0 3.8-1.5 5.2-2.4 6.1h16.8C19.5 15.9 18 14.5 18 10.7Z" />
      <path d="M9.6 19a2.6 2.6 0 0 0 4.8 0" />
      <path d="M12 3V2" />
    </svg>
  ),
};

const MainLayout: React.FC<MainLayoutProps> = ({ children, currentView, onNavigate }) => {
  const { t } = useLanguage();
  const { theme, actualTheme, toggleTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

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
          >
            {t('教練')}
          </button>
        </nav>
        <div className="header-actions">
          <button
            className={`achievement-nav-btn ${currentView === 'achievement' ? 'active' : ''}`}
            onClick={() => onNavigate('achievement')}
            title={t('我的成就')}
            aria-label={t('我的成就')}
          >
            {headerIcons.achievement}
          </button>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={`${t('當前主題')}: ${t(theme)} (${t(actualTheme)})`}
            aria-label={t('切換主題')}
          >
            {headerIcons.theme}
          </button>
          <button
            className="settings-btn"
            onClick={() => setShowSettings(true)}
            title={t('提醒設定')}
            aria-label={t('提醒設定')}
          >
            {headerIcons.reminder}
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
          {t('每日情緒覺察 • 打造平穩心靈')}
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
          gap: var(--s-3);
        }

        .achievement-nav-btn {
          background: var(--surface-elevated);
          border: 1px solid var(--shell-border);
          border-radius: 999px;
          width: 44px;
          min-width: 44px;
          height: 44px;
          font-size: 0.92rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          flex-shrink: 0;
        }
        .achievement-nav-btn:hover { transform: translateY(-1px) scale(1.05); background: var(--surface-hover); }
        .achievement-nav-btn:focus-visible { outline: 2px solid var(--color-yellow); outline-offset: 2px; }
        .achievement-nav-btn.active { border-color: rgba(212, 184, 122, 0.45); box-shadow: 0 0 0 1px rgba(212, 184, 122, 0.15), 0 8px 20px rgba(212, 184, 122, 0.12); background: rgba(212, 184, 122, 0.12); }

        .settings-btn {
          background: var(--surface-elevated);
          border: 1px solid var(--shell-border);
          border-radius: 999px;
          width: 44px;
          min-width: 44px;
          height: 44px;
          font-size: 0.92rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          flex-shrink: 0;
        }

        .settings-btn:hover {
          transform: translateY(-1px) scale(1.05);
          background: var(--surface-hover);
        }

        .settings-btn:focus-visible { outline: 2px solid var(--color-yellow); outline-offset: 2px; }

        .settings-btn:active {
          transform: scale(0.95);
        }

        .theme-toggle {
          background: var(--surface-elevated);
          border: 1px solid var(--shell-border);
          border-radius: 999px;
          width: 44px;
          min-width: 44px;
          height: 44px;
          font-size: 0.92rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          flex-shrink: 0;
        }

        .theme-toggle:hover {
          transform: translateY(-1px) scale(1.05) rotate(10deg);
          background: var(--surface-hover);
        }

        .theme-toggle:focus-visible { outline: 2px solid var(--color-yellow); outline-offset: 2px; }

        .theme-toggle:active {
          transform: scale(0.95);
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

        .header-action-icon {
          width: 19px;
          height: 19px;
          color: var(--text-primary);
          fill: none;
          stroke: currentColor;
          stroke-width: 1.65;
          stroke-linecap: round;
          stroke-linejoin: round;
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
          .settings-btn,
          .achievement-nav-btn,
          .theme-toggle {
            width: 40px;
            min-width: 40px;
            height: 40px;
            padding: 0;
            border-radius: 999px;
          }
          .header-action-icon { width: 18px; height: 18px; }
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
          .theme-toggle {
            width: 40px;
            min-width: 40px;
            height: 40px;
            padding: 0;
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
          .theme-toggle {
            width: 36px;
            min-width: 36px;
            height: 36px;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default MainLayout;
