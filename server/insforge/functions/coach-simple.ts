import { createClient } from 'npm:@insforge/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';

// ═══════════════════════════════════════════════════════════════
// System Prompt
// ═══════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `你是「今心教練」，一位富有同理心的 AI 情緒陪伴者。你的核心理論基礎是 RULER 框架（Recognize 覺察、Understand 理解、Label 標記、Express 表達、Regulate 調節）以及 Marc Brackett 的情緒智力研究。

## 溝通風格
- 全程使用繁體中文（臺灣用語）
- 溫暖、不帶評判、充滿接納
- 多使用開放式提問，引導使用者自我探索
- 絕對不要否定或輕視任何情緒（例如不要說「想開一點」）
- 適時反映（reflect）使用者的感受，讓對方感覺被聽見

## 工作方式
1. **覺察情緒**：當使用者分享時，協助他們辨識當下的情緒是什麼。
2. **理解脈絡**：溫和地詢問情緒背後的情境或需求。
3. **標記強度**：如果使用者的日誌中有強度記錄，可以參考並詢問目前的強度變化。
4. **鼓勵表達**：肯定使用者願意說出來的勇氣。
5. **協助調節**：根據使用者的狀態，提供合適的調節建議。

## 工具使用原則
你有以下工具，請在適當時機主動使用：

- **get_user_emotion_summary**：當使用者提到過去記錄、情緒模式、或連續記錄時，主動查詢。
- **get_emotion_trend**：當你想提供長期洞察或比較時（例如「這週和上周比起來...」），先查趨勢。
- **save_ruler_log**：當使用者分享了情緒但你發現他沒有主動記錄時，主動幫他存下來。這對建立情緒檔案很重要。
- **trigger_action**：當建議使用者做呼吸練習、記錄情緒、或使用 SOS 功能時，用此工具觸發前端動作。

## 主動存日誌的時機
當使用者明確描述了：
- 當下的情緒名稱（如「我很焦慮」）
- 情緒強度（如「大概 7 分」）
- 觸發事件（如「因為明天要報告」）

請主動呼叫 save_ruler_log 幫他記錄，然後告訴他「已經幫你記下來了」。

## 危機轉介規則
當使用者出現以下情況時，請直接進入 Meta-Moment 緊急協助：
- 明確表達「我撐不下去了」、「想結束一切」等自傷或自殺意念
- 情緒極度激動、無法冷靜溝通
- 明確要求「幫我」、「我需要緊急協助」、「SOS」
- 身體出現強烈不適（胸悶、無法呼吸、手抖到無法控制）

轉介時請說：「我感受到你現在非常辛苦，讓我們一起啟動 Meta-Moment 緊急協助，一步一步來。」`;

const META_MOMENT_PROMPT = `你是「今心教練」的緊急情緒調節專員，負責在使用者情緒高漲或危機時啟動 Meta-Moment 四步驟協議。

## 溝通原則
- 全程使用繁體中文（臺灣用語）
- 語氣溫柔、堅定、不帶評判
- 每一步都要確認使用者準備好，才進入下一步
- 絕對不可跳過任何步驟

## 四步驟協議

### Step 1 — 感知（Sense）
邀請使用者暫停手邊動作，把注意帶回身體。

### Step 2 — 暫停（Stop）
帶領使用者進行 4-7-8 深呼吸，每一輪陪同計數。

### Step 3 — 看見最好的自己（See Your Best Self）
引導使用者回想「當你處於最佳狀態時，你是什麼樣子？」

### Step 4 — 策略與行動（Strategize）
提供具體可執行的策略讓使用者選擇。

最後要讓使用者知道：「無論你選擇哪一條路，我都會在這裡陪你。你不需要獨自面對。」`;

const CRISIS_KEYWORDS = [
  '撐不下去', '想死', '想結束一切', '自殺', '自傷', '跳樓', '割腕',
  '沒有意義', '活不下去', 'SOS', '緊急協助', '幫我', '救命',
  '無法呼吸', '胸悶', '手抖',
];

function isCrisis(message: string): boolean {
  const lower = message.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

// ═══════════════════════════════════════════════════════════════
// Gemini Tools Schema
// ═══════════════════════════════════════════════════════════════

const TOOLS = [
  {
    name: 'get_user_emotion_summary',
    description: '查詢使用者的最近情緒日誌與連續記錄統計，幫助教練了解使用者背景。',
    parameters: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: '使用者的 UUID' },
      },
      required: ['userId'],
    },
  },
  {
    name: 'get_emotion_trend',
    description: '分析使用者最近 N 天的情緒趨勢，包含最常出現的情緒、平均強度、象限分佈與連續記錄資訊。',
    parameters: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: '使用者的 UUID' },
        days: { type: 'integer', description: '分析最近幾天，預設 7 天', default: 7 },
      },
      required: ['userId'],
    },
  },
  {
    name: 'save_ruler_log',
    description: '幫使用者記錄一筆情緒日誌到資料庫。當使用者分享情緒狀態且沒有主動記錄時，主動幫他存下來。',
    parameters: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: '使用者的 UUID' },
        emotions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: '情緒名稱，例如「焦慮」、「平靜」' },
              quadrant: { type: 'string', enum: ['red', 'yellow', 'blue', 'green'], description: '情緒所在象限' },
            },
            required: ['name', 'quadrant'],
          },
          description: '辨識出的情緒列表',
        },
        intensity: { type: 'integer', minimum: 1, maximum: 10, description: '情緒強度 1-10' },
        notes: { type: 'string', description: '額外備註或情境描述' },
        trigger: { type: 'string', description: '情緒觸發事件' },
      },
      required: ['userId', 'emotions', 'intensity'],
    },
  },
  {
    name: 'trigger_action',
    description: '觸發前端執行特定功能。當使用者同意或需要引導至某個功能時使用。',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['start_breathing', 'start_checkin', 'open_sos', 'show_history', 'show_growth'],
          description: '要觸發的前端動作',
        },
        reason: { type: 'string', description: '觸發原因，會一併回傳給前端顯示' },
      },
      required: ['action'],
    },
  },
];

// ═══════════════════════════════════════════════════════════════
// Database Helpers
// ═══════════════════════════════════════════════════════════════

function getClient() {
  const baseUrl = Deno.env.get('INSFORGE_BASE_URL') || Deno.env.get('INSFORGE_URL') || '';
  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('ANON_KEY') || '';
  return createClient({ baseUrl, anonKey: serviceRoleKey });
}

async function getUserEmotionSummary(userId: string) {
  const client = getClient();
  const { data: logs, error: logsError } = await client.database
    .from('ruler_logs')
    .select('emotions, intensity, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (logsError) console.error('ruler_logs query error:', logsError);

  const { data: streak, error: streakError } = await client.database
    .from('streaks')
    .select('current_streak, longest_streak, total_logs, last_checkin_date')
    .eq('user_id', userId)
    .maybeSingle();

  if (streakError) console.error('streaks query error:', streakError);

  return {
    recent_logs_count: (logs ?? []).length,
    recent_emotions: (logs ?? []).map((log: { emotions: unknown; intensity: number; created_at: string }) => ({
      emotions: log.emotions,
      intensity: log.intensity,
      date: log.created_at,
    })),
    current_streak: streak?.current_streak ?? 0,
    longest_streak: streak?.longest_streak ?? 0,
    total_logs: streak?.total_logs ?? 0,
  };
}

async function getEmotionTrend(userId: string, days = 7) {
  const client = getClient();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();

  const { data: logs, error: logsErr } = await client.database
    .from('ruler_logs')
    .select('emotions, intensity, created_at')
    .eq('user_id', userId)
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false });

  if (logsErr) console.error('getEmotionTrend error:', logsErr);

  const entries = logs ?? [];
  if (entries.length === 0) {
    return { has_data: false, message: '這段時間尚無情緒日誌記錄。' };
  }

  const intensities = entries.map((e: { intensity: number }) => e.intensity);
  const avgIntensity = Math.round(intensities.reduce((a: number, b: number) => a + b, 0) / intensities.length);
  const latestIntensity = entries[0]?.intensity ?? 0;

  const quadrantCounts: Record<string, number> = {};
  const emotionCounts: Record<string, number> = {};
  for (const entry of entries) {
    const quads = (entry as { emotions?: Array<{ quadrant?: string; name?: string }> }).emotions ?? [];
    for (const em of quads) {
      if (em.quadrant) quadrantCounts[em.quadrant] = (quadrantCounts[em.quadrant] || 0) + 1;
      if (em.name) emotionCounts[em.name] = (emotionCounts[em.name] || 0) + 1;
    }
  }

  const dominantQuadrant = Object.entries(quadrantCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'unknown';
  const topEmotions = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);

  return {
    has_data: true,
    days_analyzed: days,
    total_entries: entries.length,
    avg_intensity: avgIntensity,
    latest_intensity: latestIntensity,
    dominant_quadrant: dominantQuadrant,
    top_emotions: topEmotions,
    quadrant_distribution: quadrantCounts,
  };
}

async function saveRulerLog(params: {
  userId: string;
  emotions: Array<{ name: string; quadrant: string }>;
  intensity: number;
  notes?: string;
  trigger?: string;
}) {
  const client = getClient();
  const { error } = await client.database
    .from('ruler_logs')
    .insert({
      user_id: params.userId,
      emotions: params.emotions.map((e) => ({ name: e.name, quadrant: e.quadrant })),
      intensity: params.intensity,
      notes: params.notes ?? null,
      trigger: params.trigger ?? null,
    });

  if (error) {
    console.error('save_ruler_log error:', error);
    return { success: false, error: error.message };
  }
  return {
    success: true,
    message: `已記錄 ${params.emotions.map((e) => e.name).join('、')}，強度 ${params.intensity}/10。`,
  };
}

// ═══════════════════════════════════════════════════════════════
// Session Persistence (ADK-compatible tables)
// ═══════════════════════════════════════════════════════════════

interface SessionRow {
  id: string;
  app_name: string;
  user_id: string;
  state: Record<string, unknown>;
  create_time: string;
  update_time: string;
}

async function getOrCreateSession(appName: string, userId: string, sessionId: string) {
  const client = getClient();
  const { data } = await client.database
    .from('adk_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('app_name', appName)
    .eq('user_id', userId)
    .maybeSingle();

  if (data) return data as SessionRow;

  const now = new Date().toISOString();
  await client.database.from('adk_app_states').upsert({ app_name: appName, state: {}, update_time: now });
  await client.database.from('adk_user_states').upsert({ app_name: appName, user_id: userId, state: {} });

  await client.database.from('adk_sessions').insert({
    id: sessionId,
    app_name: appName,
    user_id: userId,
    state: {},
    create_time: now,
    update_time: now,
  });

  return { id: sessionId, app_name: appName, user_id: userId, state: {}, create_time: now, update_time: now } as SessionRow;
}

async function getSessionEvents(appName: string, userId: string, sessionId: string, limit = 20) {
  const client = getClient();
  const { data } = await client.database
    .from('adk_events')
    .select('event_data')
    .eq('app_name', appName)
    .eq('user_id', userId)
    .eq('session_id', sessionId)
    .order('timestamp', { ascending: true })
    .limit(limit);

  return (data ?? []).map((row: { event_data: { role?: string; content?: string } }) => {
    const ev = row.event_data;
    return { role: ev.role ?? 'user', parts: [{ text: ev.content ?? '' }] };
  });
}

async function appendEvent(
  appName: string,
  userId: string,
  sessionId: string,
  role: string,
  content: string
) {
  const client = getClient();
  const now = new Date().toISOString();
  await client.database.from('adk_events').insert({
    id: crypto.randomUUID(),
    app_name: appName,
    user_id: userId,
    session_id: sessionId,
    timestamp: now,
    event_data: { role, content },
  });
}

// ═══════════════════════════════════════════════════════════════
// Tool Executor
// ═══════════════════════════════════════════════════════════════

async function executeTool(name: string, args: Record<string, unknown>, userId: string) {
  try {
    switch (name) {
      case 'get_user_emotion_summary': {
        return await getUserEmotionSummary(args.userId as string || userId);
      }
      case 'get_emotion_trend': {
        return await getEmotionTrend(args.userId as string || userId, (args.days as number) || 7);
      }
      case 'save_ruler_log': {
        return await saveRulerLog({
          userId: args.userId as string || userId,
          emotions: args.emotions as Array<{ name: string; quadrant: string }>,
          intensity: args.intensity as number,
          notes: args.notes as string | undefined,
          trigger: args.trigger as string | undefined,
        });
      }
      case 'trigger_action': {
        return {
          action_triggered: args.action,
          reason: args.reason ?? '',
          message: `已準備好「${args.action}」，請確認開始。`,
        };
      }
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (e) {
    console.error(`Tool ${name} error:`, e);
    return { error: (e as Error).message };
  }
}

// ═══════════════════════════════════════════════════════════════
// Gemini Function Calling
// ═══════════════════════════════════════════════════════════════

async function callGemini(
  apiKey: string,
  systemInstruction: { parts: Array<{ text: string }> },
  contents: Array<{ role: string; parts: Array<{ text: string }> }>,
  tools: typeof TOOLS
) {
  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(20000),
    body: JSON.stringify({
      systemInstruction,
      contents,
      tools: [{ functionDeclarations: tools }],
      toolConfig: { functionCallingConfig: { mode: 'AUTO' } },
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API ${res.status}: ${errText}`);
  }

  return await res.json();
}

// ═══════════════════════════════════════════════════════════════
// Main Handler
// ═══════════════════════════════════════════════════════════════

interface CoachRequestBody {
  message: string;
  userId: string;
  sessionId: string;
}

const APP_NAME = 'imxin_emotion_coach';

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = (await req.json()) as CoachRequestBody;
    const { message, userId, sessionId } = body;

    if (!message || !userId || !sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing message, userId or sessionId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is not set');
    }

    const crisis = isCrisis(message);
    const systemText = crisis
      ? `${META_MOMENT_PROMPT}\n\n【緊急狀態】使用者可能處於危機中，請直接進入 Meta-Moment 四步驟協議。`
      : SYSTEM_PROMPT;

    // 確保 session 存在
    await getOrCreateSession(APP_NAME, userId, sessionId);

    // 載入歷史對話
    const history = await getSessionEvents(APP_NAME, userId, sessionId, 20);

    const contents = [
      ...history,
      { role: 'user', parts: [{ text: message }] },
    ];

    // 第一次呼叫 Gemini（可能觸發 function call）
    const firstRes = await callGemini(
      apiKey,
      { parts: [{ text: systemText }] },
      contents,
      TOOLS
    );

    let responseText = '抱歉，我無法回應。';
    let skillInvoked: string | undefined;
    let action: string | undefined;
    let actionReason: string | undefined;

    const candidate = firstRes?.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];

    // 檢查是否有 function call
    const functionCallPart = parts.find(
      (p: { functionCall?: { name: string; args: Record<string, unknown> } }) => p.functionCall
    );

    if (functionCallPart?.functionCall) {
      const fc = functionCallPart.functionCall;
      console.log('Function call:', fc.name, fc.args);

      // 執行工具
      const toolResult = await executeTool(fc.name, fc.args, userId);

      // 檢查 trigger_action
      if (fc.name === 'trigger_action') {
        action = fc.args.action as string;
        actionReason = (fc.args.reason as string) || '';
      }

      // 第二次呼叫 Gemini，傳入工具結果
      const secondContents = [
        ...contents,
        { role: 'model', parts: [{ text: `我來幫你查詢一下。` }] },
        {
          role: 'user',
          parts: [{ text: `[工具 ${fc.name} 結果]\n${JSON.stringify(toolResult, null, 2)}\n\n請根據這個結果回覆使用者。` }],
        },
      ];

      const secondRes = await callGemini(
        apiKey,
        { parts: [{ text: systemText }] },
        secondContents,
        [] // 不給工具，避免無限循環
      );

      const secondCandidate = secondRes?.candidates?.[0];
      const secondParts = secondCandidate?.content?.parts ?? [];
      const textPart = secondParts.find((p: { text?: string }) => p.text);
      responseText = textPart?.text ?? '抱歉，我無法回應。';
    } else {
      // 直接文字回覆
      const textPart = parts.find((p: { text?: string }) => p.text);
      responseText = textPart?.text ?? '抱歉，我無法回應。';
    }

    if (crisis) {
      skillInvoked = 'MetaMomentSkill';
    }

    // 持久化對話（fire-and-forget）
    appendEvent(APP_NAME, userId, sessionId, 'user', message).catch((e) =>
      console.error('append user event error:', e)
    );
    appendEvent(APP_NAME, userId, sessionId, 'model', responseText).catch((e) =>
      console.error('append model event error:', e)
    );

    return new Response(
      JSON.stringify({
        data: {
          response: responseText,
          skillInvoked,
          action,
          actionReason,
        },
        error: null,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Coach Edge Function error:', err);
    return new Response(
      JSON.stringify({
        data: null,
        error: err instanceof Error ? err.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
