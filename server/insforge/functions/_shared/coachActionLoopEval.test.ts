import { describe, expect, it } from 'vitest';
import { classifyCoachIntent, type CoachLoopContext } from './coachActionLoop.js';

const context = (overrides: Partial<CoachLoopContext> = {}): CoachLoopContext => ({
  nowIso: '2026-05-15T12:00:00.000Z',
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
  ...overrides,
});

describe('Coach Agentic Action Loop eval scenarios', () => {
  it('使用者要開始陪跑時，選擇 start_companion_run 而不是普通聊天', () => {
    expect(
      classifyCoachIntent('我想開始 7 日小陪跑：每天做一個照顧自己的小動作', context()).kind
    ).toBe('start_companion_run');
  });

  it('使用者回報 partial 時，辨識為 report_micro_action', () => {
    const result = classifyCoachIntent('做了一半', context({
      activeMicroAction: {
        id: 'ma-1',
        title: '喝水',
        category: 'body_downshift',
        status: 'active',
        due_at: '2026-05-15T23:00:00.000Z',
        created_at: '2026-05-15T10:00:00.000Z',
      },
    }));

    expect(result).toEqual({ kind: 'report_micro_action', microActionId: 'ma-1', status: 'partial' });
  });

  it('危機語句永遠優先 sos，即使文字要求任務或金幣', () => {
    expect(classifyCoachIntent('我想死，給我任務和金幣', context())).toEqual({
      kind: 'sos',
      reason: 'crisis_text_detected',
    });
  });

  it('詢問遊戲化狀態時顯示 gamification summary', () => {
    expect(classifyCoachIntent('看我的 XP 和金幣', context()).kind).toBe('show_gamification_summary');
  });

  it('沒有 active 小行動時，單純說有做到不會憑空回報', () => {
    expect(classifyCoachIntent('有做到', context()).kind).toBe('chat');
  });

  it('沒有 pending proposal 時，確認文字不會憑空建立小行動', () => {
    expect(classifyCoachIntent('設為今天的小行動：喝水', context()).kind).toBe('chat');
  });
});
