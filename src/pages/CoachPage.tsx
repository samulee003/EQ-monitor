import { useState, useRef, useEffect, useCallback } from 'react';
import { sendMessage } from '../lib/adk/client';
import { loadChatHistory, saveChatHistory } from '../lib/adk/storage';
import type { CoachMessage } from '../lib/adk/types';
import { ChatBubble } from '../components/coach/ChatBubble';
import { ChatInput } from '../components/coach/ChatInput';
import { MetaMomentOverlay } from '../components/coach/MetaMomentOverlay';
import { TypingIndicator } from '../components/coach/TypingIndicator';
import { WelcomeCard } from '../components/coach/WelcomeCard';
import { useAuth } from '../services/AuthContext';
import styles from './CoachPage.module.css';

const WELCOME_MSG: CoachMessage = {
  id: 'welcome',
  role: 'model',
  content:
    '你好，我是今心教練。我在這裡陪伴你，無論你現在的感受是什麼，都可以跟我說說。',
  timestamp: new Date().toISOString(),
};

type ErrorType = 'network' | 'api' | 'timeout';

function getErrorMessage(type: ErrorType): string {
  switch (type) {
    case 'network':
      return '網路連線不穩定，請檢查後再試一次';
    case 'api':
      return '伺服器暫時忙碌，請稍後再試';
    case 'timeout':
      return '連線有點慢，請稍後再試';
  }
}

export default function CoachPage() {
  const { user } = useAuth();
  // TODO: Remove 'test-user' fallback once auth is fully wired for all users
  const userId = user?.id || 'test-user';

  const [messages, setMessages] = useState<CoachMessage[]>([WELCOME_MSG]);
  const [loading, setLoading] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [error, setError] = useState<{ type: ErrorType; retryText: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef(crypto.randomUUID());

  // Load history on mount
  useEffect(() => {
    const history = loadChatHistory();
    if (history && history.length > 0) {
      setMessages(history);
    }
  }, []);

  // Persist on change
  useEffect(() => {
    saveChatHistory(messages);
  }, [messages]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const doSend = useCallback(async (text: string, addUserMsg = true) => {
    setError(null);
    if (addUserMsg) {
      const userMsg: CoachMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
    }
    setLoading(true);

    try {
      const res = await sendMessage({
        message: text,
        userId: userId,
        sessionId: sessionIdRef.current,
      });
      const modelMsg: CoachMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        content: res.response,
        timestamp: new Date().toISOString(),
        metadata: res.metadata
          ? {
              skillInvoked: res.skillInvoked,
              step: res.step,
              emotions: res.metadata.emotions_detected,
            }
          : undefined,
      };
      setMessages((prev) => [...prev, modelMsg]);
    } catch (err) {
      let errorType: ErrorType = 'network';
      if (err instanceof Error) {
        if (err.message === 'timeout') errorType = 'timeout';
        else if (err.message.startsWith('Coach API error')) errorType = 'api';
      }
      setError({ type: errorType, retryText: text });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSend = useCallback(
    (text: string) => doSend(text, true),
    [doSend]
  );

  const handleRetry = useCallback(() => {
    if (error) {
      setError(null);
      doSend(error.retryText, false);
    }
  }, [error, doSend]);

  const handlePromptClick = useCallback(
    (prompt: string) => {
      if (prompt === '幫我啟動 Meta-Moment') {
        setShowSOS(true);
        return;
      }
      handleSend(prompt);
    },
    [handleSend]
  );

  const showWelcome = messages.length <= 1;

  return (
    <div className={styles.coachPage}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>🤖</div>
          <h1 className={styles.headerTitle}>今心教練</h1>
        </div>
        <span className={styles.headerSubtitle}>AI 陪伴你的情緒旅程</span>
      </header>

      {/* Chat Area */}
      <div className={styles.chatArea}>
        {showWelcome && <WelcomeCard onPromptClick={handlePromptClick} />}
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Error Banner */}
      {error && (
        <div className={styles.errorBanner}>
          <span className={styles.errorMessage}>
            {getErrorMessage(error.type)}
          </span>
          <button
            onClick={handleRetry}
            className={styles.retryButton}
          >
            再試一次
          </button>
        </div>
      )}

      <ChatInput
        onSend={handleSend}
        onSOS={() => setShowSOS(true)}
        disabled={loading}
      />

      {showSOS && (
        <MetaMomentOverlay
          onClose={() => setShowSOS(false)}
          onComplete={({ bestSelf, strategy }) => {
            setShowSOS(false);
            handleSend(
              `我完成了 Meta-Moment。看見的自己是：${bestSelf}，選擇的策略是：${strategy}`
            );
          }}
        />
      )}
    </div>
  );
}
