import type { CoachMessage } from '../../lib/adk/types';
import { formatRelativeTime } from '../../utils/dateUtils';
import styles from './ChatBubble.module.css';

interface Props {
  message: CoachMessage;
}

function formatCoachTimestamp(iso: string): string {
  const target = new Date(iso);
  const diffSeconds = Math.floor((Date.now() - target.getTime()) / 1000);
  if (diffSeconds < 60) return '剛剛';
  return formatRelativeTime(target);
}

export function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user';
  return (
    <div
      className={`${styles.bubbleRow} ${isUser ? styles.bubbleRowUser : ''}`}
    >
      {/* Avatar */}
      <div
        className={`${styles.avatar} ${isUser ? styles.avatarUser : styles.avatarModel}`}
      >
        {isUser ? '👤' : '🤖'}
      </div>

      {/* Bubble */}
      <div className={styles.bubbleColumn}>
        <div
          className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleModel}`}
        >
          {message.content}
        </div>

        {/* Metadata */}
        <div className={styles.metadata}>
          {message.metadata?.skillInvoked && (
            <span className={styles.skillBadge}>
              🛟 {message.metadata.skillInvoked}
            </span>
          )}
          <span className={styles.timestamp}>
            {formatCoachTimestamp(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}
