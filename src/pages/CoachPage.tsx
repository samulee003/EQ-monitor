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

type ErrorType = 'network' | 'api' | 'timeout';
type CoachView = 'home' | 'history' | 'growth' | 'achievement' | 'coach';

const QUICK_REPLIES = ['好的，一起試試', '我現在只想聊聊'];
const COACH_SCENARIOS = [
  {
    label: '我最近晚上都很焦慮',
    prompt: '我最近晚上都很焦慮，想請阿念陪我整理可能的模式和下一步。',
  },
  {
    label: '我剛對孩子發脾氣',
    prompt: '我剛對孩子發脾氣，現在有點後悔，也想知道接下來可以怎麼修復。',
  },
  {
    label: '我想看阿念觀察到什麼',
    prompt: '我想看阿念根據我最近的情緒線索觀察到什麼。',
  },
];

const COMPANION_GOALS = [
  '睡前焦慮少一點',
  '親子衝突後快一點回來',
  '每天做一個照顧自己的小動作',
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
  // TODO: Remove 'test-user' fallback once auth is fully wired for all users
  const userId = user?.id || 'test-user';

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
  }, [handleAction, userId]);

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

  const handleRetry = useCallback(() => {
    if (error) {
      setError(null);
      doSend(error.retryText, false);
    }
  }, [error, doSend]);

  const handleQuickReply = useCallback(
    (prompt: string) => {
      if (prompt === '好的，一起試試') {
        setPendingAction({ action: 'start_breathing', reason: '跟著阿念一起呼吸' });
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
    if (bindingSubmitting) return;

    const code = bindingCode.trim().toUpperCase();
    if (!code) {
      setBindingMessage('請輸入 LINE Bot 給你的綁定碼');
      return;
    }

    setBindingSubmitting(true);
    try {
      const result = await botSyncService.claimLineBinding(code, userId);
      if (result.error) {
        setBindingMessage(`綁定失敗：${result.error.message}`);
        return;
      }

      setBindingMessage(`已綁定 LINE Bot：${result.data.lineUserId}`);
      setBindingCode('');
    } finally {
      setBindingSubmitting(false);
    }
  }, [bindingCode, bindingSubmitting, userId]);

  const showWelcome = messages.length <= 1;
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
                <p className={styles.agentEyebrow}>阿念教練</p>
                <h2>你不用自己想下一步</h2>
                <p className={styles.agentDescription}>
                  我是阿念，會依你的情緒記錄、LINE 互動與當下訊息，陪你用知心四式：心照、喚名、安神、動念，慢慢整理出下一步。
                </p>
                <div className={styles.agentFeatureGrid} aria-label="阿念教練特色">
                  <div className={styles.agentFeature}>
                    <strong>主動提下一步</strong>
                    <span>聊天、記錄、呼吸或緊急安定，我會幫你判斷先做什麼。</span>
                  </div>
                  <div className={styles.agentFeature}>
                    <strong>串起 LINE 與 APP</strong>
                    <span>日常在 LINE 留下片段，回到 APP 就能看見脈絡。</span>
                  </div>
                  <div className={styles.agentFeature}>
                    <strong>越來越懂你</strong>
                    <span>把最近的情緒、強度與需求整理成更容易行動的提醒。</span>
                  </div>
                </div>
              </div>
              <div className={styles.modelBubble}>
                <p>你不需要先想好怎麼說。只要留下一句話，阿念會接住前後脈絡，判斷適合先聊天、記錄、呼吸，或打開緊急安定練習。</p>
              </div>
              <div className={styles.modelBubble}>
                <p>例如你說「我今天很焦慮」，我會先陪你釐清觸發點，再把它轉成可以完成的一小步。</p>
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
              <div className={styles.momentumPanel} aria-label="7 日小陪跑">
                <div className={styles.momentumHeader}>
                  <p>7 日小陪跑</p>
                  <h3>讓阿念推你前進一點點</h3>
                </div>
                <button
                  type="button"
                  className={styles.momentumPrimary}
                  onClick={() => handleStartCompanionRun('每天做一個照顧自己的小動作')}
                >
                  開始 7 日小陪跑
                </button>
                <div className={styles.momentumGoals}>
                  {COMPANION_GOALS.map((goal) => (
                    <button
                      type="button"
                      key={goal}
                      className={styles.momentumGoal}
                      onClick={() => handleStartCompanionRun(goal)}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
              </div>
              <div className={styles.scenarioPanel} aria-label="阿念教練情境入口">
                <p>你現在可能想找我做什麼</p>
                <div className={styles.scenarioGrid}>
                  {COACH_SCENARIOS.map(({ label, prompt }) => (
                    <button
                      type="button"
                      key={label}
                      className={styles.scenarioButton}
                      onClick={() => handleSend(prompt)}
                    >
                      {label}
                    </button>
                  ))}
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
        <EmergencyStabilizationOverlay
          onClose={() => setShowSOS(false)}
          onComplete={({ bestSelf, strategy }) => {
            setShowSOS(false);
            handleSend(
              `我完成了緊急安定練習。看見的自己是：${bestSelf}，選擇的策略是：${strategy}`
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
