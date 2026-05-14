// 主動推送共用純函式（無 Deno / Node 特定 API，便於 Vitest 測試）
// 對應 schedules：weekly-report 批次、achievement-checker 主動關懷掃描

export interface RulerLogRow {
  user_id?: string | null;
  app_user_id?: string | null;
  created_at: string;
  emotions?: Array<{ name?: string; quadrant?: string }> | null;
}

export interface NotificationLogRow {
  user_id: string;
  type: string;
  run_date: string;
}

export interface CoachContextOptInRow {
  user_id: string;
  coach_opted_in?: boolean | null;
}

/** 從近 7 天 ruler_logs 收斂 active user 清單（去重，限制批次大小）。 */
export function pickActiveUsers(
  logs: RulerLogRow[],
  options: { limit?: number; userIdKey?: 'user_id' | 'app_user_id' } = {}
): string[] {
  const limit = options.limit ?? 10;
  const key = options.userIdKey ?? 'user_id';
  const seen = new Set<string>();
  for (const row of logs) {
    const id = (row as unknown as Record<string, unknown>)[key];
    if (typeof id === 'string' && id.length > 0 && !seen.has(id)) {
      seen.add(id);
      if (seen.size >= limit) break;
    }
  }
  return Array.from(seen);
}

/** 過濾掉今日已發送過同類型通知的用戶（冪等）。 */
export function filterUnsentToday(
  candidates: string[],
  sentToday: NotificationLogRow[],
  type: string,
  runDate: string
): string[] {
  const sent = new Set(
    sentToday.filter((r) => r.type === type && r.run_date === runDate).map((r) => r.user_id)
  );
  return candidates.filter((id) => !sent.has(id));
}

/** 僅保留明確同意主動教練推送的使用者。 */
export function filterOptedInUsers(
  candidates: string[],
  coachContexts: CoachContextOptInRow[]
): string[] {
  const optedIn = new Set(
    coachContexts
      .filter((row) => row.coach_opted_in === true)
      .map((row) => row.user_id)
  );
  return candidates.filter((id) => optedIn.has(id));
}

/** 找出「連續 N 天紅象限」用戶。 */
export function findRedStreakUsers(
  logs: RulerLogRow[],
  options: { minDays?: number; userIdKey?: 'user_id' | 'app_user_id' } = {}
): string[] {
  const minDays = options.minDays ?? 3;
  const key = options.userIdKey ?? 'user_id';
  const byUser = new Map<string, Set<string>>();
  for (const row of logs) {
    const id = (row as unknown as Record<string, unknown>)[key];
    if (typeof id !== 'string' || id.length === 0) continue;
    const isRed = (row.emotions ?? []).some((e) => e?.quadrant === 'red');
    if (!isRed) continue;
    const day = (row.created_at ?? '').slice(0, 10);
    if (!day) continue;
    if (!byUser.has(id)) byUser.set(id, new Set());
    byUser.get(id)!.add(day);
  }
  const result: string[] = [];
  for (const [id, days] of byUser.entries()) {
    if (hasConsecutiveDays(Array.from(days), minDays)) result.push(id);
  }
  return result;
}

/** 找出沉默 N 天的用戶（曾經 active，但近 N 天無記錄）。 */
export function findSilentUsers(
  historicalUserIds: string[],
  recentActiveUsers: string[]
): string[] {
  const active = new Set(recentActiveUsers);
  return historicalUserIds.filter((id) => !active.has(id));
}

/** 檢查日期字串集合是否包含 minDays 個連續的天。 */
export function hasConsecutiveDays(days: string[], minDays: number): boolean {
  if (days.length < minDays) return false;
  const sorted = [...days].sort();
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = Date.parse(sorted[i - 1] + 'T00:00:00Z');
    const curr = Date.parse(sorted[i] + 'T00:00:00Z');
    if (curr - prev === 86_400_000) {
      streak++;
      if (streak >= minDays) return true;
    } else if (curr !== prev) {
      streak = 1;
    }
  }
  return streak >= minDays;
}

/** 7 天冷卻：判斷該用戶 7 天內是否已收到同類關懷。 */
export function isWithinCooldown(
  userId: string,
  type: string,
  recent: NotificationLogRow[],
  todayIso: string,
  coolDownDays = 7
): boolean {
  const todayMs = Date.parse(todayIso.slice(0, 10) + 'T00:00:00Z');
  const cutoff = todayMs - coolDownDays * 86_400_000;
  return recent.some((r) => {
    if (r.user_id !== userId || r.type !== type) return false;
    const rMs = Date.parse(r.run_date + 'T00:00:00Z');
    return rMs >= cutoff;
  });
}

/** 渲染週報為 LINE 文字訊息。 */
export function renderWeeklyReportText(report: {
  summary?: string;
  suggestedAction?: string;
  total_sessions?: number;
  dominant_quadrant?: string | null;
}): string {
  const lines = [
    '【今心週報】',
    `本週記錄：${report.total_sessions ?? 0} 次`,
    report.dominant_quadrant ? `主要象限：${report.dominant_quadrant}` : '',
    '',
    report.summary ?? '',
    '',
    report.suggestedAction ? `下週小練習：${report.suggestedAction}` : '',
  ];
  return lines.filter((s) => s !== '').join('\n');
}

/** 主動關懷訊息文案。 */
export function renderCareMessage(type: 'care_silent' | 'care_red_streak'): string {
  if (type === 'care_red_streak') {
    return [
      '【今心關懷】',
      '注意到你最近幾天有些紅象限的情緒升溫。',
      '記得：感受被看見就已經開始流動。',
      '想試試 3 分鐘暫停練習嗎？回覆「練習」我陪你做一次。',
    ].join('\n');
  }
  return [
    '【今心關懷】',
    '好久沒見到你了。',
    '不用回覆也沒關係，但如果你願意，回覆任何一個字，我都在。',
  ].join('\n');
}
