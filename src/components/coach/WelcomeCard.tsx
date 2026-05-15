import styles from './WelcomeCard.module.css';

interface Props {
  onPromptClick: (prompt: string) => void;
}

const SUGGESTED_PROMPTS = [
  { text: '我今天有點煩，想找人聊聊', icon: '💭' },
  { text: '幫我啟動緊急安定練習', icon: '🛟' },
  { text: '看看我最近的情緒趨勢', icon: '📊' },
];

export function WelcomeCard({ onPromptClick }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Icon */}
        <div className={styles.icon}>
          🤝
        </div>

        <h2 className={styles.title}>
          歡迎來到今心教練
        </h2>
        <p className={styles.description}>
          我是你的主動情緒教練，在這裡陪你用看見、命名、安放、回應整理情緒，練習選一個可承受的下一步。
        </p>

        <div className={styles.promptList}>
          {SUGGESTED_PROMPTS.map(({ text, icon }) => (
            <button
              key={text}
              onClick={() => onPromptClick(text)}
              className={styles.promptButton}
            >
              <span className={styles.promptIcon}>{icon}</span>
              <span className={styles.promptText}>{text}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
