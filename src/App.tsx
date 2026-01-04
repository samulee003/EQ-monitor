import React, { useState } from 'react';
import MainLayout from './components/MainLayout';
import CheckInFlow from './components/CheckInFlow';
import Timeline from './components/Timeline';
import GrowthDashboard from './components/GrowthDashboard';
import SplashScreen from './components/SplashScreen';
import './index.css';

function App() {
    const [view, setView] = useState<'checkin' | 'history' | 'growth'>('checkin');
    const [showSplash, setShowSplash] = useState(true);

    if (showSplash) {
        return <SplashScreen onComplete={() => setShowSplash(false)} />;
    }

    return (
        <MainLayout currentView={view} onNavigate={(v) => setView(v)}>
            {view === 'checkin' && <CheckInFlow />}
            {view === 'history' && <Timeline />}
            {view === 'growth' && <GrowthDashboard />}
        </MainLayout>
    );
}

export default App;
