import { logger } from '../utils/logger';
import React, { useState, useEffect } from 'react';
import './ParentHome.css';
import SOSMode from './SOSMode';
import QuickCheckIn, { type QuickCheckInData } from './QuickCheckIn';
import { dataAdapter } from '../adapters';
import { type RulerLogEntry } from '../types/RulerTypes';

// 深度覺察沿用現有的 CheckInFlow
const CheckInFlow = React.lazy(() => import('./CheckInFlow'));

type HomeMode = 'home' | 'sos' | 'quick' | 'deep';

const ParentHome: React.FC = () => {
    const [mode, setMode] = useState<HomeMode>('home');
    const [greeting, setGreeting] = useState('');
    const [todayCount, setTodayCount] = useState(0);
    const [streakDays, setStreakDays] = useState(0);
    // const { t } = useLanguage();

    useEffect(() => {
        const loadData = async () => {
            // 設置個性化問候語
            const hour = new Date().getHours();
            let greet = '';
            if (hour < 12) {
                greet = '早安，今天會是美好的一天';
            } else if (hour < 18) {
                greet = '午安，記得給自己一點喘息';
            } else {
                greet = '晚安，辛苦你了';
            }
            setGreeting(greet);

            // 獲取今日記錄數和連續記錄天數
            const data = await dataAdapter.logs.export();
            const today = new Date().toDateString();
            const todayLogs = data.filter((log: RulerLogEntry) =>
                new Date(log.timestamp).toDateString() === today
            );
            setTodayCount(todayLogs.length);

            // 簡化計算連續天數（實際應使用 HabitService）
            const uniqueDays = new Set(data.map((log: RulerLogEntry) =>
                new Date(log.timestamp).toDateString()
            ));
            setStreakDays(Math.min(uniqueDays.size, 7)); // 簡化顯示
        };
        loadData();
    }, [mode]); // mode 改變時重新計算

    const handleSOSComplete = () => {
        // SOS 完成後詢問是否記錄
        setMode('home');
    };

    const handleQuickComplete = async (data: QuickCheckInData) => {
        // 保存快速記錄
        const quadrantDefaults: Record<string, { energy: number; pleasantness: number }> = {
            red: { energy: 4, pleasantness: 1 },
            yellow: { energy: 4, pleasantness: 4 },
            blue: { energy: 1, pleasantness: 1 },
            green: { energy: 1, pleasantness: 4 },
        };
        const defaults = quadrantDefaults[data.emotion.quadrant] || { energy: 3, pleasantness: 3 };
        const logEntry: RulerLogEntry = {
            id: crypto.randomUUID(),
            emotions: [{
                id: data.emotion.id,
                name: data.emotion.name,
                quadrant: data.emotion.quadrant,
                energy: defaults.energy,
                pleasantness: defaults.pleasantness,
            }],
            intensity: data.intensity,
            bodyScan: null,
            understanding: {
                trigger: data.scenarioTag || '',
                what: data.note || '',
                who: '',
                where: '',
                need: null,
                message: ''
            },
            expressing: null,
            regulating: null,
            physicalContext: undefined,
            postMood: '',
            timestamp: data.timestamp,
            isFullFlow: false
        };

        try {
            await dataAdapter.logs.create(logEntry);
            setMode('home');
        } catch (error) {
            logger.error('[ParentHome] Save failed', { error: String(error) });
        }
    };

    // 渲染首頁
    if (mode === 'home') {
        return (
            <div className="parent-home">
                <div className="home-container">
                    {/* 頭部問候 */}
                    <div className="home-header">
                        <h1 className="greeting">{greeting}</h1>
                        <p className="sub-greeting">
                            {todayCount > 0 
                                ? `今天已記錄 ${todayCount} 次心情 💚` 
                                : '今天還沒記錄心情，需要 1 分鐘嗎？'}
                        </p>
                        {streakDays > 1 && (
                            <div className="streak-badge">
                                🔥 連續 {streakDays} 天
                            </div>
                        )}
                    </div>

                    {/* 三層級選擇 */}
                    <div className="mode-selection">
                        {/* SOS 緊急救援 */}
                        <button 
                            className="mode-card mode-sos"
                            onClick={() => setMode('sos')}
                        >
                            <div className="mode-icon">🆘</div>
                            <div className="mode-content">
                                <h2>我需要急救</h2>
                                <p>剛對孩子發脾氣 / 孩子哭鬧 / 快崩潰</p>
                                <span className="mode-time">30 秒</span>
                            </div>
                            <div className="mode-arrow">→</div>
                        </button>

                        {/* 快速記錄 */}
                        <button 
                            className="mode-card mode-quick"
                            onClick={() => setMode('quick')}
                        >
                            <div className="mode-icon">⚡</div>
                            <div className="mode-content">
                                <h2>快速記錄心情</h2>
                                <p>花 1 分鐘記下現在的感受</p>
                                <span className="mode-time">1 分鐘</span>
                            </div>
                            <div className="mode-arrow">→</div>
                        </button>

                        {/* 深度覺察 */}
                        <button 
                            className="mode-card mode-deep"
                            onClick={() => setMode('deep')}
                        >
                            <div className="mode-icon">🧘</div>
                            <div className="mode-content">
                                <h2>深度覺察練習</h2>
                                <p>完整的情緒探索與調節</p>
                                <span className="mode-time">5-10 分鐘</span>
                            </div>
                            <div className="mode-arrow">→</div>
                        </button>
                    </div>

                    {/* 底部提示 */}
                    <div className="home-footer">
                        <p>💡 小提示：修復比完美更重要</p>
                        <p className="footer-sub">每次願意面對自己的情緒，都是很棒的成長</p>
                    </div>
                </div>
            </div>
        );
    }

    // SOS 模式
    if (mode === 'sos') {
        return (
            <SOSMode 
                onComplete={handleSOSComplete}
                onBack={() => setMode('home')}
            />
        );
    }

    // 快速記錄模式
    if (mode === 'quick') {
        return (
            <QuickCheckIn 
                onComplete={handleQuickComplete}
                onBack={() => setMode('home')}
            />
        );
    }

    // 深度覺察模式
    if (mode === 'deep') {
        return (
            <React.Suspense fallback={<div className="loading">載入中...</div>}>
                <div className="deep-checkin-wrapper">
                    <button className="nav-btn deep-back-btn" onClick={() => setMode('home')}>
                        ← 返回首頁
                    </button>
                    <CheckInFlow />
                </div>
            </React.Suspense>
        );
    }

    return null;
};

export default ParentHome;
