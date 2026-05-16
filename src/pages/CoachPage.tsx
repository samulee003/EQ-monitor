import { useState, useRef, useEffect, useCallback } from 'react';
import { sendMessage } from '../lib/adk/client';
import { loadChatHistory, saveChatHistory } from '../lib/adk/storage';
import {
  type CoachMessage,
  type CoachAction,
  type CoachGamificationSummary,
  type CoachMicroAction,
  type CoachMicroActionProposal,
  type CoachMicroActionStatus,
} from '../lib/adk/types';
import { ChatBubble } from '../components/coach/ChatBubble';
import { ChatInput } from '../components/coach/ChatInput';
import { EmergencyStabilizationOverlay } from '../components/coach/EmergencyStabilizationOverlay';
import { GamificationStrip } from '../components/coach/GamificationStrip';
import { MicroActionCard } from '../components/coach/MicroActionCard';
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
    '你好，我是阿念教練。我會依你的情緒記錄、LINE 互動與當下訊息，慢慢看懂你的節奏，陪你整理下一步。',
  timestamp: new Date().toISOString(),
};

type ErrorType = 'network' | 'api' | 'timeout' | 'auth';
type CoachView = 'home' | 'history' | 'growth' | 'achievement' | 'coach';

const START_ACTIONS = [
  {
    label: '我現在很煩',
    prompt: '我現在很煩，先陪我整理一下。',
  },
  {
    label: '先做呼吸',
    action: 'breathing' as const,
  },
  {
    label: '開始 7 日陪跑',
    companionGoal: '每天做一個照顧自己的小動作',
  },
];

const TOOL_TRACE_NAMES = [
  'save_ruler_log',
  'get_user_emotion_summary',
  'get_emotion_trend',
  'trigger_action',
];

function getErrorMessage(type: ErrorType): string {
  switch (type) {
    case 'network':
      return '網路連線不穩定，請檢查後再試一次';
    case 'api':
      return '伺服器暫時忙碌，請稍後再試';
    case 'timeout':
      return '連線有點慢，請稍後再試';
    case 'auth':
      return '請先登入或註冊帳號，再使用阿念教練與 7 日小陪跑';
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

function sanitizeCoachResponse(content: string): string {
  const toolNamePattern = TOOL_TRACE_NAMES.join('|');
  const toolHeaderPattern = new RegExp(`\\[\\s*工具\\s*(?:${toolNamePattern})?\\s*結果\\s*\\]`);
  const sanitizedLines: string[] = [];
  let skippingToolPayload = false;
  let braceDepth = 0;

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (toolHeaderPattern.test(trimmed)) {
      skippingToolPayload = true;
      braceDepth = 0;
      continue;
    }

    if (skippingToolPayload) {
      const chars = [...trimmed];
      const opens = chars.filter((char) => char === '{' || char === '[').length;
      const closes = chars.filter((char) => char === '}' || char === ']').length;
      const looksLikePayload =
        trimmed === '' ||
        trimmed.startsWith('{') ||
        trimmed.startsWith('[') ||
        /^[}\]",]/.test(trimmed) ||
        braceDepth > 0;

      if (looksLikePayload) {
        braceDepth += opens - closes;
        if (braceDepth <= 0 && (trimmed.endsWith('}') || trimmed.endsWith(']'))) {
          skippingToolPayload = false;
        }
        continue;
      }

      skippingToolPayload = false;
    }

    sanitizedLines.push(line);
  }

  return sanitizedLines
    .join('\n')
    .replace(new RegExp(`\\b(?:${toolNamePattern})\\b`, 'g'), '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
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
      // SOS 由頁面內的 EmergencyStabilizationOverlay 處理
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
  const userId = user?.id ?? 'guest';
  const isSignedIn = Boolean(user?.id);

  const [messages, setMessages] = useState<CoachMessage[]>([WELCOME_MSG]);
  const [loading, setLoading] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ action: CoachAction; reason?: string } | null>(null);
  const [microActionProposal, setMicroActionProposal] = useState<CoachMicroActionProposal | null>(null);
  const [activeMicroAction, setActiveMicroAction] = useState<CoachMicroAction | null>(null);
  const [gamification, setGamification] = useState<CoachGamificationSummary | null>(null);
  const [error, setError] = useState<{ type: ErrorType; retryText: string } | null>(null);
  const [bindingCode, setBindingCode] = useState('');
  const [bindingMessage, setBindingMessage] = useState('');
  const [bindingSubmitting, setBindingSubmitting] = useState(false);
  const [showBindingSetup, setShowBindingSetup] = useState(false);
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
    if (messages.length > 1 || loading) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
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
    if (!isSignedIn) {
      setError({ type: 'auth', retryText: text });
      return;
    }

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
      setMicroActionProposal(res.microActionProposal ?? null);
      setActiveMicroAction(res.activeMicroAction ?? null);
      setGamification(res.gamification ?? null);

      const modelMsg: CoachMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        content: sanitizeCoachResponse(res.response),
        timestamp: new Date().toISOString(),
        metadata: {
          skillInvoked: res.skillInvoked,
          step: res.step,
          action: res.action,
          actionReason: res.actionReason,
          intent: res.intent,
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
  }, [handleAction, isSignedIn, userId]);

  const handleSend = useCallback(
    (text: string) => doSend(text, true),
    [doSend]
  );

  const handleStartCompanionRun = useCallback(
    (goal: string) => handleSend(`我想開始 7 日小陪跑：${goal}`),
    [handleSend]
  );

  const handleConfirmMicroAction = useCallback(
    (title: string) => {
      setMicroActionProposal(null);
      handleSend(`設為今天的小行動：${title}`);
    },
    [handleSend]
  );

  const handleRejectMicroAction = useCallback(() => {
    setMicroActionProposal(null);
    handleSend('先不要設小行動，我現在只想聊聊。');
  }, [handleSend]);

  const handleReportMicroAction = useCallback(
    (status: Extract<CoachMicroActionStatus, 'completed' | 'partial' | 'skipped'>) => {
      setActiveMicroAction(null);
      const reportText = {
        completed: '有做到',
        partial: '做了一半',
        skipped: '沒做到，但我回來了',
      }[status];
      handleSend(`小行動回報：${reportText}`);
    },
    [handleSend]
  );

  const handleSOSComplete = useCallback((result: { safeStep: string; strategy: string }) => {
    const safeStep = result.safeStep.trim() || '先待在安全的地方';
    const localMsg: CoachMessage = {
      id: crypto.randomUUID(),
      role: 'model',
      content:
        `安定練習先收在這裡。你剛剛選的是「${result.strategy}」，也提醒自己「${safeStep}」。接下來先照顧身體，不需要立刻分析；如果有立即危險，請先聯絡 119 或 110，或找身邊可信任的人陪你。`,
      timestamp: new Date().toISOString(),
      metadata: {
        skillInvoked: 'emergency_stabilization',
        action: 'local_sos_complete',
        actionReason: 'SOS completion stays local and does not call Coach API',
      },
    };
    setMessages((prev) => [...prev, localMsg]);
  }, []);

  const handleRetry = useCallback(() => {
    if (error) {
      setError(null);
      doSend(error.retryText, false);
    }
  }, [error, doSend]);

  const handleStartAction = useCallback(
    (item: typeof START_ACTIONS[number]) => {
      if (item.action === 'breathing') {
        setPendingAction({ action: 'start_breathing', reason: '跟著阿念一起呼吸' });
        setShowBreathing(true);
        return;
      }

      if (!isSignedIn) return;

      if (item.companionGoal) {
        handleStartCompanionRun(item.companionGoal);
        return;
      }

      if (item.prompt) {
        handleSend(item.prompt);
      }
    },
    [handleSend, handleStartCompanionRun, isSignedIn]
  );

  const handleNavigate = useCallback((view: CoachView) => {
    useAppStore.getState().setView(view);
  }, []);

  const handleClaimBinding = useCallback(async () => {
    if (bindingSubmitting) return;

    const code = bindingCode.trim().toUpperCase();
    if (!code) {
      setBindingMessage('請輸入 LINE Bot 給你的綁定碼');
      return;
    }
    if (!user?.id) {
      setBindingMessage('請先登入或註冊帳號，再綁定 LINE Bot');
      return;
    }

    setBindingSubmitting(true);
    try {
      const result = await botSyncService.claimLineBinding(code, user.id);
      if (result.error) {
        setBindingMessage(`綁定失敗：${result.error.message}`);
        return;
      }

      setBindingMessage(`已綁定 LINE Bot：${result.data.lineUserId}`);
      setBindingCode('');
    } finally {
      setBindingSubmitting(false);
    }
  }, [bindingCode, bindingSubmitting, user?.id]);

  const showWelcome = messages.length <= 1;
  const showBindingPanel = !showWelcome || showBindingSetup;
  const visibleMessages = showWelcome
    ? messages.filter((message) => message.id !== WELCOME_MSG.id)
    : messages;

  return (
    <div className={styles.coachPage} role="region" aria-label="阿念教練畫布">
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

        {showWelcome && (
          <section className={styles.stitchOpening} aria-label="阿念教練引導">
            <div className={styles.coachAvatar} aria-hidden="true">
              ✦
            </div>
            <div className={styles.openingStack}>
              <div className={styles.agentIntro}>
                <div className={styles.agentMeta}>
                  <p className={styles.agentEyebrow}>阿念教練</p>
                  <span className={styles.betaBadge} aria-label="Beta 內測版">Beta</span>
                </div>
                <h2>先說一句就好</h2>
                <p className={styles.agentDescription}>
                  不用整理完整。我會陪你把現在的感受，變成一個比較能承受的小下一步。
                </p>
                <p className={styles.betaNotice}>
                  內測中
                </p>
                {!isSignedIn && (
                  <div className={styles.guestGate} role="note">
                    <strong>登入後，阿念才能記住你的陪跑進度</strong>
                    <p>你仍然可以先做呼吸，或回到今日心情記一筆；要開始 7 日小陪跑時，再從右上角登入。</p>
                    <button
                      type="button"
                      className={styles.guestGateButton}
                      onClick={() => handleNavigate('home')}
                    >
                      回到今日心情登入
                    </button>
                  </div>
                )}
                <div className={styles.lineEntryRow} aria-label={`LINE 官方帳號 ${LINE_BOT_BASIC_ID}`}>
                  <span>也可以用 LINE 對話</span>
                  <strong>{LINE_BOT_BASIC_ID}</strong>
                </div>
                <a
                  className={styles.lineEntryLink}
                  href={LINE_BOT_ADD_FRIEND_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`加入 LINE 官方帳號 ${LINE_BOT_BASIC_ID}`}
                >
                  加入後輸入「綁定」
                </a>
                <button
                  type="button"
                  className={styles.lineCodeButton}
                  onClick={() => setShowBindingSetup(true)}
                >
                  我已有 6 位碼
                </button>
                <div className={styles.startActions} aria-label="阿念教練開始選項">
                  {START_ACTIONS.map((item) => {
                    const requiresSignIn = !item.action && !isSignedIn;
                    return (
                    <button
                      type="button"
                      key={item.label}
                      className={`${styles.startActionButton} ${requiresSignIn ? styles.startActionButtonLocked : ''}`}
                      onClick={() => handleStartAction(item)}
                      disabled={requiresSignIn}
                    >
                      {item.label}
                    </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {visibleMessages.map((m) => (
          <ChatBubble key={m.id} message={m} />
        ))}

        <GamificationStrip summary={gamification} />
        <MicroActionCard
          proposal={microActionProposal}
          activeAction={activeMicroAction}
          onConfirmProposal={handleConfirmMicroAction}
          onRejectProposal={handleRejectMicroAction}
          onReportAction={handleReportMicroAction}
        />

        {showBindingPanel && (
        <section className={styles.bindingPanel} aria-label="LINE Bot 綁定" data-testid="line-binding-panel">
          <div>
            <p className={styles.bindingTitle}>把 LINE 變成日常入口</p>
            <p className={styles.bindingHint}>先加入下方 LINE 官方帳號，對它輸入「綁定」，再把 6 位碼貼到這裡。之後你在 LINE 留下的覺察，也會成為阿念理解你的線索。</p>
          </div>
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
                data-testid="line-binding-input"
                disabled={bindingSubmitting}
              />
            </label>
            <button
              type="button"
              className={styles.bindingButton}
              onClick={handleClaimBinding}
              data-testid="line-binding-submit"
              disabled={bindingSubmitting}
            >
              {bindingSubmitting ? '綁定中...' : '綁定'}
            </button>
          </div>
          {bindingMessage && (
            <p className={styles.bindingMessage} data-testid="line-binding-message">
              {bindingMessage}
            </p>
          )}
        </section>
        )}

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
          messageDisabled={!isSignedIn}
          placeholder={isSignedIn ? '告訴我你的感受...' : '登入後可以和阿念對話'}
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
          <span className={styles.navLabelWithBeta}>
            教練
            <span className={styles.navBetaBadge} aria-label="Beta 內測版">Beta</span>
          </span>
        </button>
        <button type="button" onClick={() => handleNavigate('growth')}>
          <span aria-hidden="true">▥</span>
          <span>成長看板</span>
        </button>
      </nav>

      {showSOS && (
        <EmergencyStabilizationOverlay
          onClose={() => setShowSOS(false)}
          onComplete={(result) => {
            setShowSOS(false);
            handleSOSComplete(result);
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
              {pendingAction?.reason || '跟著阿念一起呼吸'}
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
