# Agentic Emotion Coach — Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:dispatching-parallel-agents. Steps use checkbox syntax.

**Goal:** Deliver AI coach chat + 緊急安定練習 SOS in the 今心 APP by end of day.

**Architecture:** Frontend `/coach` page calls Edge Function `/api/coach`, which runs Google ADK JS agent. Agent reads user history via InsForge DB tool and can invoke 緊急安定練習 skill for crisis intervention.

**Tech Stack:** React 19 + TS + Vite, Google ADK JS v1.0.0, InsForge Edge Functions (Deno), Tailwind 3.4.

---

## File Structure

| File | Type | Responsibility |
|---|---|---|
| `src/pages/CoachPage.tsx` | Create | Main chat UI with SOS button |
| `src/components/coach/ChatBubble.tsx` | Create | Message bubble component |
| `src/components/coach/ChatInput.tsx` | Create | Input + send button |
| `src/components/coach/EmergencyStabilizationOverlay.tsx` | Create | 4-step SOS wizard overlay |
| `src/components/coach/BreathingAnimation.tsx` | Create | Circle breathing animation |
| `src/lib/adk/client.ts` | Create | Frontend client calling `/api/coach` |
| `src/lib/adk/types.ts` | Create | TypeScript types for coach API |
| `server/insforge/functions/coach.ts` | Create | Edge Function: ADK Runner endpoint |
| `server/insforge/agents/emotionCoach.ts` | Create | EmotionCoachAgent definition |
| `server/insforge/agents/skills/emergencyStabilization.ts` | Create | Internal emergency stabilization skill definition |
| `server/insforge/agents/tools/rulerData.ts` | Create | RulerDataTool (InsForge DB query) |
| `server/insforge/agents/runner.ts` | Create | ADK Runner setup |
| `src/App.tsx` | Modify | Add `/coach` route |

---

## Task 1: Frontend — Coach Chat UI

**Files:**
- Create: `src/lib/adk/types.ts`
- Create: `src/lib/adk/client.ts`
- Create: `src/components/coach/ChatBubble.tsx`
- Create: `src/components/coach/ChatInput.tsx`
- Create: `src/pages/CoachPage.tsx`
- Modify: `src/App.tsx`

### Step 1.1: Write types

`src/lib/adk/types.ts`:
```typescript
export interface CoachMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  metadata?: {
    skillInvoked?: string;
    step?: number;
    emotions?: string[];
  };
}

export interface CoachRequest {
  message: string;
  userId: string;
  sessionId: string;
}

export interface CoachResponse {
  response: string;
  skillInvoked?: string;
  step?: number;
  metadata?: {
    emotions_detected?: string[];
    suggested_intensity?: number;
  };
}
```

### Step 1.2: Write frontend client

`src/lib/adk/client.ts`:
```typescript
import type { CoachRequest, CoachResponse } from './types';

const COACH_API_URL = import.meta.env.VITE_COACH_API_URL || '/api/coach';

export async function sendMessage(req: CoachRequest): Promise<CoachResponse> {
  const res = await fetch(COACH_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Coach API error: ${res.status}`);
  return res.json();
}
```

### Step 1.3: Write ChatBubble

`src/components/coach/ChatBubble.tsx`:
```typescript
import type { CoachMessage } from '../../lib/adk/types';

interface Props {
  message: CoachMessage;
}

export function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
        }`}
      >
        {message.content}
        {message.metadata?.skillInvoked && (
          <div className="mt-1 text-xs opacity-70">
            🛟 {message.metadata.skillInvoked}
          </div>
        )}
      </div>
    </div>
  );
}
```

### Step 1.4: Write ChatInput

`src/components/coach/ChatInput.tsx`:
```typescript
import { useState } from 'react';

interface Props {
  onSend: (text: string) => void;
  onSOS: () => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, onSOS, disabled }: Props) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4 border-t bg-white">
      <button
        type="button"
        onClick={onSOS}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500 text-white font-bold hover:bg-red-600 transition"
        title="SOS 緊急協助"
      >
        🆘
      </button>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="跟今心教練說說話..."
        disabled={disabled}
        className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="flex-shrink-0 rounded-full bg-blue-600 text-white px-4 py-2 text-sm font-medium disabled:opacity-50 hover:bg-blue-700 transition"
      >
        送出
      </button>
    </form>
  );
}
```

### Step 1.5: Write CoachPage

`src/pages/CoachPage.tsx`:
```typescript
import { useState, useRef, useEffect } from 'react';
import { sendMessage } from '../lib/adk/client';
import type { CoachMessage } from '../lib/adk/types';
import { ChatBubble } from '../components/coach/ChatBubble';
import { ChatInput } from '../components/coach/ChatInput';
import { EmergencyStabilizationOverlay } from '../components/coach/EmergencyStabilizationOverlay';
import { v4 as uuidv4 } from 'uuid';

const SESSION_ID = uuidv4();
const USER_ID = 'test-user'; // TODO: replace with auth user

export default function CoachPage() {
  const [messages, setMessages] = useState<CoachMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: '你好，我是今心教練。我在這裡陪伴你，無論你現在的感受是什麼，都可以跟我說說。',
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
      id: uuidv4(),
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
        id: uuidv4(),
        role: 'model',
        content: res.response,
        timestamp: new Date().toISOString(),
        metadata: res.metadata,
      };
      setMessages((prev) => [...prev, modelMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: uuidv4(),
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

      <ChatInput onSend={handleSend} onSOS={() => setShowSOS(true)} disabled={loading} />

      {showSOS && (
        <EmergencyStabilizationOverlay onClose={() => setShowSOS(false)} onComplete={(strategy) => {
          setShowSOS(false);
          handleSend(`我完成了 緊急安定練習，選擇的策略是：${strategy}`);
        }} />
      )}
    </div>
  );
}
```

### Step 1.6: Add route to App.tsx

In `src/App.tsx`, add:
```typescript
import CoachPage from './pages/CoachPage';
```
And in the router/routes:
```typescript
<Route path="/coach" element={<CoachPage />} />
```

Verify: `npm run test:run` should still pass (only existing tests).

---

## Task 2: Frontend — 緊急安定練習 SOS Overlay

**Files:**
- Create: `src/components/coach/EmergencyStabilizationOverlay.tsx`
- Create: `src/components/coach/BreathingAnimation.tsx`

### Step 2.1: Write BreathingAnimation

`src/components/coach/BreathingAnimation.tsx`:
```typescript
import { useState, useEffect } from 'react';

export function BreathingAnimation() {
  const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [count, setCount] = useState(4);

  useEffect(() => {
    const cycle = [
      { phase: 'inhale' as const, duration: 4000, text: '吸氣...' },
      { phase: 'hold' as const, duration: 7000, text: '屏息...' },
      { phase: 'exhale' as const, duration: 8000, text: '吐氣...' },
    ];
    let idx = 0;
    let timer: number;

    const run = () => {
      const step = cycle[idx];
      setPhase(step.phase);
      setCount(step.duration / 1000);
      timer = window.setTimeout(() => {
        idx = (idx + 1) % cycle.length;
        run();
      }, step.duration);
    };
    run();

    const countInterval = window.setInterval(() => {
      setCount((c) => (c > 1 ? c - 1 : c));
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(countInterval);
    };
  }, []);

  const scale = phase === 'inhale' ? 'scale-150' : phase === 'hold' ? 'scale-150' : 'scale-100';

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div
        className={`w-32 h-32 rounded-full bg-blue-400 opacity-60 transition-transform duration-[4000ms] ease-in-out ${scale}`}
      />
      <p className="text-lg font-medium text-blue-700">
        {phase === 'inhale' ? '吸氣' : phase === 'hold' ? '屏息' : '吐氣'} ({count})
      </p>
    </div>
  );
}
```

### Step 2.2: Write EmergencyStabilizationOverlay

`src/components/coach/EmergencyStabilizationOverlay.tsx`:
```typescript
import { useState } from 'react';
import { BreathingAnimation } from './BreathingAnimation';

interface Props {
  onClose: () => void;
  onComplete: (strategy: string) => void;
}

const STEPS = [
  {
    title: 'Step 1: 感知 (Sense)',
    content: '先暫停一下，感受一下你的身體。你的心跳如何？肩膀緊嗎？肚子有什麼感覺？',
  },
  {
    title: 'Step 2: 暫停 (Stop)',
    content: '讓我們一起深呼吸，給情緒一些空間。',
  },
  {
    title: 'Step 3: 看見最好的自己',
    content: '想一想，當你處於最好的狀態時，你是什麼樣子？充滿耐心？冷靜？有同理心？',
  },
  {
    title: 'Step 4: 策略與行動',
    content: '選擇一個策略來幫助你回到平衡：',
  },
];

const STRATEGIES = [
  '繼續深呼吸 1 分鐘',
  '去外面散步 5 分鐘',
  '喝一杯水',
  '寫下現在的感受',
  '打給我的「馬文叔叔」',
];

export function EmergencyStabilizationOverlay({ onClose, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [bestSelf, setBestSelf] = useState('');

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h2 className="text-lg font-bold text-red-600">🆘 緊急安定練習 緊急協助</h2>
        <button onClick={onClose} className="text-gray-500 text-2xl">&times;</button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-2 text-sm text-gray-400">{STEPS[step].title}</div>
        <p className="text-lg text-gray-800 mb-8 max-w-md">{STEPS[step].content}</p>

        {step === 1 && <BreathingAnimation />}

        {step === 2 && (
          <input
            type="text"
            value={bestSelf}
            onChange={(e) => setBestSelf(e.target.value)}
            placeholder="例如：冷靜、有耐心"
            className="w-full max-w-xs border rounded-lg px-4 py-2 text-center"
          />
        )}

        {step === 3 && (
          <div className="flex flex-col gap-3 w-full max-w-xs">
            {STRATEGIES.map((s) => (
              <button
                key={s}
                onClick={() => onComplete(s)}
                className="px-4 py-3 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition text-left"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      {step < 3 && (
        <div className="p-4">
          <button
            onClick={handleNext}
            className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            {step === 0 ? '我準備好了，開始呼吸' : step === 1 ? '呼吸完成' : '下一步'}
          </button>
        </div>
      )}
    </div>
  );
}
```

Verify: Visually inspect `/coach` page in browser. SOS button should open overlay.

---

## Task 3: Backend — ADK Edge Function

**Files:**
- Create: `server/insforge/agents/tools/rulerData.ts`
- Create: `server/insforge/agents/skills/emergencyStabilization.ts`
- Create: `server/insforge/agents/emotionCoach.ts`
- Create: `server/insforge/agents/runner.ts`
- Create: `server/insforge/functions/coach.ts`

### Step 3.1: Install ADK JS

```bash
npm install @google/adk@latest
```

### Step 3.2: Write RulerDataTool

`server/insforge/agents/tools/rulerData.ts`:
```typescript
import { createClient } from 'npm:@insforge/sdk';

const client = createClient({
  baseUrl: Deno.env.get('INSFORGE_URL')!,
  anonKey: Deno.env.get('SERVICE_ROLE_KEY')!,
});

export async function getUserEmotionSummary(userId: string) {
  const { data: logs } = await client.database
    .from('ruler_logs')
    .select('emotions, intensity, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  const { data: streak } = await client.database
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  return {
    recentLogs: logs ?? [],
    streak: streak ?? { current_streak: 0, total_logs: 0 },
  };
}
```

### Step 3.3: Write internal emergency stabilization skill

`server/insforge/agents/skills/emergencyStabilization.ts`:
```typescript
import { LlmAgent } from '@google/adk';

export const emergencyStabilizationSkill = new LlmAgent({
  name: 'InternalStabilizationSkill',
  description: 'Emergency emotional regulation using the 4-step 緊急安定練習 protocol.',
  instruction: `
    You are the 緊急安定練習 emergency skill. Guide the user through 4 steps:
    
    Step 1 - Sense: Ask the user to notice physical sensations (heartbeat, tension, stomach).
    Step 2 - Stop: Guide deep breathing (4-7-8 pattern). Count with them.
    Step 3 - Best Self: Ask them to recall their ideal self qualities (patient, calm, empathetic).
    Step 4 - Strategize: Offer concrete actions (continue breathing, take a walk, drink water, journal, call someone).
    
    Always proceed step by step. Never skip. Confirm readiness before advancing.
    Respond in Traditional Chinese (zh-TW).
  `,
});
```

### Step 3.4: Write EmotionCoachAgent

`server/insforge/agents/emotionCoach.ts`:
```typescript
import { LlmAgent } from '@google/adk';
import { emergencyStabilizationSkill } from './skills/emergencyStabilization';

export const emotionCoachAgent = new LlmAgent({
  name: 'EmotionCoachAgent',
  description: 'A compassionate emotional regulation coach based on 今心四步 framework.',
  instruction: `
    You are a compassionate emotional regulation coach trained in 今心四步:
    看見、命名、安放、回應.
    The method is RULER 啟發, ACT-informed, IFS-informed, and Dan Siegel-informed,
    but it does not use the RULER five-letter sequence as the user-facing flow.
    
    Communication style:
    - Warm, non-judgmental, validating
    - Use Traditional Chinese (zh-TW)
    - Ask open-ended questions
    - Never dismiss feelings
    
    When the user is in crisis or highly distressed, transfer to the internal stabilization skill.
    Otherwise, engage in supportive dialogue.
    
    You have access to the user's emotion history via tools.
  `,
  tools: [], // rulerDataTool will be injected at runtime
  subAgents: [emergencyStabilizationSkill],
});
```

### Step 3.5: Write Runner

`server/insforge/agents/runner.ts`:
```typescript
import { Runner } from '@google/adk';
import { emotionCoachAgent } from './emotionCoach';

export async function runCoach(userMessage: string, userId: string) {
  const runner = new Runner(emotionCoachAgent);
  // TODO: inject userId into context for tool access
  const result = await runner.run(userMessage);
  return {
    response: result.text ?? '抱歉，我無法回應。',
    skillInvoked: result.events?.find((e) => e.author === 'InternalStabilizationSkill') ? 'emergency_stabilization' : undefined,
  };
}
```

### Step 3.6: Write Edge Function

`server/insforge/functions/coach.ts`:
```typescript
import { runCoach } from '../agents/runner';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { message, userId } = body;

    if (!message || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing message or userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await runCoach(message, userId);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
```

Verify: Edge Function can be deployed via InsForge CLI.

---

## Task 4: Integration & Environment

### Step 4.1: Add env variables

`.env.example`:
```
VITE_INSFORGE_URL=https://b88egxiz.ap-southeast.insforge.app
VITE_COACH_API_URL=/api/coach
```

### Step 4.2: Navigation link

Add a floating or nav link to `/coach` from the main app homepage.

---

## Parallel Dispatch Plan

3 independent agent tracks:

1. **Frontend Agent** → Tasks 1 & 2 (CoachPage + Chat components + EmergencyStabilizationOverlay)
2. **Backend Agent** → Task 3 (ADK Agent + Skills + Edge Function)
3. **Integration Agent** → Task 4 (env vars + routing + navigation)

Tracks 1 & 2 can run in parallel. Track 3 waits for both.
