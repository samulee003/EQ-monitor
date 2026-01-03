import React, { useMemo } from 'react';
import { resilienceService, DailyResilience, GranularityData, StrategyDiversityData } from '../services/ResilienceService';

const GrowthDashboard: React.FC = () => {
    const data: DailyResilience[] = useMemo(() => resilienceService.getDashboardData(), []);
    const overallScore = useMemo(() => resilienceService.getOverallScore(), []);
    const heatmapData = useMemo(() => resilienceService.getHeatmapData(), []);
    const intensityData = useMemo(() => resilienceService.getIntensityData(), []);
    const granularity: GranularityData = useMemo(() => resilienceService.getEmotionalGranularity(), []);
    const diversity: StrategyDiversityData = useMemo(() => resilienceService.getStrategyDiversity(), []);

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
                    <h3>情緒韌性積分</h3>
                    <p>基於您的調節頻率與身心回饋計算</p>
                </div>
            </div>

            <div className="dashboard-section heatmap-section">
                <label className="heading-sm">情緒熱點圖 (近 30 天)</label>
                <div className="heatmap-grid">
                    {heatmapData.map((day: any, i: number) => (
                        <div
                            key={i}
                            className={`heatmap-cell ${day.hasData ? 'active' : ''}`}
                            style={day.hasData ? {
                                backgroundColor: `var(--color-${day.quadrant})`,
                                opacity: 0.3 + (day.intensity / 10) * 0.7
                            } : {}}
                            title={day.hasData ? `${day.date}: ${day.intensity} 級` : day.date}
                        ></div>
                    ))}
                </div>
                <div className="heatmap-legend">
                    <span>低強度</span>
                    <div className="legend-dots">
                        <span style={{ background: 'var(--color-blue)' }}></span>
                        <span style={{ background: 'var(--color-green)' }}></span>
                        <span style={{ background: 'var(--color-yellow)' }}></span>
                        <span style={{ background: 'var(--color-red)' }}></span>
                    </div>
                    <span>高強度</span>
                </div>
            </div>

            <div className="charts-grid">
                <div className="chart-container">
                    <label className="heading-sm">韌性趨勢 (Resilience)</label>
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
                        <div className="empty-chart">需要更多記錄來生成趨勢圖</div>
                    )}
                    <div className="chart-labels">
                        <span>過去</span>
                        <span>現在</span>
                    </div>
                </div>

                <div className="chart-container">
                    <label className="heading-sm">強度波動 (Intensity)</label>
                    <div className="bar-chart">
                        {intensityData.map((d: any, i: number) => (
                            <div key={i} className="bar-wrapper">
                                <div
                                    className="bar"
                                    style={{ height: `${(d.value / 10) * 100}%` }}
                                    title={`${d.label}: ${d.value} 級`}
                                ></div>
                                <span className="bar-label">{d.label}</span>
                            </div>
                        ))}
                        {intensityData.length === 0 && <div className="empty-chart">無數據</div>}
                    </div>
                </div>
            </div>

            {/* 神經科學導向指標 - Phase 1 */}
            <div className="neuroscience-metrics">
                <label className="heading-sm">🧠 情緒智能指標</label>
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
                            <h4>情緒粒度</h4>
                            <p className="metric-desc">你已辨識 <strong>{granularity.uniqueEmotions.length}</strong> 種不同情緒</p>
                            <div className="metric-level">
                                <span className={`level-badge ${granularity.level}`}>
                                    {granularity.level === 'beginner' && '🌱 萌芽期'}
                                    {granularity.level === 'growing' && '🌿 成長中'}
                                    {granularity.level === 'rich' && '🌳 豐富'}
                                    {granularity.level === 'expert' && '✨ 專家'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 調節策略多樣性 */}
                    <div className="metric-card diversity-card">
                        <div className="metric-visual">
                            <div className="toolbox-icon">
                                <span className="toolbox-emoji">🧰</span>
                                <span className="tool-count">{diversity.usedStrategies.length}</span>
                            </div>
                        </div>
                        <div className="metric-info">
                            <h4>調節工具箱</h4>
                            <p className="metric-desc">已掌握 <strong>{diversity.usedStrategies.length}/{diversity.totalPossible}</strong> 種策略</p>
                            <div className="metric-level">
                                <span className={`level-badge ${diversity.level}`}>
                                    {diversity.level === 'starter' && '🔧 初始'}
                                    {diversity.level === 'developing' && '🛠️ 發展中'}
                                    {diversity.level === 'diverse' && '⚙️ 多元'}
                                    {diversity.level === 'master' && '🏆 大師'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="insights-grid">
                <div className="insight-item">
                    <span className="icon">🌱</span>
                    <div className="item-content">
                        <label>主要情緒</label>
                        <p>{data[data.length - 1]?.dominantEmotion || '無數據'}</p>
                    </div>
                </div>
                <div className="insight-item">
                    <span className="icon">🛡️</span>
                    <div className="item-content">
                        <label>情緒防禦力</label>
                        <p>{overallScore > 70 ? '穩健' : (overallScore > 40 ? '成長中' : '重建中')}</p>
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
                .chart-labels { display: flex; justify-content: space-between; margin-top: 0.5rem; font-size: 0.65rem; color: var(--text-secondary); opacity: 0.7; }

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
                .toolbox-emoji { font-size: 1.6rem; filter: saturate(0.7); }
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
                    display: inline-block;
                    padding: 2px 8px;
                    font-size: 0.65rem;
                    border-radius: 20px;
                    background: rgba(255,255,255,0.08);
                    color: var(--text-secondary);
                    font-weight: 600;
                }
                .level-badge.beginner, .level-badge.starter { background: rgba(158,158,158,0.2); }
                .level-badge.growing, .level-badge.developing { background: rgba(76,175,80,0.2); color: #81C784; }
                .level-badge.rich, .level-badge.diverse { background: rgba(33,150,243,0.2); color: #64B5F6; }
                .level-badge.expert, .level-badge.master { background: rgba(255,193,7,0.2); color: #FFD54F; }

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
                .insight-item .icon { font-size: 1.2rem; }
                .insight-item label { font-size: 0.7rem; color: var(--text-secondary); display: block; margin-bottom: 2px; }
                .insight-item p { font-size: 0.9rem; font-weight: 600; color: var(--text-primary); margin: 0; }
            `}</style>
        </div>
    );
};

export default GrowthDashboard;
