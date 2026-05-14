import styles from './TypingIndicator.module.css';

export function TypingIndicator() {
  return (
    <div className={styles.container} data-testid="typing-indicator">
      {/* Avatar */}
      <div className={styles.avatar}>
        ✦
      </div>

      <div className={styles.bubble}>
        <span className={styles.typingLabel}>
          教練正在思考...
        </span>
        <div className={styles.dots}>
          <span className={`${styles.dot} ${styles.dot1}`} />
          <span className={`${styles.dot} ${styles.dot2}`} />
          <span className={`${styles.dot} ${styles.dot3}`} />
        </div>
      </div>
    </div>
  );
}
