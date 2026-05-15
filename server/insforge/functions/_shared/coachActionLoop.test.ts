import { describe, expect, it } from 'vitest';
import { buildCoachActionLoop, type CoachActionLoopInput } from './coachActionLoop.js';

const fixedNow = new Date('2026-05-15T08:00:00.000Z');

const baseInput: CoachActionLoopInput = {
  userId: 'user-1',
  sessionId: 'session-1',
  message: '我今天被孩子吵到很煩，但我想先停一下。',
  coachResponse: '我聽見你已經很努力，先讓自己有一個小停頓。',
  now: fixedNow,
};

describe('buildCoachActionLoop', () => {
  it('相同輸入產生 deterministic output', () => {
    const first = buildCoachActionLoop(baseInput);
    const second = buildCoachActionLoop(baseInput);

    expect(second).toEqual(first);
    expect(first.traceId).toMatch(/^cal_[0-9a-f]{8}$/);
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
