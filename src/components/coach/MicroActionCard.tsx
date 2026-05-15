import type { CoachMicroAction, CoachMicroActionProposal, CoachMicroActionStatus } from '../../lib/adk/types';
import styles from './MicroActionCard.module.css';

interface Props {
  proposal?: CoachMicroActionProposal | null;
  activeAction?: CoachMicroAction | null;
  onConfirmProposal: (title: string) => void;
  onRejectProposal: () => void;
  onReportAction: (status: Extract<CoachMicroActionStatus, 'completed' | 'partial' | 'skipped'>) => void;
}

export function MicroActionCard({
  proposal,
  activeAction,
  onConfirmProposal,
  onRejectProposal,
  onReportAction,
}: Props) {
  if (!proposal && !activeAction) {
    return null;
  }

  if (proposal) {
    return (
      <section className={styles.card} aria-label="今天的小行動">
        <div className={styles.content}>
          <p className={styles.eyebrow}>今天的小行動</p>
          <h3 className={styles.title}>{proposal.title}</h3>
          <p className={styles.copy}>
            24 小時內回來看一眼就可以。做一半也算數，沒做到但回來說也算數。
          </p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => onConfirmProposal(proposal.title)}
          >
            設為今天的小行動
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onRejectProposal}
          >
            先不要
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.card} aria-label="上次的小行動">
      <div className={styles.content}>
        <p className={styles.eyebrow}>上次的小行動</p>
        <h3 className={styles.title}>{activeAction?.title}</h3>
        <p className={styles.copy}>回來看一眼就好，不是成績單。</p>
      </div>
      <div className={styles.reportGrid}>
        <button
          type="button"
          className={styles.primaryButton}
          onClick={() => onReportAction('completed')}
        >
          有做到
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => onReportAction('partial')}
        >
          做了一半
        </button>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={() => onReportAction('skipped')}
        >
          沒做到，但我回來了
        </button>
      </div>
    </section>
  );
}
