import { useState, useRef, useEffect, useCallback } from 'react';
import { sendMessage } from '../lib/adk/client';
import { loadChatHistory, saveChatHistory } from '../lib/adk/storage';
import type { CoachMessage } from '../lib/adk/types';
import { ChatBubble } from '../components/coach/ChatBubble';
import { ChatInput } from '../components/coach/ChatInput';
import { MetaMomentOverlay } from '../components/coach/MetaMomentOverlay';
import { TypingIndicator } from '../components/coach/TypingIndicator';
import { WelcomeCard } from '../components/coach/WelcomeCard';

const SESSION_ID = crypto.randomUUID();
const USER_ID = 'test-user'; // TODO: replace with auth user

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
  const [messages, setMessages] = useState<CoachMessage[]>([WELCOME_MSG]);
  const [loading, setLoading] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const [error, setError] = useState<{ type: ErrorType; retryText: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

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
        userId: USER_ID,
        sessionId: SESSION_ID,
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
    <div
      className="flex flex-col bg-white"
      style={{ height: '100dvh' }}
    >
      <header className="flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-gray-800">今心教練</h1>
        <span className="text-xs text-gray-400">AI 陪伴你的情緒旅程</span>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {showWelcome && <WelcomeCard onPromptClick={handlePromptClick} />}
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-100 flex items-center justify-between gap-3">
          <span className="text-sm text-red-700 flex-1">
            {getErrorMessage(error.type)}
          </span>
          <button
            onClick={handleRetry}
            className="text-sm px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition whitespace-nowrap"
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
