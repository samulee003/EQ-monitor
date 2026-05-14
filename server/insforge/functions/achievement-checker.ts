import { createClient } from 'npm:@insforge/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const COOL_DOWN_DAYS = 7;
const RED_STREAK_MIN_DAYS = 3;
const SILENT_DAYS = 7;
const BATCH_LIMIT = 20;

interface AchievementRule {
  key: string;
  check: (stats: UserStats) => boolean;
}

interface UserStats {
  totalLogs: number;
  fullFlowCount: number;
  uniqueEmotions: number;
  currentStreak: number;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

async function pushLine(toLineUserId: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const token = Deno.env.get('LINE_CHANNEL_ACCESS_TOKEN') || '';
  if (!token) return { ok: false, error: 'LINE_CHANNEL_ACCESS_TOKEN missing' };
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: toLineUserId, messages: [{ type: 'text', text }] }),
    });
    if (!res.ok) return { ok: false, error: `LINE push ${res.status}: ${await res.text()}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'fetch failed' };
  }
}

function hasConsecutiveDays(days: string[], minDays: number): boolean {
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

const CARE_MESSAGES: Record<string, string> = {
  care_red_streak: [
    '【今心關懷】',
    '注意到你最近幾天有些紅象限的情緒升溫。',
    '記得：感受被看見就已經開始流動。',
    '想試試 3 分鐘暫停練習嗎？回覆「練習」我陪你做一次。',
  ].join('\n'),
  care_silent: [
    '【今心關懷】',
    '好久沒見到你了。',
    '不用回覆也沒關係，但如果你願意，回覆任何一個字，我都在。',
  ].join('\n'),
};

async function runScan(client: ReturnType<typeof createClient>): Promise<Record<string, unknown>> {
  const today = new Date();
  const runDate = today.toISOString().slice(0, 10);

  // 近 7 天 ruler_logs
  const sevenDaysAgo = new Date(today.getTime() - SILENT_DAYS * 86_400_000);
  const { data: recentLogs, error: recentErr } = await client.database
    .from('ruler_logs')
    .select('user_id, created_at, emotions')
    .gte('created_at', sevenDaysAgo.toISOString());
  if (recentErr) return { error: recentErr.message };

  // 過去 30 天歷史 active 用戶（用於沉默判斷）
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 86_400_000);
  const { data: histLogs, error: histErr } = await client.database
    .from('ruler_logs')
    .select('user_id, created_at')
    .gte('created_at', thirtyDaysAgo.toISOString())
    .lt('created_at', sevenDaysAgo.toISOString());
  if (histErr) return { error: histErr.message };

  // 紅象限連續
  const redDaysByUser = new Map<string, Set<string>>();
  for (const row of recentLogs ?? []) {
    const uid = (row as { user_id?: string }).user_id;
    if (!uid) continue;
    const isRed = ((row as { emotions?: Array<{ quadrant?: string }> }).emotions ?? []).some(
      (e) => e?.quadrant === 'red'
    );
    if (!isRed) continue;
    const day = (row as { created_at: string }).created_at.slice(0, 10);
    if (!redDaysByUser.has(uid)) redDaysByUser.set(uid, new Set());
    redDaysByUser.get(uid)!.add(day);
  }
  const redStreakUsers: string[] = [];
  for (const [uid, days] of redDaysByUser.entries()) {
    if (hasConsecutiveDays(Array.from(days), RED_STREAK_MIN_DAYS)) redStreakUsers.push(uid);
  }

  // 沉默用戶：30 天內有記錄但近 7 天無記錄
  const recentActiveSet = new Set(
    (recentLogs ?? []).map((r) => (r as { user_id?: string }).user_id).filter(Boolean) as string[]
  );
  const historicalSet = new Set(
    (histLogs ?? []).map((r) => (r as { user_id?: string }).user_id).filter(Boolean) as string[]
  );
  const silentUsers: string[] = [];
  for (const uid of historicalSet) {
    if (!recentActiveSet.has(uid)) silentUsers.push(uid);
  }

  const allCareCandidates = Array.from(new Set([...redStreakUsers, ...silentUsers]));
  const { data: optedInRows, error: optInError } = allCareCandidates.length > 0
    ? await client.database
      .from('coach_context')
      .select('user_id, coach_opted_in')
      .in('user_id', allCareCandidates)
      .eq('coach_opted_in', true)
    : { data: [], error: null };
  if (optInError) return { error: optInError.message };

  const optedInSet = new Set((optedInRows ?? []).map((r: { user_id: string }) => r.user_id));

  // 撈最近 7 天 notification_log 做冷卻
  const coolDownStart = new Date(today.getTime() - COOL_DOWN_DAYS * 86_400_000);
  const { data: recentNotif } = await client.database
    .from('notification_log')
    .select('user_id, type, run_date')
    .gte('run_date', coolDownStart.toISOString().slice(0, 10));
  const sentRecent = new Map<string, Set<string>>();
  for (const r of recentNotif ?? []) {
    const key = (r as { user_id: string }).user_id;
    if (!sentRecent.has(key)) sentRecent.set(key, new Set());
    sentRecent.get(key)!.add((r as { type: string }).type);
  }

  const queue: Array<{ uid: string; type: 'care_red_streak' | 'care_silent' }> = [];
  for (const uid of redStreakUsers) {
    if (!optedInSet.has(uid)) continue;
    if (!sentRecent.get(uid)?.has('care_red_streak')) queue.push({ uid, type: 'care_red_streak' });
  }
  for (const uid of silentUsers) {
    if (!optedInSet.has(uid)) continue;
    if (!sentRecent.get(uid)?.has('care_silent')) queue.push({ uid, type: 'care_silent' });
  }

  const limited = queue.slice(0, BATCH_LIMIT);
  const results: Array<{ uid: string; type: string; pushed: boolean; reason?: string }> = [];

  for (const item of limited) {
    const { data: binding } = await client.database
      .from('line_user_bindings')
      .select('line_user_id')
      .eq('app_user_id', item.uid)
      .eq('status', 'claimed')
      .order('claimed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let pushed = false;
    let reason: string | undefined;
    if (binding?.line_user_id) {
      const r = await pushLine(binding.line_user_id as string, CARE_MESSAGES[item.type]);
      pushed = r.ok;
      reason = r.error;
    } else {
      reason = 'no LINE binding';
    }

    await client.database.from('notification_log').insert({
      user_id: item.uid,
      type: item.type,
      run_date: runDate,
      channel: 'line',
      payload: { pushed, reason },
    });

    results.push({ uid: item.uid, type: item.type, pushed, reason });
  }

  return {
    run_date: runDate,
    red_streak_candidates: redStreakUsers.length,
    silent_candidates: silentUsers.length,
    queued: queue.length,
    processed: results.length,
    pushed: results.filter((r) => r.pushed).length,
    results,
  };
}

async function runCheck(client: ReturnType<typeof createClient>, userId: string): Promise<Response> {
  const uuid = isUuid(userId);

  const { data: logs, error: logsError } = await client.database
    .from(uuid ? 'ruler_logs' : 'agent_ruler_logs')
    .select('emotions, is_full_flow')
    .eq(uuid ? 'user_id' : 'app_user_id', userId);

  if (logsError) return jsonResponse({ data: null, error: logsError.message }, 500);

  const { data: streakData, error: streakError } = uuid
    ? await client.database.from('streaks').select('current_streak').eq('user_id', userId).maybeSingle()
    : { data: null, error: null };

  if (streakError) return jsonResponse({ data: null, error: streakError.message }, 500);

  const totalLogs = logs?.length ?? 0;
  const fullFlowCount = (logs ?? []).filter((log) => log.is_full_flow === true).length;

  const uniqueEmotionSet = new Set<string>();
  for (const log of logs ?? []) {
    const emotions = (log.emotions ?? []) as Array<{ name?: string; id?: string }>;
    for (const emotion of emotions) {
      uniqueEmotionSet.add(emotion.name ?? emotion.id ?? 'unknown');
    }
  }
  const stats: UserStats = {
    totalLogs,
    fullFlowCount,
    uniqueEmotions: uniqueEmotionSet.size,
    currentStreak: streakData?.current_streak ?? 0,
  };

  const rules: AchievementRule[] = [
    { key: 'first_log', check: (s) => s.totalLogs >= 1 },
    { key: 'streak_3', check: (s) => s.currentStreak >= 3 },
    { key: 'streak_7', check: (s) => s.currentStreak >= 7 },
    { key: 'emotions_10', check: (s) => s.uniqueEmotions >= 10 },
    { key: 'full_ruler_5', check: (s) => s.fullFlowCount >= 5 },
  ];

  if (!uuid) {
    return jsonResponse({ data: { newly_unlocked: [], stats }, error: null });
  }

  const { data: existingAchievements, error: achievementsError } = await client.database
    .from('achievement_records')
    .select('achievement_key')
    .eq('user_id', userId);

  if (achievementsError) return jsonResponse({ data: null, error: achievementsError.message }, 500);

  const unlockedSet = new Set((existingAchievements ?? []).map((a) => a.achievement_key));
  const newlyUnlocked: string[] = [];
  for (const rule of rules) {
    if (!unlockedSet.has(rule.key) && rule.check(stats)) newlyUnlocked.push(rule.key);
  }

  if (newlyUnlocked.length > 0) {
    const inserts = newlyUnlocked.map((key) => ({
      user_id: userId,
      achievement_key: key,
      unlocked_at: new Date().toISOString(),
    }));
    const { error: insertError } = await client.database.from('achievement_records').insert(inserts);
    if (insertError) return jsonResponse({ data: null, error: insertError.message }, 500);
  }

  return jsonResponse({ data: { newly_unlocked: newlyUnlocked, stats }, error: null });
}

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const mode = (body.mode as string | undefined) || url.searchParams.get('mode') || '';
    const userId = (body.userId as string | undefined) || '';

    const baseUrl = Deno.env.get('INSFORGE_BASE_URL') || Deno.env.get('INSFORGE_URL') || '';
    const serverKey = Deno.env.get('API_KEY') || Deno.env.get('SERVICE_ROLE_KEY') || Deno.env.get('ANON_KEY') || '';
    const client = createClient({ baseUrl, anonKey: serverKey });

    if (mode === 'scan') {
      const result = await runScan(client);
      return jsonResponse({ data: result, error: null });
    }

    if (!userId) {
      return jsonResponse({ data: null, error: 'Missing userId' }, 400);
    }
    return runCheck(client, userId);
  } catch (err) {
    return jsonResponse(
      { data: null, error: err instanceof Error ? err.message : 'Unknown error' },
      500
    );
  }
}
