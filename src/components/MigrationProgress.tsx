import React, { useEffect, useState } from 'react';
import { runMigration } from '@/lib/insforge/localStorageMigration';

interface Props {
  userId: string;
  onComplete: () => void;
}

const MigrationProgress: React.FC<Props> = ({ userId, onComplete }) => {
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    runMigration(userId, (d, t) => {
      if (cancelled) return;
      setDone(d);
      setTotal(t);
    })
      .then(() => {
        if (!cancelled) onComplete();
      })
      .catch(err => {
        if (!cancelled) setError(err instanceof Error ? err.message : '遷移失敗');
      });
    return () => { cancelled = true; };
  }, [userId, onComplete]);

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--bg, #1a1a1a)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', zIndex: 9999, gap: 16,
    }}>
      <div style={{ fontSize: 48 }}>☁️</div>
      <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text, #fff)' }}>
        正在同步你的記錄
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted, #888)', textAlign: 'center' }}>
        把本機 {total} 筆情緒記錄傳送到雲端，讓阿念能接續你的脈絡
      </div>
      {error ? (
        <div style={{ color: '#C58B8A', fontSize: 13 }}>{error}（已跳過，稍後可重試）</div>
      ) : (
        <>
          <div style={{
            width: 240, height: 8, background: 'var(--surface, #2a2a2a)',
            borderRadius: 100, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: 'var(--accent, #7c6f5b)', borderRadius: 100,
              transition: 'width 0.3s ease',
            }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted, #888)' }}>
            {done} / {total} 筆
          </div>
        </>
      )}
    </div>
  );
};

export default MigrationProgress;
