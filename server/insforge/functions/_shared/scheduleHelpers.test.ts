import { describe, it, expect } from 'vitest';
import {
  pickActiveUsers,
  filterUnsentToday,
  findRedStreakUsers,
  findSilentUsers,
  hasConsecutiveDays,
  isWithinCooldown,
  renderWeeklyReportText,
  renderCareMessage,
} from './scheduleHelpers.js';

describe('pickActiveUsers', () => {
  it('回傳去重後的 active user 清單', () => {
    const logs = [
      { user_id: 'u1', created_at: '2026-05-10T01:00:00Z' },
      { user_id: 'u2', created_at: '2026-05-10T02:00:00Z' },
      { user_id: 'u1', created_at: '2026-05-11T03:00:00Z' },
    ];
    expect(pickActiveUsers(logs)).toEqual(['u1', 'u2']);
  });

  it('遵守 limit 上限', () => {
    const logs = Array.from({ length: 25 }, (_, i) => ({
      user_id: `u${i}`,
      created_at: '2026-05-10T00:00:00Z',
    }));
    expect(pickActiveUsers(logs, { limit: 10 })).toHaveLength(10);
  });

  it('支援 app_user_id key（內測橋接）', () => {
    const logs = [
      { app_user_id: 'a1', created_at: '2026-05-10T01:00:00Z' },
      { app_user_id: 'a2', created_at: '2026-05-10T02:00:00Z' },
    ];
    expect(pickActiveUsers(logs, { userIdKey: 'app_user_id' })).toEqual(['a1', 'a2']);
  });
});

describe('filterUnsentToday', () => {
  it('排除今日已發送過同類型通知的用戶', () => {
    const candidates = ['u1', 'u2', 'u3'];
    const sent = [
      { user_id: 'u1', type: 'weekly_report', run_date: '2026-05-10' },
      { user_id: 'u3', type: 'weekly_report', run_date: '2026-05-10' },
    ];
    expect(filterUnsentToday(candidates, sent, 'weekly_report', '2026-05-10')).toEqual(['u2']);
  });

  it('不同類型 / 日期不會被誤排除', () => {
    const candidates = ['u1'];
    const sent = [
      { user_id: 'u1', type: 'care_silent', run_date: '2026-05-10' },
      { user_id: 'u1', type: 'weekly_report', run_date: '2026-05-09' },
    ];
    expect(filterUnsentToday(candidates, sent, 'weekly_report', '2026-05-10')).toEqual(['u1']);
  });
});

describe('hasConsecutiveDays', () => {
  it('辨識 3 天連續', () => {
    expect(hasConsecutiveDays(['2026-05-08', '2026-05-09', '2026-05-10'], 3)).toBe(true);
  });
  it('中斷不算連續', () => {
    expect(hasConsecutiveDays(['2026-05-08', '2026-05-10', '2026-05-11'], 3)).toBe(false);
  });
  it('5 天中連 3 仍命中', () => {
    expect(
      hasConsecutiveDays(['2026-05-01', '2026-05-08', '2026-05-09', '2026-05-10', '2026-05-12'], 3)
    ).toBe(true);
  });
});

describe('findRedStreakUsers', () => {
  it('找出連續 3 天紅象限的用戶', () => {
    const logs = [
      { user_id: 'u1', created_at: '2026-05-08T01:00:00Z', emotions: [{ quadrant: 'red' }] },
      { user_id: 'u1', created_at: '2026-05-09T01:00:00Z', emotions: [{ quadrant: 'red' }] },
      { user_id: 'u1', created_at: '2026-05-10T01:00:00Z', emotions: [{ quadrant: 'red' }] },
      { user_id: 'u2', created_at: '2026-05-08T01:00:00Z', emotions: [{ quadrant: 'red' }] },
      { user_id: 'u2', created_at: '2026-05-10T01:00:00Z', emotions: [{ quadrant: 'green' }] },
    ];
    expect(findRedStreakUsers(logs, { minDays: 3 })).toEqual(['u1']);
  });
});

describe('findSilentUsers', () => {
  it('歷史 active 但近期 inactive 的用戶被選出', () => {
    expect(findSilentUsers(['u1', 'u2', 'u3'], ['u2'])).toEqual(['u1', 'u3']);
  });
});

describe('isWithinCooldown', () => {
  it('7 天內已通知 → 在冷卻中', () => {
    const recent = [{ user_id: 'u1', type: 'care_silent', run_date: '2026-05-08' }];
    expect(isWithinCooldown('u1', 'care_silent', recent, '2026-05-13', 7)).toBe(true);
  });
  it('超過 7 天 → 解除冷卻', () => {
    const recent = [{ user_id: 'u1', type: 'care_silent', run_date: '2026-04-01' }];
    expect(isWithinCooldown('u1', 'care_silent', recent, '2026-05-13', 7)).toBe(false);
  });
});

describe('renderWeeklyReportText', () => {
  it('包含週報關鍵欄位', () => {
    const text = renderWeeklyReportText({
      summary: '本週你很努力。',
      suggestedAction: '下週試 3 分鐘暫停。',
      total_sessions: 5,
      dominant_quadrant: 'red',
    });
    expect(text).toContain('本週記錄：5 次');
    expect(text).toContain('主要象限：red');
    expect(text).toContain('本週你很努力。');
    expect(text).toContain('下週試 3 分鐘暫停。');
  });
});

describe('renderCareMessage', () => {
  it('紅象限關懷文案', () => {
    expect(renderCareMessage('care_red_streak')).toContain('紅象限');
  });
  it('沉默用戶關懷文案', () => {
    expect(renderCareMessage('care_silent')).toContain('好久沒見到你');
  });
});
