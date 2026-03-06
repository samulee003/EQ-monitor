import React, { useState, useEffect } from 'react';
import { useLanguage } from '../services/LanguageContext';
import { useTheme } from '../services/ThemeContext';
import NotificationSettingsPanel from './NotificationSettings';
import { notificationService } from '../services/NotificationService';
import AchievementToast from './AchievementToast';
import OnboardingFlow from './OnboardingFlow';

interface MainLayoutProps {
  children: React.ReactNode;
  currentView: 'checkin' | 'history' | 'growth' | 'achievement';
  onNavigate: (view: 'checkin' | 'history' | 'growth' | 'achievement') => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, currentView, onNavigate }) => {
  const { t } = useLanguage();
  const { theme, actualTheme, toggleTheme } = useTheme();
  const [showSettings, setShowSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // 主題圖標
  const themeIcon = {
    dark: '🌙',
    light: '☀️',
    system: '💻'
  }[theme];

  // Initialize notification service and check onboarding
  useEffect(() => {
    notificationService.initialize();
    
    const onboardingCompleted = localStorage.getItem('imxin_onboarding_completed');
    if (!onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('imxin_onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  return (
    <div className="app-container">
      <header className="glass-header">
        <div className="logo-section" onClick={() => onNavigate('checkin')} style={{ cursor: 'pointer' }}>
          <img src="/logo.png" alt="今心 Logo" className="logo-image" />
          <span className="logo-text">{t('今心')}</span>
        </div>
        <nav>
          <button
            className={`nav-link ${currentView === 'checkin' ? 'active' : ''}`}
            onClick={() => onNavigate('checkin')}
          >
            {t('今日心情')}
          </button>
          <button
            className={`nav-link ${currentView === 'history' ? 'active' : ''}`}
            onClick={() => onNavigate('history')}
          >
            {t('紀錄回顧')}
          </button>
          <button
            className={`nav-link ${currentView === 'growth' ? 'active' : ''}`}
            onClick={() => onNavigate('growth')}
          >
            {t('成長看板')}
          </button>
        </nav>
        <div className="header-actions">
          <button
            className={`achievement-nav-btn ${currentView === 'achievement' ? 'active' : ''}`}
            onClick={() => onNavigate('achievement')}
            title={t('我的成就')}
          >
            🏅
          </button>
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={`${t('當前主題')}: ${t(theme)} (${t(actualTheme)})`}
          >
            {themeIcon}
          </button>
          <button
            className="settings-btn"
            onClick={() => setShowSettings(true)}
            title={t('提醒設定')}
          >
            🔔
          </button>
        </div>
      </header>

      <main className="main-content">
        {children}
      </main>

      <AchievementToast />

      {showOnboarding && (
        <OnboardingFlow onComplete={handleOnboardingComplete} />
      )}

      <footer>
        <div className="footer-main">
          {t('基於 RULER 模型 • 打造平穩心靈')}
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
          background: var(--glass-bg);
          backdrop-filter: var(--glass-blur);
          border-bottom: 1px solid var(--glass-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--s-4) var(--s-6);
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
          filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.15));
          transition: transform 0.3s ease;
        }

        .logo-section:hover .logo-image {
          transform: scale(1.05) rotate(-2deg);
        }

        .logo-text {
          font-size: 1.6rem;
          font-weight: 900;
          letter-spacing: 3px;
          background: linear-gradient(135deg, var(--color-red) 0%, var(--color-yellow) 50%, var(--color-green) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 20px rgba(197, 139, 138, 0.2));
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
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          padding: var(--s-2) var(--s-2);
          position: relative;
          transition: var(--transition);
          white-space: nowrap;
          flex-shrink: 0;
        }

        .nav-link:hover {
          color: var(--text-primary);
        }

        .nav-link.active {
          color: var(--text-primary);
          font-weight: 600;
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
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          border-radius: 50%;
          width: 36px;
          height: 36px;
          font-size: 1.1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .achievement-nav-btn:hover { transform: scale(1.1); background: rgba(255,255,255,0.1); }
        .achievement-nav-btn.active { border-color: var(--color-yellow); box-shadow: 0 0 10px var(--color-yellow); background: rgba(213, 193, 165, 0.2); }

        .settings-btn {
          background: linear-gradient(135deg, var(--color-yellow) 0%, var(--color-red) 100%);
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          flex-shrink: 0;
        }

        .settings-btn:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .settings-btn:active {
          transform: scale(0.95);
        }

        .theme-toggle {
          background: linear-gradient(135deg, var(--color-yellow) 0%, var(--color-red) 100%);
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          flex-shrink: 0;
        }

        .theme-toggle:hover {
          transform: scale(1.1) rotate(15deg);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .theme-toggle:active {
          transform: scale(0.95);
        }

        footer {
          padding: 1.5rem 2rem 1rem;
          text-align: center;
          font-size: 0.8rem;
          color: var(--text-secondary);
          opacity: 0.6;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
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
            gap: var(--s-2);
          }
          .settings-btn,
          .achievement-nav-btn,
          .theme-toggle {
            width: 32px;
            height: 32px;
            font-size: 0.9rem;
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
            width: 28px;
            height: 28px;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
};

export default MainLayout;
