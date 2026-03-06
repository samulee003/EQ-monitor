import React, { useMemo, useState, useEffect } from 'react';
import { resilienceService, DailyResilience, GranularityData, StrategyDiversityData } from '../services/ResilienceService';
import { storageService } from '../services/StorageService';
import { utilityIcons, uiIcons } from './icons/SvgIcons';
import { useLanguage } from '../services/LanguageContext';
import { aiService, AIInsight } from '../services/AIService';
import Skeleton from './Skeleton';

const GrowthDashboard: React.FC = () => {
    const { t } = useLanguage();
    const logs = useMemo(() => storageService.getLogs(), []);
    const [isLoading, setIsLoading] = useState(true);

    const [weeklyInsight, setWeeklyInsight] = useState<AIInsight | null>(null);
    const [loadingInsight, setLoadingInsight] = useState(false);

    useEffect(() => {
        // Simulate loading for smoother UX
        setTimeout(() => {
            setIsLoading(false);
        }, 400);
    }, []);

    useEffect(() => {
        const fetchInsight = async () => {
            if (logs.length >= 3) { // Only fetch if we have enough data
                setLoadingInsight(true);
                try {
                    const insight = await aiService.generateWeeklyInsight(logs);
                    setWeeklyInsight(insight);
                } catch (e) {
                    console.error(e);
                } finally {
                    setLoadingInsight(false);
                }
            }
        };
        fetchInsight();
    }, [logs]);

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
                <style>{`
                    .resilience-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
                    .header-text { flex: 1; }
                    .dashboard-section { margin-bottom: 1.5rem; }
                    .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                `}</style>
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

                <style>{`
                    .growth-dashboard-empty {
                        padding: 3rem 2rem;
                        text-align: center;
                        background: var(--bg-secondary);
                        border-radius: var(--radius-lg);
                        border: 1px solid var(--glass-border);
                    }
                    .empty-illustration {
                        width: 140px;
                        height: 100px;
                        margin: 0 auto 2rem;
                        position: relative;
                    }
                    .chart-mock {
                        width: 100%;
                        height: 100%;
                        position: relative;
                        border: 1px dashed var(--glass-border);
                        border-radius: var(--radius-md);
                        overflow: hidden;
                    }
                    .mock-line {
                        position: absolute;
                        bottom: 20px;
                        left: 10px;
                        right: 10px;
                        height: 2px;
                        background: linear-gradient(90deg, transparent, var(--color-green), var(--color-yellow), transparent);
                        opacity: 0.3;
                    }
                    .mock-dot {
                        position: absolute;
                        bottom: 40px;
                        left: 50%;
                        width: 8px;
                        height: 8px;
                        background: var(--color-yellow);
                        border-radius: 50%;
                        opacity: 0.5;
                        animation: pulse 2s ease-in-out infinite;
                    }
                    @keyframes pulse {
                        0%, 100% { transform: scale(1); opacity: 0.5; }
                        50% { transform: scale(1.3); opacity: 0.8; }
                    }
                    .growth-dashboard-empty h2 {
                        font-size: 1.4rem;
                        color: var(--text-primary);
                        margin-bottom: 0.5rem;
                    }
                    .growth-dashboard-empty p {
                        color: var(--text-secondary);
                        font-size: 0.9rem;
                        line-height: 1.6;
                        max-width: 300px;
                        margin: 0 auto 2rem;
                    }
                    .insight-preview {
                        display: flex;
                        justify-content: center;
                        gap: 1.5rem;
                        margin-bottom: 2rem;
                        flex-wrap: wrap;
                    }
                    .preview-item {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 0.5rem;
                        font-size: 0.8rem;
                        color: var(--text-secondary);
                    }
                    .preview-icon {
                        font-size: 1.8rem;
                        opacity: 0.7;
                    }
                    .encouragement {
                        padding: 1rem;
                        background: linear-gradient(135deg, rgba(213, 193, 165, 0.1), rgba(170, 176, 155, 0.1));
                        border-radius: var(--radius-md);
                        border: 1px solid var(--glass-border);
                    }
                    .encouragement p {
                        color: var(--color-yellow);
                        font-size: 0.95rem;
                        margin: 0;
                    }
                `}</style>
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
            <div className="resilience-header">
                <div className="score-circle">
                    <svg viewBox="0 0 36 36" className="circular-chart">
                        <path className="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="circle" strokeDasharray={`${overallScore}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <text x="18" y="20.35" className="percentage">{overallScore}</text>
                    </svg>
                </div>
                <div className="header-text">
                    <h3>{t('情緒參與度積分')}</h3>
                    <p>{t('反映您的記錄參與程度，非臨床韌性評估')}</p>
                </div>
            </div>

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
                                        const insight = await aiService.generateWeeklyInsight(logs);
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
                    {heatmapData.map((day: any, i: number) => (
                        <div
                            key={i}
                            className={`heatmap-cell ${day.hasData ? 'active' : ''}`}
                            style={day.hasData ? {
                                backgroundColor: `var(--color-${day.quadrant})`,
                                opacity: 0.3 + (day.intensity / 10) * 0.7
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
                        {intensityData.map((d: any, i: number) => (
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

            <style>{`
                .growth-dashboard { 
                    padding: 1.5rem; 
                    background: var(--bg-secondary); 
                    border-radius: var(--radius-lg); 
                    border: 1px solid var(--glass-border);
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                
                .resilience-header { display: flex; align-items: center; gap: 1rem; }
                .score-circle { width: 60px; height: 60px; }
                .circular-chart { display: block; max-width: 100%; max-height: 100%; }

                .engagement-disclaimer {
                    font-size: 0.72rem;
                    color: var(--text-secondary);
                    opacity: 0.7;
                    margin: 0.5rem 0 1.5rem;
                    line-height: 1.4;
                }
                .circle-bg { fill: none; stroke: var(--glass-border); stroke-width: 2.5; }
                .circle { fill: none; stroke-width: 2.5; stroke-linecap: round; stroke: var(--color-yellow); transition: stroke-dasharray 0.3s ease; }
                .percentage { fill: var(--text-primary); font-family: inherit; font-size: 0.6em; text-anchor: middle; font-weight: 700; dominant-baseline: middle; }

                .header-text h3 { font-size: 1.1rem; margin-bottom: 0.2rem; color: var(--text-primary); }
                .header-text p { font-size: 0.8rem; color: var(--text-secondary); margin: 0; }

                .heading-sm { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); margin-bottom: 1rem; display: block; }

                .heatmap-grid { 
                    display: grid; 
                    grid-template-columns: repeat(10, 1fr); 
                    gap: 6px; 
                    margin-bottom: 0.8rem;
                }
                .heatmap-cell { 
                    aspect-ratio: 1; 
                    background: rgba(255,255,255,0.03); 
                    border-radius: 3px; 
                    transition: transform 0.2s; 
                }
                .heatmap-cell.active:hover { transform: scale(1.2); box-shadow: 0 0 10px rgba(255,255,255,0.1); z-index: 10; cursor: help; }
                
                .heatmap-legend { 
                    display: flex; 
                    align-items: center; 
                    justify-content: space-between; 
                    font-size: 0.7rem; 
                    color: var(--text-secondary); 
                }
                .legend-dots { display: flex; gap: 4px; }
                .legend-dots span { width: 6px; height: 6px; border-radius: 50%; opacity: 0.6; }

                .chart-container { 
                    background: rgba(0,0,0,0.1); 
                    padding: 1rem; 
                    border-radius: var(--radius-md); 
                    border: 1px solid var(--glass-border);
                }
                .line-chart { width: 100%; height: auto; margin-top: 0.5rem; overflow: visible; }
                .empty-chart { height: 80px; display: flex; align-items: center; justify-content: center; color: var(--text-secondary); font-size: 0.8rem; }
                .chart-labels { display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 0.75rem; color: var(--text-secondary); font-weight: 500; }

                .charts-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
                @media (min-width: 600px) { .charts-grid { grid-template-columns: 1fr 1fr; } }

                .bar-chart { 
                    height: 80px; 
                    display: flex; 
                    align-items: flex-end; 
                    justify-content: space-around; 
                    padding-top: 10px;
                }
                .bar-wrapper { 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    gap: 6px; 
                    height: 100%; 
                    flex: 1;
                }
                .bar { 
                    width: 6px; 
                    background: var(--color-yellow); 
                    border-radius: 3px 3px 0 0; 
                    opacity: 0.6; 
                    transition: height 0.3s ease;
                }
                .bar-label { font-size: 0.6rem; color: var(--text-secondary); opacity: 0.7; }

                /* Neuroscience Metrics - Phase 1 */
                .neuroscience-metrics {
                    background: var(--bg-secondary);
                    border-radius: var(--radius-md);
                    padding: 1.2rem;
                    border: 1px solid var(--glass-border);
                }
                .metrics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1rem; }
                @media (max-width: 500px) { .metrics-grid { grid-template-columns: 1fr; } }

                .metric-card {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background: rgba(0,0,0,0.15);
                    border-radius: var(--radius-md);
                    border: 1px solid var(--glass-border);
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .metric-card:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.2); }

                .metric-visual { flex-shrink: 0; }
                .metric-visual .circular-chart { width: 56px; height: 56px; }
                .metric-visual .circle.granularity { stroke: #4DD0E1; }

                .toolbox-icon {
                    width: 56px;
                    height: 56px;
                    background: linear-gradient(135deg, rgba(255,193,7,0.2), rgba(255,152,0,0.2));
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                }
                .toolbox-svg { 
                    width: 28px; 
                    height: 28px; 
                    color: var(--text-secondary); 
                    opacity: 0.8;
                }
                .toolbox-svg svg { width: 100%; height: 100%; }
                .tool-count {
                    position: absolute;
                    bottom: -4px;
                    right: -4px;
                    background: var(--text-primary);
                    color: var(--bg-color);
                    width: 22px;
                    height: 22px;
                    border-radius: 50%;
                    font-size: 0.7rem;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .metric-info h4 { font-size: 0.9rem; font-weight: 700; margin: 0 0 4px 0; color: var(--text-primary); }
                .metric-desc { font-size: 0.75rem; color: var(--text-secondary); margin: 0 0 6px 0; }
                .metric-desc strong { color: var(--text-primary); }

                .level-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 2px 8px;
                    font-size: 0.65rem;
                    border-radius: 20px;
                    background: rgba(255,255,255,0.08);
                    color: var(--text-secondary);
                    font-weight: 600;
                }
                .badge-icon { width: 12px; height: 12px; display: inline-flex; }
                .badge-icon svg { width: 100%; height: 100%; }
                .level-badge.beginner, .level-badge.starter { background: rgba(158,158,158,0.2); }
                .level-badge.growing, .level-badge.developing { background: rgba(76,175,80,0.2); color: #81C784; }
                .level-badge.rich, .level-badge.diverse { background: rgba(33,150,243,0.2); color: #64B5F6; }
                .level-badge.expert, .level-badge.master { background: rgba(255,193,7,0.2); color: #FFD54F; }

                .section-icon { width: 16px; height: 16px; display: inline-flex; vertical-align: middle; margin-right: 4px; }
                .section-icon svg { width: 100%; height: 100%; }

                .insights-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
                .insight-item { 
                    padding: 1rem; 
                    background: var(--glass-bg); 
                    border-radius: var(--radius-md); 
                    border: 1px solid var(--glass-border);
                    display: flex;
                    align-items: center;
                    gap: 0.8rem;
                }
                .insight-item .icon { width: 24px; height: 24px; color: var(--text-secondary); opacity: 0.7; }
                .insight-item .icon svg { width: 100%; height: 100%; }
                .insight-item label { font-size: 0.7rem; color: var(--text-secondary); display: block; margin-bottom: 2px; }
                .insight-item p { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); margin: 0; }

                /* AI Insight Section Styles */
                .ai-insight-section {
                    background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%);
                    border: 1px solid var(--glass-border);
                    border-radius: var(--radius-lg);
                    padding: 1.25rem;
                    position: relative;
                    overflow: hidden;
                }
                .ai-insight-section::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3px;
                    background: linear-gradient(90deg, var(--color-yellow), var(--color-green));
                    opacity: 0.6;
                }
                .ai-insight-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 1rem;
                }
                .ai-title {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                .ai-icon {
                    width: 24px;
                    height: 24px;
                    color: var(--color-yellow);
                    animation: sparkle 2s ease-in-out infinite;
                }
                .ai-icon svg { width: 100%; height: 100%; }
                .ai-insight-header h4 {
                    font-size: 0.95rem;
                    font-weight: 700;
                    color: var(--text-primary);
                    margin: 0;
                }
                .regenerate-btn-sm {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--glass-bg);
                    border: 1px solid var(--glass-border);
                    border-radius: 8px;
                    color: var(--text-secondary);
                    cursor: pointer;
                    transition: all 0.2s;
                    padding: 0;
                }
                .regenerate-btn-sm:hover {
                    border-color: var(--text-secondary);
                    color: var(--text-primary);
                    transform: rotate(180deg);
                }
                .regenerate-btn-sm svg {
                    width: 16px;
                    height: 16px;
                }
                @keyframes sparkle {
                    0%, 100% { opacity: 0.7; transform: scale(1); }
                    50% { opacity: 1; transform: scale(1.1); }
                }
                .ai-loading {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 2rem;
                    color: var(--text-secondary);
                }
                .loading-dots {
                    display: flex;
                    gap: 6px;
                }
                .loading-dots span {
                    width: 8px;
                    height: 8px;
                    background: var(--text-secondary);
                    border-radius: 50%;
                    animation: loadingBounce 1.4s ease-in-out infinite both;
                }
                .loading-dots span:nth-child(1) { animation-delay: -0.32s; }
                .loading-dots span:nth-child(2) { animation-delay: -0.16s; }
                @keyframes loadingBounce {
                    0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
                    40% { transform: scale(1); opacity: 1; }
                }
                .ai-insight-content {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                .insight-main {
                    padding: 1rem;
                    background: rgba(0,0,0,0.15);
                    border-radius: var(--radius-md);
                    border-left: 3px solid var(--color-yellow);
                }
                .insight-summary {
                    font-size: 1rem;
                    line-height: 1.7;
                    color: var(--text-primary);
                    margin: 0;
                }
                .color-theory-banner {
                    display: flex;
                    align-items: flex-start;
                    gap: 0.75rem;
                    padding: 0.75rem 1rem;
                    background: linear-gradient(90deg, rgba(212,175,55,0.1), transparent);
                    border-radius: var(--radius-md);
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                }
                .color-icon {
                    font-size: 1.2rem;
                    flex-shrink: 0;
                }
                .color-theory-banner p {
                    margin: 0;
                    font-style: italic;
                }
                .insight-details {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 0.75rem;
                }
                @media (max-width: 500px) {
                    .insight-details { grid-template-columns: 1fr; }
                }
                @media (min-width: 768px) {
                    .charts-grid { grid-template-columns: 1fr 1fr; }
                    .metrics-grid { grid-template-columns: 1fr 1fr; }
                    .insight-details { grid-template-columns: 1fr 1fr; }
                }
                .detail-card {
                    padding: 1rem;
                    background: var(--glass-bg);
                    border-radius: var(--radius-md);
                    border: 1px solid var(--glass-border);
                }
                .detail-card label {
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    color: var(--text-secondary);
                    display: block;
                    margin-bottom: 0.5rem;
                }
                .pattern-tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }
                .pattern-tag {
                    padding: 4px 10px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid var(--glass-border);
                    border-radius: 16px;
                    font-size: 0.8rem;
                    color: var(--text-primary);
                }
                .action-card .suggested-action {
                    font-size: 0.9rem;
                    line-height: 1.6;
                    color: var(--text-primary);
                    margin: 0;
                }
                .insight-quote {
                    margin: 0.5rem 0 0;
                    padding: 1rem 1.25rem;
                    background: rgba(0,0,0,0.1);
                    border-radius: var(--radius-md);
                    border-left: 2px solid var(--color-green);
                    font-style: italic;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    line-height: 1.6;
                    position: relative;
                }
                .quote-mark {
                    color: var(--color-green);
                    font-size: 1.2rem;
                    font-weight: 700;
                    opacity: 0.6;
                }
            `}</style>
        </div>
    );
};

export default GrowthDashboard;
