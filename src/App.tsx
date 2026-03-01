import React, { useState, Suspense, lazy } from 'react';
import MainLayout from './components/MainLayout';
import CheckInFlow from './components/CheckInFlow';
import SplashScreen from './components/SplashScreen';
import PrivacyLock from './components/PrivacyLock';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import SkipLink from './components/SkipLink';
import A11yAnnouncer from './components/A11yAnnouncer';
import { LanguageProvider } from './services/LanguageContext';
import { HabitProvider } from './services/HabitContext';
import { ThemeProvider } from './services/ThemeContext';
import { useFocusVisible } from './hooks/useA11y';
import './index.css';

// 懶加載非首屏組件
const Timeline = lazy(() => import('./components/Timeline'));
const GrowthDashboard = lazy(() => import('./components/GrowthDashboard'));
const AchievementPage = lazy(() => import('./components/AchievementPage'));

// 內部組件，可以使用 hooks
function AppContent() {
  // 啟用焦點可見性管理
  useFocusVisible();
  
  const [view, setView] = useState<'checkin' | 'history' | 'growth' | 'achievement'>('checkin');
  const [showSplash, setShowSplash] = useState(true);
  const [isLocked, setIsLocked] = useState(() => {
    const hasPin = !!localStorage.getItem('imxin_privacy_pin');
    const isEnabled = localStorage.getItem('imxin_privacy_enabled') === 'true';
    return hasPin && isEnabled;
  });

  if (showSplash) {
    return (
      <LanguageProvider>
        <HabitProvider>
          <SplashScreen onComplete={() => setShowSplash(false)} />
        </HabitProvider>
      </LanguageProvider>
    );
  }

  if (isLocked) {
    return (
      <LanguageProvider>
        <HabitProvider>
          <PrivacyLock onUnlock={() => setIsLocked(false)} />
        </HabitProvider>
      </LanguageProvider>
    );
  }

  return (
    <>
      <SkipLink />
      <ThemeProvider>
        <LanguageProvider>
          <HabitProvider>
            <ErrorBoundary>
              <MainLayout currentView={view} onNavigate={(v) => setView(v)}>
                <Suspense fallback={<LoadingSpinner message="載入頁面中..." />}>
                  {view === 'checkin' && <CheckInFlow />}
                  {view === 'history' && <Timeline />}
                  {view === 'growth' && <GrowthDashboard />}
                  {view === 'achievement' && <AchievementPage />}
                </Suspense>
              </MainLayout>
            </ErrorBoundary>
          </HabitProvider>
        </LanguageProvider>
      </ThemeProvider>
      <A11yAnnouncer />
    </>
  );
}

function App() {
  return <AppContent />;
}

export default App;
