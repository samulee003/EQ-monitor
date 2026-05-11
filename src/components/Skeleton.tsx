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
            <div className="skeleton-line skeleton-shimmer short" />
            <div className="skeleton-line skeleton-shimmer" />
            <div className="skeleton-line skeleton-shimmer medium" />
            <div className="skeleton-tags">
              <div className="skeleton-tag skeleton-shimmer" />
              <div className="skeleton-tag skeleton-shimmer" />
            </div>
          </div>
        );
      case 'chart':
        return (
          <div className="skeleton-chart">
            <div className="skeleton-circle skeleton-shimmer" />
            <div className="skeleton-chart-content">
              <div className="skeleton-line skeleton-shimmer short" />
              <div className="skeleton-line skeleton-shimmer" />
            </div>
          </div>
        );
      case 'heatmap':
        return (
          <div className="skeleton-heatmap">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i} className="skeleton-cell skeleton-shimmer" />
            ))}
          </div>
        );
      case 'circle':
        return <div className="skeleton-circle-lg skeleton-shimmer" />;
      default:
        return <div className="skeleton-line skeleton-shimmer" />;
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

        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            var(--glass-border) 25%,
            var(--glass-bg) 50%,
            var(--glass-border) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        .skeleton-wrapper {
          width: 100%;
        }

        .skeleton-line {
          height: 14px;
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
          flex-shrink: 0;
        }

        .skeleton-circle-lg {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          margin: 0 auto;
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
          border-radius: 3px;
        }
      `}</style>
    </>
  );
};

export default Skeleton;