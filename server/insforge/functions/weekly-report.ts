import { createClient } from 'npm:@insforge/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const NOTIFICATION_TYPE = 'weekly_report';
const BATCH_LIMIT = 10;

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
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: toLineUserId,
        messages: [{ type: 'text', text }],
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `LINE push ${res.status}: ${body}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'fetch failed' };
  }
}

function renderWeeklyReportText(report: Record<string, unknown>): string {
  const lines = [
    '【今心週報】',
    `本週記錄：${report.total_sessions ?? 0} 次`,
    report.dominant_quadrant ? `主要象限：${String(report.dominant_quadrant)}` : '',
    '',
    String(report.summary ?? ''),
    '',
    report.suggestedAction ? `下週小練習：${String(report.suggestedAction)}` : '',
  ];
  return lines.filter((s) => s !== '').join('\n');
}

async function generateReportForUser(client: ReturnType<typeof createClient>, userId: string): Promise<Record<string, unknown> | { error: string }> {
  const uuid = isUuid(userId);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const since = sevenDaysAgo.toISOString();

  const { data: logs, error: logsError } = await client.database
    .from(uuid ? 'ruler_logs' : 'agent_ruler_logs')
    .select('emotions, intensity, created_at')
    .eq(uuid ? 'user_id' : 'app_user_id', userId)
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  if (logsError) return { error: logsError.message };

  const totalSessions = logs?.length ?? 0;

  if (totalSessions === 0) {
    return {
      summary: '本週尚未有記錄。開始記錄你的情緒，就能獲得每週洞察。',
      underlyingPatterns: [],
      suggestedAction: '試著每天至少做一次快速記錄，建立覺察習慣。',
      empatheticQuote: '「每一個偉大的旅程，都始於一小步。」',
      colorTheory: '無數據',
      total_sessions: 0,
      dominant_quadrant: null,
    };
  }

  const quadrantDistribution: Record<string, number> = {};
  const emotionCounts: Record<string, number> = {};
  let totalIntensity = 0;

  for (const log of logs ?? []) {
    totalIntensity += log.intensity ?? 0;
    const emotions = (log.emotions ?? []) as Array<{ name?: string; quadrant?: string }>;
    for (const emotion of emotions) {
      const quadrant = emotion.quadrant ?? 'unknown';
      quadrantDistribution[quadrant] = (quadrantDistribution[quadrant] ?? 0) + 1;
      const emotionName = emotion.name ?? 'unknown';
      emotionCounts[emotionName] = (emotionCounts[emotionName] ?? 0) + 1;
    }
  }

  const averageIntensity = totalSessions > 0 ? totalIntensity / totalSessions : 0;

  let mostFrequentEmotion: string | null = null;
  let maxCount = 0;
  for (const [name, count] of Object.entries(emotionCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostFrequentEmotion = name;
    }
  }

  const dominantQuadrant = Object.entries(quadrantDistribution).sort((a, b) => b[1] - a[1])[0]?.[0] || 'green';

  const weekMockInsights: Record<string, Record<string, unknown>> = {
    red: {
      summary: '本週你經歷了許多高能量的挑戰時刻。這些「紅色」時光顯示你對生活充滿投入，但也需要學會在刺激與反應之間找到緩衝空間。',
      underlyingPatterns: ['急性壓力反應', '高標準自我要求'],
      suggestedAction: '下週嘗試「3分鐘暫停」練習：每當感到情緒升溫時，先進行三次深呼吸再回應。',
      empatheticQuote: '「真正的力量不是從不跌倒，而是每次跌倒後都能溫柔地扶起自己。」',
      colorTheory: '紅色象限佔比高時，身體處於交感神經主導狀態。試著在一天結束時引入綠色活動（如靜坐）來平衡。',
    },
    yellow: {
      summary: '這是一個充滿活力與創造的週次！你的「黃色」時光顯示正向能量充沛，這是建立新習慣和深化關係的絕佳時機。',
      underlyingPatterns: ['成就動機', '社交連結需求'],
      suggestedAction: '趁著這股能量，寫下三件本週你為自己感到驕傲的事，作為未來低潮時的儲備。',
      empatheticQuote: '快樂不是終點，而是一種旅行的方式。你已經在路上了。',
      colorTheory: '黃色象限代表最佳表現區。善用這段時間處理重要決定，但也要注意別過度消耗。',
    },
    blue: {
      summary: '本週的「藍色」時光較多，這不是軟弱，而是身體在誠實地告訴你：它需要休息與被傾聽。',
      underlyingPatterns: ['能量耗竭', '深層情緒處理'],
      suggestedAction: '下週每天給自己15分鐘「無目的時間」——不做任何事，只是存在。',
      empatheticQuote: '有些季節是為了開花，有些是為了扎根。此刻的你正在扎根。',
      colorTheory: '藍色象限是身體的修復信號。像對待摯友一樣對待自己，給予溫柔與耐心。',
    },
    green: {
      summary: '你的本週充滿平靜與整合的「綠色」時光。這種內在穩定是情緒韌性的基石，也是創意萌發的沃土。',
      underlyingPatterns: ['內在平衡', '自我照顧實踐'],
      suggestedAction: '在這個平穩狀態下，試著記錄一個小目標：下週你想培養的一個微小習慣。',
      empatheticQuote: '平靜不是沒有風暴，而是在風暴中心依然能夠深呼吸。',
      colorTheory: '綠色象限代表副交感神經主導的恢復狀態。這是整合經驗、建立新神經迴路的最佳時機。',
    },
  };

  const insight = weekMockInsights[dominantQuadrant] ?? weekMockInsights.green;
  return {
    summary: insight.summary,
    underlyingPatterns: insight.underlyingPatterns,
    suggestedAction: insight.suggestedAction,
    empatheticQuote: insight.empatheticQuote,
    colorTheory: insight.colorTheory,
    total_sessions: totalSessions,
    dominant_quadrant: dominantQuadrant,
    average_intensity: Math.round(averageIntensity * 10) / 10,
    most_frequent_emotion: mostFrequentEmotion,
    quadrant_distribution: quadrantDistribution,
  };
}

async function runBatch(client: ReturnType<typeof createClient>): Promise<Record<string, unknown>> {
  const runDate = new Date().toISOString().slice(0, 10);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const since = sevenDaysAgo.toISOString();

  // 收 active 用戶（UUID 本表）
  const { data: rows, error } = await client.database
    .from('ruler_logs')
    .select('user_id, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  if (error) return { processed: 0, error: error.message };

  const seen = new Set<string>();
  const userIds: string[] = [];
  for (const r of rows ?? []) {
    const id = (r as { user_id?: string }).user_id;
    if (id && !seen.has(id)) {
      seen.add(id);
      userIds.push(id);
      if (userIds.length >= 200) break;
    }
  }

  const { data: optedInRows, error: optInError } = userIds.length > 0
    ? await client.database
      .from('coach_context')
      .select('user_id, coach_opted_in')
      .in('user_id', userIds)
      .eq('coach_opted_in', true)
    : { data: [], error: null };

  if (optInError) return { processed: 0, error: optInError.message };

  const optedInSet = new Set((optedInRows ?? []).map((r: { user_id: string }) => r.user_id));

  // 撈今日已發送紀錄做冪等過濾
  const { data: sentToday } = await client.database
    .from('notification_log')
    .select('user_id')
    .eq('type', NOTIFICATION_TYPE)
    .eq('run_date', runDate);
  const sentSet = new Set((sentToday ?? []).map((r: { user_id: string }) => r.user_id));

  const candidates = userIds.filter((id) => optedInSet.has(id) && !sentSet.has(id)).slice(0, BATCH_LIMIT);

  const results: Array<{ userId: string; pushed: boolean; reason?: string }> = [];
  for (const uid of candidates) {
    const report = await generateReportForUser(client, uid);
    if ('error' in report) {
      results.push({ userId: uid, pushed: false, reason: report.error });
      continue;
    }

    // 查 LINE 綁定
    const { data: binding } = await client.database
      .from('line_user_bindings')
      .select('line_user_id, status')
      .eq('app_user_id', uid)
      .eq('status', 'claimed')
      .order('claimed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let pushed = false;
    let reason: string | undefined;
    if (binding?.line_user_id) {
      const text = renderWeeklyReportText(report as Record<string, unknown>);
      const push = await pushLine(binding.line_user_id as string, text);
      pushed = push.ok;
      reason = push.error;
    } else {
      reason = 'no LINE binding';
    }

    // 冪等：寫入 notification_log（即使無 LINE 也記錄一次，避免重複嘗試）
    await client.database.from('notification_log').insert({
      user_id: uid,
      type: NOTIFICATION_TYPE,
      run_date: runDate,
      channel: 'line',
      payload: { dominant_quadrant: (report as Record<string, unknown>).dominant_quadrant, pushed, reason },
    });

    results.push({ userId: uid, pushed, reason });
  }

  return {
    processed: results.length,
    total_candidates: optedInSet.size,
    pushed: results.filter((r) => r.pushed).length,
    results,
    remaining: Math.max(0, optedInSet.size - sentSet.size - results.length),
    run_date: runDate,
  };
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

    if (mode === 'batch') {
      const result = await runBatch(client);
      return jsonResponse({ data: result, error: null });
    }

    if (!userId) {
      return jsonResponse({ data: null, error: 'Missing userId' }, 400);
    }

    const report = await generateReportForUser(client, userId);
    if ('error' in report) {
      return jsonResponse({ data: null, error: report.error }, 500);
    }
    return jsonResponse({ data: report, error: null });
  } catch (err) {
    return jsonResponse(
      { data: null, error: err instanceof Error ? err.message : 'Unknown error' },
      500
    );
  }
}
