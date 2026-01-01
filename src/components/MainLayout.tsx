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
          background: rgba(26, 26, 26, 0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--glass-border);
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: 2px;
          background: linear-gradient(135deg, var(--color-red) 0%, var(--color-yellow) 50%, var(--color-green) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 0 30px rgba(197, 139, 138, 0.3);
        }
      `}</style>
        </div>
    );
};

export default MainLayout;
