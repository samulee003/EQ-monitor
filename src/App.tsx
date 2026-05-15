import { Suspense, lazy } from 'react';
import MainLayout from './components/MainLayout';
import SplashScreen from './components/SplashScreen';
import PrivacyLock from './components/PrivacyLock';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import SkipLink from './components/SkipLink';
import A11yAnnouncer from './components/A11yAnnouncer';
import CombinedProviders from './components/CombinedProviders';
import MigrationProgress from './components/MigrationProgress';
import AboutPage from './components/LandingPage';
import { useAppStore } from './stores/appStore';
import { useFocusVisible } from './hooks/useA11y';
import { useAuth } from './services/AuthContext';
import { useLanguage } from './services/LanguageContext';
import './index.css';

// 懶加載非首屏組件
const Timeline = lazy(() => import('./components/Timeline'));
const GrowthDashboard = lazy(() => import('./components/GrowthDashboard'));
const AchievementPage = lazy(() => import('./components/AchievementPage'));
const CheckInFlow = lazy(() => import('./components/CheckInFlow'));
const CoachPage = lazy(() => import('./pages/CoachPage'));

// 內部組件，可以使用 hooks
function AppContent() {
  // 啟用焦點可見性管理
  useFocusVisible();

  const { t } = useLanguage();
  const { user, migrationNeeded, clearMigrationFlag } = useAuth();

  const {
    currentView,
    setView,
    showSplash,
    dismissSplash,
    isLocked,
    unlock,
  } = useAppStore();

  if (showSplash) {
    return <SplashScreen onComplete={dismissSplash} />;
  }

  if (isLocked) {
    return <PrivacyLock onUnlock={unlock} />;
  }

  return (
    <>
      <SkipLink />
      {migrationNeeded && user && (
        <MigrationProgress
          userId={user.id}
          onComplete={clearMigrationFlag}
        />
      )}
      <ErrorBoundary>
        <MainLayout currentView={currentView} onNavigate={setView}>
          <Suspense fallback={<LoadingSpinner message="載入頁面中..." />}>
            {currentView === 'home' && <CheckInFlow />}
            {currentView === 'history' && <Timeline />}
            {currentView === 'growth' && <GrowthDashboard />}
            {currentView === 'achievement' && <AchievementPage />}
            {currentView === 'coach' && <CoachPage />}
            {currentView === 'about' && (
              <AboutPage
                onStart={() => setView('home')}
                onCoach={() => setView('coach')}
              />
            )}
            {currentView !== 'home' && currentView !== 'history' && currentView !== 'growth' && currentView !== 'achievement' && currentView !== 'coach' && currentView !== 'about' && (
              <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <h2>{t('頁面未找到')}</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{t('這個頁面不存在。')}</p>
                <button className="morandi-main-btn" onClick={() => setView('home')}>{t('回到首頁')}</button>
              </div>
            )}
          </Suspense>
        </MainLayout>
      </ErrorBoundary>
      <A11yAnnouncer />
    </>
  );
}

function App() {
  return (
    <CombinedProviders>
      <AppContent />
    </CombinedProviders>
  );
}

export default App;
