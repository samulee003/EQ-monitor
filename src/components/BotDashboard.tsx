import React, { useEffect, useMemo } from 'react';
import { useBotStore } from '../stores/botStore';
import { useLanguage } from '../services/LanguageContext';
import { uiIcons } from './icons/SvgIcons';
import Skeleton from './Skeleton';

interface BotDashboardProps {
  lineUserId: string;
}

const BotDashboard: React.FC<BotDashboardProps> = ({ lineUserId }) => {
  const { t } = useLanguage();
  const {
    summary,
    weeklyReport,
    isLoadingSummary,
    isLoadingWeekly,
    summaryError,
    weeklyError,
    fetchSummary,
    fetchWeeklyReport,
  } = useBotStore();

  useEffect(() => {
    if (lineUserId) {
      fetchSummary(lineUserId);
      fetchWeeklyReport(lineUserId);
    }
  }, [lineUserId, fetchSummary, fetchWeeklyReport]);

  const quadrantData = useMemo(() => {
    if (!weeklyReport) return [];
    const dist = weeklyReport.quadrantDistribution;
    const total = dist.red + dist.yellow + dist.blue + dist.green || 1;
    return [
      { key: 'red', label: t('高能量\n不適'), count: dist.red, color: 'var(--color-red)' },
      { key: 'yellow', label: t('高能量\n愉悅'), count: dist.yellow, color: 'var(--color-yellow)' },
      { key: 'blue', label: t('低能量\n不適'), count: dist.blue, color: 'var(--color-blue)' },
      { key: 'green', label: t('低能量\n平靜'), count: dist.green, color: 'var(--color-green)' },
    ].map((d) => ({ ...d, percent: Math.round((d.count / total) * 100) }));
  }, [weeklyReport, t]);

  const maxCount = useMemo(() => {
    return Math.max(...quadrantData.map((d) => d.count), 1);
  }, [quadrantData]);

  const isLoading = isLoadingSummary || isLoadingWeekly;
  const hasError = summaryError || weeklyError;

  if (isLoading) {
    return (
      <div className="bot-dashboard fade-in">
        <div className="dashboard-header">
          <Skeleton type="circle" />
          <div className="header-text" style={{ flex: 1 }}>
            <Skeleton type="text" />
            <Skeleton type="text" className="short" />
          </div>
        </div>
        <div className="stats-grid">
          <Skeleton type="chart" />
          <Skeleton type="chart" />
        </div>
        <style>{`
          .bot-dashboard { padding: 1.5rem; background: var(--bg-secondary); border-radius: var(--radius-lg); border: 1px solid var(--glass-border); }
          .dashboard-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
          .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
        `}</style>
      </div>
    );
  }

  if (hasError && !summary && !weeklyReport) {
    return (
      <div className="bot-dashboard fade-in">
        <div className="dashboard-empty">
          <span className="empty-icon">📡</span>
          <h3>{t('數據同步失敗')}</h3>
          <p>{summaryError?.message || weeklyError?.message || t('無法連接到 Bot 後端')}</p>
          <button
            className="retry-btn"
            onClick={() => {
              fetchSummary(lineUserId);
              fetchWeeklyReport(lineUserId);
            }}
          >
            {t('重試')}
          </button>
        </div>
        <style>{`
          .bot-dashboard { padding: 1.5rem; background: var(--bg-secondary); border-radius: var(--radius-lg); border: 1px solid var(--glass-border); }
          .dashboard-empty { text-align: center; padding: 2rem 1rem; }
          .empty-icon { font-size: 2.5rem; display: block; margin-bottom: 1rem; }
          .dashboard-empty h3 { font-size: 1.1rem; color: var(--text-primary); margin: 0 0 0.5rem; }
          .dashboard-empty p { font-size: 0.85rem; color: var(--text-secondary); margin: 0 0 1.5rem; }
          .retry-btn { background: var(--glass-bg); border: 1px solid var(--glass-border); color: var(--text-primary); padding: 0.6rem 1.5rem; border-radius: var(--radius-sm); cursor: pointer; font-size: 0.9rem; transition: var(--transition); }
          .retry-btn:hover { background: var(--glass-border); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="bot-dashboard fade-in">
      <div className="dashboard-header">
        <div className="bot-avatar">
          <span className="avatar-icon">🤖</span>
        </div>
        <div className="header-text">
          <h3>{t('Bot 儀表盤')}</h3>
          <p className="subtitle">{t('與 LINE Bot 的覺察數據同步')}</p>
        </div>
      </div>

      {/* 核心統計 */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(197, 139, 138, 0.15)' }}>
            <span className="stat-icon">🧘</span>
          </div>
          <div className="stat-content">
            <span className="stat-value">{summary?.totalSessions ?? 0}</span>
            <span className="stat-label">{t('累積覺察')}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(213, 193, 165, 0.15)' }}>
            <span className="stat-icon">🔥</span>
          </div>
          <div className="stat-content">
            <span className="stat-value">{summary?.streakDays ?? 0}</span>
            <span className="stat-label">{t('連續天數')}</span>
          </div>
        </div>
      </div>

      {/* 情緒分佈 */}
      {weeklyReport && quadrantData.length > 0 && (
        <div className="distribution-section">
          <label className="section-label">
            <span className="section-icon-inline">{uiIcons.brain}</span>
            {t('情緒分佤')}
          </label>
          <div className="bar-chart">
            {quadrantData.map((item) => (
              <div key={item.key} className="bar-group">
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      height: `${(item.count / maxCount) * 100}%`,
                      background: item.color,
                    }}
                    title={`${item.label.replace('\n', '')}: ${item.count} (${item.percent}%)`}
                  />
                </div>
                <span className="bar-count">{item.count}</span>
                <span className="bar-label">{item.label.split('\n').map((l, i) => <React.Fragment key={i}>{i > 0 && <br />}{l}</React.Fragment>)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 底部刷新 */}
      <div className="dashboard-footer">
        <button
          className="refresh-btn"
          onClick={() => {
            fetchSummary(lineUserId);
            fetchWeeklyReport(lineUserId);
          }}
          title={t('刷新數據')}
        >
          <span className="refresh-icon">{uiIcons.refresh}</span>
          <span>{t('刷新')}</span>
        </button>
        {summary?.lastSessionDate && (
          <span className="last-updated">
            {t('最近覺察')}: {new Date(summary.lastSessionDate).toLocaleDateString('zh-TW')}
          </span>
        )}
      </div>

      <style>{`
        .bot-dashboard {
          background: var(--bg-secondary);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-lg);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .dashboard-header {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .bot-avatar {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, rgba(151, 166, 180, 0.2), rgba(170, 176, 155, 0.2));
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--glass-border);
        }

        .avatar-icon {
          font-size: 1.5rem;
        }

        .header-text h3 {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 0.2rem;
        }

        .subtitle {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          padding: 1rem;
          background: var(--glass-bg);
          border-radius: var(--radius-md);
          border: 1px solid var(--glass-border);
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }

        .stat-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stat-icon {
          font-size: 1.25rem;
        }

        .stat-content {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .stat-value {
          font-size: 1.5rem;
          font-weight: 800;
          color: var(--text-primary);
          line-height: 1.2;
        }

        .stat-label {
          font-size: 0.7rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .distribution-section {
          background: var(--glass-bg);
          border-radius: var(--radius-md);
          border: 1px solid var(--glass-border);
          padding: 1.25rem;
        }

        .section-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--text-secondary);
          margin-bottom: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .section-icon-inline {
          width: 16px;
          height: 16px;
          display: inline-flex;
          color: var(--text-secondary);
        }

        .section-icon-inline svg {
          width: 100%;
          height: 100%;
        }

        .bar-chart {
          display: flex;
          align-items: flex-end;
          justify-content: space-around;
          height: 120px;
          gap: 0.5rem;
        }

        .bar-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          flex: 1;
          height: 100%;
        }

        .bar-track {
          flex: 1;
          width: 100%;
          max-width: 32px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 6px 6px 0 0;
          position: relative;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
        }

        .bar-fill {
          width: 100%;
          border-radius: 6px 6px 0 0;
          opacity: 0.75;
          transition: height 0.5s cubic-bezier(0.23, 1, 0.32, 1);
        }

        .bar-count {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .bar-label {
          font-size: 0.6rem;
          color: var(--text-secondary);
          text-align: center;
          line-height: 1.3;
          min-height: 1.8em;
        }

        .dashboard-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding-top: 0.5rem;
        }

        .refresh-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--glass-bg);
          border: 1px solid var(--glass-border);
          color: var(--text-secondary);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          cursor: pointer;
          transition: var(--transition);
        }

        .refresh-btn:hover {
          background: var(--glass-border);
          color: var(--text-primary);
        }

        .refresh-icon {
          width: 14px;
          height: 14px;
          display: inline-flex;
        }

        .refresh-icon svg {
          width: 100%;
          height: 100%;
        }

        .last-updated {
          font-size: 0.7rem;
          color: var(--text-secondary);
          opacity: 0.7;
        }

        @media (max-width: 480px) {
          .stats-grid {
            gap: 0.75rem;
          }
          .stat-card {
            padding: 0.875rem;
          }
          .stat-value {
            font-size: 1.3rem;
          }
        }
      `}</style>
    </div>
  );
};

export default BotDashboard;
