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

const COACH_SOUL_SOURCE_PATH = 'server/insforge/agents/soul.md';

function buildEmotionCoachGlobalInstruction(): string {
  return `
你是「今心教練」，一位主動但不打擾的 AI 情緒教練。

你的所有回應都必須遵守 ${COACH_SOUL_SOURCE_PATH} 的 soul 契約：
- 你不是客服、不是占卜、不是診斷工具，也不是單純聊天機器人。
- 你的核心節奏是「同理 → 觀察 → 下一步」。
- 你會主動整理使用者留下的情緒線索，但不把所有情緒都導向功能操作。
- 當資料不足時，明確說「目前資料還不夠」，不要假裝看見長期模式。
- 不做診斷、不承諾治療效果、不取代心理師、醫師或緊急救援。
- 使用繁體中文與台灣用語，語氣溫暖、穩定、清楚。
`.trim();
}

function buildEmotionCoachInstruction(): string {
  return `
你的理論基礎是 RULER 框架（Recognize 覺察、Understand 理解、Label 標記、Express 表達、Regulate 調節）以及 Marc Brackett 的情緒智力研究。

## 回覆節奏
- 先接住感受，不急著給建議。
- 再指出一個觀察，例如情緒、強度、觸發點、需求或可能的模式。
- 最後只給一個很小、可完成的下一步。
- 不說「你應該」，改說「我們可以先」。
- 不把情緒分成好壞，只說「這個情緒可能在提醒你什麼」。

## Agentic 工作方式
1. 覺察情緒：協助使用者辨識當下情緒。
2. 理解脈絡：溫和詢問情緒背後的情境或需求。
3. 標記強度：如果有強度資料，參考並詢問變化。
4. 鼓勵表達：肯定使用者願意說出來。
5. 協助調節：依狀態提供一個合適策略。

## 工具使用原則
你有以下工具，請在適當時機主動使用：

- get_user_emotion_summary：使用者提到過去記錄、情緒模式、連續記錄時，先查資料。
- get_emotion_trend：使用者問「最近怎麼樣」「有沒有進步」「我是不是常常...」時，先查趨勢，不憑感覺回答。
- save_ruler_log：使用者提供明確情緒、強度、觸發點時，主動整理成 RULER 紀錄。
- trigger_action：建議呼吸、記錄、SOS、歷史或成長功能時，用工具觸發前端動作。
- 內部可以使用工具，但使用者可見回覆不可提及工具名稱，也不可把工具結果原樣貼給使用者；請把查到的結果轉成自然、簡短、可理解的教練回覆。

## 主動存日誌的時機
當使用者明確描述了：
- 當下情緒名稱，例如「我很焦慮」。
- 情緒強度，例如「大概 7 分」。
- 觸發事件，例如「因為明天要報告」。

請主動呼叫 save_ruler_log 幫他記錄，然後用短句告訴他「已經幫你記下來了」。
如果資訊不足，只問一個最小問題補齊，不要一次問太多。

## 情境判斷
- 使用者只想聊聊：陪伴優先，反映感受，不急著工具化。
- 使用者不知道怎麼開始：給一個很小的選項。
- 使用者語氣急促、混亂、無助：優先降載，先呼吸，再問一個問題。
- 使用者要求看模式或趨勢：先查資料，再回應。

## 危機轉介
當使用者出現以下情況時，你必須轉交給 MetaMomentSkill：
- 明確自傷或自殺意念，例如「我撐不下去了」「想結束一切」。
- 情緒極度激動、無法冷靜溝通。
- 明確要求 SOS、救命或緊急協助。
- 身體強烈不適，例如胸悶、無法呼吸、失控發抖。

轉介時請說：「我感受到你現在非常辛苦，讓我們一起啟動 Meta-Moment 緊急協助，一步一步來。」
`.trim();
}

function buildProductionCoachSystemPrompt(): string {
  return `
${buildEmotionCoachGlobalInstruction()}

${buildEmotionCoachInstruction()}

## REST fallback 執行規則
這個上線入口不是完整 ADK Runner，而是與 Gemini function calling 串接的 REST fallback。
因此你必須特別遵守：

- 工具名稱只使用 get_user_emotion_summary、get_emotion_trend、save_ruler_log、trigger_action。
- 使用者問「最近怎麼樣」「有沒有進步」「我是不是常常...」時，必須先呼叫 get_emotion_trend 或 get_user_emotion_summary。
- 使用者明確提供情緒、強度與觸發點時，優先呼叫 save_ruler_log；資訊不足時只問一個最小問題。
- 需要前端協助呼吸、紀錄、SOS、歷史或成長頁時，呼叫 trigger_action。
- 危機語句出現時，直接進入 Meta-Moment 語氣，並呼叫 trigger_action(open_sos)。
- 最終回覆仍維持「同理 → 觀察 → 下一步」，不可提及工具名稱，也不可把工具結果原樣貼給使用者。
`.trim();
}

const TOOL_TRACE_NAMES = [
  'save_ruler_log',
  'get_user_emotion_summary',
  'get_emotion_trend',
  'trigger_action',
];

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
      const opens = (trimmed.match(/[\{\[]/g) ?? []).length;
      const closes = (trimmed.match(/[\}\]]/g) ?? []).length;
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

const SYSTEM_PROMPT = buildProductionCoachSystemPrompt();

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

const EMOTION_HINTS = [
  { name: '焦慮', quadrant: 'red' },
  { name: '緊張', quadrant: 'red' },
  { name: '害怕', quadrant: 'red' },
  { name: '生氣', quadrant: 'red' },
  { name: '憤怒', quadrant: 'red' },
  { name: '煩躁', quadrant: 'red' },
  { name: '難過', quadrant: 'blue' },
  { name: '沮喪', quadrant: 'blue' },
  { name: '疲憊', quadrant: 'blue' },
  { name: '失落', quadrant: 'blue' },
  { name: '開心', quadrant: 'yellow' },
  { name: '興奮', quadrant: 'yellow' },
  { name: '期待', quadrant: 'yellow' },
  { name: '平靜', quadrant: 'green' },
  { name: '放鬆', quadrant: 'green' },
  { name: '安心', quadrant: 'green' },
] as const;

function isCrisis(message: string): boolean {
  const lower = message.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

function extractExplicitRulerLog(message: string, userId: string) {
  const wantsRecord = /記錄|紀錄|記下|幫我存|存下/.test(message);
  if (!wantsRecord) return null;

  const intensityMatch = message.match(/(?:強度|大概|大約|約)?\s*(10|[1-9])\s*(?:分|\/10)?/);
  const intensity = intensityMatch ? Number(intensityMatch[1]) : null;
  if (!intensity) return null;

  const emotions = EMOTION_HINTS.filter((hint) => message.includes(hint.name));
  if (emotions.length === 0) return null;

  const triggerMatch = message.match(/(?:因為|由於|原因是|觸發(?:事件)?是)([^。！？\n]+)/);

  return {
    userId,
    emotions: emotions.map((emotion) => ({ name: emotion.name, quadrant: emotion.quadrant })),
    intensity,
    notes: message,
    trigger: triggerMatch?.[1]?.trim(),
  };
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
  const serverKey = Deno.env.get('API_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('ANON_KEY') || '';
  return createClient({ baseUrl, anonKey: serverKey });
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function logsQuery(client: ReturnType<typeof createClient>, userId: string) {
  return isUuid(userId)
    ? client.database.from('ruler_logs').select('emotions, intensity, created_at').eq('user_id', userId)
    : client.database.from('agent_ruler_logs').select('emotions, intensity, created_at').eq('app_user_id', userId);
}

async function getUserEmotionSummary(userId: string) {
  const client = getClient();
  const { data: logs, error: logsError } = await logsQuery(client, userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (logsError) console.error('ruler_logs query error:', logsError);

  const { data: streak, error: streakError } = isUuid(userId) ? await client.database
    .from('streaks')
    .select('current_streak, longest_streak, total_logs, last_checkin_date')
    .eq('user_id', userId)
    .maybeSingle() : { data: null, error: null };

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

  const { data: logs, error: logsErr } = await logsQuery(client, userId)
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
  const target = isUuid(params.userId) ? 'ruler_logs' : 'agent_ruler_logs';
  const userColumn = isUuid(params.userId) ? 'user_id' : 'app_user_id';
  const { error } = await client.database
    .from(target)
    .insert({
      [userColumn]: params.userId,
      source: isUuid(params.userId) ? undefined : 'coach',
      emotions: params.emotions.map((e) => ({ name: e.name, quadrant: e.quadrant })),
      intensity: params.intensity,
      understanding: {
        trigger: params.trigger ?? params.notes ?? '',
        need: null,
      },
      expressing: params.notes ? { expression: params.notes, mode: 'coach' } : null,
      is_full_flow: false,
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
    const explicitLog = extractExplicitRulerLog(message, userId);
    const explicitLogResult = explicitLog ? await saveRulerLog(explicitLog) : null;
    const explicitLogStatus = explicitLogResult
      ? `\n\n【本次紀錄狀態】${
          explicitLogResult.success
            ? explicitLogResult.message
            : `紀錄失敗：${explicitLogResult.error ?? '未知錯誤'}`
        }`
      : '';
    const systemText = (crisis
      ? `${META_MOMENT_PROMPT}\n\n【緊急狀態】使用者可能處於危機中，請直接進入 Meta-Moment 四步驟協議。`
      : SYSTEM_PROMPT) + explicitLogStatus;

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
      const toolResult = fc.name === 'save_ruler_log' && explicitLogResult?.success
        ? explicitLogResult
        : await executeTool(fc.name, fc.args, userId);

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
      responseText = sanitizeCoachResponse(textPart?.text ?? '抱歉，我無法回應。');
    } else {
      // 直接文字回覆
      const textPart = parts.find((p: { text?: string }) => p.text);
      responseText = sanitizeCoachResponse(textPart?.text ?? '抱歉，我無法回應。');
    }

    if (crisis) {
      skillInvoked = 'MetaMomentSkill';
      action = action ?? 'open_sos';
      actionReason = actionReason ?? '偵測到你可能需要緊急情緒調節協助';
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
