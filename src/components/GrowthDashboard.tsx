import { logger } from '../utils/logger';
import React, { useMemo, useState, useEffect } from 'react';
import { resilienceService, type DailyResilience, type GranularityData, type StrategyDiversityData } from '../services/ResilienceService';
import { dataAdapter } from '../adapters';
import { type RulerLogEntry } from '../types/RulerTypes';
import { utilityIcons, uiIcons } from './icons/SvgIcons';
import { useLanguage } from '../services/LanguageContext';
import { useAuth } from '../services/AuthContext';
import { aiService, type AIInsight } from '../services/AIService';
import { type HeatmapDay, type IntensityData } from '../services/ResilienceService';
import Skeleton from './Skeleton';
import './GrowthDashboard.css';

const GrowthDashboard: React.FC = () => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const userId = user?.id || 'test-user';
    const [logs, setLogs] = useState<RulerLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [weeklyInsight, setWeeklyInsight] = useState<AIInsight | null>(null);
    const [loadingInsight, setLoadingInsight] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            const data = await dataAdapter.logs.export();
            setLogs(data);
        };
        loadData();
        const timer = setTimeout(() => setIsLoading(false), 400);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        const fetchInsight = async () => {
            if (logs.length >= 3) { // Only fetch if we have enough data
                setLoadingInsight(true);
                try {
                    const insight = await aiService.generateWeeklyInsight(userId, logs);
                    setWeeklyInsight(insight);
                } catch (e) {
                    logger.error('[GrowthDashboard] Failed to fetch insight', { error: String(e) });
                } finally {
                    setLoadingInsight(false);
                }
            }
        };
        fetchInsight();
    }, [logs, userId]);

    const data: DailyResilience[] = useMemo(() => resilienceService.getDashboardData(logs), [logs]);

    const overallScore = useMemo(() => resilienceService.getOverallScore(logs), [logs]);
    const heatmapData = useMemo(() => resilienceService.getHeatmapData(logs), [logs]);
    const intensityData = useMemo(() => resilienceService.getIntensityData(logs), [logs]);
    const granularity: GranularityData = useMemo(() => resilienceService.getEmotionalGranularity(logs), [logs]);
    const diversity: StrategyDiversityData = useMemo(() => resilienceService.getStrategyDiversity(logs), [logs]);

    // Empty state check
    const hasData = logs.length > 0;

    // Loading state
    if (isLoading) {
        return (
            <div className="growth-dashboard fade-in">
                <div className="resilience-header">
                    <Skeleton type="circle" />
                    <div className="header-text">
                        <Skeleton type="text" />
                        <Skeleton type="text" className="short" />
                    </div>
                </div>
                <div className="dashboard-section">
                    <Skeleton type="heatmap" />
                </div>
                <div className="charts-grid">
                    <Skeleton type="chart" />
                    <Skeleton type="chart" />
                </div>
            </div>
        );
    }

    // Empty state
    if (!hasData) {
        return (
            <div className="growth-dashboard-empty fade-in">
                <div className="empty-illustration">
                    <div className="chart-mock">
                        <div className="mock-line"></div>
                        <div className="mock-dot"></div>
                    </div>
                </div>
                <h2>{t('累積你的情緒數據')}</h2>
                <p>{t('開始記錄情緒後，你將能看到你的情緒趨勢、參與度成長與個人洞察。')}</p>
                
                <div className="insight-preview">
                    <div className="preview-item">
                        <span className="preview-icon">📈</span>
                        <span>{t('情緒趨勢分析')}</span>
                    </div>
                    <div className="preview-item">
                        <span className="preview-icon">🎯</span>
                        <span>{t('參與度積分')}</span>
                    </div>
                    <div className="preview-item">
                        <span className="preview-icon">🧠</span>
                        <span>{t('情緒智能指標')}</span>
                    </div>
                </div>

                <div className="encouragement">
                    <p>✨ {t('每一次覺察都是成長的開始')}</p>
                </div>

            </div>
        );
    }

    // Simple SVG Line Chart logic
    const maxScore = 100;
    const chartHeight = 120;
    const chartWidth = 300;

    const points = data.length > 1 ? data.map((d: DailyResilience, i: number) => {
        const x = (i / (data.length - 1)) * chartWidth;
        const y = chartHeight - (d.score / maxScore) * chartHeight;
        return `${x},${y}`;
    }).join(' ') : "";

    return (
        <div className="growth-dashboard fade-in">
            <section className="growth-hero">
                <div className="growth-hero-copy">
                    <span className="growth-kicker">{t('週報洞察')}</span>
                    <h3>{t('把情緒軌跡整理成可閱讀的成長地圖')}</h3>
                    <p>{t('這裡不是分數排行榜，而是把你的記錄、波動與回穩方式，慢慢翻譯成更清楚的自我理解。')}</p>
                </div>
                <div className="resilience-header">
                    <div className="score-circle">
                        <svg viewBox="0 0 36 36" className="circular-chart">
                            <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <path className="circle" strokeDasharray={`${overallScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            <text x="18" y="20.35" className="percentage">{overallScore}</text>
                        </svg>
                    </div>
                    <div className="header-text">
                        <h4>{t('情緒參與度積分')}</h4>
                        <p>{t('反映您的記錄參與程度，非臨床韌性評估')}</p>
                    </div>
                </div>
            </section>

            <p className="engagement-disclaimer">{t('⚠️ 此分數為參與激勵指標，不反映您的心理健康狀態，亦非任何臨床評估結果。')}</p>

            {/* AI Weekly Insight Section */}
            {(loadingInsight || weeklyInsight) && (
                <div className="dashboard-section ai-insight-section fade-in">
                    <div className="ai-insight-header">
                        <div className="ai-title">
                            <span className="ai-icon">{uiIcons.sparkle}</span>
                            <h4>{t('今心每週洞察')}</h4>
                        </div>
                        {!loadingInsight && weeklyInsight && (
                            <button 
                                className="regenerate-btn-sm" 
                                onClick={async () => {
                                    setLoadingInsight(true);
                                    try {
                                        const insight = await aiService.generateWeeklyInsight(userId, logs);
                                        setWeeklyInsight(insight);
                                    } finally {
                                        setLoadingInsight(false);
                                    }
                                }}
                            >
                                {uiIcons.refresh}
                            </button>
                        )}
                    </div>
                    {loadingInsight ? (
                        <div className="ai-loading">
                            <div className="loading-dots"><span></span><span></span><span></span></div>
                            <p>{t('正在分析你的情緒軌跡...')}</p>
                        </div>
                    ) : weeklyInsight && (
                        <div className="ai-insight-content">
                            <div className="insight-main">
                                <p className="insight-summary">{t(weeklyInsight.summary)}</p>
                            </div>
                            
                            {weeklyInsight.colorTheory && (
                                <div className="color-theory-banner">
                                    <span className="color-icon">🎨</span>
                                    <p>{t(weeklyInsight.colorTheory)}</p>
                                </div>
                            )}
                            
                            <div className="insight-details">
                                <div className="detail-card patterns-card">
                                    <label>{t('觀察到的模式')}</label>
                                    <div className="pattern-tags">
                                        {weeklyInsight.underlyingPatterns.map(p => (
                                            <span key={p} className="pattern-tag">{t(p)}</span>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="detail-card action-card">
                                    <label>{t('本週練習')}</label>
                                    <p className="suggested-action">{t(weeklyInsight.suggestedAction)}</p>
                                </div>
                            </div>
                            
                            <blockquote className="insight-quote">
                                <span className="quote-mark">「</span>
                                {t(weeklyInsight.empatheticQuote)}
                                <span className="quote-mark">」</span>
                            </blockquote>
                        </div>
                    )}
                </div>
            )}

            <div className="dashboard-section heatmap-section">

                <label className="heading-sm">{t('情緒熱點圖 (近 30 天)')}</label>
                <div className="heatmap-grid">
                    {heatmapData.map((day: HeatmapDay, i: number) => (
                        <div
                            key={i}
                            className={`heatmap-cell ${day.hasData ? 'active' : ''}`}
                            style={day.hasData ? {
                                backgroundColor: `var(--color-${day.quadrant})`,
                                opacity: 0.3 + ((day.intensity ?? 5) / 10) * 0.7
                            } : {}}
                            title={day.hasData ? `${day.date}: ${day.intensity} ${t('級')}` : day.date}
                        ></div>
                    ))}
                </div>
                <div className="heatmap-legend">
                    <span>{t('低強度')}</span>
                    <div className="legend-dots">
                        <span style={{ background: 'var(--color-blue)' }}></span>
                        <span style={{ background: 'var(--color-green)' }}></span>
                        <span style={{ background: 'var(--color-yellow)' }}></span>
                        <span style={{ background: 'var(--color-red)' }}></span>
                    </div>
                    <span>{t('高強度')}</span>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-container">
                    <label className="heading-sm">{t('參與度趨勢 (Engagement)')}</label>
                    {data.length > 1 ? (
                        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="line-chart">
                            <path
                                d={`M ${points}`}
                                fill="none"
                                stroke="var(--color-yellow)"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            {data.map((d, i) => {
                                const x = (i / (data.length - 1)) * chartWidth;
                                const y = chartHeight - (d.score / maxScore) * chartHeight;
                                return (
                                    <circle key={i} cx={x} cy={y} r="3" fill="var(--color-yellow)" />
                                );
                            })}
                        </svg>
                    ) : (
                        <div className="empty-chart">{t('需要更多記錄來生成趨勢圖')}</div>
                    )}
                    <div className="chart-labels">
                        <span>{t('過去')}</span>
                        <span>{t('現在')}</span>
                    </div>
                </div>

                <div className="chart-container">
                    <label className="heading-sm">{t('強度波動 (Intensity)')}</label>
                    <div className="bar-chart">
                        {intensityData.map((d: IntensityData, i: number) => (
                            <div key={i} className="bar-wrapper">
                                <div
                                    className="bar"
                                    style={{ height: `${(d.value / 10) * 100}%` }}
                                    title={`${d.label}: ${d.value} 級`}
                                ></div>
                                <span className="bar-label">{t(d.label)}</span>
                            </div>
                        ))}
                        {intensityData.length === 0 && <div className="empty-chart">{t('無數據')}</div>}
                    </div>
                </div>
            </div>

            {/* 神經科學導向指標 - Phase 1 */}
            <div className="neuroscience-metrics">
                <label className="heading-sm"><span className="section-icon">{uiIcons.brain}</span> {t('情緒智能指標')}</label>
                <div className="metrics-grid">
                    {/* 情緒粒度分數 */}
                    <div className="metric-card granularity-card">
                        <div className="metric-visual">
                            <svg viewBox="0 0 36 36" className="circular-chart">
                                <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                <path className="circle granularity" strokeDasharray={`${granularity.score}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                <text x="18" y="20.35" className="percentage">{granularity.uniqueEmotions.length}</text>
                            </svg>
                        </div>
                        <div className="metric-info">
                            <h4>{t('情緒粒度')}</h4>
                            <p className="metric-desc">{t('你已辨識')} <strong>{granularity.uniqueEmotions.length}</strong> {t('種不同情緒')}</p>
                            <div className="metric-level">
                                <span className={`level-badge ${granularity.level}`}>
                                    <span className="badge-icon">{granularity.level === 'beginner' && uiIcons.seedling}{granularity.level === 'growing' && uiIcons.branch}{granularity.level === 'rich' && uiIcons.tree}{granularity.level === 'expert' && uiIcons.sparkle}</span>
                                    {granularity.level === 'beginner' && t('萌芽期')}
                                    {granularity.level === 'growing' && t('成長中')}
                                    {granularity.level === 'rich' && t('豐富')}
                                    {granularity.level === 'expert' && t('專家')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 調節策略多樣性 */}
                    <div className="metric-card diversity-card">
                        <div className="metric-visual">
                            <div className="toolbox-icon">
                                <span className="toolbox-svg">{utilityIcons.toolbox}</span>
                                <span className="tool-count">{diversity.usedStrategies.length}</span>
                            </div>
                        </div>
                        <div className="metric-info">
                            <h4>{t('調節工具箱')}</h4>
                            <p className="metric-desc">{t('已掌握')} <strong>{diversity.usedStrategies.length}/{diversity.totalPossible}</strong> {t('種策略')}</p>
                            <div className="metric-level">
                                <span className={`level-badge ${diversity.level}`}>
                                    <span className="badge-icon">{diversity.level === 'starter' && uiIcons.wrench}{diversity.level === 'developing' && uiIcons.hammer}{diversity.level === 'diverse' && uiIcons.gear}{diversity.level === 'master' && uiIcons.trophy}</span>
                                    {diversity.level === 'starter' && t('初始')}
                                    {diversity.level === 'developing' && t('發展中')}
                                    {diversity.level === 'diverse' && t('多元')}
                                    {diversity.level === 'master' && t('大師')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="insights-grid">
                <div className="insight-item">
                    <span className="icon">{uiIcons.seedling}</span>
                    <div className="item-content">
                        <label>{t('主要情緒')}</label>
                        <p>{data[data.length - 1]?.dominantEmotion ? t(data[data.length - 1].dominantEmotion) : t('無數據')}</p>
                    </div>
                </div>
                <div className="insight-item">
                    <span className="icon">{uiIcons.shield}</span>
                    <div className="item-content">
                        <label>{t('情緒防禦力')}</label>
                        <p>{overallScore > 70 ? t('穩健') : (overallScore > 40 ? t('成長中') : t('重建中'))}</p>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default GrowthDashboard;
