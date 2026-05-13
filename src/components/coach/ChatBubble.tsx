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

function sanitizeCoachContent(content: string): string {
  return content
    .replace(/`?(?:save_ruler_log|get_ruler_history|analyze_emotion_trend|trigger_action)`?/g, '這段覺察紀錄')
    .replace(/已為您執行\s*/g, '')
    .replace(/已為你執行\s*/g, '')
    .trim();
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
        {isUser ? '人' : '✦'}
      </div>

      {/* Bubble */}
      <div className={styles.bubbleColumn}>
        <div
          className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleModel}`}
        >
          {isUser ? message.content : sanitizeCoachContent(message.content)}
        </div>

        <div className={styles.metadata}>
          <span className={styles.timestamp}>
            {formatCoachTimestamp(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}
