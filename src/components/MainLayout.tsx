import React from 'react';
import { useLanguage } from '../services/LanguageContext';

interface MainLayoutProps {
  children: React.ReactNode;
  currentView: 'checkin' | 'history' | 'growth';
  onNavigate: (view: 'checkin' | 'history' | 'growth') => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, currentView, onNavigate }) => {
  const { language, toggleLanguage, t } = useLanguage();

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
        <button
          className="language-toggle"
          onClick={toggleLanguage}
          title={language === 'zh-TW' ? '切換為簡體中文' : '切换为繁体中文'}
        >
          {language === 'zh-TW' ? '简' : '繁'}
        </button>
      </header>

      <main className="main-content">
        {children}
      </main>

      <footer>
        {t('基於 RULER 模型 • 打造平穩心靈')}
      </footer>

      <style>{`
        .glass-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: hsla(0, 0%, 10%, 0.8);
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
        }

        nav {
          display: flex;
          gap: var(--s-6);
        }

        .language-toggle {
          background: linear-gradient(135deg, var(--color-blue) 0%, var(--color-green) 100%);
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          font-size: 0.9rem;
          font-weight: 700;
          color: white;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          flex-shrink: 0;
        }

        .language-toggle:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .language-toggle:active {
          transform: scale(0.95);
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
          .language-toggle {
            width: 32px;
            height: 32px;
            font-size: 0.8rem;
          }
        }

        @media (max-width: 360px) {
          .logo-text {
            display: none;
          }
          nav {
            gap: var(--s-2);
          }
          .language-toggle {
            width: 28px;
            height: 28px;
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};

export default MainLayout;

