import React, { useEffect, useMemo } from 'react';
import { useBotStore } from '../stores/botStore';
import { useLanguage } from '../services/LanguageContext';
import { uiIcons } from './icons/SvgIcons';
import Skeleton from './Skeleton';
import './BotDashboard.css';

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
            {t('情緒分佈')}
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

    </div>
  );
};

export default BotDashboard;
