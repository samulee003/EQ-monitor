import { useState, useRef, useEffect, useCallback } from 'react';
import { sendMessage } from '../lib/adk/client';
import { loadChatHistory, saveChatHistory } from '../lib/adk/storage';
import type { CoachMessage, CoachAction } from '../lib/adk/types';
import { ChatBubble } from '../components/coach/ChatBubble';
import { ChatInput } from '../components/coach/ChatInput';
import { MetaMomentOverlay } from '../components/coach/MetaMomentOverlay';
import { TypingIndicator } from '../components/coach/TypingIndicator';
import { useAuth } from '../services/AuthContext';
import { botSyncService } from '../services/BotSyncService';
import { LINE_BOT_ADD_FRIEND_URL, LINE_BOT_BASIC_ID, LINE_BOT_DISPLAY_NAME } from '../constants/lineBot';
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
type CoachView = 'home' | 'history' | 'growth' | 'achievement' | 'coach';

const QUICK_REPLIES = ['好的，一起試試', '我現在只想聊聊'];

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

function getTodayLabel(): string {
  const time = new Intl.DateTimeFormat('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());

  return `今日，${time}`;
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
  const bindingPanelRef = useRef<HTMLElement>(null);
  const bindingInputRef = useRef<HTMLInputElement>(null);
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
    if (messages.length > 1 || loading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  // 從首頁 LINE Bot 入口進來時，直接把人帶到綁定碼欄位。
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const shouldFocusBinding = window.sessionStorage.getItem('imxin_focus_line_binding') === '1';
      if (!shouldFocusBinding) return;

      window.sessionStorage.removeItem('imxin_focus_line_binding');
      window.setTimeout(() => {
        bindingPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        bindingInputRef.current?.focus();
      }, 0);
    } catch {
      // sessionStorage 不可用時維持一般教練頁體驗。
    }
  }, []);

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

  const handleQuickReply = useCallback(
    (prompt: string) => {
      if (prompt === '好的，一起試試') {
        setPendingAction({ action: 'start_breathing', reason: '跟著教練一起呼吸' });
        setShowBreathing(true);
        return;
      }

      handleSend(prompt);
    },
    [handleSend]
  );

  const handleNavigate = useCallback((view: CoachView) => {
    useAppStore.getState().setView(view);
  }, []);

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
  const visibleMessages = showWelcome
    ? messages.filter((message) => message.id !== WELCOME_MSG.id)
    : messages;

  return (
    <div className={styles.coachPage} role="region" aria-label="Stitch AI 情緒教練畫布">
      <div className={styles.emotionalGlow} />

      <header className={styles.header}>
        <button
          type="button"
          className={styles.headerIconButton}
          aria-label="回到今日心情"
          onClick={() => handleNavigate('home')}
        >
          心
        </button>
        <h1 className={styles.headerTitle}>今心</h1>
        <div className={styles.headerSpacer} aria-hidden="true" />
      </header>

      <main className={styles.chatArea}>
        <div className={styles.dateDivider}>
          <span>{getTodayLabel()}</span>
        </div>

        <section
          ref={bindingPanelRef}
          className={styles.bindingPanel}
          aria-label="LINE Bot 綁定"
          data-testid="line-binding-panel"
        >
          <div className={styles.bindingHeader}>
            <span className={styles.bindingEyebrow}>LINE Bot 綁定</span>
            <h2 className={styles.bindingTitle}>把 LINE 給你的 6 位碼貼在這裡</h2>
            <p className={styles.bindingHint}>綁定後，LINE 完成的覺察會同步給今心教練參考。</p>
            <div className={styles.bindingAccount} aria-label="目前使用的 LINE 官方帳號">
              <span>LINE 官方帳號</span>
              <strong>{LINE_BOT_DISPLAY_NAME}</strong>
              <code>{LINE_BOT_BASIC_ID}</code>
            </div>
            <a
              className={styles.bindingAddFriendLink}
              href={LINE_BOT_ADD_FRIEND_URL}
              target="_blank"
              rel="noreferrer"
            >
              先加入 LINE 官方帳號
            </a>
          </div>
          <ol className={styles.bindingSteps} aria-label="LINE Bot 綁定步驟">
            <li>1. 先加入上方 LINE 官方帳號</li>
            <li>2. 在 LINE 對它輸入「綁定」</li>
            <li>3. 複製 LINE 回覆的 6 位碼，貼到下方欄位</li>
          </ol>
          <div className={styles.bindingForm}>
            <label className={styles.bindingLabel}>
              <span className={styles.visuallyHidden}>LINE 綁定碼</span>
              <input
                ref={bindingInputRef}
                aria-label="LINE 綁定碼"
                value={bindingCode}
                onChange={(event) => setBindingCode(event.target.value.toUpperCase())}
                maxLength={6}
                className={styles.bindingInput}
                placeholder="輸入 6 位碼"
                data-testid="line-binding-input"
              />
            </label>
            <button
              type="button"
              className={styles.bindingButton}
              onClick={handleClaimBinding}
              data-testid="line-binding-submit"
            >
              貼上後綁定
            </button>
          </div>
          {bindingMessage && (
            <p className={styles.bindingMessage} data-testid="line-binding-message">
              {bindingMessage}
            </p>
          )}
        </section>

        {showWelcome && (
          <section className={styles.stitchOpening} aria-label="AI 教練引導">
            <div className={styles.coachAvatar} aria-hidden="true">
              ✦
            </div>
            <div className={styles.openingStack}>
              <div className={styles.modelBubble}>
                <p>早安。今天感覺如何？你可以只說一個詞，或描述身體現在最明顯的感覺。</p>
              </div>
              <div className={styles.modelBubble}>
                <p>我聽到了。焦慮在面對壓力時是很自然的情緒反應。它就像是一個警報系統，告訴我們有重要的事情需要處理。</p>
              </div>
              <div className={styles.modelBubble}>
                <p>我們試著先深呼吸幾次，把注意力帶回當下。你願意和我一起做個簡短的呼吸練習嗎？</p>
              </div>
              <div className={styles.quickReplies} aria-label="快速回覆">
                {QUICK_REPLIES.map((prompt) => (
                  <button
                    type="button"
                    key={prompt}
                    className={styles.quickReply}
                    onClick={() => handleQuickReply(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {visibleMessages.map((m) => (
          <ChatBubble key={m.id} message={m} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </main>

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

      <div className={styles.inputDock}>
        <ChatInput
          onSend={handleSend}
          onSOS={() => setShowSOS(true)}
          disabled={loading}
        />
      </div>

      <nav className={styles.bottomNav} aria-label="Coach 頁面導覽">
        <button type="button" onClick={() => handleNavigate('home')}>
          <span aria-hidden="true">♧</span>
          <span>今日心情</span>
        </button>
        <button type="button" onClick={() => handleNavigate('history')}>
          <span aria-hidden="true">≋</span>
          <span>記錄回顧</span>
        </button>
        <button type="button" className={styles.activeNav} aria-current="page">
          <span aria-hidden="true">✦</span>
          <span>教練</span>
        </button>
        <button type="button" onClick={() => handleNavigate('growth')}>
          <span aria-hidden="true">▥</span>
          <span>成長看板</span>
        </button>
      </nav>

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

      {showBreathing && (
        <div
          className={styles.breathingOverlay}
          onClick={() => setShowBreathing(false)}
        >
          <div
            className={styles.breathingCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.breathingOrb} />
            <p className={styles.breathingText}>
              {pendingAction?.reason || '跟著教練一起呼吸'}
            </p>
            <button
              onClick={() => setShowBreathing(false)}
              className={styles.breathingButton}
            >
              完成
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
