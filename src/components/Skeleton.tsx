import React from 'react';
import './Skeleton.css';

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
    </>
  );
};

export default Skeleton;