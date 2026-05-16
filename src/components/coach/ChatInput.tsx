import { useState } from 'react';
import styles from './ChatInput.module.css';

interface Props {
  onSend: (text: string) => void;
  onSOS: () => void;
  disabled?: boolean;
  messageDisabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  onSOS,
  disabled = false,
  messageDisabled = false,
  placeholder = '告訴我你的感受...',
}: Props) {
  const [text, setText] = useState('');
  const textDisabled = disabled || messageDisabled;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || textDisabled) return;
    onSend(text.trim());
    setText('');
  };

  const hasText = text.trim().length > 0;

  return (
    <form
      onSubmit={handleSubmit}
      className={styles.form}
    >
      {/* SOS Button */}
      <button
        type="button"
        onClick={onSOS}
        disabled={disabled}
        aria-label="SOS 緊急協助"
        className={styles.sosButton}
        title="SOS 緊急協助：安心專線 1925，生命線 1909"
        data-testid="coach-sos-button"
      >
        <span className={styles.sosText}>SOS</span>
      </button>

      {/* Text Input */}
      <div className={styles.inputWrapper}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          disabled={textDisabled}
          aria-label="輸入訊息"
          className={styles.textInput}
        />

        {/* Send Button */}
        <button
          type="submit"
          disabled={textDisabled || !hasText}
          aria-label="送出訊息"
          className={`${styles.sendButton} ${hasText ? styles.sendButtonActive : styles.sendButtonInactive}`}
        >
          {disabled ? (
            <span className={styles.spinner} />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          )}
        </button>
      </div>
    </form>
  );
}
