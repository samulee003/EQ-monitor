import React from 'react';

interface MainLayoutProps {
    children: React.ReactNode;
    currentView: 'checkin' | 'history' | 'growth';
    onNavigate: (view: 'checkin' | 'history' | 'growth') => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, currentView, onNavigate }) => {
    return (
        <div className="app-container">
            <header className="glass-header">
                <div className="logo-section" onClick={() => onNavigate('checkin')} style={{ cursor: 'pointer' }}>
                    <img src="/logo.png" alt="今心 Logo" className="logo-image" />
                    <span className="logo-text">今心</span>
                </div>
                <nav>
                    <button
                        className={`nav-link ${currentView === 'checkin' ? 'active' : ''}`}
                        onClick={() => onNavigate('checkin')}
                    >
                        今日心情
                    </button>
                    <button
                        className={`nav-link ${currentView === 'history' ? 'active' : ''}`}
                        onClick={() => onNavigate('history')}
                    >
                        紀錄回顧
                    </button>
                    <button
                        className={`nav-link ${currentView === 'growth' ? 'active' : ''}`}
                        onClick={() => onNavigate('growth')}
                    >
                        成長看板
                    </button>
                </nav>
            </header>

            <main className="main-content">
                {children}
            </main>

            <footer>
                基於 RULER 模型 • 打造平穩心靈
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
        }

        @media (max-width: 360px) {
          .logo-text {
            display: none;
          }
          nav {
            gap: var(--s-2);
          }
        }
      `}</style>
        </div>
    );
};

export default MainLayout;
