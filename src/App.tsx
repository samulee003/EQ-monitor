import { Suspense, lazy } from 'react';
import MainLayout from './components/MainLayout';
import SplashScreen from './components/SplashScreen';
import PrivacyLock from './components/PrivacyLock';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import SkipLink from './components/SkipLink';
import A11yAnnouncer from './components/A11yAnnouncer';
import CombinedProviders from './components/CombinedProviders';
import { useAppStore } from './stores/appStore';
import { useFocusVisible } from './hooks/useA11y';
import './index.css';

// 懶加載非首屏組件
const Timeline = lazy(() => import('./components/Timeline'));
const GrowthDashboard = lazy(() => import('./components/GrowthDashboard'));
const AchievementPage = lazy(() => import('./components/AchievementPage'));
const CheckInFlow = lazy(() => import('./components/CheckInFlow'));
const ParentHome = lazy(() => import('./components/ParentHome'));

// 內部組件，可以使用 hooks
function AppContent() {
  // 啟用焦點可見性管理
  useFocusVisible();

  const {
    currentView,
    setView,
    showSplash,
    dismissSplash,
    isLocked,
    unlock,
  } = useAppStore();

  if (showSplash) {
    return (
      <CombinedProviders>
        <SplashScreen onComplete={dismissSplash} />
      </CombinedProviders>
    );
  }

  if (isLocked) {
    return (
      <CombinedProviders>
        <PrivacyLock onUnlock={unlock} />
      </CombinedProviders>
    );
  }

  return (
    <>
      <SkipLink />
      <CombinedProviders>
        <ErrorBoundary>
          <MainLayout currentView={currentView} onNavigate={setView}>
            <Suspense fallback={<LoadingSpinner message="載入頁面中..." />}>
              {currentView === 'home' && <ParentHome />}
              {currentView === 'checkin' && <CheckInFlow />}
              {currentView === 'history' && <Timeline />}
              {currentView === 'growth' && <GrowthDashboard />}
              {currentView === 'achievement' && <AchievementPage />}
            </Suspense>
          </MainLayout>
        </ErrorBoundary>
      </CombinedProviders>
      <A11yAnnouncer />
    </>
  );
}

function App() {
  return <AppContent />;
}

export default App;
