import React from 'react';

interface SkeletonProps {
  type?: 'card' | 'chart' | 'text' | 'circle' | 'heatmap';
  count?: number;
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ type = 'text', count = 1, className = '' }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="skeleton-card">
            <div className="skeleton-line short" />
            <div className="skeleton-line" />
            <div className="skeleton-line medium" />
            <div className="skeleton-tags">
              <div className="skeleton-tag" />
              <div className="skeleton-tag" />
            </div>
          </div>
        );
      case 'chart':
        return (
          <div className="skeleton-chart">
            <div className="skeleton-circle" />
            <div className="skeleton-chart-content">
              <div className="skeleton-line short" />
              <div className="skeleton-line" />
            </div>
          </div>
        );
      case 'heatmap':
        return (
          <div className="skeleton-heatmap">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="skeleton-cell" />
            ))}
          </div>
        );
      case 'circle':
        return <div className="skeleton-circle-lg" />;
      default:
        return <div className="skeleton-line" />;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`skeleton-wrapper ${className}`}>
          {renderSkeleton()}
        </div>
      ))}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        .skeleton-wrapper {
          width: 100%;
        }

        .skeleton-line {
          height: 14px;
          background: linear-gradient(
            90deg,
            var(--glass-border) 25%,
            rgba(255, 255, 255, 0.1) 50%,
            var(--glass-border) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
          margin-bottom: 10px;
        }

        .skeleton-line.short { width: 40%; }
        .skeleton-line.medium { width: 70%; }

        .skeleton-card {
          background: var(--bg-secondary);
          border: 1px solid var(--glass-border);
          border-radius: var(--radius-md);
          padding: 1.5rem;
        }

        .skeleton-tags {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }

        .skeleton-tag {
          width: 60px;
          height: 24px;
          background: linear-gradient(
            90deg,
            var(--glass-border) 25%,
            rgba(255, 255, 255, 0.1) 50%,
            var(--glass-border) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 4px;
        }

        .skeleton-chart {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.1);
          border-radius: var(--radius-md);
          border: 1px solid var(--glass-border);
        }

        .skeleton-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(
            90deg,
            var(--glass-border) 25%,
            rgba(255, 255, 255, 0.1) 50%,
            var(--glass-border) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          flex-shrink: 0;
        }

        .skeleton-circle-lg {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          margin: 0 auto;
          background: linear-gradient(
            90deg,
            var(--glass-border) 25%,
            rgba(255, 255, 255, 0.1) 50%,
            var(--glass-border) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        .skeleton-chart-content {
          flex: 1;
        }

        .skeleton-heatmap {
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          gap: 6px;
        }

        .skeleton-cell {
          aspect-ratio: 1;
          background: linear-gradient(
            90deg,
            var(--glass-border) 25%,
            rgba(255, 255, 255, 0.1) 50%,
            var(--glass-border) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 3px;
        }
      `}</style>
    </>
  );
};

export default Skeleton;