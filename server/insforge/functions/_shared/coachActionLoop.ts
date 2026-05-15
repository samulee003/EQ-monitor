export type EmotionalQuadrant = 'red' | 'blue' | 'green' | 'yellow';

export type ZhixinMove = '心照' | '喚名' | '安神' | '動念';

export type MicroActionStatus = 'proposed' | 'accepted' | 'completed' | 'skipped' | 'expired';

export interface CoachActionLoopInput {
  userId: string;
  sessionId: string;
  message: string;
  coachResponse: string;
  emotionLabel?: string | null;
  quadrant?: EmotionalQuadrant | null;
  energy?: number | null;
  valence?: number | null;
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
const FALLBACK_NOW = new Date('2026-05-15T00:00:00.000Z');
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

export function buildCoachActionLoop(input: CoachActionLoopInput): CoachActionLoopMetadata {
  const now = input.now ?? FALLBACK_NOW;
  const quadrant = input.quadrant ?? null;
  const riskLevel = detectRiskLevel(input.message, input.coachResponse, quadrant);
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
  coachResponse: string,
  quadrant: EmotionalQuadrant | null
): 'low' | 'medium' | 'high' {
  const text = `${message}\n${coachResponse}`;
  if (HIGH_RISK_PATTERNS.some((pattern) => pattern.test(text))) return 'high';
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
  const seed = [
    LOOP_VERSION,
    input.userId,
    input.sessionId,
    now.toISOString(),
    input.message,
    input.coachResponse,
  ].join('\u001f');
  return `cal_${stableHash(seed)}`;
}

function stableHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}
