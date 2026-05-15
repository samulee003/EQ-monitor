import type { CoachGamificationSummary } from '../../lib/adk/types';
import styles from './GamificationStrip.module.css';

interface Props {
  summary?: CoachGamificationSummary | null;
}

export function GamificationStrip({ summary }: Props) {
  if (!summary) {
    return null;
  }

  const level = summary.level;

  return (
    <section className={styles.strip} aria-label="阿念行動陪跑進度">
      {level && (
        <div className={styles.item}>
          <span className={styles.label}>目前</span>
          <strong>{`Lv.${level.level} ${level.title}`}</strong>
        </div>
      )}
      {level?.nextLevelXp != null && (
        <div className={styles.item}>
          <span className={styles.label}>XP</span>
          <strong>{`${level.currentXp} / ${level.nextLevelXp} XP`}</strong>
        </div>
      )}
      <div className={styles.item}>
        <span className={styles.label}>金幣</span>
        <strong>{`${summary.coin_balance} 金幣`}</strong>
      </div>
      <div className={styles.item}>
        <span className={styles.label}>復盤</span>
        <strong>{`復盤連續 ${summary.current_review_streak} 天`}</strong>
      </div>
    </section>
  );
}
