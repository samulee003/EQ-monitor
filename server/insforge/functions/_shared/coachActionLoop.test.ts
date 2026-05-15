import { describe, expect, it } from 'vitest';
import {
  buildCoachActionLoop,
  classifyCoachIntent,
  computeMicroActionReward,
  expireMicroActions,
  getLevelFromXp,
  isCrisisText,
  pickDefaultTaskForGoal,
  updateReviewStreak,
  type CoachActionLoopInput,
  type CoachLoopContext,
  type MicroActionRow,
  type PendingMicroActionProposal,
} from './coachActionLoop.js';

const fixedNow = new Date('2026-05-15T08:00:00.000Z');

const baseInput: CoachActionLoopInput = {
  userId: 'user-1',
  sessionId: 'session-1',
  message: '我今天被孩子吵到很煩，但我想先停一下。',
  coachResponse: '我聽見你已經很努力，先讓自己有一個小停頓。',
  now: fixedNow,
};

describe('buildCoachActionLoop', () => {
  it('缺少 now 時丟出清楚錯誤，避免產生過期 action', () => {
    const inputWithoutNow: CoachActionLoopInput = { ...baseInput };
    delete inputWithoutNow.now;

    expect(() => buildCoachActionLoop(inputWithoutNow)).toThrow(
      'buildCoachActionLoop requires input.now'
    );
  });

  it('相同輸入產生 deterministic output', () => {
    const first = buildCoachActionLoop(baseInput);
    const second = buildCoachActionLoop(baseInput);

    expect(second).toEqual(first);
    expect(first.traceId).toMatch(/^cal_[0-9a-f]{8}$/);
  });

  it('改變會影響輸出的 normalized input 時，traceId 也會改變', () => {
    const redWithoutLabel = buildCoachActionLoop({
      ...baseInput,
      quadrant: 'red',
      emotionLabel: null,
    });
    const redWithLabel = buildCoachActionLoop({
      ...baseInput,
      quadrant: 'red',
      emotionLabel: '憤怒',
    });
    const greenWithLabel = buildCoachActionLoop({
      ...baseInput,
      quadrant: 'green',
      emotionLabel: '憤怒',
    });

    expect(redWithLabel.traceId).not.toBe(redWithoutLabel.traceId);
    expect(greenWithLabel.traceId).not.toBe(redWithLabel.traceId);
  });

  it('紅象限且已有情緒命名時，對應安神與 medium risk', () => {
    const result = buildCoachActionLoop({
      ...baseInput,
      emotionLabel: '憤怒',
      quadrant: 'red',
    });

    expect(result.orientation.zhixinMove).toBe('安神');
    expect(result.orientation.riskLevel).toBe('medium');
    expect(result.plan.intent).toBe('grounding');
  });

  it.each(['green', 'yellow'] as const)('%s 象限對應動念與 low risk', (quadrant) => {
    const result = buildCoachActionLoop({
      ...baseInput,
      quadrant,
      emotionLabel: '平靜',
    });

    expect(result.orientation.zhixinMove).toBe('動念');
    expect(result.orientation.riskLevel).toBe('low');
    expect(result.plan.intent).toBe('next_step');
  });

  it('高風險關鍵字觸發 high risk 與安全邊界提示', () => {
    const result = buildCoachActionLoop({
      ...baseInput,
      message: '我剛剛氣到想傷害自己，也怕會傷害孩子。',
      coachResponse: '先確保安全，找一個可信任的人陪你。',
      quadrant: 'red',
    });

    expect(result.orientation.riskLevel).toBe('high');
    expect(result.orientation.zhixinMove).toBe('喚名');
    expect(result.safetyNotes.join('\n')).toContain('不是正式心理治療、診斷或醫療建議');
    expect(result.safetyNotes.join('\n')).toContain('緊急服務');
  });

  it('coachResponse 的一般安全提醒不會誤升為 high risk', () => {
    const result = buildCoachActionLoop({
      ...baseInput,
      message: '我今天很累，但只是想先冷靜一下。',
      coachResponse: '若想傷害自己請立刻求助；現在我們先做一個短暫停頓。',
      quadrant: 'green',
    });

    expect(result.orientation.riskLevel).toBe('low');
    expect(result.safetyNotes).toEqual([]);
  });

  it('明確 structured safetySignal 可以升高為 high risk', () => {
    const result = buildCoachActionLoop({
      ...baseInput,
      message: '我現在說不太清楚。',
      coachResponse: '先確保身邊安全。',
      quadrant: 'green',
      safetySignal: 'high',
    });

    expect(result.orientation.riskLevel).toBe('high');
    expect(result.safetyNotes.join('\n')).toContain('不是正式心理治療、診斷或醫療建議');
  });

  it('小行動獎勵為正向，且沒有扣分欄位或負值', () => {
    const result = buildCoachActionLoop(baseInput);
    const microActionRecord = result.microAction as unknown as Record<string, unknown>;
    const rewardRecord = result.microAction.reward as unknown as Record<string, unknown>;

    expect(result.microAction.reward.xp).toBeGreaterThan(0);
    expect(result.microAction.reward.coins).toBeGreaterThan(0);
    expect(result.microAction.reward.streakEligible).toBe(true);
    expect(microActionRecord.penalty).toBeUndefined();
    expect(rewardRecord.penalty).toBeUndefined();
    expect(Object.values(result.microAction.reward).filter((value) => typeof value === 'number')).toEqual(
      expect.arrayContaining([expect.any(Number)])
    );
    expect(
      Object.values(result.microAction.reward)
        .filter((value): value is number => typeof value === 'number')
        .every((value) => value >= 0)
    ).toBe(true);
  });
});

const baseLoopContext: CoachLoopContext = {
  nowIso: '2026-05-15T08:00:00.000Z',
  userId: 'user-1',
  sessionId: 'session-1',
  activeMicroAction: null,
  pendingProposal: null,
  gamification: {
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
  },
  recentEmotionSummary: { recent_logs_count: 0 },
};

const pendingSleepProposal: PendingMicroActionProposal = {
  task: {
    key: 'sleep_breath_3min',
    goalKey: 'sleep_anxiety',
    category: 'settling',
    title: '睡前做 3 分鐘安神呼吸',
    dueHours: 24,
  },
  proposedAt: '2026-05-15T08:00:00.000Z',
};

const pendingRepairProposal: PendingMicroActionProposal = {
  task: {
    key: 'repair_step_away_2min',
    goalKey: 'parent_repair',
    category: 'repair',
    title: '情緒升高時先離開現場 2 分鐘',
    dueHours: 24,
  },
  proposedAt: '2026-05-15T08:00:00.000Z',
};

const activeMicroAction: MicroActionRow = {
  id: 'action-1',
  title: '喝一杯水，坐下來寫一句「我現在其實需要……」',
  category: 'daily_care',
  status: 'active',
  due_at: '2026-05-16T08:00:00.000Z',
  created_at: '2026-05-15T08:00:00.000Z',
  goal_key: 'daily_care',
  task_key: 'drink_water_and_need',
};

describe('Coach action loop runtime helpers', () => {
  it('辨識危機文字，但不誤判一般陪跑文字', () => {
    expect(isCrisisText('我快撐不下去了，救命')).toBe(true);
    expect(isCrisisText('我想開始 7 日小陪跑，每天照顧自己')).toBe(false);
  });

  it('危機文字分類為 sos intent', () => {
    expect(classifyCoachIntent('我快撐不下去了，救命', baseLoopContext)).toEqual({
      kind: 'sos',
      reason: 'crisis_text_detected',
    });
  });

  it('7 日小陪跑預設開始 daily_care', () => {
    expect(classifyCoachIntent('我想開始 7 日小陪跑', baseLoopContext)).toEqual({
      kind: 'start_companion_run',
      goalKey: 'daily_care',
    });
  });

  it('有 active micro action 且使用者說有做到時回報 completed', () => {
    expect(
      classifyCoachIntent('我今天有做到', {
        ...baseLoopContext,
        activeMicroAction,
      })
    ).toEqual({
      kind: 'report_micro_action',
      microActionId: 'action-1',
      status: 'completed',
    });
  });

  it('有 active micro action 且使用者說做了一半時回報 partial', () => {
    expect(
      classifyCoachIntent('我做了一半', {
        ...baseLoopContext,
        activeMicroAction,
      })
    ).toEqual({
      kind: 'report_micro_action',
      microActionId: 'action-1',
      status: 'partial',
    });
  });

  it('有 active micro action 且使用者說沒有做到時回報 skipped', () => {
    expect(
      classifyCoachIntent('我今天沒有做到', {
        ...baseLoopContext,
        activeMicroAction,
      })
    ).toEqual({
      kind: 'report_micro_action',
      microActionId: 'action-1',
      status: 'skipped',
    });
  });

  it('沒有 pending proposal 時，裸確認 可以 不會建立 micro action', () => {
    expect(
      classifyCoachIntent('可以', {
        ...baseLoopContext,
        activeMicroAction: null,
        pendingProposal: null,
      }).kind
    ).not.toBe('create_micro_action');
  });

  it('有 pending sleep proposal 時，確認 可以 會建立該 sleep task', () => {
    const intent = classifyCoachIntent('可以', {
      ...baseLoopContext,
      activeMicroAction: null,
      pendingProposal: pendingSleepProposal,
    });

    expect(intent.kind).toBe('create_micro_action');
    if (intent.kind === 'create_micro_action') {
      expect(intent.task).toEqual(pendingSleepProposal.task);
      expect(intent.confirmationText).toBe('可以');
    }
  });

  it('有 pending repair proposal 時，確認 可以 會建立該 repair task', () => {
    const intent = classifyCoachIntent('可以', {
      ...baseLoopContext,
      activeMicroAction: null,
      pendingProposal: pendingRepairProposal,
    });

    expect(intent.kind).toBe('create_micro_action');
    if (intent.kind === 'create_micro_action') {
      expect(intent.task).toEqual(pendingRepairProposal.task);
      expect(intent.confirmationText).toBe('可以');
    }
  });

  it('已有 active micro action 時，可以 不會重複建立 active action', () => {
    expect(
      classifyCoachIntent('可以', {
        ...baseLoopContext,
        activeMicroAction,
      }).kind
    ).not.toBe('create_micro_action');
  });

  it('daily_care 預設小行動是喝水與需要句', () => {
    expect(pickDefaultTaskForGoal('daily_care')).toMatchObject({
      key: 'drink_water_and_need',
      title: '喝一杯水，坐下來寫一句「我現在其實需要……」',
      dueHours: 24,
    });
  });

  it('expireMicroActions 會過期逾期 active，並回傳最新未過期 active', () => {
    const rows: MicroActionRow[] = [
      {
        ...activeMicroAction,
        id: 'expired-action',
        due_at: '2026-05-15T07:59:59.000Z',
        created_at: '2026-05-14T08:00:00.000Z',
      },
      {
        ...activeMicroAction,
        id: 'older-active',
        due_at: '2026-05-16T08:00:00.000Z',
        created_at: '2026-05-15T07:00:00.000Z',
      },
      {
        ...activeMicroAction,
        id: 'newer-active',
        due_at: '2026-05-16T08:00:00.000Z',
        created_at: '2026-05-15T08:00:00.000Z',
      },
    ];

    expect(expireMicroActions(rows, '2026-05-15T08:00:00.000Z')).toEqual({
      expiredIds: ['expired-action'],
      active: expect.objectContaining({ id: 'newer-active' }),
    });
  });

  it('micro action reward 只給正向獎勵，過期為零', () => {
    expect(computeMicroActionReward('completed')).toEqual({ xp: 20, coins: 10 });
    expect(computeMicroActionReward('partial')).toEqual({ xp: 15, coins: 7 });
    expect(computeMicroActionReward('skipped')).toEqual({ xp: 10, coins: 5 });
    expect(computeMicroActionReward('expired')).toEqual({ xp: 0, coins: 0 });
  });

  it('updateReviewStreak 支援同日、隔日與中斷後重算', () => {
    expect(
      updateReviewStreak({
        current: 2,
        longest: 4,
        lastReviewDate: '2026-05-15',
        reportDate: '2026-05-15',
      })
    ).toEqual({ current: 2, longest: 4, lastReviewDate: '2026-05-15' });

    expect(
      updateReviewStreak({
        current: 2,
        longest: 4,
        lastReviewDate: '2026-05-15',
        reportDate: '2026-05-16',
      })
    ).toEqual({ current: 3, longest: 4, lastReviewDate: '2026-05-16' });

    expect(
      updateReviewStreak({
        current: 2,
        longest: 4,
        lastReviewDate: '2026-05-15',
        reportDate: '2026-05-18',
      })
    ).toEqual({ current: 1, longest: 4, lastReviewDate: '2026-05-18' });
  });

  it('getLevelFromXp 回傳基本等級進度', () => {
    expect(getLevelFromXp(0)).toEqual({
      level: 1,
      title: '起步覺察者',
      currentXp: 0,
      nextLevelXp: 100,
    });
    expect(getLevelFromXp(120)).toEqual({
      level: 2,
      title: '穩定練習者',
      currentXp: 120,
      nextLevelXp: 250,
    });
  });
});
