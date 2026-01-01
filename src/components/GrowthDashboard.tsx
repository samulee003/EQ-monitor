import React, { useMemo } from 'react';
import { resilienceService, DailyResilience } from '../services/ResilienceService';

const GrowthDashboard: React.FC = () => {
    const data: DailyResilience[] = useMemo(() => resilienceService.getDashboardData(), []);
    const overallScore = useMemo(() => resilienceService.getOverallScore(), []);
    const heatmapData = useMemo(() => resilienceService.getHeatmapData(), []);
    const intensityData = useMemo(() => resilienceService.getIntensityData(), []);

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
