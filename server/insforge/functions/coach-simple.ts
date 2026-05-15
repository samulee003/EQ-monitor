import { createClient } from 'npm:@insforge/sdk';
import {
  classifyCoachIntent,
  computeMicroActionReward,
  expireMicroActions,
  getLevelFromXp,
  isCrisisText,
  pickDefaultTaskForGoal,
  updateReviewStreak,
  type CoachIntent,
  type CoachLoopContext,
  type CompanionGoalKey,
  type GamificationStats,
  type MicroActionCategory,
  type MicroActionRow,
  type PendingMicroActionProposal,
  type TaskTemplate,
} from './_shared/coachActionLoop.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';

const MAX_AGENTIC_STEPS = 3;
const APP_NAME = 'imxin_emotion_coach';
const PENDING_MICRO_ACTION_STATE_KEY = 'pendingMicroActionProposal';

// ═══════════════════════════════════════════════════════════════
// System Prompt
// ═══════════════════════════════════════════════════════════════

const COACH_SOUL_SOURCE_PATH = 'server/insforge/agents/soul.md';

function buildEmotionCoachGlobalInstruction(): string {
  return `
你是「阿念教練」，今心裡一位主動但不打擾的 AI 情緒教練。

你的所有回應都必須遵守 ${COACH_SOUL_SOURCE_PATH} 的 soul 契約：
- 你不是客服、不是占卜、不是診斷工具，也不是單純聊天機器人。
- 你的核心節奏是「同理 → 觀察 → 下一步」。
- 你會主動整理使用者留下的情緒線索，慢慢看懂使用者的節奏，但不把所有情緒都導向功能操作。
- 當資料不足時，明確說「目前資料還不夠」，不要假裝看見長期模式。
- 不做診斷、不承諾治療效果、不取代心理師、醫師或緊急救援。
- 使用繁體中文與台灣用語，語氣溫暖、穩定、清楚。
- 方法來源要誠實：今心是 RULER 啟發、ACT-informed、IFS-informed、Dan Siegel-informed 的自有整合練習。
- 不宣稱與 Yale、RULER Approach、ACT、IFS 或 Dan Siegel / Mindsight Institute 有官方關係。
`.trim();
}

function buildEmotionCoachInstruction(): string {
  return `
你的方法基礎是「知心四式」：心照、喚名、安神、動念。語氣可以有一點武俠招式感，但保持溫柔、現代、清楚，不浮誇。

## 方法融合
- RULER 啟發：看見、理解、命名情緒，但使用今心自己的「知心四式」語言。
- ACT-informed：接納感受，協助使用者回到價值與可做的小行動。
- IFS-informed：把內在衝突視為不同部分的保護訊號，不把任何部分說成壞。
- Dan Siegel-informed：用 mindsight 幫使用者看見「我正在感到...」而不是「我就是...」，並在高壓時先回到可承受範圍。

## 回覆節奏
- 先接住感受，不急著給建議。
- 再指出一個觀察，例如情緒、強度、觸發點、需求或可能的模式。
- 最後只給一個很小、可完成的下一步。
- 不說「你應該」，改說「我們可以先」。
- 不把情緒分成好壞，只說「這個情緒可能在提醒你什麼」。

## Agentic 工作方式
1. 心照：協助使用者辨識當下感受與身體線索。
2. 喚名：如果有情緒或強度資料，參考並詢問變化。
3. 安神：語氣降載，溫和整理情緒背後的情境、需求、界線或內在部分。
4. 動念：依狀態提供一個合適策略。

## 工具使用原則
你有以下工具，請在適當時機主動使用：

- get_user_emotion_summary：使用者提到過去記錄、情緒模式、連續記錄時，先查資料。
- get_emotion_trend：使用者問「最近怎麼樣」「有沒有進步」「我是不是常常...」時，先查趨勢，不憑感覺回答。
- save_ruler_log：使用者提供明確情緒、強度、觸發點時，主動整理成今心情緒紀錄。
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
當使用者出現以下情況時，你必須啟動內部緊急安定技能，但對使用者只稱為「緊急安定練習」：
- 明確自傷或自殺意念，例如「我撐不下去了」「想結束一切」。
- 情緒極度激動、無法冷靜溝通。
- 明確要求 SOS、救命或緊急協助。
- 身體強烈不適，例如胸悶、無法呼吸、失控發抖。

轉介時請說：「我感受到你現在非常辛苦，讓我們一起啟動緊急安定練習，一步一步來。」
`.trim();
}

function buildProductionCoachSystemPrompt(): string {
  return `
${buildEmotionCoachGlobalInstruction()}

${buildEmotionCoachInstruction()}

## REST fallback 執行規則
這個上線入口不是完整 ADK Runner，而是與 Gemini function calling 串接的 REST fallback。
因此你必須特別遵守：

- 工具名稱只使用 get_user_emotion_summary、get_emotion_trend、save_ruler_log、trigger_action、get_active_micro_action、create_micro_action、report_micro_action、get_gamification_summary。
- 使用者問「最近怎麼樣」「有沒有進步」「我是不是常常...」時，必須先呼叫 get_emotion_trend 或 get_user_emotion_summary。
- 使用者明確提供情緒、強度與觸發點時，優先呼叫 save_ruler_log；資訊不足時只問一個最小問題。
- 需要前端協助呼吸、紀錄、SOS、歷史或成長頁時，呼叫 trigger_action。
- 需要確認、建立、回報 24 小時小行動或查看個人 XP / 金幣 / 復盤連續時，使用對應 micro action 與 gamification 工具；這些都是個人進度，不提供社交排行榜。
- 危機語句出現時，直接進入緊急安定語氣，並呼叫 trigger_action(open_sos)。
- 最終回覆仍維持「同理 → 觀察 → 下一步」，不可提及工具名稱，也不可把工具結果原樣貼給使用者。
`.trim();
}

const TOOL_TRACE_NAMES = [
  'save_ruler_log',
  'get_user_emotion_summary',
  'get_emotion_trend',
  'trigger_action',
  'get_active_micro_action',
  'create_micro_action',
  'report_micro_action',
  'get_gamification_summary',
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

const EMERGENCY_STABILIZATION_PROMPT = `你是「阿念教練」的緊急情緒調節專員，負責在使用者情緒高漲或危機時啟動今心緊急安定四步流程。

## 溝通原則
- 全程使用繁體中文（臺灣用語）
- 語氣溫柔、堅定、不帶評判
- 每一步都要確認使用者準備好，才進入下一步
- 絕對不可跳過任何步驟
- 這是今心自己的緊急穩定流程，參考情緒調節與 Dan Siegel-informed 的身心腦整合觀點；不要宣稱是 Yale、RULER Approach、ACT、IFS、Dan Siegel 或 Mindsight Institute 的官方練習。
- 不做診斷、不承諾治療效果、不取代心理師、醫師或緊急救援。
- 目標不是立刻變好，而是先回到可承受範圍，讓使用者多一點停頓與選擇空間。

## 四步驟協議

### 第 1 步：感覺身體
邀請使用者暫停手邊動作，把注意帶回身體。

### 第 2 步：呼吸暫停
帶領使用者進行 4-7-8 深呼吸，每一輪陪同計數。

### 第 3 步：記得想成為的自己
引導使用者回想「當你處於最佳狀態時，你是什麼樣子？」

### 第 4 步：選一個照顧動作
提供具體可執行的策略讓使用者選擇。

最後要讓使用者知道：「無論你選擇哪一條路，我都會在這裡陪你。你不需要獨自面對。」`;

const CRISIS_KEYWORDS = [
  '撐不下去', '想死', '想結束一切', '自殺', '自傷', '跳樓', '割腕',
  '沒有意義', '活不下去', 'SOS', '緊急協助', '幫幫我', '救命',
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
  return isCrisisText(message) || CRISIS_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
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
    description: '分析使用者最近 N 天的情緒趨勢，包含最常出現的情緒、平均強度、狀態色彩分佈與連續記錄資訊。',
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
              quadrant: { type: 'string', enum: ['red', 'yellow', 'blue', 'green'], description: '情緒所在狀態色彩' },
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
  {
    name: 'get_active_micro_action',
    description: '查詢使用者目前 active 的 24 小時小行動。',
    parameters: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: '使用者的 UUID 或 app user id' },
      },
      required: ['userId'],
    },
  },
  {
    name: 'create_micro_action',
    description: '建立使用者已確認的 24 小時小行動，若已有 active 小行動則不可重複建立。',
    parameters: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: '使用者的 UUID 或 app user id' },
        goalKey: { type: 'string', enum: ['sleep_anxiety', 'parent_repair', 'daily_care'] },
        taskKey: { type: 'string' },
        title: { type: 'string' },
        category: { type: 'string', enum: ['body_downshift', 'settling', 'repair', 'daily_care'] },
      },
      required: ['userId', 'goalKey', 'taskKey', 'title', 'category'],
    },
  },
  {
    name: 'report_micro_action',
    description: '回報 24 小時小行動結果，只接受 completed、partial、skipped，且只給正向獎勵。',
    parameters: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: '使用者的 UUID 或 app user id' },
        microActionId: { type: 'string' },
        status: { type: 'string', enum: ['completed', 'partial', 'skipped'] },
        reportText: { type: 'string' },
      },
      required: ['userId', 'microActionId', 'status'],
    },
  },
  {
    name: 'get_gamification_summary',
    description: '查詢使用者個人 XP、金幣、等級與復盤連續摘要；這不是社交排行榜。',
    parameters: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: '使用者的 UUID 或 app user id' },
      },
      required: ['userId'],
    },
  },
];

const RESTRICTED_CRISIS_TOOLS = TOOLS.filter((tool) => tool.name === 'trigger_action');
const MUTATING_ACTION_LOOP_TOOLS = new Set(['create_micro_action', 'report_micro_action']);

// ═══════════════════════════════════════════════════════════════
// Database Helpers
// ═══════════════════════════════════════════════════════════════

function getClient() {
  const baseUrl = Deno.env.get('INSFORGE_BASE_URL') || Deno.env.get('INSFORGE_URL') || '';
  const serverKey = Deno.env.get('API_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('ANON_KEY') || '';
  return createClient({ baseUrl, anonKey: serverKey });
}

function getAuthClient(req: Request) {
  const baseUrl = Deno.env.get('INSFORGE_BASE_URL') || Deno.env.get('INSFORGE_URL') || '';
  const authHeader = req.headers.get('Authorization');
  const userToken = authHeader ? authHeader.replace('Bearer ', '') : '';
  return createClient({ baseUrl, edgeFunctionToken: userToken });
}

async function assertAuthorizedUser(req: Request, userId: string): Promise<Response | null> {
  if (!isUuid(userId)) return null;

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ data: null, error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { data, error } = await getAuthClient(req).auth.getCurrentUser();
  const authUser = data?.user;
  if (error || !authUser?.id) {
    return new Response(
      JSON.stringify({ data: null, error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  if (authUser.id !== userId) {
    return new Response(
      JSON.stringify({ data: null, error: 'Forbidden' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return null;
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

function userSelector(userId: string): { column: 'user_id' | 'app_user_id'; value: string; uuid: boolean } {
  const uuid = isUuid(userId);
  return { column: uuid ? 'user_id' : 'app_user_id', value: userId, uuid };
}

function normalizeMicroActionRow(row: Record<string, unknown>): MicroActionRow {
  return {
    id: String(row.id),
    title: String(row.title ?? ''),
    category: row.category as MicroActionCategory,
    status: row.status as MicroActionRow['status'],
    due_at: String(row.due_at ?? ''),
    created_at: String(row.created_at ?? ''),
    goal_key: (row.goal_key as CompanionGoalKey | null | undefined) ?? null,
    task_key: (row.task_key as string | null | undefined) ?? null,
    report_text: (row.report_text as string | null | undefined) ?? null,
  };
}

function normalizePendingMicroActionProposal(value: unknown): PendingMicroActionProposal | null {
  if (!value || typeof value !== 'object') return null;
  const proposal = value as Partial<PendingMicroActionProposal>;
  const task = proposal.task;
  if (!task || typeof task !== 'object') return null;
  if (
    typeof task.key !== 'string' ||
    typeof task.goalKey !== 'string' ||
    typeof task.category !== 'string' ||
    typeof task.title !== 'string' ||
    typeof task.dueHours !== 'number'
  ) {
    return null;
  }
  return {
    task: {
      key: task.key,
      goalKey: task.goalKey as CompanionGoalKey,
      category: task.category as MicroActionCategory,
      title: task.title,
      dueHours: task.dueHours,
    },
    proposedAt: typeof proposal.proposedAt === 'string' ? proposal.proposedAt : new Date().toISOString(),
  };
}

async function loadSessionState(userId: string, sessionId: string): Promise<Record<string, unknown>> {
  const client = getClient();
  const { data, error } = await client.database
    .from('adk_sessions')
    .select('state')
    .eq('id', sessionId)
    .eq('app_name', APP_NAME)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('loadSessionState error:', error);
    return {};
  }
  return ((data as { state?: Record<string, unknown> } | null)?.state ?? {}) as Record<string, unknown>;
}

async function loadPendingMicroActionProposal(
  userId: string,
  sessionId: string
): Promise<PendingMicroActionProposal | null> {
  const state = await loadSessionState(userId, sessionId);
  return normalizePendingMicroActionProposal(state[PENDING_MICRO_ACTION_STATE_KEY]);
}

async function savePendingMicroActionProposal(
  userId: string,
  sessionId: string,
  proposal: PendingMicroActionProposal | null
) {
  const client = getClient();
  const state = await loadSessionState(userId, sessionId);
  const nextState = {
    ...state,
    [PENDING_MICRO_ACTION_STATE_KEY]: proposal,
  };
  const { error } = await client.database
    .from('adk_sessions')
    .update({ state: nextState, update_time: new Date().toISOString() })
    .eq('id', sessionId)
    .eq('app_name', APP_NAME)
    .eq('user_id', userId);

  if (error) console.error('savePendingMicroActionProposal error:', error);
}

async function loadActiveMicroAction(userId: string, nowIso: string): Promise<MicroActionRow | null> {
  const client = getClient();
  const selector = userSelector(userId);
  const { data, error } = await client.database
    .from('coach_micro_actions')
    .select('id, title, category, status, due_at, created_at, goal_key, task_key, report_text')
    .eq(selector.column, selector.value)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('loadActiveMicroAction error:', error);
    return null;
  }

  const rows = (data ?? []).map((row: Record<string, unknown>) => normalizeMicroActionRow(row));
  const { expiredIds, active } = expireMicroActions(rows, nowIso);
  if (expiredIds.length > 0) {
    await client.database
      .from('coach_micro_actions')
      .update({ status: 'expired', updated_at: nowIso, xp_awarded: 0, coins_awarded: 0 })
      .in('id', expiredIds);
  }
  return active;
}

function emptyGamificationStats(): GamificationStats {
  return {
    total_xp: 0,
    coin_balance: 0,
    lifetime_coins: 0,
    total_reported: 0,
    completed_count: 0,
    partial_count: 0,
    skipped_count: 0,
    current_review_streak: 0,
    longest_review_streak: 0,
    last_review_date: null,
  };
}

function normalizeGamificationStats(row: Partial<GamificationStats> | null | undefined): GamificationStats {
  const empty = emptyGamificationStats();
  if (!row) return empty;
  return {
    total_xp: Math.max(0, Number(row.total_xp ?? empty.total_xp)),
    coin_balance: Math.max(0, Number(row.coin_balance ?? empty.coin_balance)),
    lifetime_coins: Math.max(0, Number(row.lifetime_coins ?? empty.lifetime_coins)),
    total_reported: Math.max(0, Number(row.total_reported ?? empty.total_reported)),
    completed_count: Math.max(0, Number(row.completed_count ?? empty.completed_count)),
    partial_count: Math.max(0, Number(row.partial_count ?? empty.partial_count)),
    skipped_count: Math.max(0, Number(row.skipped_count ?? empty.skipped_count)),
    current_review_streak: Math.max(0, Number(row.current_review_streak ?? empty.current_review_streak)),
    longest_review_streak: Math.max(0, Number(row.longest_review_streak ?? empty.longest_review_streak)),
    last_review_date: row.last_review_date ?? null,
  };
}

async function loadGamificationStats(userId: string): Promise<GamificationStats> {
  const client = getClient();
  const selector = userSelector(userId);
  const { data, error } = await client.database
    .from('coach_gamification_stats')
    .select(
      'total_xp, coin_balance, lifetime_coins, total_reported, completed_count, partial_count, skipped_count, current_review_streak, longest_review_streak, last_review_date'
    )
    .eq(selector.column, selector.value)
    .maybeSingle();

  if (error) {
    console.error('loadGamificationStats error:', error);
    return emptyGamificationStats();
  }
  return normalizeGamificationStats(data as Partial<GamificationStats> | null);
}

async function loadLoopContext(userId: string, sessionId: string, nowIso: string): Promise<CoachLoopContext> {
  const [activeMicroAction, pendingProposal, gamification, recentEmotionSummary] = await Promise.all([
    loadActiveMicroAction(userId, nowIso),
    loadPendingMicroActionProposal(userId, sessionId),
    loadGamificationStats(userId),
    getUserEmotionSummary(userId),
  ]);
  return {
    nowIso,
    userId,
    sessionId,
    activeMicroAction,
    pendingProposal,
    gamification,
    recentEmotionSummary,
  };
}

async function persistTraceEvent(input: {
  userId: string;
  sessionId: string;
  step: number;
  phase: 'observe' | 'orient' | 'plan' | 'act' | 'persist' | 'evaluate' | 'adjust';
  intent?: CoachIntent;
  toolName?: string;
  guardrailResult?: string;
  payload?: Record<string, unknown>;
}) {
  const client = getClient();
  const selector = userSelector(input.userId);
  const { error } = await client.database.from('coach_agent_traces').insert({
    id: crypto.randomUUID(),
    [selector.column]: selector.value,
    session_id: input.sessionId,
    step: input.step,
    phase: input.phase,
    intent: input.intent?.kind,
    tool_name: input.toolName,
    guardrail_result: input.guardrailResult,
    payload: {
      ...(input.payload ?? {}),
      intent: input.intent ?? null,
    },
  });

  if (error) console.error('persistTraceEvent error:', error);
}

function taskFromIntentOrTask(intentOrTask: TaskTemplate | CoachIntent): TaskTemplate | null {
  if ('key' in intentOrTask) return intentOrTask;
  if (intentOrTask.kind === 'create_micro_action') return intentOrTask.task;
  if (intentOrTask.kind === 'propose_micro_action') return intentOrTask.task;
  return null;
}

function isUniqueConflict(error: { code?: string; message?: string } | null | undefined): boolean {
  return Boolean(
    error?.code === '23505' ||
      error?.message?.includes('duplicate key') ||
      error?.message?.includes('idx_coach_micro_actions_one_active')
  );
}

async function createMicroAction(userId: string, intentOrTask: TaskTemplate | CoachIntent) {
  const nowIso = new Date().toISOString();
  const active = await loadActiveMicroAction(userId, nowIso);
  if (active) {
    return { success: false, reason: 'active_micro_action_exists', microAction: active };
  }

  const task = taskFromIntentOrTask(intentOrTask);
  if (!task) return { success: false, error: 'missing_task' };

  const client = getClient();
  const selector = userSelector(userId);
  const dueAt = new Date(Date.parse(nowIso) + task.dueHours * 60 * 60 * 1000).toISOString();
  const { data, error } = await client.database
    .from('coach_micro_actions')
    .insert({
      id: crypto.randomUUID(),
      [selector.column]: selector.value,
      source: 'coach',
      goal_key: task.goalKey,
      task_key: task.key,
      title: task.title,
      category: task.category,
      status: 'active',
      due_at: dueAt,
      xp_awarded: 0,
      coins_awarded: 0,
      created_at: nowIso,
      updated_at: nowIso,
    })
    .select('id, title, category, status, due_at, created_at, goal_key, task_key, report_text')
    .maybeSingle();

  if (error) {
    if (isUniqueConflict(error)) {
      return {
        success: false,
        reason: 'active_micro_action_exists',
        microAction: await loadActiveMicroAction(userId, new Date().toISOString()),
      };
    }
    console.error('createMicroAction error:', error);
    return { success: false, error: error.message };
  }
  return { success: true, microAction: normalizeMicroActionRow(data as Record<string, unknown>) };
}

async function incrementGamification(
  userId: string,
  reward: { xp: number; coins: number; reportStatus?: 'completed' | 'partial' | 'skipped' }
): Promise<GamificationStats> {
  const client = getClient();
  const selector = userSelector(userId);
  const current = await loadGamificationStats(userId);
  const xp = Math.max(0, reward.xp);
  const coins = Math.max(0, reward.coins);
  const reportDate = new Date().toISOString().slice(0, 10);
  const streak = reward.reportStatus
    ? updateReviewStreak({
        current: current.current_review_streak,
        longest: current.longest_review_streak,
        lastReviewDate: current.last_review_date,
        reportDate,
      })
    : {
        current: current.current_review_streak,
        longest: current.longest_review_streak,
        lastReviewDate: current.last_review_date,
      };
  const next: GamificationStats = {
    total_xp: current.total_xp + xp,
    coin_balance: current.coin_balance + coins,
    lifetime_coins: current.lifetime_coins + coins,
    total_reported: current.total_reported + (reward.reportStatus ? 1 : 0),
    completed_count: current.completed_count + (reward.reportStatus === 'completed' ? 1 : 0),
    partial_count: current.partial_count + (reward.reportStatus === 'partial' ? 1 : 0),
    skipped_count: current.skipped_count + (reward.reportStatus === 'skipped' ? 1 : 0),
    current_review_streak: streak.current,
    longest_review_streak: streak.longest,
    last_review_date: streak.lastReviewDate,
  };
  const nowIso = new Date().toISOString();
  const { data: existing } = await client.database
    .from('coach_gamification_stats')
    .select('id')
    .eq(selector.column, selector.value)
    .maybeSingle();
  const payload = {
    [selector.column]: selector.value,
    ...next,
    updated_at: nowIso,
  };
  const result = existing?.id
    ? await client.database.from('coach_gamification_stats').update(payload).eq('id', existing.id)
    : await client.database.from('coach_gamification_stats').insert({ id: crypto.randomUUID(), ...payload });

  if (result.error) console.error('incrementGamification error:', result.error);
  return next;
}

async function reportMicroAction(
  userId: string,
  microActionId: string,
  status: 'completed' | 'partial' | 'skipped',
  reportText?: string
) {
  const nowIso = new Date().toISOString();
  const reward = computeMicroActionReward(status);
  const client = getClient();
  const selector = userSelector(userId);
  const { data, error } = await client.database
    .from('coach_micro_actions')
    .update({
      status,
      reported_at: nowIso,
      report_text: reportText ?? null,
      xp_awarded: reward.xp,
      coins_awarded: reward.coins,
      updated_at: nowIso,
    })
    .eq('id', microActionId)
    .eq(selector.column, selector.value)
    .eq('status', 'active')
    .is('reported_at', null)
    .select('id, title, category, status, due_at, created_at, goal_key, task_key, report_text')
    .maybeSingle();

  if (error) {
    console.error('reportMicroAction error:', error);
    return { success: false, error: error.message };
  }

  if (!data) {
    return { success: false, reason: 'micro_action_not_active', reward: { xp: 0, coins: 0 } };
  }

  const gamification = await incrementGamification(userId, {
    ...reward,
    reportStatus: status,
  });
  return {
    success: true,
    microAction: data ? normalizeMicroActionRow(data as Record<string, unknown>) : null,
    reward,
    gamification: buildGamificationSummary(gamification),
  };
}

function buildGamificationSummary(stats: GamificationStats) {
  return {
    ...stats,
    level: getLevelFromXp(stats.total_xp),
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

async function executeTool(
  name: string,
  args: Record<string, unknown>,
  userId: string,
  options: { crisis?: boolean } = {}
) {
  try {
    if (options.crisis && MUTATING_ACTION_LOOP_TOOLS.has(name)) {
      return { success: false, crisis_reward_blocked: true };
    }

    switch (name) {
      case 'get_user_emotion_summary': {
        return await getUserEmotionSummary(userId);
      }
      case 'get_emotion_trend': {
        return await getEmotionTrend(userId, (args.days as number) || 7);
      }
      case 'save_ruler_log': {
        return await saveRulerLog({
          userId,
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
      case 'get_active_micro_action': {
        return await loadActiveMicroAction(userId, new Date().toISOString());
      }
      case 'create_micro_action': {
        const active = await loadActiveMicroAction(userId, new Date().toISOString());
        if (active) return { success: false, reason: 'active_micro_action_exists', microAction: active };
        return await createMicroAction(userId, {
          key: String(args.taskKey ?? 'drink_water_and_need'),
          goalKey: (args.goalKey as CompanionGoalKey) ?? 'daily_care',
          category: (args.category as MicroActionCategory) ?? 'daily_care',
          title: String(args.title ?? '喝一杯水，坐下來寫一句「我現在其實需要……」'),
          dueHours: 24,
        });
      }
      case 'report_micro_action': {
        return await reportMicroAction(
          userId,
          String(args.microActionId ?? ''),
          args.status as 'completed' | 'partial' | 'skipped',
          args.reportText as string | undefined
        );
      }
      case 'get_gamification_summary': {
        return buildGamificationSummary(await loadGamificationStats(userId));
      }
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (e) {
    console.error(`Tool ${name} error:`, e);
    return { error: (e as Error).message };
  }
}

async function runAgenticActionLoop(input: {
  message: string;
  userId: string;
  sessionId: string;
  crisis: boolean;
}): Promise<{
  intent: CoachIntent;
  loopContext: CoachLoopContext;
  toolResult: unknown;
  activeMicroAction: MicroActionRow | null;
  gamification: ReturnType<typeof buildGamificationSummary>;
}> {
  const nowIso = new Date().toISOString();
  let loopContext = await loadLoopContext(input.userId, input.sessionId, nowIso);
  const recentSummary = loopContext.recentEmotionSummary as { recent_logs_count?: number };

  await persistTraceEvent({
    userId: input.userId,
    sessionId: input.sessionId,
    step: 0,
    phase: 'observe',
    payload: {
      hasActiveMicroAction: Boolean(loopContext.activeMicroAction),
      recentLogs: recentSummary?.recent_logs_count ?? 0,
    },
  });

  if (input.crisis || isCrisisText(input.message)) {
    const intent: CoachIntent = { kind: 'sos', reason: 'crisis_text_detected' };
    await persistTraceEvent({
      userId: input.userId,
      sessionId: input.sessionId,
      step: 0,
      phase: 'evaluate',
      intent,
      guardrailResult: 'crisis_reward_blocked',
      payload: { crisis_reward_blocked: true },
    });
    return {
      intent,
      loopContext,
      toolResult: { crisis_reward_blocked: true },
      activeMicroAction: loopContext.activeMicroAction,
      gamification: buildGamificationSummary(loopContext.gamification),
    };
  }

  let intent = classifyCoachIntent(input.message, loopContext);
  let toolResult: unknown = null;
  await persistTraceEvent({
    userId: input.userId,
    sessionId: input.sessionId,
    step: 1,
    phase: 'orient',
    intent,
  });

  for (let step = 1; step <= MAX_AGENTIC_STEPS; step += 1) {
    if (intent.kind === 'start_companion_run') {
      const task = pickDefaultTaskForGoal(intent.goalKey);
      intent = { kind: 'propose_micro_action', goalKey: intent.goalKey, task };
      toolResult = { proposal: task };
      await savePendingMicroActionProposal(input.userId, input.sessionId, {
        task,
        proposedAt: new Date().toISOString(),
      });
      await persistTraceEvent({
        userId: input.userId,
        sessionId: input.sessionId,
        step,
        phase: 'plan',
        intent,
        payload: { proposal: task },
      });
      break;
    }

    if (intent.kind === 'create_micro_action') {
      await persistTraceEvent({
        userId: input.userId,
        sessionId: input.sessionId,
        step,
        phase: 'plan',
        intent,
        payload: { task: intent.task },
      });
      toolResult = await createMicroAction(input.userId, intent);
      if ((toolResult as { success?: boolean })?.success) {
        await savePendingMicroActionProposal(input.userId, input.sessionId, null);
      }
      await persistTraceEvent({
        userId: input.userId,
        sessionId: input.sessionId,
        step,
        phase: 'act',
        intent,
        toolName: 'create_micro_action',
        payload: { toolResult: toolResult as Record<string, unknown> },
      });
      await persistTraceEvent({
        userId: input.userId,
        sessionId: input.sessionId,
        step,
        phase: 'persist',
        intent,
        toolName: 'create_micro_action',
        payload: { success: Boolean((toolResult as { success?: boolean })?.success) },
      });
      break;
    }

    if (intent.kind === 'report_micro_action') {
      await persistTraceEvent({
        userId: input.userId,
        sessionId: input.sessionId,
        step,
        phase: 'plan',
        intent,
      });
      toolResult = await reportMicroAction(
        input.userId,
        intent.microActionId,
        intent.status,
        input.message
      );
      if ((toolResult as { success?: boolean })?.success) {
        await savePendingMicroActionProposal(input.userId, input.sessionId, null);
      }
      await persistTraceEvent({
        userId: input.userId,
        sessionId: input.sessionId,
        step,
        phase: 'act',
        intent,
        toolName: 'report_micro_action',
        payload: { toolResult: toolResult as Record<string, unknown> },
      });
      await persistTraceEvent({
        userId: input.userId,
        sessionId: input.sessionId,
        step,
        phase: 'persist',
        intent,
        toolName: 'report_micro_action',
        payload: {
          success: Boolean((toolResult as { success?: boolean })?.success),
          reward: (toolResult as { reward?: unknown })?.reward ?? null,
        },
      });
      break;
    }

    if (intent.kind === 'show_gamification_summary') {
      toolResult = buildGamificationSummary(loopContext.gamification);
      await persistTraceEvent({
        userId: input.userId,
        sessionId: input.sessionId,
        step,
        phase: 'act',
        intent,
        toolName: 'get_gamification_summary',
        payload: { toolResult: toolResult as Record<string, unknown> },
      });
      break;
    }

    break;
  }

  loopContext = await loadLoopContext(input.userId, input.sessionId, new Date().toISOString());
  await persistTraceEvent({
    userId: input.userId,
    sessionId: input.sessionId,
    step: MAX_AGENTIC_STEPS,
    phase: 'evaluate',
    intent,
    payload: {
      activeMicroActionId: loopContext.activeMicroAction?.id ?? null,
      totalXp: loopContext.gamification.total_xp,
    },
  });

  return {
    intent,
    loopContext,
    toolResult,
    activeMicroAction: loopContext.activeMicroAction,
    gamification: buildGamificationSummary(loopContext.gamification),
  };
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

    if (!isUuid(userId)) {
      return new Response(
        JSON.stringify({ error: 'Public coach endpoint requires UUID userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authorizationError = await assertAuthorizedUser(req, userId);
    if (authorizationError) return authorizationError;

    const apiKey = Deno.env.get('GOOGLE_API_KEY');
    if (!apiKey) {
      throw new Error('GOOGLE_API_KEY is not set');
    }

    const crisis = isCrisis(message);
    // 確保 session 存在，讓 action loop 可以使用 ADK session state 存放 pending proposal。
    await getOrCreateSession(APP_NAME, userId, sessionId);
    const agenticLoop = await runAgenticActionLoop({ message, userId, sessionId, crisis });
    const explicitLog = extractExplicitRulerLog(message, userId);
    const explicitLogResult = explicitLog ? await saveRulerLog(explicitLog) : null;
    const explicitLogStatus = explicitLogResult
      ? `\n\n【本次紀錄狀態】${
          explicitLogResult.success
            ? explicitLogResult.message
            : `紀錄失敗：${explicitLogResult.error ?? '未知錯誤'}`
        }`
      : '';
    const loopContextStatus = `\n\n【內部 Agentic Action Loop 狀態】
- intent: ${agenticLoop.intent.kind}
- activeMicroAction: ${agenticLoop.activeMicroAction?.title ?? 'none'}
- totalXp: ${agenticLoop.gamification.total_xp}
- coins: ${agenticLoop.gamification.coin_balance}
請只把這些狀態轉成自然教練回覆，不要向使用者列出工具名稱或 trace。`;
    const systemText = (crisis
      ? `${EMERGENCY_STABILIZATION_PROMPT}\n\n【緊急狀態】使用者可能處於危機中，請直接進入今心緊急安定四步流程。`
      : SYSTEM_PROMPT) + explicitLogStatus + loopContextStatus;

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
      crisis ? RESTRICTED_CRISIS_TOOLS : TOOLS
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
        : await executeTool(fc.name, fc.args, userId, { crisis });

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
      skillInvoked = 'emergency_stabilization';
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
          intent: agenticLoop.intent.kind,
          microActionProposal:
            agenticLoop.intent.kind === 'propose_micro_action' ? agenticLoop.intent.task : null,
          activeMicroAction: agenticLoop.activeMicroAction,
          gamification: agenticLoop.gamification,
          toolResult: agenticLoop.toolResult,
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
