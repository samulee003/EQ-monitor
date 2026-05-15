import styles from './CoachFAB.module.css';

interface Props {
  onClick: () => void;
  visible: boolean;
}

export function CoachFAB({ onClick, visible }: Props) {
  if (!visible) return null;

  return (
    <button
      onClick={onClick}
      aria-label="開啟阿念教練"
      className={styles.fab}
    >
      <span aria-hidden="true" className={styles.icon}>✦</span>
      <span className={styles.label}>阿念教練</span>
    </button>
  );
}
