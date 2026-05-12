import { createClient } from 'npm:@insforge/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default async function (req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || '';

    if (!userId) {
      return new Response(
        JSON.stringify({ data: null, error: 'Missing userId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const baseUrl = Deno.env.get('INSFORGE_BASE_URL') || Deno.env.get('INSFORGE_URL') || '';
    const anonKey = Deno.env.get('ANON_KEY') || '';
    const client = createClient({ baseUrl, anonKey });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const since = sevenDaysAgo.toISOString();

    const { data: logs, error: logsError } = await client.database
      .from('ruler_logs')
      .select('emotions, intensity, created_at')
      .eq('user_id', userId)
      .gte('created_at', since)
      .order('created_at', { ascending: false });

    if (logsError) {
      return new Response(
        JSON.stringify({ data: null, error: logsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const totalSessions = logs?.length ?? 0;

    if (totalSessions === 0) {
      return new Response(
        JSON.stringify({
          data: {
            summary: '本週尚未有記錄。開始記錄你的情緒，就能獲得每週洞察。',
            underlyingPatterns: [],
            suggestedAction: '試著每天至少做一次快速記錄，建立覺察習慣。',
            empatheticQuote: '「每一個偉大的旅程，都始於一小步。」',
            colorTheory: '無數據',
            total_sessions: 0,
            dominant_quadrant: null,
          },
          error: null,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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

    const dominantQuadrant = Object.entries(quadrantDistribution)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'green';

    const weekMockInsights: Record<string, unknown> = {
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

    const insight = weekMockInsights[dominantQuadrant] as Record<string, unknown>;

    const report = {
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

    return new Response(
      JSON.stringify({ data: report, error: null }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ data: null, error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
