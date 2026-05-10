import { useState, useRef, useEffect } from 'react';
import { sendMessage } from '../lib/adk/client';
import type { CoachMessage } from '../lib/adk/types';
import { ChatBubble } from '../components/coach/ChatBubble';
import { ChatInput } from '../components/coach/ChatInput';
import { MetaMomentOverlay } from '../components/coach/MetaMomentOverlay';

const SESSION_ID = crypto.randomUUID();
const USER_ID = 'test-user'; // TODO: replace with auth user

export default function CoachPage() {
  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content:
        '你好，我是今心教練。我在這裡陪伴你，無論你現在的感受是什麼，都可以跟我說說。',
      timestamp: new Date().toISOString(),
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [showSOS, setShowSOS] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    const userMsg: CoachMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
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
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'model',
          content: '抱歉，我現在無法回應，請稍後再試。',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <header className="flex items-center justify-between px-4 py-3 border-b bg-white sticky top-0 z-10">
        <h1 className="text-lg font-semibold text-gray-800">今心教練</h1>
        <span className="text-xs text-gray-400">AI 陪伴你的情緒旅程</span>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>

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
