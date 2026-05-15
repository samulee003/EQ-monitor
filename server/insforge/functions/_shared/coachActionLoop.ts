export type EmotionalQuadrant = 'red' | 'blue' | 'green' | 'yellow';

export type ZhixinMove = '心照' | '喚名' | '安神' | '動念';

export type CompanionGoalKey = 'sleep_anxiety' | 'parent_repair' | 'daily_care';

export type MicroActionCategory = 'body_downshift' | 'settling' | 'repair' | 'daily_care';

export type MicroActionStatus =
  | 'proposed'
  | 'accepted'
  | 'active'
  | 'completed'
  | 'partial'
  | 'skipped'
  | 'expired';

export interface MicroActionRow {
  id: string;
  title: string;
  category: MicroActionCategory;
  status: MicroActionStatus;
  due_at: string;
  created_at: string;
  goal_key?: CompanionGoalKey | null;
  task_key?: string | null;
  report_text?: string | null;
}

export interface GamificationStats {
  total_xp: number;
  coin_balance: number;
  lifetime_coins: number;
  total_reported: number;
  completed_count: number;
  partial_count: number;
  skipped_count: number;
  current_review_streak: number;
  longest_review_streak: number;
  last_review_date: string | null;
}

export interface CoachLoopContext {
  nowIso: string;
  userId: string;
  sessionId: string;
  activeMicroAction: MicroActionRow | null;
  pendingProposal: PendingMicroActionProposal | null;
  gamification: GamificationStats;
  recentEmotionSummary: unknown;
}

export interface TaskTemplate {
  key: string;
  goalKey: CompanionGoalKey;
  category: MicroActionCategory;
  title: string;
  dueHours: number;
}

export interface PendingMicroActionProposal {
  task: TaskTemplate;
  proposedAt: string;
}

export type CoachIntent =
  | { kind: 'sos'; reason: 'crisis_text_detected' }
  | { kind: 'start_companion_run'; goalKey: CompanionGoalKey }
  | { kind: 'propose_micro_action'; goalKey: CompanionGoalKey; task: TaskTemplate }
  | { kind: 'create_micro_action'; task: TaskTemplate; confirmationText: string }
  | { kind: 'report_micro_action'; microActionId: string; status: 'completed' | 'partial' | 'skipped' }
  | { kind: 'show_gamification_summary' }
  | { kind: 'chat' };

export interface CoachActionLoopInput {
  userId: string;
  sessionId: string;
  message: string;
  coachResponse: string;
  emotionLabel?: string | null;
  quadrant?: EmotionalQuadrant | null;
  energy?: number | null;
  valence?: number | null;
  safetySignal?: 'none' | 'high';
  now?: Date;
}

export interface CoachActionLoopMetadata {
  loopVersion: '2026-05-action-loop-v1';
  traceId: string;
  observations: string[];
  orientation: {
    zhixinMove: ZhixinMove;
    quadrant: EmotionalQuadrant | null;
    riskLevel: 'low' | 'medium' | 'high';
  };
  plan: {
    intent: 'grounding' | 'naming' | 'repair' | 'next_step';
    reason: string;
  };
  microAction: {
    title: string;
    description: string;
    status: MicroActionStatus;
    dueAt: string;
    reward: {
      xp: number;
      coins: number;
      streakEligible: boolean;
    };
  };
  evaluationPrompt: string;
  safetyNotes: string[];
}

const LOOP_VERSION = '2026-05-action-loop-v1' as const;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const HIGH_RISK_PATTERNS = [
  /自殺/,
  /輕生/,
  /不想活/,
  /想死/,
  /傷害自己/,
  /割腕/,
  /殺了孩子/,
  /打死小孩/,
  /傷害孩子/,
  /傷害小孩/,
  /打到失控/,
  /suicide/i,
  /self[- ]?harm/i,
  /kill myself/i,
  /hurt myself/i,
  /hurt my child/i,
  /harm my child/i,
];

export const TASK_TEMPLATES: TaskTemplate[] = [
  {
    key: 'sleep_breath_3min',
    goalKey: 'sleep_anxiety',
    category: 'settling',
    title: '睡前做 3 分鐘安神呼吸',
    dueHours: 24,
  },
  {
    key: 'repair_step_away_2min',
    goalKey: 'parent_repair',
    category: 'repair',
    title: '情緒升高時先離開現場 2 分鐘',
    dueHours: 24,
  },
  {
    key: 'drink_water_and_need',
    goalKey: 'daily_care',
    category: 'daily_care',
    title: '喝一杯水，坐下來寫一句「我現在其實需要……」',
    dueHours: 24,
  },
];

export function isCrisisText(text: string): boolean {
  return HIGH_RISK_PATTERNS.some((pattern) => pattern.test(text)) || /救命|撐不下去|活不下去|SOS/i.test(text);
}

export function normalizeCompanionGoal(text: string): CompanionGoalKey {
  if (/睡|失眠|睡前|夜晚|焦慮/.test(text)) return 'sleep_anxiety';
  if (/親子|孩子|小孩|修復|道歉|吵架|情緒升高|離開現場/.test(text)) return 'parent_repair';
  return 'daily_care';
}

export function pickDefaultTaskForGoal(goalKey: CompanionGoalKey): TaskTemplate {
  return TASK_TEMPLATES.find((task) => task.goalKey === goalKey) ?? TASK_TEMPLATES[2];
}

export function classifyCoachIntent(text: string, context: CoachLoopContext): CoachIntent {
  if (isCrisisText(text)) return { kind: 'sos', reason: 'crisis_text_detected' };

  const normalized = text.trim();
  const active = context.activeMicroAction;

  if (/金幣|XP|等級|復盤連續|排行榜/i.test(normalized)) {
    return { kind: 'show_gamification_summary' };
  }

  if (/7\s*日小陪跑|7日小陪跑|開始陪跑/.test(normalized)) {
    return { kind: 'start_companion_run', goalKey: normalizeCompanionGoal(normalized) };
  }

  if (active) {
    if (/沒做到|沒有做到|沒做|先換/.test(normalized)) {
      return { kind: 'report_micro_action', microActionId: active.id, status: 'skipped' };
    }
    if (/有做到|完成|做到了/.test(normalized)) {
      return { kind: 'report_micro_action', microActionId: active.id, status: 'completed' };
    }
    if (/一半|部分|有做一點/.test(normalized)) {
      return { kind: 'report_micro_action', microActionId: active.id, status: 'partial' };
    }
    return { kind: 'chat' };
  }

  if (/^(好|可以|就這個|設為今天的小行動)$/.test(normalized) && context.pendingProposal) {
    return {
      kind: 'create_micro_action',
      task: context.pendingProposal.task,
      confirmationText: normalized,
    };
  }

  return { kind: 'chat' };
}

export function expireMicroActions(
  rows: MicroActionRow[],
  nowIso: string
): { expiredIds: string[]; active: MicroActionRow | null } {
  const nowMs = Date.parse(nowIso);
  const expiredIds = rows
    .filter((row) => row.status === 'active' && Date.parse(row.due_at) <= nowMs)
    .map((row) => row.id);
  const active =
    rows
      .filter((row) => row.status === 'active' && Date.parse(row.due_at) > nowMs)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0] ?? null;
  return { expiredIds, active };
}

export function computeMicroActionReward(status: 'completed' | 'partial' | 'skipped' | 'expired') {
  switch (status) {
    case 'completed':
      return { xp: 20, coins: 10 };
    case 'partial':
      return { xp: 15, coins: 7 };
    case 'skipped':
      return { xp: 10, coins: 5 };
    case 'expired':
      return { xp: 0, coins: 0 };
  }
}

export function updateReviewStreak(input: {
  current: number;
  longest: number;
  lastReviewDate: string | null;
  reportDate: string;
}): { current: number; longest: number; lastReviewDate: string } {
  if (input.lastReviewDate === input.reportDate) {
    return {
      current: input.current,
      longest: input.longest,
      lastReviewDate: input.reportDate,
    };
  }

  const lastMs = input.lastReviewDate ? Date.parse(`${input.lastReviewDate}T00:00:00.000Z`) : null;
  const reportMs = Date.parse(`${input.reportDate}T00:00:00.000Z`);
  const oneDayMs = 24 * 60 * 60 * 1000;
  const current = lastMs !== null && reportMs - lastMs === oneDayMs ? input.current + 1 : 1;

  return {
    current,
    longest: Math.max(input.longest, current),
    lastReviewDate: input.reportDate,
  };
}

export function getLevelFromXp(totalXp: number): {
  level: number;
  title: string;
  currentXp: number;
  nextLevelXp: number | null;
} {
  const xp = Math.max(0, totalXp);
  const levels = [
    { level: 1, title: '起步覺察者', minXp: 0, nextLevelXp: 100 },
    { level: 2, title: '穩定練習者', minXp: 100, nextLevelXp: 250 },
    { level: 3, title: '安神同行者', minXp: 250, nextLevelXp: 500 },
    { level: 4, title: '動念實踐者', minXp: 500, nextLevelXp: 900 },
    { level: 5, title: '知心守護者', minXp: 900, nextLevelXp: null },
  ];
  const current = [...levels].reverse().find((level) => xp >= level.minXp) ?? levels[0];
  return {
    level: current.level,
    title: current.title,
    currentXp: xp,
    nextLevelXp: current.nextLevelXp,
  };
}

export function buildCoachActionLoop(input: CoachActionLoopInput): CoachActionLoopMetadata {
  const now = requireInjectedNow(input.now);
  const quadrant = input.quadrant ?? null;
  const riskLevel = detectRiskLevel(input.message, quadrant, input.safetySignal ?? 'none');
  const hasEmotionLabel = typeof input.emotionLabel === 'string' && input.emotionLabel.trim().length > 0;
  const zhixinMove = chooseZhixinMove({ riskLevel, quadrant, hasEmotionLabel });
  const plan = buildPlan(zhixinMove);
  const microAction = buildMicroAction(zhixinMove, now);
  const observations = buildObservations(input, riskLevel);

  return {
    loopVersion: LOOP_VERSION,
    traceId: buildTraceId(input, now),
    observations,
    orientation: {
      zhixinMove,
      quadrant,
      riskLevel,
    },
    plan,
    microAction,
    evaluationPrompt: `明天回來看看：「${microAction.title}」有沒有讓你離自己想成為的樣子近一點。完成、跳過或想換一個，都可以如實記下來。`,
    safetyNotes: buildSafetyNotes(riskLevel),
  };
}

function detectRiskLevel(
  message: string,
  quadrant: EmotionalQuadrant | null,
  safetySignal: NonNullable<CoachActionLoopInput['safetySignal']>
): 'low' | 'medium' | 'high' {
  if (safetySignal === 'high') return 'high';
  if (HIGH_RISK_PATTERNS.some((pattern) => pattern.test(message))) return 'high';
  if (quadrant === 'red' || quadrant === 'blue') return 'medium';
  return 'low';
}

function chooseZhixinMove(input: {
  riskLevel: 'low' | 'medium' | 'high';
  quadrant: EmotionalQuadrant | null;
  hasEmotionLabel: boolean;
}): ZhixinMove {
  if ((input.riskLevel === 'high' || input.riskLevel === 'medium') && !input.hasEmotionLabel) {
    return '喚名';
  }
  if ((input.quadrant === 'red' || input.quadrant === 'blue') && input.hasEmotionLabel) {
    return '安神';
  }
  if (input.quadrant === 'green' || input.quadrant === 'yellow') {
    return '動念';
  }
  return '心照';
}

function buildPlan(zhixinMove: ZhixinMove): CoachActionLoopMetadata['plan'] {
  switch (zhixinMove) {
    case '喚名':
      return {
        intent: 'naming',
        reason: '先把模糊情緒靠近一點，讓下一步不用靠衝動決定。',
      };
    case '安神':
      return {
        intent: 'grounding',
        reason: '情緒已經被看見，下一步先讓身體和注意力有地方安放。',
      };
    case '動念':
      return {
        intent: 'next_step',
        reason: '目前狀態適合選一個很小、可完成的行動，累積回到生活的力量。',
      };
    case '心照':
      return {
        intent: 'grounding',
        reason: '資料還不完整，先用短暫停頓看清此刻狀態。',
      };
  }
}

function buildMicroAction(
  zhixinMove: ZhixinMove,
  now: Date
): CoachActionLoopMetadata['microAction'] {
  const dueAt = new Date(now.getTime() + ONE_DAY_MS).toISOString();
  const actionByMove: Record<ZhixinMove, { title: string; description: string }> = {
    心照: {
      title: '停一下，記下此刻',
      description: '找一個安靜的 1 分鐘，寫下現在身體最明顯的一個訊號。',
    },
    喚名: {
      title: '替感受取一個名字',
      description: '從「生氣、委屈、害怕、疲累」中選一個最接近的詞；不必完美，只要接近。',
    },
    安神: {
      title: '做一次 3 次呼吸安神',
      description: '慢慢吸氣、吐氣 3 回合，吐氣時把肩膀放低，先不急著處理問題。',
    },
    動念: {
      title: '選一個 5 分鐘小行動',
      description: '挑一件今天做得到的小事，例如倒水、傳一則訊息，或整理桌面一角。',
    },
  };

  return {
    ...actionByMove[zhixinMove],
    status: 'proposed',
    dueAt,
    reward: {
      xp: 20,
      coins: 5,
      streakEligible: true,
    },
  };
}

function buildObservations(
  input: CoachActionLoopInput,
  riskLevel: CoachActionLoopMetadata['orientation']['riskLevel']
): string[] {
  const observations = [
    `使用者訊息長度：${input.message.trim().length}`,
    `教練回覆長度：${input.coachResponse.trim().length}`,
  ];
  if (input.emotionLabel?.trim()) observations.push(`情緒命名：${input.emotionLabel.trim()}`);
  if (input.quadrant) observations.push(`象限：${input.quadrant}`);
  if (typeof input.energy === 'number') observations.push(`能量：${input.energy}`);
  if (typeof input.valence === 'number') observations.push(`愉悅度：${input.valence}`);
  if (riskLevel === 'high') observations.push('偵測到高風險關鍵字，需要升高安全邊界。');
  return observations;
}

function buildSafetyNotes(
  riskLevel: CoachActionLoopMetadata['orientation']['riskLevel']
): string[] {
  if (riskLevel !== 'high') return [];
  return [
    '今心提供情緒覺察與下一步練習，不是正式心理治療、診斷或醫療建議。',
    '若有立即傷害自己或孩子的風險，請立刻聯絡當地緊急服務、可信任親友或專業人員。',
  ];
}

function buildTraceId(input: CoachActionLoopInput, now: Date): string {
  const seed = JSON.stringify({
    loopVersion: LOOP_VERSION,
    userId: input.userId,
    sessionId: input.sessionId,
    now: now.toISOString(),
    message: input.message,
    coachResponse: input.coachResponse,
    emotionLabel: input.emotionLabel?.trim() || null,
    quadrant: input.quadrant ?? null,
    energy: input.energy ?? null,
    valence: input.valence ?? null,
    safetySignal: input.safetySignal ?? 'none',
  });
  return `cal_${stableHash(seed)}`;
}

function requireInjectedNow(now: Date | undefined): Date {
  if (!now) {
    throw new Error('buildCoachActionLoop requires input.now; integration boundary must inject clock.');
  }
  if (Number.isNaN(now.getTime())) {
    throw new Error('buildCoachActionLoop requires a valid input.now Date.');
  }
  return now;
}

function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
