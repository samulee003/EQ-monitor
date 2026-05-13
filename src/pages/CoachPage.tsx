import { useState, useRef, useEffect, useCallback } from 'react';
import { sendMessage } from '../lib/adk/client';
import { loadChatHistory, saveChatHistory } from '../lib/adk/storage';
import type { CoachMessage, CoachAction } from '../lib/adk/types';
import { ChatBubble } from '../components/coach/ChatBubble';
import { ChatInput } from '../components/coach/ChatInput';
import { MetaMomentOverlay } from '../components/coach/MetaMomentOverlay';
import { TypingIndicator } from '../components/coach/TypingIndicator';
import { WelcomeCard } from '../components/coach/WelcomeCard';
import { useAuth } from '../services/AuthContext';
import { botSyncService } from '../services/BotSyncService';
import { useAppStore } from '../stores/appStore';
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

/** 執行 Agent 觸發的前端動作 */
function executeCoachAction(action: CoachAction, reason?: string): string {
  const setView = useAppStore.getState().setView;

  switch (action) {
    case 'start_breathing':
      // 呼吸動作由頁面內的覆蓋層處理，這裡回傳提示文字
      return reason ? `已準備好呼吸練習：${reason}` : '已準備好呼吸練習';
    case 'start_checkin':
      setView('home');
      return reason ? `已為你開啟情緒記錄：${reason}` : '已為你開啟情緒記錄';
    case 'open_sos':
      // SOS 由頁面內的 MetaMomentOverlay 處理
      return reason ? `已準備好緊急協助：${reason}` : '已準備好緊急協助';
    case 'show_history':
      setView('history');
      return '已為你開啟歷史回顧';
    case 'show_growth':
      setView('growth');
      return '已為你開啟成長儀表板';
    default:
      return '';
  }
}

export default function CoachPage() {
  const { user } = useAuth();
  // TODO: Remove 'test-user' fallback once auth is fully wired for all users
  const userId = user?.id || 'test-user';

  const [messages, setMessages] = useState<CoachMessage[]>([WELCOME_MSG]);
  const [loading, setLoading] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ action: CoachAction; reason?: string } | null>(null);
  const [error, setError] = useState<{ type: ErrorType; retryText: string } | null>(null);
  const [bindingCode, setBindingCode] = useState('');
  const [bindingMessage, setBindingMessage] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef(crypto.randomUUID());

  // Load history on mount
  useEffect(() => {
    const history = loadChatHistory(userId);
    if (history && history.length > 0) {
      setMessages(history);
    } else {
      setMessages([WELCOME_MSG]);
    }
  }, [userId]);

  // Persist on change
  useEffect(() => {
    saveChatHistory(messages, userId);
  }, [messages, userId]);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  /** 處理 Agent 回傳的 action */
  const handleAction = useCallback((action: CoachAction | undefined, reason?: string) => {
    if (!action) return;

    if (action === 'open_sos') {
      setShowSOS(true);
      return;
    }
    if (action === 'start_breathing') {
      setPendingAction({ action, reason });
      setShowBreathing(true);
      return;
    }

    // 導航類 action
    executeCoachAction(action, reason);
  }, []);

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

      // 處理 action 指令
      if (res.action) {
        handleAction(res.action as CoachAction, res.actionReason);
      }

      const modelMsg: CoachMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        content: res.response,
        timestamp: new Date().toISOString(),
        metadata: {
          skillInvoked: res.skillInvoked,
          step: res.step,
          action: res.action,
          actionReason: res.actionReason,
        },
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
  }, [handleAction, userId]);

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

  const handleClaimBinding = useCallback(async () => {
    const code = bindingCode.trim().toUpperCase();
    if (!code) {
      setBindingMessage('請輸入 LINE Bot 給你的綁定碼');
      return;
    }

    const result = await botSyncService.claimLineBinding(code, userId);
    if (result.error) {
      setBindingMessage(`綁定失敗：${result.error.message}`);
      return;
    }

    setBindingMessage(`已綁定 LINE Bot：${result.data.lineUserId}`);
    setBindingCode('');
  }, [bindingCode, userId]);

  const showWelcome = messages.length <= 1;

  return (
    <div className={styles.coachPage}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>教</div>
          <h1 className={styles.headerTitle}>今心教練</h1>
        </div>
        <span className={styles.headerSubtitle}>AI 陪伴你的情緒旅程</span>
      </header>

      <section className={styles.bindingPanel} aria-label="LINE Bot 綁定">
        <div>
          <p className={styles.bindingTitle}>LINE Bot 同步</p>
          <p className={styles.bindingHint}>在 LINE 對今心輸入「綁定」，再把 6 位碼貼到這裡。</p>
        </div>
        <div className={styles.bindingForm}>
          <label className={styles.bindingLabel}>
            <span className={styles.visuallyHidden}>LINE 綁定碼</span>
            <input
              aria-label="LINE 綁定碼"
              value={bindingCode}
              onChange={(event) => setBindingCode(event.target.value.toUpperCase())}
              maxLength={6}
              className={styles.bindingInput}
              placeholder="ABC123"
            />
          </label>
          <button type="button" className={styles.bindingButton} onClick={handleClaimBinding}>
            綁定
          </button>
        </div>
        {bindingMessage && <p className={styles.bindingMessage}>{bindingMessage}</p>}
      </section>

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

      {/* TODO: Breathing overlay triggered by agent action */}
      {showBreathing && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--surface-mask)',
            backdropFilter: 'blur(12px)',
          }}
          onClick={() => setShowBreathing(false)}
        >
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-luxe)',
              padding: '2rem',
              maxWidth: '360px',
              textAlign: 'center',
              border: '1px solid var(--glass-border)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'var(--grad-blue)',
                margin: '0 auto 1.5rem',
                animation: 'breatheLuxe 3s cubic-bezier(0.4, 0, 0.2, 1) infinite',
              }}
            />
            <p style={{ color: 'var(--text-primary)', marginBottom: '1rem' }}>
              {pendingAction?.reason || '跟著教練一起呼吸'}
            </p>
            <button
              onClick={() => setShowBreathing(false)}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'var(--text-primary)',
                color: 'var(--bg-color)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              完成
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
